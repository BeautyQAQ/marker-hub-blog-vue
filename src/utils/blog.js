export const MAX_CONTENT_BYTES = 1024 * 1024

export function articleValidationMessage(form) {
  if (!form.title?.trim()) return '请输入标题'
  if (form.title.length > 255) return '标题不能超过 255 个字符'
  if ((form.description || '').length > 1000) return '摘要不能超过 1000 个字符'
  if (!form.content?.trim()) return '请输入文章内容'
  if (new TextEncoder().encode(form.content).length > MAX_CONTENT_BYTES) return '文章内容不能超过 1 MiB（按 UTF-8 计算）'
  return ''
}

export function validateContent(_rule, value, callback) {
  if (new TextEncoder().encode(value || '').length > MAX_CONTENT_BYTES) {
    callback(new Error('文章内容不能超过 1 MiB（按 UTF-8 计算）'))
  } else {
    callback()
  }
}

export function blogPayload(form, status = form.status) {
  return {
    ...(form.id ? { id: form.id } : {}),
    title: form.title,
    description: form.description || '',
    content: form.content,
    status
  }
}
