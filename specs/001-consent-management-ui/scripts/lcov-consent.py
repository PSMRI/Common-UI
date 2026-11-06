#!/usr/bin/env python3
"""Coverage for consent files only, from an lcov.info: per-file and total for the four metrics.

Usage: lcov-consent.py <lcov.info> <host-dir> [base-ref]
Counts files under src/consent/ and v2/consent/ (not testing/). For changed existing files
(registration.component.ts) only the lines added since base-ref (default: HEAD of the feature
branch's upstream base, e.g. origin/angular-zard-migration) are counted.
"""
import os
import re
import subprocess
import sys

files = {}
cur = None
for line in open(sys.argv[1]):
    line = line.strip()
    if line.startswith('SF:'):
        cur = line[3:]
        files[cur] = {'DA': [], 'BRDA': [], 'FNDA': [], 'FN': {}}
    elif cur and line.startswith('DA:'):
        n, hits = line[3:].split(',')[:2]
        files[cur]['DA'].append((int(n), int(hits)))
    elif cur and line.startswith('BRDA:'):
        n, _b, _br, hits = line[5:].split(',')
        files[cur]['BRDA'].append((int(n), 0 if hits == '-' else int(hits)))
    elif cur and line.startswith('FN:'):
        n, name = line[3:].split(',', 1)
        files[cur]['FN'][name] = int(n)
    elif cur and line.startswith('FNDA:'):
        hits, name = line[5:].split(',', 1)
        files[cur]['FNDA'].append((name, int(hits)))

tot = {'lines': [0, 0], 'branches': [0, 0], 'functions': [0, 0]}
for path, d in sorted(files.items()):
    in_consent = re.search(r'/(src|v2)/consent/', path) and '/testing/' not in path
    hook = path.endswith('registrar/registration/registration.component.ts')
    if not (in_consent or hook):
        continue
    keep = None
    if hook:
        full = os.path.join(sys.argv[2], path)
        repo = os.path.join(sys.argv[2], 'Common-UI')
        base = sys.argv[3] if len(sys.argv) > 3 else 'origin/angular-zard-migration'
        diff = subprocess.run(['git', '-C', repo, 'diff', '-U0', base, '--', os.path.relpath(full, repo)],
                              capture_output=True, text=True).stdout
        keep = set()
        for m in re.finditer(r'^@@ -\S+ \+(\d+)(?:,(\d+))? @@', diff, re.M):
            start, count = int(m.group(1)), int(m.group(2) or 1)
            keep.update(range(start, start + count))
    da = [h for n, h in d['DA'] if keep is None or n in keep]
    br = [h for n, h in d['BRDA'] if keep is None or n in keep]
    fn = [h for name, h in d['FNDA'] if keep is None or d['FN'].get(name) in keep]
    for k, arr in (('lines', da), ('branches', br), ('functions', fn)):
        tot[k][0] += sum(1 for h in arr if h > 0)
        tot[k][1] += len(arr)
    miss = [n for n, h in d['DA'] if h == 0 and (keep is None or n in keep)]
    bmiss = sorted({n for n, h in d['BRDA'] if h == 0 and (keep is None or n in keep)})
    short = path.split('Common-UI/')[-1]
    print(f"{short}: lines {sum(1 for h in da if h)}/{len(da)} branches {sum(1 for h in br if h)}/{len(br)}"
          + (f"  missed lines {miss}" if miss else '') + (f"  missed branches at {bmiss}" if bmiss else ''))
print('TOTAL ' + '  '.join(f"{k} {v[0]}/{v[1]} ({100.0 * v[0] / v[1] if v[1] else 100:.2f}%)" for k, v in tot.items()))
