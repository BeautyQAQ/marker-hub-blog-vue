import { describe, expect, it } from 'vitest'
import { MAX_CONTENT_BYTES, validateContent } from './blog'

describe('article content size validation', () => {
  it('accepts 1 MiB and rejects multibyte text beyond the UTF-8 limit', () => {
    let error
    validateContent({}, 'a'.repeat(MAX_CONTENT_BYTES), value => { error = value })
    expect(error).toBeUndefined()
    validateContent({}, '文'.repeat(Math.floor(MAX_CONTENT_BYTES / 3) + 1), value => { error = value })
    expect(error.message).toContain('UTF-8')
  })
})
