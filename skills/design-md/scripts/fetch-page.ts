const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (compatible; design-md-skill; +https://github.com/ecafe8/oc-engineering-standards-skills)";

type Mode = "gate-only" | "static" | "render";

type StylesheetEvidence = {
  url: string;
  status: number | null;
  ok: boolean;
  contentType: string;
  bytes: number;
  rawText?: string;
  rawTextTruncated: boolean;
  reason?: string;
  analysis?: CssAnalysis;
};

type CssAnalysis = {
  customProperties: string[];
  fontFaces: number;
  colorFunctions: number;
  boxShadows: number;
  borderRadii: number;
  themeSelectors: number;
};

type GateResult = {
  passed: boolean;
  reasons: string[];
  warnings: string[];
  dnsVerified: boolean;
  resolvedAddresses: string[];
  robots: { checked: boolean; allowed: boolean | null; reason: string; url: string };
};

type Options = {
  url: string;
  mode: Mode;
  allowHttp: boolean;
  skipDnsCheck: boolean;
  timeoutMs: number;
  settleMs: number;
  maxRedirects: number;
  maxStylesheets: number;
  maxCssBytes: number;
  maxHtmlBytes: number;
  maxTextChars: number;
  selector: string | null;
  userAgent: string;
  output: string | null;
  screenshot: string | null;
};

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    url: "",
    mode: "static",
    allowHttp: false,
    skipDnsCheck: false,
    timeoutMs: 30000,
    settleMs: 2500,
    maxRedirects: 5,
    maxStylesheets: 12,
    maxCssBytes: 2 * 1024 * 1024,
    maxHtmlBytes: 2 * 1024 * 1024,
    maxTextChars: 20000,
    selector: null,
    userAgent: DEFAULT_USER_AGENT,
    output: null,
    screenshot: null,
  };
  const num = (raw: string, fallback: number): number => {
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = (): string => argv[++i] ?? "";
    switch (arg) {
      case "--url":
        opts.url = next();
        break;
      case "--mode":
        opts.mode = next() as Mode;
        break;
      case "--allow-http":
        opts.allowHttp = true;
        break;
      case "--skip-dns-check":
        opts.skipDnsCheck = true;
        break;
      case "--timeout":
        opts.timeoutMs = num(next(), 30) * 1000;
        break;
      case "--settle":
        opts.settleMs = num(next(), 2500);
        break;
      case "--max-redirects":
        opts.maxRedirects = Math.floor(num(next(), 5));
        break;
      case "--max-stylesheets":
        opts.maxStylesheets = Math.floor(num(next(), 12));
        break;
      case "--max-css-kb":
        opts.maxCssBytes = Math.floor(num(next(), 2048)) * 1024;
        break;
      case "--max-html-kb":
        opts.maxHtmlBytes = Math.floor(num(next(), 2048)) * 1024;
        break;
      case "--max-text-chars":
        opts.maxTextChars = Math.floor(num(next(), 20000));
        break;
      case "--selector":
        opts.selector = next() || null;
        break;
      case "--user-agent":
        opts.userAgent = next() || DEFAULT_USER_AGENT;
        break;
      case "--output":
        opts.output = next() || null;
        break;
      case "--screenshot":
        opts.screenshot = next() || null;
        break;
      default:
        if (!opts.url && arg.startsWith("http")) {
          opts.url = arg;
        }
    }
  }
  if (!["gate-only", "static", "render"].includes(opts.mode)) {
    opts.mode = "static";
  }
  return opts;
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 0) return true;
  if (a === 192 && b === 168) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const v = ip.toLowerCase().split("%")[0];
  if (v === "::" || v === "::1") return true;
  if (/^fe[89ab]/.test(v)) return true;
  if (/^f[cd]/.test(v)) return true;
  if (v.startsWith("ff")) return true;
  if (v.startsWith("2001:db8")) return true;
  const embedded = v.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (embedded) return isPrivateIpv4(embedded[1]);
  return false;
}

function classifyHost(host: string): string | null {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (!h) return "empty-host";
  if (h === "localhost" || h.endsWith(".localhost")) return "localhost-name";
  if (h === "169.254.169.254" || h === "metadata.google.internal") return "cloud-metadata";
  if (/\.(local|internal|lan|home|corp|intranet)$/.test(h)) return "private-suffix";
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h) && isPrivateIpv4(h)) return "private-ipv4";
  if (h.includes(":") && isPrivateIpv6(h)) return "private-ipv6";
  return null;
}

