 /**
 * @file src/utils/productImageHandler.js
 * @description Browser-side image validation and compression for AgripreneurSpace product uploads.
 */

export const PRODUCT_IMAGE_LIMITS = Object.freeze({
  maxInputBytes: 8 * 1024 * 1024, // 8 MiB local file limit before processing
  maxOutputBytes: 2 * 1024 * 1024, // 2 MiB upload limit
  maxWidth: 1200,
  maxHeight: 1200,
  outputType: 'image/webp',
  fallbackType: 'image/jpeg',
  initialQuality: 0.76,
  minQuality: 0.5,
})

export const ACCEPTED_PRODUCT_IMAGE_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export async function prepareProductImage(file, options = {}) {
  const config = {
    ...PRODUCT_IMAGE_LIMITS,
    ...options,
  }

  validateInputFile(file, config)

  const source = await loadImage(file)
  const initialSize = calculateTargetSize({
    width: source.width,
    height: source.height,
    maxWidth: config.maxWidth,
    maxHeight: config.maxHeight,
  })

  const compressed = await compressUntilWithinLimit({
    source,
    file,
    width: initialSize.width,
    height: initialSize.height,
    config,
  })

  const previewUrl = URL.createObjectURL(compressed.file)

  return {
    file: compressed.file,
    blob: compressed.blob,
    previewUrl,

    width: compressed.width,
    height: compressed.height,

    originalName: file.name,
    originalType: file.type,
    originalSizeBytes: file.size,

    outputName: compressed.file.name,
    outputType: compressed.file.type,
    outputSizeBytes: compressed.file.size,

    compressionRatio: Number((compressed.file.size / file.size).toFixed(3)),
  }
}

export function revokeImagePreview(previewUrl) {
  if (!previewUrl) return
  URL.revokeObjectURL(previewUrl)
}

function validateInputFile(file, config) {
  if (!file) {
    throw new Error('Product image file is required.')
  }

  if (!ACCEPTED_PRODUCT_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, or WebP images are allowed.')
  }

  if (file.size > config.maxInputBytes) {
    throw new Error('Original image is too large. Use an image below 8 MiB before compression.')
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read the selected image.'))
    }

    image.src = url
  })
}

function calculateTargetSize({ width, height, maxWidth, maxHeight }) {
  const ratio = Math.min(
    1,
    maxWidth / width,
    maxHeight / height,
  )

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

async function compressUntilWithinLimit({ source, file, width, height, config }) {
  let currentWidth = width
  let currentHeight = height

  const qualitySteps = buildQualitySteps(config.initialQuality, config.minQuality)

  for (let resizePass = 0; resizePass < 5; resizePass++) {
    for (const quality of qualitySteps) {
      const blob = await renderToBlob({
        source,
        width: currentWidth,
        height: currentHeight,
        type: config.outputType,
        quality,
      })

      if (blob && blob.size <= config.maxOutputBytes) {
        return buildCompressedResult({
          blob,
          file,
          width: currentWidth,
          height: currentHeight,
          type: config.outputType,
        })
      }
    }

    currentWidth = Math.round(currentWidth * 0.85)
    currentHeight = Math.round(currentHeight * 0.85)

    if (currentWidth < 640 || currentHeight < 640) break
  }

  // Fallback to JPEG if WebP output failed or stayed too large.
  for (const quality of qualitySteps) {
    const blob = await renderToBlob({
      source,
      width: currentWidth,
      height: currentHeight,
      type: config.fallbackType,
      quality,
    })

    if (blob && blob.size <= config.maxOutputBytes) {
      return buildCompressedResult({
        blob,
        file,
        width: currentWidth,
        height: currentHeight,
        type: config.fallbackType,
      })
    }
  }

  throw new Error('Image could not be compressed below 2 MiB. Use a smaller image.')
}

function buildQualitySteps(initialQuality, minQuality) {
  const steps = []
  let quality = initialQuality

  while (quality >= minQuality) {
    steps.push(Number(quality.toFixed(2)))
    quality -= 0.06
  }

  return steps
}

function renderToBlob({ source, width, height, type, quality }) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d', {
      alpha: type === 'image/png',
    })

    if (!context) {
      resolve(null)
      return
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    if (type !== 'image/png') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
    }

    context.drawImage(source, 0, 0, width, height)

    canvas.toBlob(
      (blob) => resolve(blob),
      type,
      quality,
    )
  })
}

function buildCompressedResult({ blob, file, width, height, type }) {
  const outputName = buildOutputFileName(file.name, type)

  const compressedFile = new File([blob], outputName, {
    type,
    lastModified: Date.now(),
  })

  return {
    blob,
    file: compressedFile,
    width,
    height,
  }
}

function buildOutputFileName(originalName, type) {
  const extension = type === 'image/webp' ? 'webp' : 'jpg'
  const baseName = String(originalName || 'image')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return `${baseName || 'image'}.${extension}`
}