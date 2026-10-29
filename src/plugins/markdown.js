import { config } from 'md-editor-v3'
import screenfull from 'screenfull'

// Provide the fullscreen implementation locally instead of the editor's CDN default.
config({ editorExtensions: { screenfull: { instance: screenfull } } })

export const previewOptions = Object.freeze({
  noMermaid: true,
  noKatex: true,
  noHighlight: true,
  noEcharts: true
})

// These plugins initialize on mount even when their toolbar buttons are absent.
export const editorOptions = Object.freeze({
  ...previewOptions,
  noPrettier: true,
  noUploadImg: true
})
