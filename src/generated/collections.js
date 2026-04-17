/**
 * @file src/generated/collections.js
 * @description Build-time collection assembly for installed apps and features.
 */

const collectionModuleImports = import.meta.glob(
  [
    '../apps/*/collections/**/*.js',
    '../features/*/collections/**/*.js',
    '!../apps/*/collections/**/*.test.js',
    '!../apps/*/collections/**/*.spec.js',
    '!../features/*/collections/**/*.test.js',
    '!../features/*/collections/**/*.spec.js',
  ],
  { eager: true },
)

const manifestImports = import.meta.glob(
  ['../apps/*/app.manifest.js', '../features/*/feature.manifest.js'],
  { eager: true },
)

function isCollectionDefinition(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.name === 'string' &&
      value.name.trim().length > 0,
  )
}

function extractDefinitionsFromModule(modulePath, mod) {
  const extracted = []

  if (isCollectionDefinition(mod?.default)) {
    extracted.push(mod.default)
  } else if (mod?.default && typeof mod.default === 'object') {
    for (const value of Object.values(mod.default)) {
      if (isCollectionDefinition(value)) {
        extracted.push(value)
      }
    }
  }

  for (const [exportName, value] of Object.entries(mod)) {
    if (exportName === 'default') continue

    if (isCollectionDefinition(value)) {
      extracted.push(value)
    } else if (value && typeof value === 'object') {
      for (const nestedValue of Object.values(value)) {
        if (isCollectionDefinition(nestedValue)) {
          extracted.push(nestedValue)
        }
      }
    }
  }

  return extracted
}

function extractManifestCollectionNames(manifest) {
  const collections = Array.isArray(manifest?.collections) ? manifest.collections : []

  return collections
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim()
      if (entry && typeof entry === 'object' && typeof entry.name === 'string') {
        return entry.name.trim()
      }
      return null
    })
    .filter(Boolean)
}

function buildCollectionRegistry() {
  const definitions = []
  const definitionNames = new Map()
  const declaredNames = new Set()

  for (const [modulePath, mod] of Object.entries(collectionModuleImports)) {
    const extracted = extractDefinitionsFromModule(modulePath, mod)

    for (const definition of extracted) {
      const normalizedName = definition.name.trim()

      if (definitionNames.has(normalizedName)) {
        throw new Error(
          '[generated/collections] Duplicate collection definition "' +
            normalizedName +
            '" found in "' +
            modulePath +
            '" and "' +
            definitionNames.get(normalizedName) +
            '".',
        )
      }

      definitionNames.set(normalizedName, modulePath)
      definitions.push(definition)
      declaredNames.add(normalizedName)
    }
  }

  for (const mod of Object.values(manifestImports)) {
    const manifest = mod?.default || mod
    for (const name of extractManifestCollectionNames(manifest)) {
      declaredNames.add(name)
    }
  }

  definitions.sort((a, b) => a.name.localeCompare(b.name))

  return {
    definitions,
    names: Array.from(declaredNames).sort((a, b) => a.localeCompare(b)),
  }
}

const registry = buildCollectionRegistry()

export const definedCollections = registry.definitions
export const generatedCollectionNames = registry.names

export function hasGeneratedCollection(collectionName) {
  return generatedCollectionNames.includes(collectionName)
}

export default definedCollections
