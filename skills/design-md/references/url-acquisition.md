# URL Acquisition

Use this reference only in `url` mode, and only when the page must actually be
retrieved. It defines how to detect capability, how to choose an acquisition
path, and when to stop. `url-mode.md` remains authoritative for how to analyze
evidence once acquired.

## Governing Principle

Scripts in `scripts/` are accelerators, never prerequisites. Every capability
below has a manual equivalent, because this skill is distributed as Markdown
into arbitrary agent environments, including agents with no shell at all. If a
script cannot run, perform the equivalent steps with the tools available and
record the same evidence fields.

Acquisition is a combination of complementary probes, not a single backend
choice. Different artifacts have different best sources, and the strongest
source for CSS is not a browser.

## Artifact Source Matrix

| Artifact | Primary source | Fallback |
| --- | --- | --- |
| CSS source text and token declarations | Raw HTTP fetch of each stylesheet URL | In-browser `document.styleSheets` |
| Runtime-injected CSS (CSS-in-JS) | Rendered DOM `<style>` blocks | Computed styles |
| Rendered DOM and component structure | Rendering backend | Static HTML |
| Font declarations | Raw HTTP fetch of `@font-face` URLs | `document.fonts` |
| Computed styles | Rendering backend | None; do not substitute a guess |
| Resource and asset URLs | Network inspection | DOM-derived `src`/`href` list |
| Screenshot | Rendering backend | None; supporting evidence only |

Cross-origin stylesheets must be retrieved by raw HTTP. In any browser engine,
reading `cssRules` on a cross-origin sheet throws `SecurityError`, while an
ordinary HTTP request for the same URL has no CORS restriction and returns the
full text. This was verified against a live page: four cross-origin sheets from
`fonts.googleapis.com` and `cdn.jsdelivr.net` were unreadable in the DOM, all
four were fully retrieved by HTTP, and every `@font-face` declaration on the
page came from the sheet the browser could not read. Losing that sheet would
have silently deleted the entire Typography section.

Never treat a DOM `SecurityError` as permission to approximate the values.

## Layer A: Agent Capability

Inspect available tools before touching the machine. This is the cheapest check
and is about the agent, not the host.

Record whether the agent has:

- a browser or MCP page tool (navigate, snapshot, evaluate, network list,
  screenshot);
- shell execution;
- a plain HTTP fetch tool;
- file write.

Consequences:

- Browser or MCP tool present: prefer it over installing anything. It already
  satisfies rendering, evaluation, network inspection, and screenshots.
- No shell: every script path is unavailable. Use the agent HTTP tool for raw
  CSS and the agent browser tool for rendering. Do not attempt installation.
- No file write: return `DESIGN.md` inline as `SKILL.md` already specifies.

## Layer B: URL Safety Gate

Run this before any request to the page. A failed gate means zero page requests.

Reject without asking:

- any scheme other than `https:` (or `http:` only with an explicit user opt-in);
- URLs containing a username or password;
- `localhost`, any `*.localhost`, and names ending in `.local`, `.internal`,
  `.lan`, `.home`, `.corp`, or `.intranet`;
- loopback `127.0.0.0/8`, RFC1918, link-local `169.254.0.0/16` including the
  `169.254.169.254` cloud metadata endpoint, `0.0.0.0/8`, `::`, `::1`,
  `fc00::/7`, `fe80::/10`, multicast, and IPv4-mapped forms of any of these;
- hostnames that fail DNS resolution, because an unverifiable host cannot be
  proven public;
- hostnames whose resolved IP addresses are private, checked after resolution
  and not only on the literal string. A public name pointing at `127.0.0.1` must
  be rejected;
- paths disallowed by `robots.txt`.

Then check `robots.txt` for the target path before fetching the page. If it is
disallowed, stop and report. Do not change the user agent to evade a rule.

Re-run the gate on every redirect hop, and bound the chain. A hop that lands on
a private host, an unsupported scheme, or a login page is a stop condition.

## Layer C: Cheap Acquisition and Requirement Class

Fetch the document with plain HTTP, without JavaScript, and fetch every linked
stylesheet by raw HTTP. This single step yields the highest-priority evidence in
the `SKILL.md` priority list and requires no browser.

Then classify the requirement:

- `R1` static evidence sufficient. The document and its stylesheets already
  contain the design evidence. Stop here. No browser, no installation, no
  prompt.
- `R2` rendering beneficial. Tokens are available from CSS, but component
  structure or repeated patterns need the rendered DOM.
- `R3` rendering required. Tokens exist only at runtime, such as CSS-in-JS,
  a theme provider, or an empty hydration shell.

Requirement classification must be driven by evidence of client-side rendering,
never by page sparseness. A small static page with twelve elements and no
scripts is a legitimate `R1` outcome, not a page that needs a browser. Treat
rendering as required only when the source shows it:

