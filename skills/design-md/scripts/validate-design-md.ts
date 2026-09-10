const EN_DASH = "\u2013";
const MINUS_SIGN = "\u2212";

const CANONICAL_H2 = [
  `Tokens ${EN_DASH} Colors`,
  `Tokens ${EN_DASH} Typography`,
  `Tokens ${EN_DASH} Spacing & Shapes`,
  "Components",
  "Do's and Don'ts",
  "Imagery",
  "Layout",
];

const CANONICAL_H2_NORMALIZED = CANONICAL_H2.map((heading) =>
  heading.replace(/[\u2018\u2019]/g, "'").toLowerCase(),
);

const KNOWN_H3 = [
  "type scale",
  "spacing scale",
  "border radius",
  "shadows",
  "font families",
  "fonts",
  "radii",
];

const COLORS_HEADER = ["name", "value", "token", "role"];

const PROVENANCE_LABELS = [
  "assumed",
  "inferred",
  "observed",
  "guessed",
  "approximate",
  "approx",
  "estimated",
  "derived",
  "unverified",
];

const PLACEHOLDER_PATTERN = /\b(?:TODO|TBD|FIXME|N\/A|NA|XXX|Lorem)\b|\$\{|<[a-z-]+>|\.\.\./i;

const SECRET_PATTERN =
  /-----BEGIN [A-Z ]*PRIVATE KEY-----|\bauthorization:\s*\S|\bbearer\s+[A-Za-z0-9._\-]{16,}|\bapi[_-]?key\b\s*[:=]|\bpassword\b\s*[:=]|\bsecret[_-]?key\b\s*[:=]|\bset-cookie:\s*\S|\bsession[_-]?token\b\s*[:=]/i;

type Table = {
  section: string;
  subHeading: string;
  startLine: number;
  header: string[];
  rows: string[][];
};

type Report = {
  errors: string[];
  warnings: string[];
  sections: string[];
  coverage: Record<string, number>;
  stats: Record<string, unknown>;
};

function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell));
}

function balancedParens(value: string): boolean {
  let depth = 0;
  for (const char of value) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function normalizeHeading(value: string): string {
  return value.replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, " ").trim().toLowerCase();
}

function isPairedValue(cell: string): boolean {
  const match = cell.match(/^[^()]+\s+\(([^()]*)\)$/);
  if (!match) return false;
  return /\d\s*(?:px|rem|em|%|vh|vw|s|ms|deg)\b|#[0-9a-f]{3,8}\b/i.test(match[1]);
}

function isRangeValue(cell: string): boolean {
  return /\d(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|deg)?\s*(?:-|\u2013|~|\bto\b)\s*\d(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|deg)/i.test(
    cell,
  );
}

