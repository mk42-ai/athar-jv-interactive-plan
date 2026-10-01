#!/usr/bin/env bash
# Run a Playwright/Node job in its OWN process group with a hard wall-clock cap; on every exit path kill the whole group
# and any Chromium carrying this run's marker switch (Playwright launches the browser detached = separate group).
# usage: pw-run.sh <timeout_s> <marker> <cmd...>
T=$1; M=$2; shift 2
export ATHAR_QA_MARKER="$M"
setsid bash -c 'exec timeout -k 10 '"$T"' "$@"' _ "$@" &
PG=$!
cleanup(){ kill -TERM -- -$PG 2>/dev/null; sleep 0.5; kill -KILL -- -$PG 2>/dev/null; pkill -KILL -f -- "athar-qa-marker=$M" 2>/dev/null; true; }
trap cleanup EXIT INT TERM
wait $PG; RC=$?
exit $RC
