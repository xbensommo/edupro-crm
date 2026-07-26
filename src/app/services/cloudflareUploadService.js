// src/services/cloudflareUploadService.js

/**
 * @file src/services/cloudflareUploadService.js
 * @description Centralized, pure JavaScript utility for Cloudflare R2 image uploads.
 * Single source of truth for all image upload operations.
 */

import { uploadToR2, deleteFromR2 } from '@app/cloudflare/r2Storage.js'
import { prepareProductImage, revokeImagePreview as revokeImagePreviews} from '@app/utils/productImageHandler.js'

// ===== Constants =====
const MAX_IMAGE_BYTES = {
  product: 2 * 1024 * 1024,      // 2MB
  store: 2 * 1024 * 1024,        // 2MB
  event: 2 * 1024 * 1024,        // 4MB
  article: 2 * 1024 * 1024,      // 4MB
  blog_hero: 2 * 1024 * 1024,    // 4MB
  blog_gallery: 2 * 1024 * 1024, // 4MB
}

const ALLOWED_IMAGE_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
])

// ===== Error Types =====
export class UploadError extends Error {
  constructor(message, code, details = {}) {
    super(message)
    this.name = 'UploadError'
    this.code = code
    this.details = details
  }
}

// ===== Path Builders =====
function buildStoragePath(type, identifiers) {
  const paths = {
    product: () => {
      const { storeId, categorySlug, productId, filename } = identifiers
      return [
        'agripreneurspace',
        'products',
        slugify(storeId || 'unknown-store'),
        slugify(categorySlug || 'uncategorised'),
        slugify(productId || `draft-${Date.now()}`),
        filename,
      ].join('/')
    },

    store: () => {
      const { storeId, filename } = identifiers
      return [
        'agripreneurspace',
        'stores',
        slugify(storeId || 'unknown-store'),
        'profile',
        filename,
      ].join('/')
    },

    event: () => {
      const { eventId, filename } = identifiers
      return [
        'agripreneurspace',
        'events',
        slugify(eventId || `event-${Date.now()}`),
        filename,
      ].join('/')
    },

    article_hero: () => {
      const { articleId, filename } = identifiers
      return [
        'agripreneurspace',
        'articles',
        slugify(articleId || `draft-${Date.now()}`),
        'hero',
        filename,
      ].join('/')
    },

    article_gallery: () => {
      const { articleId, filename } = identifiers
      return [
        'agripreneurspace',
        'articles',
        slugify(articleId || `draft-${Date.now()}`),
        'gallery',
        filename,
      ].join('/')
    },
  }

  const builder = paths[type]
  if (!builder) {
    throw new UploadError(`Unknown upload type: ${type}`, 'INVALID_UPLOAD_TYPE')
  }

  return builder()
}

