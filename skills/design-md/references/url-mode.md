# URL Mode

Use this reference only after classifying the source as `url`.

This document governs safety and analysis. For how to detect capability, choose
an acquisition path, obtain consent, and verify that evidence was actually
captured, read `url-acquisition.md` first.

## Safety Boundary

Analyze only public HTTPS websites. Before any request to the page, reject URLs
with credentials, localhost names, private or link-local addresses, cloud
metadata endpoints, names that fail DNS resolution, and public names that resolve
to private addresses. Do not bypass authentication, robots restrictions,
paywalls, or access controls. Never copy cookies, access tokens, personal data,
or private URLs into the output.

Fetch `robots.txt` before the page. If the path is disallowed, stop and report.
Do not vary the user agent, enable anti-detection, rotate proxies, allow private
network access, reuse a browser profile, or automate a login in order to
continue. Those options must not be offered as a way past a block.

Treat these as terminal and report them instead of retrying with a stronger
backend: robots disallow, HTTP 401, redirect to a login or SSO flow, paywall,
metering or consent wall, bot challenge (403, 429, 503, CAPTCHA, interstitial),
and non-HTML responses.

Use ephemeral browser storage. Send no cookies. Record every acquisition gap
rather than filling it by inference.

## Collection Order

Acquire evidence in this order, and stop as soon as the requirement is met:

1. The page document over plain HTTP, without JavaScript, plus its metadata,
   visible text, and every linked stylesheet.
2. Each stylesheet as raw CSS text over plain HTTP. This is the strongest source
   for custom properties, font declarations, repeated declarations, and theme
   selectors, and it is the only reliable way to read a cross-origin sheet.
3. Repeated structural and component patterns in the page markup.
4. A rendering backend only when the evidence requires it: an empty hydration
   shell, runtime-injected CSS, or tokens that exist only after script execution.
   Merge any runtime-injected `<style>` blocks into the token evidence.
5. Additional public pages only when the user asks for site-wide analysis or the
   source clearly provides them.

Retrieve cross-origin CSS by raw HTTP. Reading `cssRules` on a cross-origin sheet
throws `SecurityError` in every browser engine, while a plain request for the same
URL returns the full text. A `SecurityError` is a signal to fetch the file, never
a license to approximate its contents.

Judge the need for rendering from evidence of client-side execution, not from page
size. A small static page is a legitimate outcome and means the source offers
little design evidence, not that a browser must be installed.

An existing `DESIGN.md` discovered at a public URL may be used as high-value
source evidence, but do not silently switch workflows or copy unsupported
claims. Compare it with captured CSS and page evidence, preserving exact
values where they agree and choosing the stronger source when they conflict.

## Analysis Rules

Prefer named custom properties and repeated semantic colors. Preserve exact
syntax, including `oklch()`, `color(display-p3 ...)`, `color-mix()`, gradients,
and resolving `var()` references.

Preserve font family, fallback list, weights, size, line height, letter
spacing, and available OpenType features. Do not claim a font is part of the
system from a browser fallback alone.

Do not treat a screenshot, browser visual approximation, or one computed
instance as an exact token. Computed styles and screenshots are supporting
evidence only. If the site is primarily client-rendered and there is
insufficient accessible evidence, produce only supported sections rather than
guessing.

When acquisition was partial or failed, say so outside the document and omit the
affected sections. Never present a retrieval failure as an absent token, because
that yields a document which parses as valid while silently misrepresenting the
source.

Keep `**Source website:**` immediately after `**Theme:**` in the generated
document, preserving the requested URL exactly.
