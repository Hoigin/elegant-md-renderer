import { describe, it, expect } from 'vitest';
import { render, wrapInTemplate } from '../src/index.js';
import path from 'path';

const fixtureDir = path.join(import.meta.dirname, 'fixtures');

describe('wrapInTemplate', () => {
  it('replaces all placeholders in template', () => {
    const result = render('# Test Title\n\nHello world.');
    const templatePath = path.join(fixtureDir, 'template.html');
    const html = wrapInTemplate(result, templatePath);
    expect(html).toContain('<title>Test Title</title>');
    expect(html).toContain('Hello world');
    expect(html).toContain('<article>');
  });

  it('injects MathJax CSS when present', () => {
    const result = render('$E = mc^2$');
    const templatePath = path.join(fixtureDir, 'template.html');
    const html = wrapInTemplate(result, templatePath);
    expect(html).toContain('</head>');
  });

  it('injects Mermaid script when mermaid is present', () => {
    const result = render('```mermaid\ngraph A --> B\n```');
    const templatePath = path.join(fixtureDir, 'template.html');
    const html = wrapInTemplate(result, templatePath);
    expect(html).toContain('mermaid');
  });

  it('leaves MERMAID_SCRIPT empty when no mermaid', () => {
    const result = render('# No Mermaid\n\nJust text.');
    const templatePath = path.join(fixtureDir, 'template.html');
    const html = wrapInTemplate(result, templatePath);
    expect(html).not.toContain('{{MERMAID_SCRIPT}}');
  });
});