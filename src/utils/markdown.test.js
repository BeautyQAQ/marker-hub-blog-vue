import { describe, expect, it } from 'vitest'
import { sanitizeMarkdown } from './markdown'

describe('Markdown HTML sanitization', () => {
  it('keeps article formatting and removes executable HTML and unsafe links', () => {
    const html = sanitizeMarkdown('<h2>文章</h2><p><strong>加粗</strong></p><img src="x" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">链接</a>')
    expect(html).toContain('<h2>文章</h2>')
    expect(html).toContain('<strong>加粗</strong>')
    expect(html).not.toContain('onerror')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('javascript:')
  })
})

