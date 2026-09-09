# Project Mode

Use this reference only after classifying the source as `project`.

## Inspection Order

Start with the directory tree, package metadata, and framework configuration.
Then inspect authored files that define or reuse visual rules. Prioritize these
locations when they exist, without assuming a particular framework:

- global CSS, CSS modules, Sass, and theme files;
- CSS custom properties and `@theme` declarations;
- Tailwind, UnoCSS, PostCSS, or other styling configuration;
- token files in JSON, YAML, TypeScript, or JavaScript;
- font imports, font-face declarations, and typography configuration;
- shared UI, primitives, layouts, and representative components;
- dark-mode selectors, media queries, and theme providers;
- README or product documentation containing explicit design constraints.

## Analysis Rules

Distinguish global tokens from component-local values. A variable declared in a
theme or global token file is stronger evidence than a literal used once in a
page component. Inspect representative reusable components for roles and
states such as hover, focus, disabled, selected, loading, and error, but only
document states actually present in the source.

When the project contains generated files, dependencies, build output,
snapshots, or vendored code, prefer authored source and configuration. Do not
scan or reproduce `.env` values, credentials, or unrelated application data.

## Extraction Checklist

Record evidence for:

- semantic colors and gradients;
- font families, fallbacks, weights, and type scale;
- repeated spacing, radii, borders, and complete layered shadows;
- theme-specific values and dark-mode behavior;
- reusable component roles and evidenced states;
- layout constraints that repeat across pages or components.

Preserve exact source syntax and units. Do not normalize values into another
unit or manufacture scale steps. If the project does not define enough
evidence for a section, omit that section or row.
