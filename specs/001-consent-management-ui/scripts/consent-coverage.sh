#!/bin/bash
# Usage: consent-coverage.sh <host-dir> <log-file> <spec-glob> [extra ng test args...]
# Angular instruments only files under the project's sourceRoot ("src"), so Common-UI code is never
# measured. This sets sourceRoot to "" for the run only and always restores angular.json.
# It also compiles only the consent specs (a temporary tsconfig), so stale host specs that no longer
# compile cannot block the run.
host="$1"; log="$2"; glob="$3"; shift 3
here="$(cd "$(dirname "$0")" && pwd)"
backup="$(mktemp)"
cp "$host/angular.json" "$backup"
tsconfig="$host/tsconfig.consent-spec.tmp.json"
karmaconf="$host/karma.consent.tmp.cjs"
export COVERAGE_DIR="${COVERAGE_DIR:-$(mktemp -d)}"
trap 'cp "$backup" "$host/angular.json"; rm -f "$backup" "$tsconfig" "$karmaconf"' EXIT
# Coverage goes to $COVERAGE_DIR (lcov + summary), never into the repo's coverage/ folder.
karma_args=()
if [ -f "$host/karma.conf.js" ]; then
  karma_args=(--karma-config=karma.conf.js)   # host config must honour COVERAGE_DIR (HWC-UI does)
else
  cat > "$karmaconf" <<'KARMA'
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: { clearContext: false },
    coverageReporter: {
      dir: process.env.COVERAGE_DIR,
      subdir: '.',
      reporters: [{ type: 'lcovonly' }, { type: 'text-summary' }],
    },
    reporters: ['progress'],
    browsers: ['ChromeHeadless'],
    singleRun: true,
    restartOnFileChange: false,
  });
};
KARMA
  karma_args=(--karma-config="$(basename "$karmaconf")")
fi
cat > "$tsconfig" <<'JSON'
{
  "extends": "./tsconfig.spec.json",
  "include": [
    "Common-UI/src/consent/**/*.spec.ts",
    "Common-UI/v2/consent/**/*.spec.ts",
    "Common-UI/src/registrar/**/*.consent-hook.spec.ts",
    "Common-UI/v2/registrar/**/*.consent-hook.spec.ts",
    "src/**/*.d.ts"
  ]
}
JSON
python3 - "$host/angular.json" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
a = '"sourceRoot": "src"'
assert s.count(a) == 1, 'expected exactly one sourceRoot "src" in angular.json'
open(p, 'w').write(s.replace(a, '"sourceRoot": ""'))
PY
# CONSENT_AOT=1 compiles specs AOT (Angular 18+). Needed only for specs that load Zard's stepper,
# which fails in JIT on a load-order issue. JIT is the default so that only authored code is measured
# (AOT also instruments templates and compiler-generated factories).
aot=""
[ "${CONSENT_AOT:-0}" = "1" ] && aot="--aot"
"$here/karma-run.sh" "$host" "$log" --include="$glob" --ts-config="$(basename "$tsconfig")" "${karma_args[@]}" $aot --code-coverage \
  --code-coverage-exclude='src/**' --code-coverage-exclude='**/testing/**' \
  --code-coverage-exclude='node_modules/**' "$@"
tr '\r' '\n' < "$log" | grep -A5 "Coverage summary"
echo "lcov: $COVERAGE_DIR/lcov.info"