async function resolveAddresses(host: string): Promise<string[]> {
  const dns = (globalThis as { Bun?: { dns?: { resolve?: Function } } }).Bun?.dns;
  if (!dns || typeof dns.resolve !== "function") return [];
  const normalize = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((entry) => {
          if (typeof entry === "string") return entry;
          const address = (entry as { address?: unknown })?.address;
          return typeof address === "string" ? address : "";
        })
        .filter((entry) => entry.length > 0);
    }
    const addresses = (value as { addresses?: unknown })?.addresses;
    if (Array.isArray(addresses)) {
      return addresses.filter((entry): entry is string => typeof entry === "string");
    }
    return [];
  };
  try {
    const withProtocols = await dns.resolve(host, { protocols: ["ipv4", "ipv6"] });
    const found = normalize(withProtocols);
    if (found.length > 0) return found;
  } catch {}
  try {
    return normalize(await dns.resolve(host));
  } catch {
    return [];
  }
}

function robotsPathMatches(pattern: string, path: string): boolean {
  if (!pattern) return false;
  const segments = pattern.split("*");
  let cursor = 0;
  for (let i = 0; i < segments.length; i += 1) {
    const segment = i === segments.length - 1 ? segments[i].replace(/\$$/, "") : segments[i];
    if (!segment) continue;
    const found = path.indexOf(segment, cursor);
    if (found < 0) return false;
    if (i === 0 && found !== 0) return false;
    cursor = found + segment.length;
  }
  if (pattern.endsWith("$") && cursor !== path.length) return false;
  return true;
}

type RobotsGroup = { agents: string[]; allow: string[]; disallow: string[] };

function parseRobots(body: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const sep = line.indexOf(":");
    if (sep < 0) continue;
    const field = line.slice(0, sep).trim().toLowerCase();
    const value = line.slice(sep + 1).trim();
    if (field === "user-agent") {
      if (current && current.allow.length === 0 && current.disallow.length === 0) {
        current.agents.push(value.toLowerCase());
      } else {
        current = { agents: [value.toLowerCase()], allow: [], disallow: [] };
        groups.push(current);
      }
    } else if (current) {
      if (field === "disallow") current.disallow.push(value);
      if (field === "allow") current.allow.push(value);
    }
  }
  return groups;
}

