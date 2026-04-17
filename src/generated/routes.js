/**
 * @file src/generated/routes.js
 * @description Build-time route assembly for installed apps and features.
 */

const routeModuleImports = import.meta.glob(
  [
    '../apps/*/routes.js',
    '../apps/*/routes/index.js',
    '../features/*/routes.js',
    '../features/*/routes/index.js',
  ],
  { eager: true },
)

const manifestImports = import.meta.glob(
  ['../apps/*/app.manifest.js', '../features/*/feature.manifest.js'],
  { eager: true },
)

function normalizeRouteContribution(contribution, context = {}) {
  if (!contribution) return []

  const resolved = typeof contribution === 'function' ? contribution(context) : contribution

  if (Array.isArray(resolved)) return resolved.filter(Boolean)
  if (resolved && typeof resolved === 'object' && typeof resolved.path === 'string') {
    return [resolved]
  }

  return []
}

function extractRoutesFromModule(mod, context = {}) {
  const routes = []

  if (mod?.default) {
    routes.push(...normalizeRouteContribution(mod.default, context))
  }

  if (mod?.routes) {
    routes.push(...normalizeRouteContribution(mod.routes, context))
  }

  for (const [exportName, value] of Object.entries(mod)) {
    if (exportName === 'default' || exportName === 'routes') continue
    routes.push(...normalizeRouteContribution(value, context))
  }

  return routes
}

function extractManifestRoutes(manifest) {
  const routes = Array.isArray(manifest?.routes) ? manifest.routes : []
  return routes.filter((route) => route && typeof route.path === 'string')
}

export function createGeneratedRoutes(context = {}) {
  const routes = []
  const seenKeys = new Set()

  for (const mod of Object.values(routeModuleImports)) {
    routes.push(...extractRoutesFromModule(mod, context))
  }

  for (const mod of Object.values(manifestImports)) {
    const manifest = mod?.default || mod
    routes.push(...extractManifestRoutes(manifest))
  }

  return routes.filter((route) => {
    const key = route.name || route.path
    if (!key) return false
    if (seenKeys.has(key)) return false
    seenKeys.add(key)
    return true
  })
}

  /**
 * Navigation-ready route records.
 * Components can import this directly for menus/sidebars.
 */
export const links = createGeneratedRoutes()


export function createAppRoutes(options = {}) {
  const all = createGeneratedRoutes(options)

  const publicChildren = all.filter(
    (route) =>
      route &&
      typeof route.path === 'string' &&
      route.meta?.requiresAuth === false
  )

  const adminChildren = all.filter(
    (route) =>
      route &&
      typeof route.path === 'string' &&
      route.meta?.requiresAuth !== false
  )

  return [
    {
      path: '/',
      component: () => import('@/PublicLayOut.vue'),
      meta: { guestOnly: true, requiresAuth: false },
      children: publicChildren,
    },
    {
      path: '/a',
      component: () => import('@/MainAppLayOut.vue'),
      meta: { requiresAuth: true },
      children: adminChildren,
    }
  ]
}
