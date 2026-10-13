#!/bin/bash
# Usage: consent-coverage.sh <host-dir> <log-file> <spec-glob> [extra ng test args...]
# Angular instruments only files under the project's sourceRoot ("src"), so Common-UI code is never
# measured. This sets sourceRoot to "" for the run only and always restores angular.json.
host="$1"; log="$2"; glob="$3"; shift 3
here="$(cd "$(dirname "$0")" && pwd)"
backup="$(mktemp)"
cp "$host/angular.json" "$backup"
trap 'cp "$backup" "$host/angular.json"; rm -f "$backup"' EXIT
python3 - "$host/angular.json" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
a = '"sourceRoot": "src"'
assert s.count(a) == 1, 'expected exactly one sourceRoot "src" in angular.json'
open(p, 'w').write(s.replace(a, '"sourceRoot": ""'))
PY
"$here/karma-run.sh" "$host" "$log" --include="$glob" --code-coverage \
  --code-coverage-exclude='src/**' --code-coverage-exclude='**/testing/**' \
  --code-coverage-exclude='node_modules/**' "$@"
tr '\r' '\n' < "$log" | grep -A5 "Coverage summary"
