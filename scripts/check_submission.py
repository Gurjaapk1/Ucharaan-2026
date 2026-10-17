"""Check tracked submission files without printing potential credential values."""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ['README.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', '.env.example',
            'native-app/package-lock.json', 'demo-server/.env.example',
            'docs/engineering/ml-production.md', 'docs/engineering/privacy.md']

def tracked_files():
    return [Path(p) for p in subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0') if p]

def check():
    issues = [f'Missing {p}' for p in REQUIRED if not (ROOT/p).is_file()]
    # Construct the retired demo key to avoid reintroducing the literal into source.
    retired = 'uchaaran' + '-' + 'demo'
    secret_pattern = re.compile(r'ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----')
    for rel in tracked_files():
        p=ROOT/rel
        if p.is_symlink():
            issues.append(f'Symlink must not be included: {rel}')
            continue
        if any(part in {'node_modules','.venv','__pycache__'} for part in rel.parts):
            issues.append(f'Generated dependency tracked: {rel}')
        if not p.is_file():
            continue
        if p.name.startswith('.env') and p.name!='.env.example':
            issues.append(f'Non-example environment file: {rel}')
        try:
            content=p.read_text()
        except UnicodeDecodeError:
            continue
        if retired in content or secret_pattern.search(content):
            issues.append(f'Potential credential in {rel}')
    if issues:
        raise SystemExit('\n'.join(issues))
    print('Submission source checks passed.')

if __name__=='__main__':
    check()
