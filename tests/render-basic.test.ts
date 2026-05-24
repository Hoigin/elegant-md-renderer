import { describe, it, expect } from 'vitest';
import { render, RenderResult, RenderOptions } from '../src/index.js';

describe('render — basic', () => {
  it('renders simple markdown to HTML', () => {
    const result = render('# Hello\n\nThis is **bold** text.');
    expect(result.title).toBe('Hello');
    expect(result.bodyHtml).toContain('<h1');
    expect(result.bodyHtml).toContain('Hello');
    expect(result.bodyHtml).toContain('<strong>bold</strong>');
  });

  it('extracts title from first heading', () => {
    const result = render('# My Title\n\nContent');
    expect(result.title).toBe('My Title');
  });

  it('returns Untitled when no heading exists', () => {
    const result = render('Just some text without a heading.');
    expect(result.title).toBe('Untitled');
  });

  it('returns empty mathjaxCss when no math is present', () => {
    const result = render('No math here.');
    expect(result.mathjaxCss).toBe('');
  });

  it('returns hasMermaid false when no mermaid diagrams', () => {
    const result = render('No mermaid here.');
    expect(result.hasMermaid).toBe(false);
  });

  it('detects mermaid diagrams', () => {
    const result = render('```mermaid\ngraph A --> B\n```');
    expect(result.hasMermaid).toBe(true);
    expect(result.bodyHtml).toContain('class="mermaid"');
  });
});