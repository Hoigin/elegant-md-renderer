# elegant-md-renderer

Typora-compatible Markdown-to-HTML renderer with nested GitHub Alerts, code line numbers, MathJax, Mermaid, and more.

## Install

```bash
npm install elegant-md-renderer
```

## Usage

### Basic rendering

```typescript
import { render } from 'elegant-md-renderer';

const mdContent = '# Hello World\n\nThis is **bold** text.';
const result = render(mdContent);

console.log(result.title);       // "Hello World"
console.log(result.bodyHtml);     // formatted HTML body
console.log(result.mathjaxCss);   // MathJax CSS (empty if no math)
console.log(result.hasMermaid);   // true if mermaid diagrams present
```

### With template

```typescript
import { render, wrapInTemplate } from 'elegant-md-renderer';

const result = render(mdContent);
const fullHtml = wrapInTemplate(result, 'path/to/template.html');
```

Template placeholders: `{{TITLE}}`, `{{CONTENT}}`, `{{MATHJAX_CSS}}`, `{{MERMAID_SCRIPT}}`

### Options

All features default to `true`. Pass options to disable:

```typescript
const result = render(mdContent, {
  mathjax: false,         // Disable MathJax
  emoji: false,           // Disable emoji shortcodes
  codeLineNumbers: false, // Disable line numbers in code blocks
  slugify: (text) => customSlug(text), // Custom heading ID generator
});
```

## Features

- Nested GitHub Alerts with full blockquote support
- Dual-column code blocks (line numbers + highlighted code)
- MathJax server-side pre-rendering
- Mermaid diagram detection and conditional loading
- Typora compatibility: auto URL wrapping, % encoded image fix
- Custom heading slugify with duplicate suffix
- HTML formatting with `<pre>` protection

## License

MIT