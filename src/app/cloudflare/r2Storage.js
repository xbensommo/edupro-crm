import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

// Load from environment variables
const BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME
const PUBLIC_DOMAIN = import.meta.env.VITE_R2_PUBLIC_DOMAIN
const ENDPOINT = import.meta.env.VITE_R2_ENDPOINT
const ACCESS_KEY = import.meta.env.VITE_R2_ACCESS_KEY
const SECRET_KEY = import.meta.env.VITE_R2_SECRET_KEY

if (!PUBLIC_DOMAIN || !ENDPOINT || !ACCESS_KEY || !SECRET_KEY) {
  console.warn('R2 environment variables are not fully set – uploads will fail.')
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
})

export async function uploadToR2(path, file, metadata = {}) {
  const safeMetadata = {}
  for (const [k, v] of Object.entries(metadata)) {
    if (v !== undefined && v !== null) safeMetadata[k] = String(v)
  }

  const body = new Uint8Array(await file.arrayBuffer())

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
      Body: body,
      ContentType: file.type,
      Metadata: safeMetadata,
    })
  )

  return `${PUBLIC_DOMAIN}/${path}`
}

export async function deleteFromR2(key) {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  )
}