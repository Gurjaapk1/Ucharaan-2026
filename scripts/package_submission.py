"""Build a source-only ZIP from the reviewed Git index, with content hashes."""
from pathlib import Path
import hashlib
import json
import subprocess
import zipfile
from check_submission import ROOT, check, tracked_files

check()
allowed_dirs={'native-app','native-host','demo-server','prototype','docs','scripts','.openai'}
allowed_root={'README.md','LICENSE','THIRD_PARTY_NOTICES.md','.env.example','.gitignore','.gitattributes','DEMO-SETUP.md','TESTING-KHALIS-APP.md'}
files=[]
for rel in tracked_files():
    if rel.parts[0] in allowed_dirs or str(rel) in allowed_root or str(rel).startswith('outputs/final-guide/'):
        if not (ROOT/rel).is_file(): continue
        if any(x in {'node_modules','.venv','dist','build','__pycache__','.expo','qa'} for x in rel.parts): continue
        if rel.suffix in {'.zip','.mp4','.mov','.pyc'}: continue
        files.append(rel)
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT).decode().strip()
manifest={'source_commit':sha,'files':{str(p):hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in files}}
out=ROOT/'tmp/Team12_Code.zip';out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for rel in files: z.write(ROOT/rel,'Team12_Code/'+str(rel))
    z.writestr('Team12_Code/SUBMISSION_MANIFEST.json',json.dumps(manifest,indent=2)+'\n')
with zipfile.ZipFile(out) as z:
    assert z.testzip() is None
    for rel,digest in manifest['files'].items():
        assert hashlib.sha256(z.read('Team12_Code/'+rel)).hexdigest()==digest
print(f'Verified {len(files)} source files: {out}')
