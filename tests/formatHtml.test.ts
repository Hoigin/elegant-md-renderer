import { describe, it, expect } from 'vitest';
import { render } from '../src/renderer.js';

describe('formatHtml', () => {
  it('adds indentation to block-level tags', () => {
    const result = render('# Title\n\nParagraph\n\n## Subtitle');
    expect(result.bodyHtml).toMatch(/^\s{4}<h1/);
  });

  it('preserves <pre> content whitespace', () => {
    const result = render('```\n  indented code\n    more indent\n```');
    expect(result.bodyHtml).toContain('  indented code');
    expect(result.bodyHtml).toContain('    more indent');
  });

  it('removes excessive blank lines outside <pre>', () => {
    const result = render('# Title\n\n\n\n\nParagraph');
    expect(result.bodyHtml).not.toMatch(/\n{3,}/);
  });
});