- an empty root container such as `<div id="root"></div>`;
- a framework bundle present together with a sparse DOM;
- an SSR hydration shell with almost no server-rendered content.

Report sparseness separately as a fact about the source. It means the site
genuinely offers little design evidence, so sections should be omitted per
`SKILL.md`, not that a stronger backend should be installed.

## Layer D: Stop Conditions

These are terminal. Report and stop. They are never resolved by switching
backends, retrying, or escalating.

- `robots.txt` disallows the path;
- HTTP `401`, or a redirect to a login or SSO flow;
- a paywall, metering wall, or consent wall;
- a bot challenge: HTTP `403`, `429`, `503`, CAPTCHA, or an interstitial;
- the target is not a public host, or the gate failed;
- the response is not an HTML document.

Escalating to anti-detection, proxies, private-network allowances, credential
reuse, or login automation in response to any of these is prohibited by
`url-mode.md` and must not be offered to the user as a way to continue.

## Layer E: Backend Capability Probe

Probe only for `R2` or `R3`, and only after Layer A found no sufficient browser
tool. Probe real capability, not mere presence.

Run `scripts/probe-env.sh`. It is read-only, performs no network requests, and
installs nothing. It reports `obscura`, `bun` with `webViewTypeof` and
`webViewState`, `chromium`, HTTP clients, and a `notes` array of caveats.

Interpretation:

- `obscura.present` true does not establish rendering. Obscura ships `render`,
  `no-render`, and `stealth` build variants. Confirm screenshot capability
  lazily during the first real acquisition and record the result in
  `capabilities` rather than pre-probing a third-party URL.
- `obscura.workerPresent` false means `obscura scrape` batch mode is unavailable.
- `bun.present` true is not sufficient. Require `webViewTypeof` to be
  `function` and `webViewState` to be `constructible`. The probe constructs a
  view and evaluates `1+1` without navigating anywhere, so it never touches the
  network and never needs a private-network allowance.
- `webViewState` equal to `construct-failed` on Linux or Windows usually means no
  Chromium-based browser is installed. Treat the backend as unavailable.
- On macOS `Bun.WebView` uses the system WKWebView, so CSS, font, and layout
  results may differ from Chromium. Record this as a warning when it affects
  evidence.
- `webViewState` equal to `not-probed` or `probe-failed` means the backend is
  unverified. Do not present it to the user as working.

Manual equivalent when no shell exists: attempt the backend directly and record
the failure as an unavailable capability.

## Layer F: Side-Effect Classes and Consent

Classify each viable option before acting.

| Class | Examples | Rule |
| --- | --- | --- |
| Read-only | Agent HTTP tool, agent browser tool, already-installed CLI | Proceed silently |
| Public fetch | Page, stylesheets, fonts, `robots.txt` | Within user intent |
| Subprocess | Spawning a browser process, ephemeral storage | Proceed, disclose in the report |
| Environment change | Installing Obscura, Bun, or Chromium | Explicit consent required |
| Prohibited | Stealth mode, proxy rotation, private-network allowance, reusing a user profile, persisted cookies, login automation | Never automatic; most are never allowed |

When consent is needed, ask once and disclose: what will be installed, the
install command, that it downloads and runs third-party code, whether system
dependencies are involved, that it changes the environment, that the target page
will be requested, that no existing login state or cookies will be used, and
what happens if installation fails.

Never run an install command as part of a probe. Probing is read-only.

If the user declines, degrade rather than fail: generate only
evidence-supported sections and report the acquisition gap.

Honor an explicit user preference. If the user names a backend, verify that
backend and skip the option menu.

Probe once per task. Reuse the result across pages for site-wide analysis, and
re-probe only if a backend starts failing.

## Layer G: Evidence Sufficiency Loop

Availability of a backend does not mean evidence was acquired. After each
acquisition, compare what was captured against what the page exposes.

Check:

- how many stylesheets were found, how many were retrieved, and how many failed;
- how many custom properties, `@font-face` rules, color functions, shadows, and
  radii were yielded;
- whether the rendered DOM is still an empty shell after settling;
- whether HTML was truncated.

Then decide:

- sufficient: proceed to generation;
- insufficient and a stronger backend is available: escalate exactly one step;
- insufficient and no stronger backend: degrade, generate only supported
  sections, and report the gap;
- a stop condition from Layer D: report and halt.

Escalation ladder, at most one step per level:

```text
static HTTP plus raw CSS fetch
  -> agent browser or MCP tool
  -> already-installed Obscura or usable Bun.WebView
  -> [consent gate] propose installation, never execute automatically
  -> degrade: supported sections only, report the gap
  -> halt with a diagnosis
```

## Evidence Contract

