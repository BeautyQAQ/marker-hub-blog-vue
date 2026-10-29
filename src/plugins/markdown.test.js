import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { MdEditor, MdPreview } from 'md-editor-v3'
import { editorOptions, previewOptions } from './markdown'
import { sanitizeMarkdown } from '../utils/markdown'

describe('self-contained Markdown rendering', () => {
  it('mounts the real editor and preview without injecting external plugin assets', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
    const remoteAssets = []
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue
          const assets = [node, ...node.querySelectorAll('script[src], link[href]')]
          for (const asset of assets) {
            if (!asset.matches('script[src], link[href]')) continue
            const url = asset.getAttribute('src') || asset.getAttribute('href')
            if (/^https?:\/\//.test(url)) remoteAssets.push(url)
          }
        }
      }
    })
    observer.observe(document.documentElement, { childList: true, subtree: true })
    let editor
    let preview
    try {
      editor = mount(MdEditor, {
        attachTo: document.body,
        props: { ...editorOptions, id: 'asset-test-editor', modelValue: '# 正文', toolbars: ['bold', 'preview', 'fullscreen'], sanitize: sanitizeMarkdown }
      })
      preview = mount(MdPreview, {
        attachTo: document.body,
        props: { ...previewOptions, id: 'asset-test-preview', modelValue: '# 预览', sanitize: sanitizeMarkdown }
      })
      await flushPromises()
      expect(editor.text()).toContain('正文')
      expect(preview.find('h1').text()).toBe('预览')
      expect(remoteAssets).toEqual([])
    } finally {
      editor?.unmount()
      preview?.unmount()
      observer.disconnect()
      vi.unstubAllGlobals()
    }
  })
})
