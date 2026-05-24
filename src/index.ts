/**
 * elegant-md-renderer — A flexible Markdown-to-HTML renderer
 *
 * Core rendering functionality extracted from md2html_renderer.ts
 * with customizable options for plugins and output.
 */

import markdownit from 'markdown-it';
import mathjax from 'markdown-it-mathjax3-pro';
import hljs from 'highlight.js';
import mark from 'markdown-it-mark';
import tasklist from 'markdown-it-task-lists';
import { full as emoji } from 'markdown-it-emoji';
import footnote from 'markdown-it-footnote';
import alerts from 'markdown-it-github-alerts';
import fs from 'fs';

// ── Types ─────────────────────────────────────────────────────────────

export interface RenderResult {
  /** Rendered HTML content */
  bodyHtml: string;
  /** Extracted title from first heading, or 'Untitled' */
  title: string;
  /** MathJax CSS stylesheet (empty string if no math) */
  mathjaxCss: string;
  /** Whether the content contains mermaid diagrams */
  hasMermaid: boolean;
}

export interface RenderOptions {
  /** Enable MathJax rendering (default: true) */
  mathjax?: boolean;
  /** Enable emoji support (default: true) */
  emoji?: boolean;
  /** Enable ==mark== highlighting (default: true) */
  mark?: boolean;
  /** Enable task lists (default: true) */
  tasklist?: boolean;
  /** Enable footnotes (default: true) */
  footnote?: boolean;
  /** Enable GitHub alerts (default: true) */
  alerts?: boolean;
  /** Enable syntax highlighting (default: true) */
  highlight?: boolean;
  /** Enable line numbers in code blocks (default: true) */
  codeLineNumbers?: boolean;
  /** Enable language labels in code blocks (default: true) */
  codeLangLabel?: boolean;
  /** Enable mermaid diagram detection (default: true) */
  mermaid?: boolean;
  /** Custom slugify function for heading IDs */
  slugify?: (text: string) => string;
  /** Custom fence renderer for code blocks */
  fenceRenderer?: (tokens: any[], idx: number, md: markdownit) => string;
}

// ── Constants ─────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: Required<Omit<RenderOptions, 'slugify' | 'fenceRenderer'>> = {
  mathjax: true,
  emoji: true,
  mark: true,
  tasklist: true,
  footnote: true,
  alerts: true,
  highlight: true,
  codeLineNumbers: true,
  codeLangLabel: true,
  mermaid: true,
};

const ALERT_RE = /^\[!(TIP|NOTE|IMPORTANT|WARNING|CAUTION)\]([^\n\r]*)/i;

const DEFAULT_ALERT_ICONS: Record<string, string> = {
  note: '<svg class="octicon octicon-info" viewBox="0 0 16 16" width="16" height="16"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>',
  tip: '<svg class="octicon octicon-light-bulb" viewBox="0 0 16 16" width="16" height="16"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"/></svg>',
  important: '<svg class="octicon octicon-report" viewBox="0 0 16 16" width="16" height="16"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
  warning: '<svg class="octicon octicon-alert" viewBox="0 0 16 16" width="16" height="16"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
  caution: '<svg class="octicon octicon-stop" viewBox="0 0 16 16" width="16" height="16"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>'
};

// ── Helper Functions ──────────────────────────────────────────────────

/**
 * Detects if a source line is a "spaced empty line" inside a blockquote.
 * A spaced empty line has '>' followed by whitespace only (not empty string).
 */
function isSpacedEmptyLine(srcLines: string[], lineIdx: number): boolean {
  const line = srcLines[lineIdx];
  const lastGt = line.lastIndexOf('>');
  if (lastGt < 0) return false;
  const after = line.slice(lastGt + 1);
  return after.trim() === '' && after.length > 0;
}

// ── Main Render Function ───────────────────────────────────────────────

/**
 * Renders Markdown content to HTML with configurable options.
 *
 * @param content - Markdown source string
 * @param options - Rendering options
 * @returns Rendered result with HTML, title, MathJax CSS, and mermaid detection
 */
