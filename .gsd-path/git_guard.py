#!/usr/bin/env python3
# gsd-path guard — stable runtime launcher
import os
import subprocess
import sys
sys.dont_write_bytecode = True
from pathlib import Path
from status_runtime import run_guard


def same_dir(a, b):
    return os.path.normcase(str(Path(a).resolve())) == os.path.normcase(str(Path(b).resolve()))


# Local patch for docs/specs/upstream-bugs.md O5; keep GIT_INDEX_FILE, a temporary index during `commit -a`.
git_dir = os.environ.get('GIT_DIR')
if git_dir:
    found = subprocess.run(
        ['git', 'rev-parse', '--absolute-git-dir'],
        env={key: value for key, value in os.environ.items() if key != 'GIT_DIR'},
        capture_output=True, encoding='utf-8', errors='replace', check=False,
    )
    if found.returncode == 0 and same_dir(found.stdout.strip(), git_dir):
        del os.environ['GIT_DIR']
try:
    run_guard(Path(__file__).resolve().parent.parent, 'git_guard.py')
except (OSError, ValueError) as error:
    print(str(error), file=sys.stderr)
    raise SystemExit(1)