Every acquisition path, scripted or manual, must produce the same fields. The
scripted form is `design-md/page-evidence@1`, emitted by
`scripts/fetch-page.ts`.

```text
requestedUrl, finalUrl, redirects, mode
gate: passed, reasons, warnings, dnsVerified, resolvedAddresses,
      robots { checked, allowed, reason, url }
http: status, contentType, ok
html, htmlTruncated, text, textTruncated
stylesheets[]: url, status, ok, contentType, bytes, rawText, rawTextTruncated,
               reason, analysis { customProperties, fontFaces, colorFunctions,
               boxShadows, borderRadii, themeSelectors }
inlineStyleBlocks, inlineStyleBytes, customPropertyNames
resourceUrls
tokenYield: customProperties, fontFaces, colorFunctions, boxShadows,
            borderRadii, themeSelectors
signals: elementCount, hasEmptyRoot, frameworkBundles, sparseDom,
         sparseReasons, renderLikelyRequired, renderReasons, botChallenge,
         authWall, paywall, markers
render: attempted, backend, ok, reason, html, text, computedSamples, fonts,
        stylesheetAccess, resourceUrls, screenshotPath, settleMs
acquisition: complete | partial | failed
blockers: robots | auth-wall | paywall | bot-challenge | private-network |
          credentials
capabilities: javascript, renderedDom, networkInspection, screenshot, rawCss
warnings, timingsMs
```

`acquisition` describes whether the page was captured, not whether the design
system is rich:

- `complete`: the gate passed, the document was fetched, and either rendering was
  not required or rendering succeeded;
- `partial`: rendering was required but unavailable or failed, a stylesheet could
  not be retrieved, or content was truncated;
- `failed`: the gate blocked the request, the document could not be fetched, or a
  stop condition is present.

A low `tokenYield` with `acquisition: complete` is a fact about the source, not a
failure. Carry it into the source inventory and omit unsupported sections.

`computedSamples` is level 4 evidence under `SKILL.md`. It must never be
promoted to a token, and `screenshotPath` is supporting evidence only.

## Script Reference

All paths are relative to this skill directory. Invoke through an interpreter so
a lost executable bit cannot break the flow.

```bash
sh scripts/probe-env.sh
```

Read-only local capability probe. No network, no installation. JSON to stdout.

```bash
bun run scripts/fetch-page.ts --url <URL> --mode gate-only
bun run scripts/fetch-page.ts --url <URL> --mode static --output evidence.json
bun run scripts/fetch-page.ts --url <URL> --mode render --selector "main" \
  --screenshot page.png --output evidence.json
```

Modes: `gate-only` runs Layer B and stops before any page request; `static` runs
the gate, fetches the document and every stylesheet by raw HTTP, and classifies
the requirement; `render` adds a Bun.WebView pass and merges runtime-injected
stylesheets into the token yield.

Useful flags: `--timeout` seconds, `--settle` milliseconds, `--selector` CSS to
wait for, `--max-stylesheets`, `--max-css-kb`, `--max-html-kb`,
`--max-text-chars`, `--max-redirects`, `--user-agent`, `--output`,
`--screenshot`.

Exit codes: `0` acquired, `2` gate rejected the URL with no page request made,
`3` blocked or unfetchable, `1` usage error.

`--allow-http` and `--skip-dns-check` weaken the gate. Use them only with an
explicit user decision, and never pass `--skip-dns-check` unless the backend
enforces its own SSRF protection.

The script always uses ephemeral storage, sends no cookies, and has no stealth,
proxy, or private-network flag. Those are deliberately absent.

Equivalent manual steps when Bun is unavailable: validate the URL and resolve the
host with any DNS tool, fetch `robots.txt`, fetch the document with an HTTP tool
following redirects manually, extract `link rel="stylesheet"` hrefs and fetch
each one as raw text, then use the agent browser tool for the rendered DOM if
`R2` or `R3`.

## Canonical Validation

```bash
bun run scripts/validate-design-md.ts --file DESIGN.md
bun run scripts/validate-design-md.ts < DESIGN.md
```

Emits `design-md/validation@1` with `status`, `errors`, `warnings`, `sections`,
and `coverage`. Exit `1` means blocking errors are present.

It enforces the checks listed in `SKILL.md`: single meaningful H1, blockquote
description, exact Theme declaration, Source website placement and URL validity,
canonical H2 set, table shape, the Colors header, token and value cell syntax,
paired values, ranges, placeholders, provenance labels, ASCII minus signs,
scientific notation, balanced CSS functions, `var()` resolution, duplicate and
collapsed tokens, font fallbacks, Type Scale presence, Do/Don't structure,
output purity, filename, and secret-like content.

If the working repository provides its own canonical parser, prefer it and use
this script as the fallback. The manual equivalent is to walk the same checklist
deterministically; visual judgment is never a substitute.