async function checkRobots(
  origin: string,
  path: string,
  userAgent: string,
  timeoutMs: number,
): Promise<{ checked: boolean; allowed: boolean | null; reason: string; url: string }> {
  const url = `${origin}/robots.txt`;
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": userAgent, accept: "text/plain,*/*;q=0.5" },
    });
    if (!response.ok) {
      return { checked: true, allowed: true, reason: `robots-http-${response.status}`, url };
    }
    const body = await response.text();
    if (body.length > 512 * 1024) {
      return { checked: true, allowed: true, reason: "robots-too-large", url };
    }
    const token = userAgent.toLowerCase().split(/[\s(/]/)[0] || "*";
    const groups = parseRobots(body);
    const specific = groups.find((g) => g.agents.some((a) => a === token || a.includes(token)));
    const wildcard = groups.find((g) => g.agents.includes("*"));
    const group = specific ?? wildcard;
    if (!group) return { checked: true, allowed: true, reason: "no-matching-group", url };
    let best: { len: number; allow: boolean } | null = null;
    for (const pattern of group.disallow) {
      if (pattern && robotsPathMatches(pattern, path)) {
        if (!best || pattern.length > best.len) best = { len: pattern.length, allow: false };
      }
    }
    for (const pattern of group.allow) {
      if (pattern && robotsPathMatches(pattern, path)) {
        if (!best || pattern.length >= best.len) best = { len: pattern.length, allow: true };
      }
    }
    if (!best) return { checked: true, allowed: true, reason: "no-matching-rule", url };
    return {
      checked: true,
      allowed: best.allow,
      reason: best.allow ? "allow-rule-matched" : "disallow-rule-matched",
      url,
    };
  } catch (error) {
    return { checked: false, allowed: null, reason: `robots-fetch-error:${(error as Error).message}`, url };
  }
}

async function runGate(opts: Options): Promise<GateResult> {
  const gate: GateResult = {
    passed: true,
    reasons: [],
    warnings: [],
    dnsVerified: false,
    resolvedAddresses: [],
    robots: { checked: false, allowed: null, reason: "not-checked", url: "" },
  };
  let parsed: URL;
  try {
    parsed = new URL(opts.url);
  } catch {
    gate.passed = false;
    gate.reasons.push("invalid-url");
    return gate;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    gate.passed = false;
    gate.reasons.push(`unsupported-scheme:${parsed.protocol}`);
    return gate;
  }
  if (parsed.protocol === "http:" && !opts.allowHttp) {
    gate.passed = false;
    gate.reasons.push("insecure-http-requires-allow-http");
    return gate;
  }
  if (parsed.protocol === "http:") gate.warnings.push("insecure-http-allowed-by-flag");
  if (parsed.username || parsed.password) {
    gate.passed = false;
    gate.reasons.push("credentials-in-url");
    return gate;
  }
  const hostIssue = classifyHost(parsed.hostname);
  if (hostIssue) {
    gate.passed = false;
    gate.reasons.push(hostIssue);
    return gate;
  }
  const isLiteralIp = /^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname) || parsed.hostname.includes(":");
  if (!isLiteralIp && !opts.skipDnsCheck) {
    const addresses = await resolveAddresses(parsed.hostname);
    if (addresses.length === 0) {
      gate.passed = false;
      gate.reasons.push("dns-unresolvable");
      return gate;
    }
    gate.resolvedAddresses = addresses;
    gate.dnsVerified = true;
    const privateHits = addresses.filter((ip) =>
      ip.includes(":") ? isPrivateIpv6(ip) : isPrivateIpv4(ip),
    );
    if (privateHits.length > 0) {
      gate.passed = false;
      gate.reasons.push("resolved-private-ip");
      return gate;
    }
  } else if (opts.skipDnsCheck) {
    gate.warnings.push("dns-check-skipped");
  }
  gate.robots = await checkRobots(parsed.origin, parsed.pathname || "/", opts.userAgent, opts.timeoutMs);
  if (gate.robots.allowed === false) {
    gate.passed = false;
    gate.reasons.push("robots-disallow");
  } else if (gate.robots.allowed === null) {
    gate.warnings.push("robots-unverifiable");
  }
  return gate;
}

function truncate(value: string, max: number): { text: string; truncated: boolean } {
  if (value.length <= max) return { text: value, truncated: false };
  return { text: value.slice(0, max), truncated: true };
}

function analyzeCss(css: string): CssAnalysis {
  const names = new Set<string>();
  for (const match of css.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)) names.add(match[1]);
  const count = (pattern: RegExp): number => (css.match(pattern) ?? []).length;
  return {
    customProperties: [...names],
    fontFaces: count(/@font-face/gi),
    colorFunctions: count(/\b(?:oklch|oklab|lab|lch|color|color-mix|hsla?|rgba?)\s*\(/gi),
    boxShadows: count(/(?:^|[{;\s])box-shadow\s*:/gi),
    borderRadii: count(/border-radius\s*:/gi),
    themeSelectors: count(/\.dark\b|\[data-theme|prefers-color-scheme/gi),
  };
}

function extractStylesheetUrls(html: string, base: string): string[] {
  const urls: string[] = [];
  const pattern = /<link\b[^>]*>/gi;
  for (const match of html.matchAll(pattern)) {
    const tag = match[0];
    if (!/rel\s*=\s*["']?stylesheet["']?/i.test(tag)) continue;
    const href = tag.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try {
      urls.push(new URL(href, base).href);
    } catch {}
  }
  return [...new Set(urls)];
}

function extractResourceUrls(html: string, base: string): string[] {
  const urls: string[] = [];
  const pattern = /<(?:script|img|source|video|audio|link|iframe)\b[^>]*>/gi;
  for (const match of html.matchAll(pattern)) {
    const tag = match[0];
    for (const attr of ["src", "href", "data-src", "poster"]) {
      const value = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1];
      if (!value || value.startsWith("data:")) continue;
      try {
        urls.push(new URL(value, base).href);
      } catch {}
    }
    const srcset = tag.match(/srcset\s*=\s*["']([^"']+)["']/i)?.[1];
    if (srcset) {
      for (const candidate of srcset.split(",")) {
        const value = candidate.trim().split(/\s+/)[0];
        if (!value) continue;
        try {
          urls.push(new URL(value, base).href);
        } catch {}
      }
    }
  }
  return [...new Set(urls)];
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const BOT_MARKERS = [
  "cf-browser-verification",
  "cf-challenge-running",
  "just a moment",
  "attention required! | cloudflare",
  "enable javascript and cookies to continue",
  "verifying you are human",
  "are you a robot",
  "hcaptcha",
  "g-recaptcha",
  "please verify you are a human",
  "access denied",
  "request blocked",
];

const AUTH_MARKERS = [
  "sign in to continue",
  "log in to continue",
  "please log in",
  "authentication required",
  "id=\"login",
  "name=\"password",
];

const PAYWALL_MARKERS = [
  "subscribe to read",
  "subscribe to continue",
  "this article is for subscribers",
  "you have reached your limit",
  "create a free account to continue",
];

const FRAMEWORK_HINTS: Array<[string, RegExp]> = [
  ["react", /react(?:\.production|\.development|-dom)|__NEXT_DATA__|_next\/static/i],
  ["vue", /vue(?:\.runtime|\.global)|__NUXT__|_nuxt\//i],
  ["angular", /ng-version|angular(?:\.min)?\.js/i],
  ["svelte", /svelte-kit|__SVELTEKIT_/i],
  ["astro", /astro-island/i],
];

function detectMarkers(haystack: string, markers: string[]): string[] {
  const lower = haystack.toLowerCase();
  return markers.filter((marker) => lower.includes(marker));
}

type StaticResult = {
  status: number | null;
  contentType: string;
  finalUrl: string;
  redirects: string[];
  html: string;
  htmlTruncated: boolean;
  ok: boolean;
  error?: string;
};

async function fetchDocument(opts: Options, gate: GateResult): Promise<StaticResult> {
  let current = opts.url;
  const redirects: string[] = [];
  for (let hop = 0; hop <= opts.maxRedirects; hop += 1) {
    let response: Response;
    try {
      response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(opts.timeoutMs),
        headers: {
          "user-agent": opts.userAgent,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9",
        },
      });
    } catch (error) {
      return {
        status: null,
        contentType: "",
        finalUrl: current,
        redirects,
        html: "",
        htmlTruncated: false,
        ok: false,
        error: (error as Error).message,
      };
    }
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      let next: URL;
      try {
        next = new URL(location, current);
      } catch {
        break;
      }
      redirects.push(`${response.status} ${next.href}`);
      const hopIssue = classifyHost(next.hostname);
      if (hopIssue) {
        gate.passed = false;
        gate.reasons.push(`redirect-${hopIssue}`);
        return {
          status: response.status,
          contentType: "",
          finalUrl: next.href,
          redirects,
          html: "",
          htmlTruncated: false,
          ok: false,
          error: `redirect-blocked:${hopIssue}`,
        };
      }
      if (next.protocol !== "https:" && !(next.protocol === "http:" && opts.allowHttp)) {
        gate.passed = false;
        gate.reasons.push("redirect-unsupported-scheme");
        return {
          status: response.status,
          contentType: "",
          finalUrl: next.href,
          redirects,
          html: "",
          htmlTruncated: false,
          ok: false,
          error: "redirect-unsupported-scheme",
        };
      }
      current = next.href;
      continue;
    }
    const contentType = response.headers.get("content-type") ?? "";
    const raw = await response.text();
    const limited = truncate(raw, opts.maxHtmlBytes);
    return {
      status: response.status,
      contentType,
      finalUrl: current,
      redirects,
      html: limited.text,
      htmlTruncated: limited.truncated,
      ok: response.ok,
    };
  }
  gate.warnings.push("redirect-limit-reached");
  return {
    status: null,
    contentType: "",
    finalUrl: current,
    redirects,
    html: "",
    htmlTruncated: false,
    ok: false,
    error: "redirect-limit-reached",
  };
}

async function fetchStylesheets(
  urls: string[],
  opts: Options,
): Promise<StylesheetEvidence[]> {
  const results: StylesheetEvidence[] = [];
  for (const url of urls.slice(0, opts.maxStylesheets)) {
    const entry: StylesheetEvidence = {
      url,
      status: null,
      ok: false,
      contentType: "",
      bytes: 0,
      rawTextTruncated: false,
    };
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(opts.timeoutMs),
        headers: { "user-agent": opts.userAgent, accept: "text/css,*/*;q=0.8" },
      });
      entry.status = response.status;
      entry.contentType = response.headers.get("content-type") ?? "";
      entry.ok = response.ok;
      if (!response.ok) {
        entry.reason = `http-${response.status}`;
        results.push(entry);
        continue;
      }
      const raw = await response.text();
      entry.bytes = raw.length;
      const limited = truncate(raw, opts.maxCssBytes);
      entry.rawText = limited.text;
      entry.rawTextTruncated = limited.truncated;
      entry.analysis = analyzeCss(limited.text);
    } catch (error) {
      entry.reason = `fetch-error:${(error as Error).message}`;
    }
    results.push(entry);
  }
  return results;
}

