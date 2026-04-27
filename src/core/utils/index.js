export const MAX_FILE_COUNT = 5
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
export const MAX_TOTAL_SIZE_BYTES = 25 * 1024 * 1024

export const acceptedFileTypes =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg'

export function getFileExtension(name = '') {
  const parts = String(name).toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() : ''
}

export function sanitizeFilename(name = '') {
  const extension = getFileExtension(name)
  const baseName = String(name)
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

  return extension ? `${baseName || 'file'}.${extension}` : baseName || 'file'
}

export function validateFile(file) {
  const extension = getFileExtension(file?.name)
  const hasAllowedExtension = ALLOWED_EXTENSIONS.has(extension)
  const hasAllowedMime = !file?.type || ALLOWED_MIME_TYPES.has(file.type)

  if (!hasAllowedExtension) {
    return { ok: false, reason: 'Blocked file extension.' }
  }

  if (!hasAllowedMime) {
    return { ok: false, reason: 'Blocked file type.' }
  }

  if (Number(file?.size || 0) > MAX_FILE_SIZE_BYTES) {
    return { ok: false, reason: 'File is above 10 MB.' }
  }

  return { ok: true, reason: '' }
}

export function createStoragePath({ clientId, engagementId, safeName }) {
  const stamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  return `crm/engagements/${clientId}/${engagementId}/${stamp}_${random}_${safeName}`
}