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

describe('render — plugin options', () => {
  it('disables emoji when emoji option is false', () => {
    const result = render('Hello :smile:', { emoji: false });
    expect(result.bodyHtml).toContain(':smile:');
    expect(result.bodyHtml).not.toContain('😄');
  });

  it('enables emoji by default', () => {
    const result = render('Hello :smile:');
    expect(result.bodyHtml).toContain('😄');
  });

  it('disables mark when mark option is false', () => {
    const result = render('This is ==highlighted==', { mark: false });
    expect(result.bodyHtml).toContain('==highlighted==');
    expect(result.bodyHtml).not.toContain('<mark>');
  });

  it('enables mark by default', () => {
    const result = render('This is ==highlighted==');
    expect(result.bodyHtml).toContain('<mark>highlighted</mark>');
  });

  it('disables tasklist when tasklist option is false', () => {
    const result = render('- [x] done\n- [ ] todo', { tasklist: false });
    expect(result.bodyHtml).not.toContain('task-list');
  });

  it('disables footnote when footnote option is false', () => {
    const result = render('Text[^1]\n\n[^1]: Footnote', { footnote: false });
    expect(result.bodyHtml).not.toContain('footnote');
  });
});