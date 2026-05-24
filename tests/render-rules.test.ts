import { describe, it, expect } from 'vitest';
import { render } from '../src/index.js';

describe('render — custom rules', () => {
  describe('github alerts', () => {
    it('renders [!NOTE] as alert div', () => {
      const md = '> [!NOTE]\n> This is a note.';
      const result = render(md);
      expect(result.bodyHtml).toContain('markdown-alert');
      expect(result.bodyHtml).toContain('Note');
    });

    it('renders [!WARNING] as alert div', () => {
      const md = '> [!WARNING]\n> Be careful.';
      const result = render(md);
      expect(result.bodyHtml).toContain('Warning');
    });

    it('supports nested blockquotes inside alerts', () => {
      const md = '> [!TIP]\n> > Nested quote';
      const result = render(md);
      expect(result.bodyHtml).toContain('markdown-alert');
    });

    it('hides [!TYPE] text when it is the only content', () => {
      const md = '> [!NOTE]\n> Content here.';
      const result = render(md);
      expect(result.bodyHtml).not.toContain('[!NOTE]');
    });
  });

  describe('heading slugify', () => {
    it('generates id from heading text', () => {
      const result = render('# Hello World');
      expect(result.bodyHtml).toContain('id="hello-world"');
    });

    it('handles duplicate headings with suffix', () => {
      const result = render('# First\n\n## First');
      expect(result.bodyHtml).toContain('id="first"');
      expect(result.bodyHtml).toContain('id="first-1"');
    });

    it('handles CJK characters in headings', () => {
      const result = render('# 中文标题');
      expect(result.bodyHtml).toContain('id="中文标题"');
    });
  });

  describe('fence renderer', () => {
    it('renders code block with line numbers', () => {
      const result = render('```js\nconsole.log("hi");\n```');
      expect(result.bodyHtml).toContain('post-code-line-numbers');
      expect(result.bodyHtml).toContain('hljs');
    });

    it('shows language label when lang is specified', () => {
      const result = render('```javascript\nlet x = 1;\n```');
      expect(result.bodyHtml).toContain('post-code-lang');
      expect(result.bodyHtml).toContain('javascript');
    });

    it('renders mermaid as div class mermaid', () => {
      const result = render('```mermaid\ngraph A --> B\n```');
      expect(result.bodyHtml).toContain('class="mermaid"');
      expect(result.hasMermaid).toBe(true);
    });

    it('hides line numbers when codeLineNumbers is false', () => {
      const result = render('```js\nlet x = 1;\n```', { codeLineNumbers: false });
      expect(result.bodyHtml).not.toContain('post-code-line-numbers');
    });

    it('hides language label when codeLangLabel is false', () => {
      const result = render('```js\nlet x = 1;\n```', { codeLangLabel: false });
      expect(result.bodyHtml).not.toContain('post-code-lang');
    });
  });

  describe('table cell alignment', () => {
    it('converts align attribute to style for centered td', () => {
      const md = '| Left | Center | Right |\n| :--- | :---: | ---: |\n| a | b | c |';
      const result = render(md);
      expect(result.bodyHtml).toContain('style="text-align:center"');
    });
  });
});