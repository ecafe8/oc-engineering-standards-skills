# URL Mode

Use this reference only after classifying the source as `url`.

## Safety Boundary

Analyze only public HTTPS websites. Reject or avoid URLs with credentials,
localhost, private network addresses, or other internal destinations. Do not
bypass authentication, robots restrictions, paywalls, or access controls.
Never copy cookies, access tokens, personal data, or private URLs into the
output.

## Collection Order

Collect evidence in this order:

1. The requested page's HTML, metadata, visible text, and linked stylesheets.
2. CSS custom properties, font declarations, repeated declarations, and theme
   selectors in fetched stylesheets.
3. Repeated structural and component patterns in page markup.
4. Additional public pages only when the user asks for site-wide analysis or
   the source clearly provides them.

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
instance as an exact token. If the site is primarily client-rendered and there
is insufficient accessible evidence, produce only supported sections rather
than guessing.

Keep `**Source website:**` immediately after `**Theme:**` in the generated
document, preserving the requested URL exactly.
