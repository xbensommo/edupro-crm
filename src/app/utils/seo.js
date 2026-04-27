// src/utils/seo.js


const SITE_URL = 'https://www.totisoft.com'
const SITE_NAME = 'Totisoft'
const DEFAULT_OG_IMAGE = `${SITE_URL}/preview.PNG`

export function useSeo({
  title,
  description,
  path = '/',
  image = DEFAULT_OG_IMAGE,
  keywords = '',
  type = 'website',
  schema
}) {
  const url = `${SITE_URL}${path}`
}