#!/bin/bash
# Usage: karma-run.sh <host-dir> <log-file> [extra ng test args...]
# Runs `ng test` once and stops Karma after the TOTAL line (Karma sometimes never exits). 40 min cap.
dir="$1"; log="$2"; shift 2
cd "$dir" || exit 2
npx ng test --watch=false --browsers=ChromeHeadless "$@" > "$log" 2>&1 &
pid=$!
for i in $(seq 1 2400); do
  if grep -q "TOTAL:" "$log" 2>/dev/null; then sleep 5; pkill -P $pid 2>/dev/null; kill $pid 2>/dev/null; break; fi
  if ! kill -0 $pid 2>/dev/null; then break; fi
  sleep 1
done
kill -0 $pid 2>/dev/null && { echo "TIMEOUT" >> "$log"; pkill -P $pid; kill $pid; }
grep -E "TOTAL:" "$log" | tail -1
