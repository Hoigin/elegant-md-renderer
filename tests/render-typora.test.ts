import { describe, it, expect } from 'vitest';
import { render } from '../src/index.js';

describe('render — Typora compatibility', () => {
  it('wraps URLs with spaces in angle brackets', () => {
    const md = '[link](http://example.com/path with spaces)';
    const result = render(md);
    expect(result.bodyHtml).toContain('http://example.com/path%20with%20spaces');
    expect(result.bodyHtml).not.toContain('path with spaces');
  });

  it('does not modify URLs without spaces', () => {
    const md = '[link](http://example.com/path)';
    const result = render(md);
    expect(result.bodyHtml).toContain('http://example.com/path');
  });

  it('double-encodes % in image src for Typora filenames', () => {
    const md = '![img](https%3A%2F%2Fexample.com%2Fimage.webp)';
    const result = render(md);
    expect(result.bodyHtml).toContain('https%253A%252F%252Fexample.com%252Fimage.webp');
  });

  it('does not modify image src without % encoding', () => {
    const md = '![img](image.png)';
    const result = render(md);
    expect(result.bodyHtml).toContain('src="image.png"');
  });
});