type RenderResult = {
  attempted: boolean;
  backend: string;
  ok: boolean;
  reason?: string;
  html?: string;
  htmlTruncated?: boolean;
  text?: string;
  textTruncated?: boolean;
  computedSamples?: unknown;
  fonts?: unknown;
  stylesheetAccess?: unknown;
  resourceUrls?: string[];
  screenshotPath?: string;
  settleMs?: number;
};

async function renderWithWebView(opts: Options, url: string): Promise<RenderResult> {
  const result: RenderResult = { attempted: true, backend: "bun-webview", ok: false };
  const WebView = (globalThis as { Bun?: { WebView?: Function } }).Bun?.WebView;
  if (typeof WebView !== "function") {
    result.reason = "webview-unavailable";
    return result;
  }
  let view: any = null;
  try {
    view = new (WebView as any)({
      width: 1280,
      height: 900,
      dataStore: "ephemeral",
    });
    await Promise.race([
      view.navigate(url),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("navigation-timeout")), opts.timeoutMs),
      ),
    ]);
    if (opts.selector) {
      await view
        .evaluate(
          `(async () => {
            const deadline = Date.now() + ${opts.settleMs};
            while (Date.now() < deadline) {
              if (document.querySelector(${JSON.stringify(opts.selector)})) return true;
              await new Promise(r => setTimeout(r, 150));
            }
            return false;
          })()`,
        )
        .catch(() => false);
    } else {
      await view
        .evaluate(`new Promise(r => setTimeout(r, ${opts.settleMs}))`)
        .catch(() => undefined);
    }
    result.settleMs = opts.settleMs;
    const rawHtml = String(await view.evaluate("document.documentElement.outerHTML"));
    const limitedHtml = truncate(rawHtml, opts.maxHtmlBytes);
    result.html = limitedHtml.text;
    result.htmlTruncated = limitedHtml.truncated;
    const rawText = String(await view.evaluate("document.body ? document.body.innerText : ''"));
    const limitedText = truncate(rawText, opts.maxTextChars);
    result.text = limitedText.text;
    result.textTruncated = limitedText.truncated;
    result.stylesheetAccess = await view.evaluate(
      `JSON.stringify([...document.styleSheets].map(s => {
        try { return { href: s.href, rules: s.cssRules.length, accessible: true }; }
        catch (e) { return { href: s.href, accessible: false, reason: e && e.name ? e.name : String(e) }; }
      }))`,
    );
    result.fonts = await view.evaluate(
      `JSON.stringify([...document.fonts].map(f => ({
        family: f.family, weight: f.weight, style: f.style, status: f.status, unicodeRange: f.unicodeRange
      })))`,
    );
    result.computedSamples = await view.evaluate(
      `JSON.stringify(["html","body","h1","h2","h3","p","a","button","input","main","header","footer"]
        .map(sel => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const cs = getComputedStyle(el);
          return {
            selector: sel,
            color: cs.color, backgroundColor: cs.backgroundColor,
            fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
            lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing,
            borderRadius: cs.borderRadius, boxShadow: cs.boxShadow,
            padding: cs.padding, margin: cs.margin, border: cs.border
          };
        }).filter(Boolean))`,
    );
    result.resourceUrls = JSON.parse(
      String(
        await view.evaluate(
          `JSON.stringify(performance.getEntriesByType("resource").map(e => e.name).slice(0, 300))`,
        ),
      ),
    );
    if (opts.screenshot) {
      try {
        const bytes = await view.screenshot();
        await (globalThis as { Bun: typeof Bun }).Bun.write(opts.screenshot, bytes);
        result.screenshotPath = opts.screenshot;
      } catch (error) {
        result.reason = `screenshot-failed:${(error as Error).message}`;
      }
    }
    result.ok = true;
  } catch (error) {
    result.reason = `render-failed:${(error as Error).message}`;
  } finally {
    try {
      if (view && typeof view.close === "function") await view.close();
    } catch {}
    try {
      (globalThis as { Bun?: { WebView?: { closeAll?: Function } } }).Bun?.WebView?.closeAll?.();
    } catch {}
  }
  return result;
}