function parseDocument(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const h1Lines: number[] = [];
  const h2Lines: Array<{ index: number; text: string }> = [];
  const themeLines: Array<{ index: number; value: string }> = [];
  const sourceLines: Array<{ index: number; value: string }> = [];
  const blockquoteLines: number[] = [];
  const tables: Table[] = [];

  let currentH2 = "";
  let currentH3 = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();
    if (/^````?/.test(trimmed) || trimmed.includes("```")) continue;

    if (/^#\s+\S/.test(line)) {
      h1Lines.push(index);
      continue;
    }
    if (/^##\s+\S/.test(line)) {
      currentH2 = line.replace(/^##\s+/, "").trim();
      currentH3 = "";
      h2Lines.push({ index, text: currentH2 });
      continue;
    }
    if (/^###\s+\S/.test(line)) {
      currentH3 = line.replace(/^###\s+/, "").trim();
      continue;
    }
    if (/^>\s?/.test(trimmed)) {
      blockquoteLines.push(index);
    }
    const themeMatch = trimmed.match(/^\*\*Theme:\*\*\s*(.*)$/);
    if (themeMatch) {
      themeLines.push({ index, value: themeMatch[1].trim() });
      continue;
    }
    const sourceMatch = trimmed.match(/^\*\*Source website:\*\*\s*(.*)$/);
    if (sourceMatch) {
      sourceLines.push({ index, value: sourceMatch[1].trim() });
      continue;
    }
    if (trimmed.startsWith("|")) {
      const block: Array<{ index: number; cells: string[] }> = [];
      let cursor = index;
      while (cursor < lines.length && lines[cursor].trim().startsWith("|")) {
        block.push({ index: cursor, cells: splitRow(lines[cursor]) });
        cursor += 1;
      }
      if (block.length >= 2 && isSeparatorRow(block[1].cells)) {
        tables.push({
          section: currentH2,
          subHeading: currentH3,
          startLine: block[0].index + 1,
          header: block[0].cells,
          rows: block.slice(2).map((entry) => entry.cells),
        });
      } else {
        tables.push({
          section: currentH2,
          subHeading: currentH3,
          startLine: block[0].index + 1,
          header: block[0]?.cells ?? [],
          rows: block.slice(1).map((entry) => entry.cells),
        });
      }
      index = cursor - 1;
    }
  }

  return { lines, h1Lines, h2Lines, themeLines, sourceLines, blockquoteLines, tables };
}

function validate(markdown: string, filename: string | null): Report {
  const errors: string[] = [];
  const warnings: string[] = [];
  const coverage: Record<string, number> = {};
  const { lines, h1Lines, h2Lines, themeLines, sourceLines, blockquoteLines, tables } =
    parseDocument(markdown);

  if (filename && filename.split("/").pop() !== "DESIGN.md") {
    errors.push(`filename-must-be-DESIGN.md: got ${filename.split("/").pop()}`);
  }

  if (markdown.includes("```")) {
    errors.push("output-purity: markdown fence present");
  }
  if (SECRET_PATTERN.test(markdown)) {
    errors.push("security: secret-like content present");
  }

  const firstNonEmpty = lines.findIndex((line) => line.trim().length > 0);
  if (firstNonEmpty < 0) {
    errors.push("empty-document");
    return { errors, warnings, sections: [], coverage, stats: {} };
  }
  if (!/^#\s+\S/.test(lines[firstNonEmpty])) {
    errors.push(`output-purity: preamble before H1 at line ${firstNonEmpty + 1}`);
  }
  if (h1Lines.length !== 1) {
    errors.push(`single-h1: expected 1 H1, found ${h1Lines.length}`);
  } else {
    const h1Text = lines[h1Lines[0]].replace(/^#\s+/, "").trim();
    if (h1Text.length < 3 || PLACEHOLDER_PATTERN.test(h1Text)) {
      errors.push(`h1-not-meaningful: "${h1Text}"`);
    }
  }

  const headerBlockEnd = h2Lines.length > 0 ? h2Lines[0].index : lines.length;
  const descriptionLines = blockquoteLines.filter((index) => index < headerBlockEnd);
  if (descriptionLines.length === 0) {
    errors.push("missing-blockquote-description");
  } else {
    const descriptionText = descriptionLines
      .map((index) => lines[index].replace(/^>\s?/, "").trim())
      .join(" ")
      .trim();
    if (descriptionText.length < 20) {
      errors.push(`description-too-short: ${descriptionText.length} chars`);
    }
    if (descriptionText.length > 400) {
      warnings.push(`description-not-short: ${descriptionText.length} chars`);
    }
  }

  if (themeLines.length === 0) {
    errors.push("missing-theme-declaration");
  }
  if (themeLines.length > 1) {
    errors.push(`duplicate-theme-declaration: found ${themeLines.length}`);
  }
  for (const theme of themeLines) {
    if (theme.value !== "light" && theme.value !== "dark") {
      errors.push(`invalid-theme-value: "${theme.value}" at line ${theme.index + 1}`);
    }
  }

  if (sourceLines.length > 1) {
    errors.push(`duplicate-source-website: found ${sourceLines.length}`);
  }
  for (const source of sourceLines) {
    if (themeLines.length > 0) {
      const themeIndex = themeLines[0].index;
      let nextNonEmpty = themeIndex + 1;
      while (nextNonEmpty < lines.length && lines[nextNonEmpty].trim().length === 0) {
        nextNonEmpty += 1;
      }
      if (nextNonEmpty !== source.index) {
        errors.push(
          `source-website-position: must immediately follow Theme (theme line ${themeIndex + 1}, source line ${source.index + 1})`,
        );
      }
    }
    let parsed: URL | null = null;
    try {
      parsed = new URL(source.value);
    } catch {
      parsed = null;
    }
    if (!parsed || (parsed.protocol !== "https:" && parsed.protocol !== "http:")) {
      errors.push(`source-website-not-url: "${source.value}"`);
    } else if (parsed.username || parsed.password) {
      errors.push("source-website-contains-credentials");
    }
  }

  const sectionNames = h2Lines.map((entry) => entry.text);
  for (const name of sectionNames) {
    if (!CANONICAL_H2_NORMALIZED.includes(normalizeHeading(name))) {
      errors.push(`unknown-h2-section: "## ${name}"`);
    }
  }
  coverage.sections = sectionNames.length;

  for (const entry of h2Lines) {
    const nextH2 = h2Lines.find((other) => other.index > entry.index);
    const bodyEnd = nextH2 ? nextH2.index : lines.length;
    const body = lines
      .slice(entry.index + 1, bodyEnd)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (body.length === 0) {
      errors.push(`empty-section: "## ${entry.text}" has no content`);
    }
  }

  const declaredTokens = new Set<string>();
  const tokenOccurrences = new Map<string, Array<{ section: string; value: string }>>();

  for (const table of tables) {
    const label = `${table.section}${table.subHeading ? ` > ${table.subHeading}` : ""}`;
    const width = table.header.length;
    if (width === 0) {
      errors.push(`table-shape: no header row at line ${table.startLine} (${label})`);
      continue;
    }
    if (!isSeparatorRow(splitRow(lines[table.startLine] ?? ""))) {
      errors.push(`table-shape: missing separator row at line ${table.startLine} (${label})`);
    }
    coverage[`tables:${label}`] = table.rows.length;

    if (normalizeHeading(table.section) === normalizeHeading(CANONICAL_H2[0])) {
      const header = table.header.map((cell) => cell.trim().toLowerCase());
      if (header.join("|") !== COLORS_HEADER.join("|")) {
        errors.push(
          `colors-header: expected ${COLORS_HEADER.map((c) => c[0].toUpperCase() + c.slice(1)).join(" | ")}, got ${table.header.join(" | ")} at line ${table.startLine}`,
        );
      }
    }

    const subNormalized = normalizeHeading(table.subHeading);
    if (
      table.subHeading &&
      !KNOWN_H3.some((known) => subNormalized.includes(known)) &&
      !CANONICAL_H2_NORMALIZED.some((known) => subNormalized.includes(known))
    ) {
      warnings.push(`unrecognized-subheading: "### ${table.subHeading}" (${label})`);
    }

    const tokenColumn = table.header.findIndex(
      (cell) => cell.trim().toLowerCase() === "token",
    );
    const valueColumn = table.header.findIndex(
      (cell) => cell.trim().toLowerCase() === "value",
    );

    table.rows.forEach((row, rowIndex) => {
      const lineNumber = table.startLine + 2 + rowIndex;
      if (row.length !== width) {
        errors.push(
          `table-shape: row ${rowIndex + 1} has ${row.length} cells, header has ${width} at line ${lineNumber} (${label})`,
        );
      }
      row.forEach((rawCell, cellIndex) => {
        const cell = rawCell.trim();
        if (cell.length === 0) {
          errors.push(`empty-cell: line ${lineNumber} column ${cellIndex + 1} (${label})`);
          return;
        }
        if (SECRET_PATTERN.test(cell)) {
          errors.push(`security: secret-like cell at line ${lineNumber}`);
        }
        for (const provenance of PROVENANCE_LABELS) {
          if (new RegExp(`\\(\\s*${provenance}\\s*\\)`, "i").test(cell)) {
            errors.push(`provenance-label: "(${provenance})" at line ${lineNumber} (${label})`);
          }
        }
        if (PLACEHOLDER_PATTERN.test(cell)) {
          errors.push(`placeholder-value: "${cell}" at line ${lineNumber} (${label})`);
        }
        if (cell.includes(MINUS_SIGN) || (cell.includes(EN_DASH) && /\d/.test(cell))) {
          errors.push(`non-ascii-minus: "${cell}" at line ${lineNumber} (${label})`);
        }
        if (cellIndex !== tokenColumn && cellIndex !== valueColumn) return;

        if (cellIndex === tokenColumn) {
          const matches = cell.match(/--[A-Za-z0-9_-]+/g) ?? [];
          if (matches.length !== 1 || matches[0] !== cell) {
            errors.push(
              `token-cell-syntax: expected exactly one CSS custom property, got "${cell}" at line ${lineNumber} (${label})`,
            );
          } else {
            declaredTokens.add(cell);
            const seen = tokenOccurrences.get(cell) ?? [];
            seen.push({ section: label, value: valueColumn >= 0 ? (row[valueColumn] ?? "").trim() : "" });
            tokenOccurrences.set(cell, seen);
          }
          return;
        }

        if (/;\s*\S/.test(cell)) {
          errors.push(`value-multi-declaration: "${cell}" at line ${lineNumber} (${label})`);
        }
        if (!balancedParens(cell)) {
          errors.push(`css-function-syntax: unbalanced parentheses in "${cell}" at line ${lineNumber} (${label})`);
        }
        if (/[0-9](?:\.[0-9]+)?e[+-]?[0-9]+/i.test(cell)) {
          errors.push(`scientific-notation: "${cell}" at line ${lineNumber} (${label})`);
        }
        if (isPairedValue(cell)) {
          errors.push(`paired-value: "${cell}" at line ${lineNumber} (${label})`);
        }
        if (isRangeValue(cell)) {
          errors.push(`range-value: "${cell}" at line ${lineNumber} (${label})`);
        }
        if (/,$/.test(cell)) {
          warnings.push(`possibly-truncated-value: "${cell}" at line ${lineNumber} (${label})`);
        }
        const isFontFamilyValue =
          /font/i.test(table.subHeading) || table.header[cellIndex - 1]?.toLowerCase().includes("family");
        if (isFontFamilyValue && !cell.includes(",") && !cell.startsWith("var(")) {
          warnings.push(`font-family-missing-fallback: "${cell}" at line ${lineNumber} (${label})`);
        }
        for (const reference of cell.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)) {
          const token = reference[1];
          if (!declaredTokens.has(token) && !markdown.includes(`| ${token} |`)) {
            errors.push(
              `undefined-var-reference: ${token} used at line ${lineNumber} but never declared (${label})`,
            );
          }
        }
      });
    });
  }

  for (const [token, occurrences] of tokenOccurrences) {
    if (occurrences.length > 1) {
      const distinctValues = new Set(occurrences.map((entry) => entry.value));
      if (distinctValues.size > 1) {
        errors.push(
          `collapsed-themes: ${token} declared ${occurrences.length} times with differing values (${[...distinctValues].join(" / ")})`,
        );
      } else {
        warnings.push(`duplicate-token: ${token} declared ${occurrences.length} times`);
      }
    }
  }

  coverage.declaredTokens = declaredTokens.size;
  coverage.tables = tables.length;

  const typography = tables.filter(
    (table) => normalizeHeading(table.section) === normalizeHeading(CANONICAL_H2[1]),
  );
  if (sectionNames.some((name) => normalizeHeading(name) === normalizeHeading(CANONICAL_H2[1]))) {
    if (typography.length === 0) {
      warnings.push("typography-section-has-no-table");
    }
  }

  const dodont = sectionNames.find(
    (name) => normalizeHeading(name) === normalizeHeading(CANONICAL_H2[4]),
  );
  if (dodont) {
    const startIndex = h2Lines.find((entry) => entry.text === dodont)?.index ?? 0;
    const nextH2 = h2Lines.find((entry) => entry.index > startIndex);
    const body = lines.slice(startIndex + 1, nextH2 ? nextH2.index : lines.length).join("\n");
    if (!/\bdo\b/i.test(body)) errors.push("dodont-missing-do-guidance");
    if (!/\bdon'?t\b|\bavoid\b|\bnever\b/i.test(body)) {
      errors.push("dodont-missing-dont-guidance");
    }
  }

  const lastNonEmpty = lines.map((line) => line.trim()).filter((line) => line.length > 0).pop() ?? "";
  if (/^(note|notes|validation|status|warning|disclaimer|generated|coverage|evidence)\s*:/i.test(lastNonEmpty)) {
    errors.push(`output-purity: trailing commentary "${lastNonEmpty.slice(0, 60)}"`);
  }

  const h3All = lines
    .filter((line) => /^###\s+\S/.test(line))
    .map((line) => line.replace(/^###\s+/, "").trim());
  coverage.subHeadings = h3All.length;

  return {
    errors,
    warnings,
    sections: sectionNames,
    coverage,
    stats: {
      lines: lines.length,
      h1Count: h1Lines.length,
      theme: themeLines[0]?.value ?? null,
      sourceWebsite: sourceLines[0]?.value ?? null,
      canonicalHeadingSet: CANONICAL_H2,
    },
  };
}

async function readInput(argv: string[]): Promise<{ markdown: string; filename: string | null }> {
  let file: string | null = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--file" || argv[i] === "-f") {
      file = argv[++i] ?? null;
    } else if (!argv[i].startsWith("-") && !file) {
      file = argv[i];
    }
  }
  if (file) {
    return { markdown: await Bun.file(file).text(), filename: file };
  }
  const chunks: Uint8Array[] = [];
  for await (const chunk of process.stdin as unknown as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  const merged = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return { markdown: new TextDecoder().decode(merged), filename: null };
}

const { markdown, filename } = await readInput(process.argv.slice(2));
const report = validate(markdown, filename);
const status = report.errors.length > 0 ? "invalid" : report.warnings.length > 0 ? "valid-with-warnings" : "valid";
process.stdout.write(`${JSON.stringify({ schema: "design-md/validation@1", status, filename, ...report }, null, 2)}\n`);
process.exit(report.errors.length > 0 ? 1 : 0);