export function render(content: string, options?: RenderOptions): RenderResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Extract title from first # heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

  // Preprocess: wrap URLs with spaces in angle brackets for Typora compatibility
  const processedContent = content.replace(/\]\((?!<)([^)\s][^)]*?\s[^)]*?)\)/g, '](<$1>)');

  // Build markdown-it instance with conditional plugins
  const md = markdownit({
    html: true,
    linkify: true,
    typographer: true,
  });

  if (opts.mathjax) md.use(mathjax);
  if (opts.mark) md.use(mark);
  if (opts.tasklist) md.use(tasklist, { enabled: true });
  if (opts.emoji) md.use(emoji);
  if (opts.footnote) md.use(footnote);
  if (opts.alerts) md.use(alerts);

  // Custom fence renderer for mermaid and code blocks
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx];
    const lang = token.info.trim().split(/\s+/)[0];

    // Mermaid diagrams: output <div class="mermaid"> for client-side rendering
    if (lang === 'mermaid' && opts.mermaid) {
      return `<div class="mermaid">${md.utils.escapeHtml(token.content.trim())}</div>`;
    }

    // Use custom fence renderer if provided
    if (opts.fenceRenderer) {
      return opts.fenceRenderer(tokens, idx, md);
    }

    // Default code block rendering with optional highlighting and line numbers
    const content = token.content;

    let highlighted: string;
    if (opts.highlight && lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(content, { language: lang, ignoreIllegals: true }).value;
    } else {
      highlighted = md.utils.escapeHtml(content);
    }

    // Remove trailing newline from highlighted output
    if (highlighted.endsWith('\n')) {
      highlighted = highlighted.slice(0, -1);
    }

    // Generate line numbers if enabled
    const lines = content.split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    if (opts.codeLineNumbers) {
      const lineNumbers = lines.map((_, i) => i + 1).join('\n');
      const digits = String(lines.length).length;
      const linenoWidth = Math.round((digits * 0.6 + 1.0) * 100) / 100;
      const langLabel = opts.codeLangLabel && lang ? `<span class="post-code-lang">${lang}</span>` : '';

      return `<div class="post-code-block">\n${langLabel}\n<div class="post-code-content" style="grid-template-columns:${linenoWidth}em 1fr">\n<pre class="post-code-line-numbers">${lineNumbers}</pre>\n<pre><code class="hljs">${highlighted}</code></pre>\n</div>\n</div>`;
    }

    // Fallback: simple code block without line numbers
    const langClass = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${langClass}>${highlighted}</code></pre>`;
  };

  // Render
  const env: Record<string, any> = {};
  const htmlContent = md.render(processedContent, env);

  // Post-process: fix % encoded image src (Typora compatibility)
  const fixedContent = htmlContent.replace(
    /<img\s[^>]*src="([^"]*)"[^>]*>/g,
    (match, src) => {
      if (!src.includes('%')) return match;
      return match.replace(src, src.replace(/%/g, '%25'));
    }
  );

  // Format HTML (placeholder - will be replaced in Task 5)
  const formattedContent = formatHtml(fixedContent);

  // Extract MathJax CSS
  const cssLines = (env.mathjax_stylesheet || '')
    .split('\n')
    .map((line: string) => (line.trim() ? '        ' + line : ''))
    .join('\n');
  const mathjaxCss = cssLines ? `<style id="mathjaxCss">\n${cssLines}\n    </style>` : '';

  // Detect mermaid diagrams
  const hasMermaid = formattedContent.includes('class="mermaid"');

  return {
    bodyHtml: formattedContent,
    title,
    mathjaxCss,
    hasMermaid,
  };
}

// ── Placeholder Functions (to be replaced in later tasks) ─────────────

/**
 * Formats HTML with proper indentation.
 * Placeholder - will be implemented in Task 5.
 */
function formatHtml(html: string): string {
  return html;
}

// ── Exports for later tasks ────────────────────────────────────────────

export { DEFAULT_ALERT_ICONS, ALERT_RE, isSpacedEmptyLine };