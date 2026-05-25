import fs from 'fs';
import path from 'path';
import { render } from '../src/index.js';

const DEMO_DIR = path.resolve(import.meta.dirname);
const FIXTURE_PATH = path.join(DEMO_DIR, 'fixtures', 'Markdown 渲染器测试报告.md');
const TEMPLATE_PATH = path.join(DEMO_DIR, 'template.html');
const OUTPUT_DIR = path.join(DEMO_DIR, 'dist');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'index.html');

// Read inputs
const mdSource = fs.readFileSync(FIXTURE_PATH, 'utf-8');
const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

// Render markdown
const result = render(mdSource);

// HTML-escape the MD source for safe embedding in <code>
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Build Mermaid conditional script
const mermaidScript = result.hasMermaid ? `
<script>
  document.querySelectorAll('.mermaid').forEach(el => {
    el.setAttribute('data-original', el.innerHTML);
  });
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
  s.onload = () => {
    const saved = localStorage.getItem('theme') || 'dark';
    const theme = saved === 'dark' ? 'dark' : 'default';
    const font = '"Open Sans", "PingFang SC", "Microsoft YaHei", sans-serif';
    mermaid.initialize({ startOnLoad: false, theme, themeVariables: { fontFamily: font } });
    mermaid.run();
  };
  document.head.appendChild(s);
</script>` : '';

// Replace all placeholders
const html = template
  .replaceAll('{{TITLE}}', result.title)
  .replace('{{MATHJAX_CSS}}', result.mathjaxCss)
  .replace('{{SOURCE}}', escapeHtml(mdSource))
  .replace('{{CONTENT}}', result.bodyHtml)
  .replace('{{MERMAID_SCRIPT}}', mermaidScript);

// Write output
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_PATH, html, 'utf-8');

console.log(`  Demo page built: ${OUTPUT_PATH}`);
console.log(`  Title: ${result.title}`);
console.log(`  Has Mermaid: ${result.hasMermaid}`);
console.log(`  Has MathJax: ${result.mathjaxCss ? 'true' : 'false'}`);