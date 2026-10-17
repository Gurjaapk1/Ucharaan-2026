"""Exercise actual endpoint cleanup without loading model weights or dependencies."""
import ast
import asyncio
import logging
import os
from pathlib import Path
import tempfile
import time
import unittest

SOURCE = Path(__file__).resolve().parents[1] / 'demo_server.py'

class HTTPError(Exception):
    def __init__(self, status, message):
        self.status = status
        super().__init__(message)

class Upload:
    filename = 'sample.wav'
    async def read(self):
        return b'test-audio'

class AudioLifecycle(unittest.TestCase):
    def endpoint(self, name, fail=False):
        tree = ast.parse(SOURCE.read_text())
        fn = next(n for n in tree.body if isinstance(n, ast.AsyncFunctionDef) and n.name == name)
        fn.decorator_list = []
        fn.returns = None
        for arg in fn.args.args:
            arg.annotation = None
        calls = []
        def process(path, *args):
            calls.append(path)
            self.assertEqual(Path(path).read_bytes(), b'test-audio')
            if fail:
                raise ValueError('simulated inference failure')
            return ([], False) if name == 'score' else ({'reached': None, 'status': 'ok'}, 1, {})
        namespace = dict(API_KEY='test-only-key', Path=Path, os=os,
                         tempfile=tempfile, time=time, log=logging.getLogger('test'),
                         HTTPException=HTTPError, File=lambda *a: None, Form=lambda x:x,
                         Header=lambda x:x, parse_request=lambda *a:(2, 'bjs', [5]), score_rows=process,
                         follow_body=process, to_response=lambda *a:({'status':'ok'}, 1))
        exec(compile(ast.Module(body=[fn], type_ignores=[]), str(SOURCE), 'exec'), namespace)
        return namespace[name], calls

    def test_temp_files_removed_on_success_and_failure(self):
        for name in ['score', 'follow']:
            for fail in [False, True]:
                with self.subTest(endpoint=name, failure=fail):
                    endpoint, calls = self.endpoint(name, fail)
                    call = endpoint(audio=Upload(), reciter='bjs', x_api_key='test-only-key')
                    if fail:
                        with self.assertRaises(HTTPError) as caught:
                            asyncio.run(call)
                        self.assertEqual(caught.exception.status, 422)
                    else:
                        self.assertEqual(asyncio.run(call)['status'], 'ok')
                    self.assertEqual(len(calls), 1)
                    self.assertFalse(Path(calls[0]).exists())

    def test_unauthorized_request_does_not_process_audio(self):
        for name in ['score', 'follow']:
            endpoint, calls = self.endpoint(name)
            with self.assertRaises(HTTPError) as caught:
                asyncio.run(endpoint(audio=Upload(), reciter='bjs', x_api_key='wrong'))
            self.assertEqual(caught.exception.status, 401)
            self.assertEqual(calls, [])

if __name__ == '__main__':
    unittest.main()
