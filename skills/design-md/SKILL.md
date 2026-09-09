---
name: design-md
description: >-
  Generate a canonical DESIGN.md from either a project codebase or a public
  website URL. Use this skill whenever the user asks to extract design tokens,
  UI patterns, colors, typography, spacing, themes, component styles, or a
  design system from source code or a URL, even when they do not explicitly
  mention DESIGN.md. Classify the source first, preserve exact observed values,
  distinguish evidence from inference, and validate the result against the
  canonical DESIGN.md grammar. This skill supports project and URL sources
  only; do not treat an existing DESIGN.md as a separate import mode.
---

# DESIGN.md Generator

Generate one canonical `DESIGN.md` from design-system evidence. The document
must describe reusable design rules for another AI agent, not merely summarize
a page or dump arbitrary styles.

## Workflow

1. Classify the input as exactly one primary source mode: `project` or `url`.
2. Read only the reference document for the selected mode:
   - `references/project-mode.md` for a repository, project directory, source
     tree, or code files.
   - `references/url-mode.md` for a public website URL.
3. Build a source inventory before generating the document.
4. Generate `DESIGN.md` using the shared evidence and output rules below.
5. Run the complete validation protocol before presenting the result.

If both a project and URL are provided, use `project` as the primary mode and
the URL only as secondary corroborating evidence. Do not create an import mode:
an existing `DESIGN.md` found during analysis is evidence, not a separate
workflow. If the source is ambiguous, ask one concise clarification question.

## Shared Evidence Rules

Treat source evidence as authoritative and keep the output smaller rather than
inventing a complete-looking system.

Evidence priority:

1. Explicit tokens, CSS custom properties, theme declarations, token files,
   and published design-system rules.
2. Named values repeated across global styles and reusable components.
3. Repeated patterns across pages or URL stylesheets.
4. A single computed style or page sample.
5. Conservative design judgment.

Use levels 1-2 as token evidence. Use level 3 only when the pattern is clearly
reusable. Treat levels 4-5 as supporting evidence, not as permission to
fabricate a global token. Never present an inferred value as observed.

Do not:

- invent missing colors, dimensions, font weights, tokens, or component states;
- expand one spacing value into a made-up spacing scale;
- convert a one-off element width or responsive measurement into a token;
- infer exact CSS values from visual appearance alone;
- copy secrets, cookies, access tokens, private URLs, or personal data;
- merge light and dark values into one theme;
- add filler sections only to satisfy a checklist.

If a useful value lacks enough evidence, omit the row. Components, layout,
imagery, and Do/Don't guidance are optional when the source does not support
them.

## Canonical Output Contract

Write only the canonical Markdown document to `DESIGN.md` at the requested
destination. If no destination is specified for project mode, use the project
root. If no writable project is available for URL mode, return the complete
document in the response and identify it as `DESIGN.md`.

The document must contain one meaningful H1, a short blockquote description,
and an exact `**Theme:** light` or `**Theme:** dark` declaration.

For URL-derived documents, put `**Source website:**` immediately after Theme,
preserve the requested URL, and state that the live website remains
authoritative.

For content sections, apply the evidence rule: if the source contains
supported evidence for a token group or reusable pattern, `DESIGN.md` must
include the corresponding canonical section and preserve that evidence. If the
source does not contain enough evidence, omit the section rather than creating
an empty table or invented filler. Possible sections are:

- `## Tokens – Colors` with `Name | Value | Token | Role`;
- `## Tokens – Typography` with font blocks and a Type Scale table;
- `## Tokens – Spacing & Shapes` with Spacing Scale, Border Radius, and
  Shadows tables;
- `## Components`, `## Do's and Don'ts`, `## Imagery`, and `## Layout` when
  supported by evidence.

Canonical syntax rules:

- A Token cell contains exactly one CSS custom property such as
  `--color-primary`.
- A Value cell contains exactly one executable CSS value.
- Never write paired values such as `1rem (16px)`, ranges, placeholders, or
  provenance labels such as `(assumed)` or `(inferred)` in canonical cells.
- Use ASCII `-` for negative values and never use scientific notation.
- Keep full multi-layer shadow values intact.
- Keep separate themes separate; do not collapse light and dark tokens.
- Use English canonical headings and prose while preserving brand names,
  product names, token names, and quoted source content.
- Return no Markdown fence, preamble, explanation, or trailing commentary as
  part of `DESIGN.md`.

## Validation Protocol

Validation is mandatory. Do not treat a document as complete merely because it
looks plausible. Run this pipeline:

```text
source evidence
  -> source inventory
  -> generate DESIGN.md
  -> canonical parser
  -> content coverage check
  -> security and output-purity check
  -> validation status
```

### 1. Build a source inventory

Before generation, record supported evidence categories and their counts or
locations. At minimum track colors, fonts, type scale, spacing, radii,
shadows, themes, reusable components, layout constraints, and URL source when
present. Keep this inventory internal unless the user requests an evidence
report.

### 2. Run canonical parsing

If the repository provides `parseDesignDoc`, call it on the complete Markdown
string. Treat `result.errors` as blocking. Check H1, description, Theme, URL
metadata, table shape, token and value syntax, `var()` references, CSS function
syntax, font blocks, Type Scale, Layout, Components, and Do/Don't structure
where those sections exist.

If no parser is available, perform the same checks with a deterministic local
Markdown/CSS validation step. Do not replace validation with visual judgment.

### 3. Check source coverage

Compare the generated AST or parsed sections with the source inventory:

- Every high-priority explicit token must be preserved unless its omission is
  documented as unsafe, duplicated, or intentionally out of scope.
- Every supported evidence category must have its corresponding section.
- Every light and dark value must remain in its own theme context.
- A section may be absent only when the source inventory has insufficient
  evidence for it.
- A single instance must not be counted as a reusable token without evidence.

When an evidence report is requested, report coverage as counts such as
`colors: 8/8`, `spacing: 4/4`, and `shadows: 2/2`. Do not silently drop
explicit source values.

### 4. Check security and output purity

Reject or remove secrets, credentials, cookies, authorization headers, private
URLs, personal data, Markdown fences, preambles, trailing explanations, and
provenance labels from the output. Check that the file is named exactly
`DESIGN.md`, not `design.md` or another variant.

### 5. Assign a validation status

Use this state model:

```text
valid              = no parser errors, coverage errors, or purity errors
valid-with-warnings = no blocking errors, but parser warnings remain
invalid            = any parser error, coverage error, or purity error
```

The status is workflow metadata and must not be written into `DESIGN.md`.

### 6. Repair at most once

If validation is `invalid`, repair the document once using the diagnostics and
the original source inventory, then run the full validation protocol again. If
it remains invalid, keep the evidence-backed `DESIGN.md`, remove malformed
unsupported rows where necessary, and report unresolved diagnostics outside
the document when a report was requested. Never hide uncertainty by fabricating
values.

## Optional Evidence Report

Do not add evidence notes to `DESIGN.md` unless the user asks for them. When
requested, create a separate `design-evidence.md` containing the source mode,
source locations, evidence for extracted tokens, intentionally omitted values,
source conflicts, coverage counts, validation status, and clearly separated
inferences. It must never change the canonical output or turn an inference into
a token.
