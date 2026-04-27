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

/**
 * Determine whether a value is a real shard-provider collection definition.
 *
 * Important:
 * - Do not treat schema field configs like `{ name: 'title', type: 'string' }`
 *   as collection definitions.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isCollectionDefinition(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      value.kind === 'ShardProviderCollectionDefinition' &&
      typeof value.name === 'string' &&
      value.name.trim().length > 0 &&
      value.schema &&
      typeof value.schema === 'object'
  )
}

/**
 * Extract only top-level exported collection definitions from a module.
 *
 * This intentionally does NOT walk nested objects, because nested schema fields
 * also contain `name` and would be falsely detected as collection definitions.
 *
 * @param {string} modulePath
 * @param {Record<string, any>} mod
 * @returns {Array<Record<string, any>>}
 */
function extractDefinitionsFromModule(modulePath, mod) {
  const extracted = []
  const seenNames = new Set()

  function pushDefinition(value) {
    if (!isCollectionDefinition(value)) return

    const normalizedName = value.name.trim()
    if (seenNames.has(normalizedName)) return

    seenNames.add(normalizedName)
    extracted.push(value)
  }

  pushDefinition(mod?.default)

  for (const [exportName, value] of Object.entries(mod)) {
    if (exportName === 'default') continue
    pushDefinition(value)
  }

  return extracted
}

/**
 * Extract collection names declared in manifests.
 *
 * @param {Record<string, any>} manifest
 * @returns {string[]}
 */
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

/**
 * Build the generated collection registry.
 *
 * @returns {{ definitions: Array<Record<string, any>>, names: string[] }}
 */
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

const notificationsDefinition = registry.definitions.find(
  (definition) => definition?.name === 'notifications',
)

if (!notificationsDefinition) {
  throw new Error(
    '[generated/collections] Missing "notifications" collection definition in generated registry.',
  )
}

/* console.log('[generated/collections] notifications definition', {
  name: notificationsDefinition.name,
  writableFields: notificationsDefinition.writableFields,
  updateableFields: notificationsDefinition.updateableFields,
  fieldAliases: notificationsDefinition.fieldAliases,
  schemaKeys: Object.keys(notificationsDefinition.schema || {}),
}) */

export const definedCollections = registry.definitions
export const generatedCollectionNames = registry.names

export function hasGeneratedCollection(collectionName) {
  return generatedCollectionNames.includes(collectionName)
}

export default definedCollections