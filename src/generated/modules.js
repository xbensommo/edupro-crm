/**
 * @file src/generated/modules.js
 * @description Build-time module metadata assembly.
 */

const appManifestImports = import.meta.glob('../apps/*/app.manifest.js', { eager: true })
const featureManifestImports = import.meta.glob('../features/*/feature.manifest.js', { eager: true })

function normalizeManifestMetadata(mod, kind) {
  const manifest = mod?.default || mod || {}

  return {
    kind,
    id: manifest.id || null,
    name: manifest.name || manifest.id || null,
    version: manifest.version || '1.0.0',
    description: manifest.description || '',
    dependencies: manifest.dependencies || {},
    navigation: manifest.navigation || null,
  }
}

export const installedApps = Object.values(appManifestImports)
  .map((mod) => normalizeManifestMetadata(mod, 'app'))
  .filter((item) => item.id)
  .sort((a, b) => a.id.localeCompare(b.id))

export const installedFeatures = Object.values(featureManifestImports)
  .map((mod) => normalizeManifestMetadata(mod, 'feature'))
  .filter((item) => item.id)
  .sort((a, b) => a.id.localeCompare(b.id))

export const installedModules = [...installedApps, ...installedFeatures]
  .sort((a, b) => a.id.localeCompare(b.id))

export default installedModules
