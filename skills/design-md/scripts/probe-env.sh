#!/bin/sh
set -u

json_str() {
  printf '%s' "$1" | tr -d '\n\r\t' | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

sanitize() {
  printf '%s' "$1" | tr -cd 'A-Za-z0-9._+:-'
}

sanitize_text() {
  printf '%s' "$1" | tr -cd 'A-Za-z0-9 ._+:/(),~-' | cut -c1-160
}

have() {
  command -v "$1" >/dev/null 2>&1
}

bool_json() {
  if [ "$1" -eq 0 ]; then
    printf 'true'
  else
    printf 'false'
  fi
}

run_limited() {
  _limit=$1
  shift
  if have timeout; then
    timeout "$_limit" "$@" 2>/dev/null
    return $?
  fi
  _tmp=$(mktemp 2>/dev/null) || _tmp=""
  if [ -z "$_tmp" ]; then
    "$@" 2>/dev/null
    return $?
  fi
  "$@" >"$_tmp" 2>/dev/null &
  _pid=$!
  _waited=0
  while [ "$_waited" -lt "$_limit" ]; do
    kill -0 "$_pid" 2>/dev/null || break
    sleep 1
    _waited=$((_waited + 1))
  done
  if kill -0 "$_pid" 2>/dev/null; then
    kill -9 "$_pid" 2>/dev/null
    wait "$_pid" 2>/dev/null
    rm -f "$_tmp"
    return 124
  fi
  wait "$_pid"
  _status=$?
  cat "$_tmp"
  rm -f "$_tmp"
  return "$_status"
}

present_flag() {
  if have "$1"; then
    printf '0'
  else
    printf '1'
  fi
}

version_of() {
  _raw=$(run_limited 15 "$1" --version 2>/dev/null | sed -n '1p')
  sanitize_text "$_raw"
}

NOTES=""
add_note() {
  if [ -z "$NOTES" ]; then
    NOTES="$1"
  else
    NOTES="$NOTES|$1"
  fi
}

PLATFORM=$(sanitize "$(uname -s 2>/dev/null || printf unknown)")
MACHINE=$(sanitize "$(uname -m 2>/dev/null || printf unknown)")

CURL=$(present_flag curl)
WGET=$(present_flag wget)
NODE=$(present_flag node)
BUN=$(present_flag bun)
OBSCURA=$(present_flag obscura)
WORKER=$(present_flag obscura-worker)
PYTHON=$(present_flag python3)
TIMEOUTCMD=$(present_flag timeout)

CURL_VERSION=""
WGET_VERSION=""
NODE_VERSION=""
BUN_VERSION=""
OBSCURA_VERSION=""
PYTHON_VERSION=""
[ "$CURL" -eq 0 ] && CURL_VERSION=$(version_of curl)
[ "$WGET" -eq 0 ] && WGET_VERSION=$(version_of wget)
[ "$NODE" -eq 0 ] && NODE_VERSION=$(version_of node)
[ "$BUN" -eq 0 ] && BUN_VERSION=$(version_of bun)
[ "$OBSCURA" -eq 0 ] && OBSCURA_VERSION=$(version_of obscura)
[ "$PYTHON" -eq 0 ] && PYTHON_VERSION=$(version_of python3)

CHROMIUM_PATH=""
CHROMIUM_SOURCE="none"
for candidate in chromium chromium-browser google-chrome google-chrome-stable chrome; do
  if have "$candidate"; then
    CHROMIUM_PATH=$(command -v "$candidate")
    CHROMIUM_SOURCE="path"
    break
  fi
done
if [ -z "$CHROMIUM_PATH" ] && [ -n "${CHROME_PATH:-}" ] && [ -x "${CHROME_PATH:-}" ]; then
  CHROMIUM_PATH="$CHROME_PATH"
  CHROMIUM_SOURCE="env"
fi
if [ -z "$CHROMIUM_PATH" ] && [ "$PLATFORM" = "Darwin" ]; then
  for bundle in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" "/Applications/Chromium.app/Contents/MacOS/Chromium" "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"; do
    if [ -x "$bundle" ]; then
      CHROMIUM_PATH="$bundle"
      CHROMIUM_SOURCE="app-bundle"
      break
    fi
  done
fi
CHROMIUM_PRESENT=1
[ -n "$CHROMIUM_PATH" ] && CHROMIUM_PRESENT=0

WEBVIEW_TYPEOF="not-probed"
WEBVIEW_STATE="not-probed"
if [ "$BUN" -eq 0 ]; then
  WEBVIEW_PROBE='
(async () => {
  const out = [];
  const kind = typeof Bun !== "undefined" ? typeof Bun.WebView : "no-bun";
  out.push(kind);
  if (kind !== "function") {
    out.push("unsupported");
  } else {
    let view = null;
    try {
      view = new Bun.WebView({ width: 320, height: 240, dataStore: "ephemeral" });
      const sum = await view.evaluate("1+1");
      out.push(sum === 2 ? "constructible" : "degraded");
    } catch (err) {
      out.push("construct-failed");
    } finally {
      try {
        if (view && typeof view.close === "function") {
          await view.close();
        }
      } catch (err) {}
      try {
        Bun.WebView.closeAll();
      } catch (err) {}
    }
  }
  process.stdout.write(out.join("\n"));
})();
'
  PROBE_OUT=$(run_limited 90 bun -e "$WEBVIEW_PROBE" 2>/dev/null)
  PROBE_STATUS=$?
  WEBVIEW_TYPEOF=$(sanitize "$(printf '%s\n' "$PROBE_OUT" | sed -n '1p')")
  WEBVIEW_STATE=$(sanitize "$(printf '%s\n' "$PROBE_OUT" | sed -n '2p')")
  [ -z "$WEBVIEW_TYPEOF" ] && WEBVIEW_TYPEOF="probe-failed"
  [ -z "$WEBVIEW_STATE" ] && WEBVIEW_STATE="probe-failed"
  [ "$PROBE_STATUS" -eq 124 ] && add_note "Bun.WebView probe exceeded its time budget and was terminated"
fi

if [ "$OBSCURA" -eq 0 ]; then
  add_note "obscura render and screenshot capability is confirmed lazily during the first real acquisition"
  if [ "$WORKER" -eq 1 ]; then
    add_note "obscura-worker is missing so obscura scrape batch mode is unavailable"
  fi
fi
if [ "$BUN" -eq 1 ]; then
  add_note "bun is absent so Bun.WebView and the bundled TypeScript scripts cannot run"
elif [ "$WEBVIEW_TYPEOF" != "function" ]; then
  add_note "Bun.WebView is not exposed by this Bun build"
elif [ "$WEBVIEW_STATE" = "construct-failed" ]; then
  add_note "Bun.WebView construction failed so a Chromium based browser is likely missing"
elif [ "$WEBVIEW_STATE" = "probe-failed" ]; then
  add_note "Bun.WebView probe did not report a usable state"
fi
if [ "$PLATFORM" = "Darwin" ] && [ "$WEBVIEW_STATE" = "constructible" ]; then
  add_note "Bun.WebView on macOS uses system WKWebView so CSS and font results may differ from Chromium"
fi
if [ "$CURL" -eq 1 ] && [ "$WGET" -eq 1 ]; then
  add_note "no shell http client found so static acquisition needs an agent provided fetch tool"
fi
if [ "$TIMEOUTCMD" -eq 1 ]; then
  add_note "no timeout command so probes use a portable shell watchdog"
fi

printf '{\n'
printf '  "probe": "design-md/url-acquisition",\n'
printf '  "readOnly": true,\n'
printf '  "networkRequests": 0,\n'
printf '  "installsPerformed": false,\n'
printf '  "platform": "%s",\n' "$(json_str "$PLATFORM")"
printf '  "arch": "%s",\n' "$(json_str "$MACHINE")"
printf '  "hasTimeoutCommand": %s,\n' "$(bool_json "$TIMEOUTCMD")"
printf '  "http": {\n'
printf '    "curl": { "present": %s, "version": "%s" },\n' "$(bool_json "$CURL")" "$(json_str "$CURL_VERSION")"
printf '    "wget": { "present": %s, "version": "%s" }\n' "$(bool_json "$WGET")" "$(json_str "$WGET_VERSION")"
printf '  },\n'
printf '  "obscura": {\n'
printf '    "present": %s,\n' "$(bool_json "$OBSCURA")"
printf '    "version": "%s",\n' "$(json_str "$OBSCURA_VERSION")"
printf '    "workerPresent": %s\n' "$(bool_json "$WORKER")"
printf '  },\n'
printf '  "bun": {\n'
printf '    "present": %s,\n' "$(bool_json "$BUN")"
printf '    "version": "%s",\n' "$(json_str "$BUN_VERSION")"
printf '    "webViewTypeof": "%s",\n' "$(json_str "$WEBVIEW_TYPEOF")"
printf '    "webViewState": "%s"\n' "$(json_str "$WEBVIEW_STATE")"
printf '  },\n'
printf '  "node": { "present": %s, "version": "%s" },\n' "$(bool_json "$NODE")" "$(json_str "$NODE_VERSION")"
printf '  "python3": { "present": %s, "version": "%s" },\n' "$(bool_json "$PYTHON")" "$(json_str "$PYTHON_VERSION")"
printf '  "chromium": {\n'
printf '    "present": %s,\n' "$(bool_json "$CHROMIUM_PRESENT")"
printf '    "source": "%s",\n' "$(json_str "$CHROMIUM_SOURCE")"
printf '    "path": "%s"\n' "$(json_str "$CHROMIUM_PATH")"
printf '  },\n'
printf '  "notes": ['
FIRST_NOTE=1
if [ -n "$NOTES" ]; then
  OLD_IFS=$IFS
  IFS='|'
  for note in $NOTES; do
    if [ "$FIRST_NOTE" -eq 1 ]; then
      printf '\n'
      FIRST_NOTE=0
    else
      printf ',\n'
    fi
    printf '    "%s"' "$(json_str "$note")"
  done
  IFS=$OLD_IFS
  printf '\n  '
fi
printf ']\n'
printf '}\n'