// ===== Helpers =====
function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`
}

function generateFilename(file, prefix = 'image') {
  const baseName = slugify(file.name.replace(/\.[^/.]+$/, '') || prefix)
  const extension = getFileExtension(file.type)
  const timestamp = Date.now()
  return `${timestamp}-${baseName}.${extension}`
}

function getFileExtension(mimeType) {
  switch (mimeType) {
    case 'image/webp': return 'webp'
    case 'image/png': return 'png'
    default: return 'jpg'
  }
}

function getMaxSizeBytes(uploadType) {
  return MAX_IMAGE_BYTES[uploadType] || MAX_IMAGE_BYTES.product
}

// ===== Validation =====
function validateFile(file, uploadType = 'product') {
  const errors = []

  if (!file) {
    errors.push({ field: 'file', message: 'No file provided.' })
    return errors
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    errors.push({
      field: 'type',
      message: `Unsupported file type: ${file.type}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    })
  }

  const maxSize = getMaxSizeBytes(uploadType)
  if (file.size > maxSize) {
    errors.push({
      field: 'size',
      message: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${(maxSize / 1024 / 1024).toFixed(0)}MB.`,
    })
  }

  return errors
}

// ===== Main Upload Function =====
/**
 * Upload a single image to Cloudflare R2
 * 
 * @param {File} file - The image file to upload
 * @param {Object} options - Upload configuration
 * @param {string} options.type - Upload type: 'product' | 'store' | 'event' | 'article_hero' | 'article_gallery'
 * @param {Object} options.identifiers - Context identifiers for path building
 * @param {string} options.identifiers.storeId - Store identifier
 * @param {string} options.identifiers.categorySlug - Category slug
 * @param {string} options.identifiers.productId - Product identifier
 * @param {string} options.identifiers.eventId - Event identifier
 * @param {string} options.identifiers.articleId - Article identifier
 * @param {Object} options.imageMeta - Optional image metadata from prepareProductImage
 * @param {Function} options.onProgress - Progress callback (optional)
 * 
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export async function uploadImage(file, options = {}) {
  const {
    type = 'product',
    identifiers = {},
    imageMeta = null,
    onProgress = null,
  } = options

  // 1. Validate
  const validationErrors = validateFile(file, type)
  if (validationErrors.length > 0) {
    const firstError = validationErrors[0]
    throw new UploadError(
      firstError.message,
      'VALIDATION_ERROR',
      { errors: validationErrors }
    )
  }

  // 2. Prepare image (compression)
  let prepared
  try {
    prepared = imageMeta || await prepareProductImage(file)
  } catch (error) {
    throw new UploadError(
      `Image preparation failed: ${error.message}`,
      'PREPARATION_ERROR',
      { originalError: error }
    )
  }

  // 3. Generate path and filename
  const filename = generateFilename(prepared.file || file, type)
  const path = buildStoragePath(type, { ...identifiers, filename })

  // 4. Upload to Cloudflare R2
  let url
  try {
    const metadata = {
      uploadType: type,
      originalName: prepared.originalName || file.name,
      originalType: prepared.originalType || file.type,
      originalSizeBytes: String(prepared.originalSizeBytes || file.size),
      outputName: prepared.outputName || file.name,
      outputType: prepared.outputType || file.type,
      outputSizeBytes: String(prepared.outputSizeBytes || file.size),
      outputWidth: String(prepared.width || ''),
      outputHeight: String(prepared.height || ''),
      compressionRatio: String(prepared.compressionRatio || ''),
      uploadedAt: new Date().toISOString(),
      ...Object.entries(identifiers).reduce((acc, [k, v]) => {
        if (v) acc[k] = String(v)
        return acc
      }, {}),
    }

    url = await uploadToR2(path, prepared.file || file, metadata)
  } catch (error) {
    throw new UploadError(
      `Cloudflare upload failed: ${error.message}`,
      'UPLOAD_FAILED',
      { originalError: error, path }
    )
  }

  // 5. Return result
  return {
    url,
    path,
    filename,
    metadata: {
      originalName: file.name,
      originalType: file.type,
      originalSize: file.size,
      compressedSize: prepared.outputSizeBytes || file.size,
      width: prepared.width || null,
      height: prepared.height || null,
      mimeType: prepared.outputType || file.type,
    },
    preview: prepared.previewUrl || null,
  }
}

/**
 * Upload multiple images to Cloudflare R2
 * 
 * @param {File[]} files - Array of image files
 * @param {Object} options - Same as uploadImage
 * @param {number} options.maxFiles - Maximum number of files to upload
 * @returns {Promise<Array>} Array of upload results
 */
export async function uploadImages(files, options = {}) {
  const { maxFiles = Infinity, ...rest } = options
  const results = []
  const errors = []

  const filesToUpload = Array.isArray(files) ? files.slice(0, maxFiles) : []

  for (const file of filesToUpload) {
    try {
      const result = await uploadImage(file, rest)
      results.push(result)
    } catch (error) {
      // Log but don't stop the batch
      console.error('[CloudflareUploadService] Batch upload error:', {
        file: file.name,
        error: error.message,
        code: error.code,
      })
      errors.push({
        file: file.name,
        error: error.message,
        code: error.code,
      })
    }
  }

  if (results.length === 0 && errors.length > 0) {
    throw new UploadError(
      'All files failed to upload',
      'BATCH_FAILED',
      { errors }
    )
  }

  return {
    results,
    errors,
    total: filesToUpload.length,
    succeeded: results.length,
    failed: errors.length,
  }
}

/**
 * Delete an image from Cloudflare R2
 * 
 * @param {string} path - The storage path of the file to delete
 * @returns {Promise<void>}
 */
// export async function deleteImage(path) {
//   if (!path) return

//   try {
//     await deleteFromR2(path)
//   } catch (error) {
//     throw new UploadError(
//       `Failed to delete image: ${error.message}`,
//       'DELETE_FAILED',
//       { originalError: error, path }
//     )
//   }
// }


// src/services/cloudflareUploadService.js

/**
 * Delete an image from Cloudflare R2
 * Handles both paths and full URLs
 * 
 * @param {string} pathOrUrl - The storage path or full URL
 * @returns {Promise<void>}
 */
export async function deleteImage(pathOrUrl) {
  if (!pathOrUrl) return

  // Extract path from URL if needed
  let path = pathOrUrl
  
  // If it's a full Cloudflare R2 URL, extract the path
  if (pathOrUrl.includes('.r2.cloudflarestorage.com') || 
      pathOrUrl.includes('r2.dev') ||
      pathOrUrl.includes('cloudflare')) {
    try {
      const url = new URL(pathOrUrl)
      // Remove leading slash
      path = url.pathname.replace(/^\//, '')
    } catch {
      // Try regex fallback
      const match = pathOrUrl.match(/\.com\/(agripreneurspace\/[^\?]+)/)
      if (match) {
        path = match[1]
      } else {
        //console.warn('[Delete] Could not extract path from URL:', pathOrUrl)
        return
      }
    }
  }

  // Ensure we have a valid path
  if (!path || !path.includes('/')) {
    //console.warn('[Delete] Invalid path:', path)
    return
  }

  //console.log(`[Delete] Removing: ${path}`)

  try {
    await deleteFromR2(path)
    //console.log(`[Delete] ✅ Success: ${path}`)
  } catch (error) {
    throw new UploadError(
      `Failed to delete image: ${error.message}`,
      'DELETE_FAILED',
      { originalError: error, path }
    )
  }
}

/**
 * Delete multiple images from Cloudflare R2
 * 
 * @param {string[]} paths - Array of storage paths
 * @returns {Promise<Array>} Results of delete operations
 */
export async function deleteImages(paths) {
  const results = []
  for (const path of paths) {
    try {
      await deleteImage(path)
      results.push({ path, success: true })
    } catch (error) {
      console.warn('[CloudflareUploadService] Delete error:', { path, error: error.message })
      results.push({ path, success: false, error: error.message })
    }
  }
  return results
}

/**
 * Generate a preview URL for a file (creates object URL)
 * 
 * @param {File} file - The file to preview
 * @returns {string} Object URL for preview
 */
export function createImagePreview(file) {
  if (!file) return null
  return URL.createObjectURL(file)
}

/**
 * Revoke an image preview URL
 * 
 * @param {string} previewUrl - The object URL to revoke
 */
export function revokeImagePreview(previewUrl) {
  if (previewUrl && previewUrl.startsWith('blob:')) {
    revokeImagePreviews(previewUrl)
  }
}

// ===== Export Convenience Methods =====
export const upload = {
  /**
   * Upload a product image
   */
  product: (file, identifiers, options = {}) => {
    return uploadImage(file, { type: 'product', identifiers, ...options })
  },

  /**
   * Upload a store image
   */
  store: (file, identifiers, options = {}) => {
    return uploadImage(file, { type: 'store', identifiers, ...options })
  },

  /**
   * Upload an event image
   */
  event: (file, identifiers, options = {}) => {
    return uploadImage(file, { type: 'event', identifiers, ...options })
  },

  /**
   * Upload an article hero image
   */
  articleHero: (file, identifiers, options = {}) => {
    return uploadImage(file, { type: 'article_hero', identifiers, ...options })
  },

  /**
   * Upload article gallery images
   */
  articleGallery: (files, identifiers, options = {}) => {
    return uploadImages(files, { type: 'article_gallery', identifiers, ...options })
  },
}

// ===== Re-export utilities for convenience =====
export { prepareProductImage }

// ===== Logger (can be swapped for production) =====
const logger = {
  info: (...args) => console.info('[CloudflareUpload]', ...args),
  warn: (...args) => console.warn('[CloudflareUpload]', ...args),
  error: (...args) => console.error('[CloudflareUpload]', ...args),
  debug: (...args) => process.env.NODE_ENV === 'development' && console.debug('[CloudflareUpload]', ...args),
}

export { logger }