async function main(): Promise<number> {
  const opts = parseArgs(process.argv.slice(2));
  const started = Date.now();
  const warnings: string[] = [];
  const blockers: string[] = [];

  if (!opts.url) {
    process.stderr.write("fetch-page.ts: --url is required\n");
    return 1;
  }

  const gate = await runGate(opts);
  const evidence: Record<string, unknown> = {
    schema: "design-md/page-evidence@1",
    requestedUrl: opts.url,
    finalUrl: opts.url,
    redirects: [],
    mode: opts.mode,
    gate,
    http: { status: null, contentType: "", ok: false },
    stylesheets: [],
    inlineStyleBlocks: 0,
    inlineStyleBytes: 0,
    resourceUrls: [],
    tokenYield: {
      customProperties: 0,
      fontFaces: 0,
      colorFunctions: 0,
      boxShadows: 0,
      borderRadii: 0,
      themeSelectors: 0,
    },
    signals: {
      elementCount: 0,
      hasEmptyRoot: false,
      frameworkBundles: [],
      sparseDom: false,
      sparseReasons: [],
      renderLikelyRequired: false,
      renderReasons: [],
      botChallenge: false,
      authWall: false,
      paywall: false,
      markers: [],
    },
    acquisition: "failed",
    blockers,
    capabilities: {
      javascript: false,
      renderedDom: false,
      networkInspection: false,
      screenshot: false,
      rawCss: false,
    },
    warnings,
    timingsMs: { total: 0 },
  };

  const emit = async (exitCode: number): Promise<number> => {
    (evidence as { timingsMs: { total: number } }).timingsMs.total = Date.now() - started;
    const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
    if (opts.output) {
      await Bun.write(opts.output, serialized);
    } else {
      process.stdout.write(serialized);
    }
    return exitCode;
  };

  if (!gate.passed) {
    if (gate.reasons.includes("robots-disallow")) blockers.push("robots");
    if (gate.reasons.some((r) => r.includes("private") || r.includes("localhost") || r.includes("metadata"))) {
      blockers.push("private-network");
    }
    if (gate.reasons.includes("credentials-in-url")) blockers.push("credentials");
    (evidence as { acquisition: string }).acquisition = "failed";
    return emit(2);
  }

  if (opts.mode === "gate-only") {
    (evidence as { acquisition: string }).acquisition = "complete";
    return emit(0);
  }

  const doc = await fetchDocument(opts, gate);
  evidence.finalUrl = doc.finalUrl;
  evidence.redirects = doc.redirects;
  evidence.http = { status: doc.status, contentType: doc.contentType, ok: doc.ok };

  if (!gate.passed) {
    blockers.push("private-network");
    (evidence as { acquisition: string }).acquisition = "failed";
    return emit(2);
  }

  const html = doc.html;
  const caps = evidence.capabilities as Record<string, boolean>;
  const signals = evidence.signals as Record<string, unknown>;
  const tokenYield = evidence.tokenYield as Record<string, number>;

  if (!doc.ok || !html) {
    warnings.push(`document-fetch-failed:${doc.error ?? `http-${doc.status}`}`);
    if (doc.status === 401) blockers.push("auth-wall");
    if (doc.status === 403 || doc.status === 429 || doc.status === 503) {
      signals.botChallenge = true;
      blockers.push("bot-challenge");
    }
    (evidence as { acquisition: string }).acquisition = "failed";
    return emit(3);
  }

  if (!/text\/html|application\/xhtml\+xml/i.test(doc.contentType)) {
    warnings.push(`unexpected-content-type:${doc.contentType}`);
  }

  evidence.html = html;
  evidence.htmlTruncated = doc.htmlTruncated;
  const textResult = truncate(htmlToText(html), opts.maxTextChars);
  evidence.text = textResult.text;
  evidence.textTruncated = textResult.truncated;

  const inlineStyles = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
  evidence.inlineStyleBlocks = inlineStyles.length;
  evidence.inlineStyleBytes = inlineStyles.reduce((sum, css) => sum + css.length, 0);

  const stylesheetUrls = extractStylesheetUrls(html, doc.finalUrl);
  const sheets = await fetchStylesheets(stylesheetUrls, opts);
  for (const css of inlineStyles) {
    sheets.push({
      url: "inline",
      status: 200,
      ok: true,
      contentType: "text/css;inline",
      bytes: css.length,
      rawText: css,
      rawTextTruncated: false,
      analysis: analyzeCss(css),
    });
  }
  evidence.stylesheets = sheets;
  caps.rawCss = sheets.some((sheet) => Boolean(sheet.rawText));

  const unreadableSheets = sheets.filter(
    (sheet) => sheet.url !== "inline" && (!sheet.ok || Boolean(sheet.reason)),
  );
  let degraded = false;
  if (unreadableSheets.length > 0) {
    degraded = true;
    warnings.push(`stylesheets-unreadable:${unreadableSheets.length}/${stylesheetUrls.length}`);
  }
  if (doc.htmlTruncated) {
    degraded = true;
    warnings.push("html-truncated");
  }

  const propNames = new Set<string>();
  for (const sheet of sheets) {
    const analysis = sheet.analysis;
    if (!analysis) continue;
    for (const name of analysis.customProperties) propNames.add(name);
    tokenYield.fontFaces += analysis.fontFaces;
    tokenYield.colorFunctions += analysis.colorFunctions;
    tokenYield.boxShadows += analysis.boxShadows;
    tokenYield.borderRadii += analysis.borderRadii;
    tokenYield.themeSelectors += analysis.themeSelectors;
  }
  tokenYield.customProperties = propNames.size;
  evidence.customPropertyNames = [...propNames];

  evidence.resourceUrls = extractResourceUrls(html, doc.finalUrl).slice(0, 300);

  const elementCount = (html.match(/<[a-zA-Z]/g) ?? []).length;
  signals.elementCount = elementCount;
  signals.hasEmptyRoot =
    /<div[^>]+id=["'](?:root|app|__next|__nuxt)["'][^>]*>\s*<\/div>/i.test(html) ||
    /<body[^>]*>\s*<div[^>]+id=["'][^"']+["'][^>]*>\s*<\/div>\s*<\/body>/i.test(html);
  signals.frameworkBundles = FRAMEWORK_HINTS.filter(([, pattern]) => pattern.test(html)).map(
    ([name]) => name,
  );

  const sparseReasons: string[] = [];
  if (elementCount < 60) sparseReasons.push("low-element-count");
  if (textResult.text.length < 200) sparseReasons.push("low-visible-text");
  signals.sparseDom = sparseReasons.length > 0;
  signals.sparseReasons = sparseReasons;

  const renderReasons: string[] = [];
  if (signals.hasEmptyRoot) renderReasons.push("empty-root-container");
  if ((signals.frameworkBundles as string[]).length > 0 && elementCount < 200) {
    renderReasons.push("framework-bundle-with-sparse-dom");
  }
  if (/__NEXT_DATA__|window\.__NUXT__|id=["']__next["']/i.test(html) && elementCount < 200) {
    renderReasons.push("ssr-hydration-shell");
  }
  signals.renderReasons = renderReasons;
  signals.renderLikelyRequired = renderReasons.length > 0;

  const botHits = detectMarkers(html, BOT_MARKERS);
  const authHits = detectMarkers(html, AUTH_MARKERS);
  const paywallHits = detectMarkers(html, PAYWALL_MARKERS);
  signals.markers = [...botHits, ...authHits, ...paywallHits];
  if (botHits.length > 0) {
    signals.botChallenge = true;
    blockers.push("bot-challenge");
  }
  if (authHits.length > 0) {
    signals.authWall = true;
    blockers.push("auth-wall");
  }
  if (paywallHits.length > 0) {
    signals.paywall = true;
    blockers.push("paywall");
  }

  if (blockers.length > 0) {
    (evidence as { acquisition: string }).acquisition = "failed";
    return emit(3);
  }

  if (opts.mode === "render") {
    const render = await renderWithWebView(opts, doc.finalUrl);
    evidence.render = render;
    caps.javascript = render.ok;
    caps.renderedDom = render.ok;
    caps.networkInspection = render.ok && Array.isArray(render.resourceUrls);
    caps.screenshot = Boolean(render.screenshotPath);
    if (!render.ok) {
      warnings.push(render.reason ?? "render-unavailable");
      (evidence as { acquisition: string }).acquisition = "partial";
      return emit(0);
    }

    const renderedHtml = render.html ?? "";
    const seen = new Set(sheets.map((sheet) => sheet.url));
    const extraUrls = extractStylesheetUrls(renderedHtml, doc.finalUrl).filter(
      (url) => !seen.has(url),
    );
    const extraSheets = await fetchStylesheets(extraUrls, opts);
    const renderedInline = [...renderedHtml.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(
      (match) => match[1],
    );
    const injectedInline = renderedInline.filter((css) => !inlineStyles.includes(css));
    for (const css of injectedInline) {
      extraSheets.push({
        url: "inline-rendered",
        status: 200,
        ok: true,
        contentType: "text/css;inline-rendered",
        bytes: css.length,
        rawText: css,
        rawTextTruncated: false,
        analysis: analyzeCss(css),
      });
    }
    if (extraSheets.length > 0) {
      const merged = [...sheets, ...extraSheets];
      evidence.stylesheets = merged;
      const mergedNames = new Set<string>();
      const mergedYield = {
        customProperties: 0,
        fontFaces: 0,
        colorFunctions: 0,
        boxShadows: 0,
        borderRadii: 0,
        themeSelectors: 0,
      };
      for (const sheet of merged) {
        const analysis = sheet.analysis;
        if (!analysis) continue;
        for (const name of analysis.customProperties) mergedNames.add(name);
        mergedYield.fontFaces += analysis.fontFaces;
        mergedYield.colorFunctions += analysis.colorFunctions;
        mergedYield.boxShadows += analysis.boxShadows;
        mergedYield.borderRadii += analysis.borderRadii;
        mergedYield.themeSelectors += analysis.themeSelectors;
      }
      mergedYield.customProperties = mergedNames.size;
      Object.assign(tokenYield, mergedYield);
      evidence.customPropertyNames = [...mergedNames];
      caps.rawCss = merged.some((sheet) => Boolean(sheet.rawText));
      evidence.inlineStyleBlocks = (evidence.inlineStyleBlocks as number) + injectedInline.length;
      const unreadableExtra = extraSheets.filter(
        (sheet) => sheet.url !== "inline-rendered" && (!sheet.ok || Boolean(sheet.reason)),
      );
      if (unreadableExtra.length > 0) {
        degraded = true;
        warnings.push(`rendered-stylesheets-unreadable:${unreadableExtra.length}/${extraUrls.length}`);
      }
    }
    if (Array.isArray(render.resourceUrls) && render.resourceUrls.length > 0) {
      evidence.resourceUrls = [
        ...new Set([...(evidence.resourceUrls as string[]), ...render.resourceUrls]),
      ].slice(0, 400);
    }

    (evidence as { acquisition: string }).acquisition = degraded ? "partial" : "complete";
    return emit(0);
  }

  caps.javascript = false;
  caps.renderedDom = false;
  if (signals.renderLikelyRequired) {
    degraded = true;
    warnings.push("render-required-not-performed");
  }
  (evidence as { acquisition: string }).acquisition = degraded ? "partial" : "complete";
  return emit(0);
}

process.exit(await main());
