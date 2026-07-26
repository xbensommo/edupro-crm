<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@app/stores/appStore'

import { links } from '@generated/routes.js'
import AOS from 'aos'

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const isSidebarOpen = ref(true)
const isMobileMenuOpen = ref(false)
const notificationPolling = ref(null)
const collapsedGroups = ref({})

// --- Notification Count with Reactivity ---
const unreadNotificationsCount = computed(() => {
  return 0 // store.notifications?.aggregatedCount || 0
})

const formattedNotificationCount = computed(() => {
  const count = unreadNotificationsCount.value
  if (count === 0) return null
  return count > 99 ? '99+' : count.toString()
})

// --- UI Helpers ---
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const toggleGroup = (groupName) => {
  const group = navigation.value.find(g => g.group === groupName)
  if (group?.collapsible) {
    collapsedGroups.value[groupName] = !collapsedGroups.value[groupName]
    localStorage.setItem('collapsedGroups', JSON.stringify(collapsedGroups.value))
  }
}

function titleCase(value = '') {
  return String(value)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

function inferGroup(routeRecord) {
  if (routeRecord?.meta?.navGroup) return routeRecord.meta.navGroup
  if (routeRecord?.meta?.group) return routeRecord.meta.group
  if (routeRecord?.meta?.feature) return titleCase(routeRecord.meta.feature)
  
  // Enhanced group inference based on route path/name
  const path = routeRecord?.path || ''
  const name = routeRecord?.name || ''
  const combined = `${path} ${name}`.toLowerCase()
  
  if (combined.includes('dashboard') || combined.includes('analytics') || combined.includes('report')) {
    return 'Dashboard'
  }
  if (combined.includes('client')) {
    return 'Client Management'
  }
  if (combined.includes('crm') || combined.includes('work') || combined.includes('engagement')) {
    return 'Work & Engagement'
  }
  if (combined.includes('finance') || combined.includes('payment') || combined.includes('invoice') || 
      combined.includes('payout') || combined.includes('expense') || combined.includes('transaction')) {
    return 'Finance'
  }
  if (combined.includes('vacancy')) {
    return 'Vacancy'
  }
  if (combined.includes('notification') || combined.includes('alert')) {
    return 'Notifications'
  }
  if (combined.includes('setting') || combined.includes('profile') || combined.includes('user')) {
    return 'Settings'
  }
  
  return 'Modules'
}

/**
 * Infers the appropriate FontAwesome 6 icon based on route metadata.
 * @param {import('vue-router').RouteRecordRaw} routeRecord
 * @returns {string} FontAwesome class string
 */
function inferIcon(routeRecord) {
  const haystack = [
    routeRecord?.name,
    routeRecord?.path,
    routeRecord?.meta?.title,
    routeRecord?.meta?.feature,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  // Dashboard & Analytics
  if (haystack.includes('dashboard') || haystack.includes('overview')) {
    return 'fas fa-chart-pie'
  }
  if (haystack.includes('analytics') || haystack.includes('insight')) {
    return 'fas fa-chart-scatter'
  }
  if (haystack.includes('report')) {
    return 'fas fa-file-alt'
  }

  // Client Management
  if (haystack.includes('client') || haystack.includes('customer') || haystack.includes('record')) {
    if (haystack.includes('list') || haystack.includes('all') || haystack.includes('manage')) {
      return 'fas fa-users'
    }
    if (haystack.includes('create') || haystack.includes('new') || haystack.includes('add')) {
      return 'fas fa-user-plus'
    }
    if (haystack.includes('edit') || haystack.includes('update')) {
      return 'fas fa-user-edit'
    }
    if (haystack.includes('detail') || haystack.includes('profile') || haystack.includes('view')) {
      return 'fas fa-user-circle'
    }
    return 'fas fa-address-book'
  }

  // CRM & Work
  if (haystack.includes('crm') || haystack.includes('work') || haystack.includes('engagement')) {
    if (haystack.includes('list') || haystack.includes('all') || haystack.includes('manage')) {
      return 'fas fa-tasks'
    }
    if (haystack.includes('create') || haystack.includes('new') || haystack.includes('add')) {
      return 'fas fa-plus-circle'
    }
    if (haystack.includes('detail') || haystack.includes('view') || haystack.includes('selected')) {
      return 'fas fa-file-invoice'
    }
    if (haystack.includes('submit') || haystack.includes('final') || haystack.includes('delivery')) {
      return 'fas fa-check-double'
    }
    return 'fas fa-briefcase'
  }

  // Finance
  if (haystack.includes('finance') || haystack.includes('transaction') || haystack.includes('payment')) {
    if (haystack.includes('dashboard') || haystack.includes('overview')) {
      return 'fas fa-chart-line'
    }
    if (haystack.includes('transaction')) {
      return 'fas fa-exchange-alt'
    }
    if (haystack.includes('payment')) {
      return 'fas fa-credit-card'
    }
    if (haystack.includes('invoice')) {
      return 'fas fa-file-invoice'
    }
    if (haystack.includes('quotation') || haystack.includes('quote')) {
      return 'fas fa-file-signature'
    }
    if (haystack.includes('receivable')) {
      return 'fas fa-hand-holding-usd'
    }
    if (haystack.includes('payout')) {
      return haystack.includes('my') ? 'fas fa-wallet' : 'fas fa-hand-holding-heart'
    }
    if (haystack.includes('expense')) {
      return 'fas fa-receipt'
    }
    if (haystack.includes('refund')) {
      return 'fas fa-undo-alt'
    }
    if (haystack.includes('audit')) {
      return 'fas fa-search'
    }
    if (haystack.includes('account')) {
      return 'fas fa-building-columns'
    }
    if (haystack.includes('balance') || haystack.includes('sheet')) {
      return 'fas fa-balance-scale'
    }
    if (haystack.includes('income') || haystack.includes('statement')) {
      return 'fas fa-arrow-trend-up'
    }
    return 'fas fa-coins'
  }

  // Vacancy
  if (haystack.includes('vacancy')) {
    if (haystack.includes('create') || haystack.includes('new')) {
      return 'fas fa-plus-circle'
    }
    if (haystack.includes('manage') || haystack.includes('list')) {
      return 'fas fa-list-alt'
    }
    if (haystack.includes('edit')) {
      return 'fas fa-edit'
    }
    return 'fas fa-bullhorn'
  }

  // Notifications
  if (haystack.includes('notification') || haystack.includes('alert')) {
    return 'fas fa-bell'
  }

  // Settings & System
  if (haystack.includes('setting') || haystack.includes('preference') || haystack.includes('config')) {
    return 'fas fa-sliders-h'
  }
  if (haystack.includes('user') || haystack.includes('profile') || haystack.includes('team')) {
    return 'fas fa-user-gear'
  }
  if (haystack.includes('media') || haystack.includes('file') || haystack.includes('upload')) {
    return 'fas fa-folder-open'
  }

  // Default
  return 'fas fa-cubes'
}

function isNotificationsRoute(routeRecord) {
  const haystack = [
    routeRecord?.name,
    routeRecord?.path,
    routeRecord?.meta?.title,
    routeRecord?.meta?.feature,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  
  return haystack.includes('notification') || haystack.includes('alert')
}

/**
 * Determine whether a route should appear in navigation.
 * A route must be nav-visible and access-allowed.
 * @param {import('vue-router').RouteRecordRaw} routeRecord
 * @returns {boolean}
 */
function shouldShowInNavigation(routeRecord) {
  if (!routeRecord || typeof routeRecord.path !== 'string') return false
  if (routeRecord.meta?.hideInNav === true) return false
  if (routeRecord.path.includes('/:')) return false
  if (routeRecord.meta?.publicAccess === true) return false
  if (routeRecord.meta?.navigation === false) return false

  if (typeof store.canAccessRoute === 'function') {
    return store.canAccessRoute(routeRecord.meta || {})
  }
  
  // Check roles
  if (routeRecord.meta?.roles && Array.isArray(routeRecord.meta.roles)) {
    if (!store.currentUser?.role) return false
    if (!routeRecord.meta.roles.includes(store.currentUser.role)) return false
  }
  
  return true
}

function getRoutePath(routeName) {
  // Find the route by name and return its path
  const allRoutes = Array.isArray(links) ? links : []
  const route = allRoutes.find(r => r.name === routeName)
  return route?.path || `/${String(routeName).toLowerCase()}`
}

function normalizeNavigationLink(routeRecord) {
  if (!shouldShowInNavigation(routeRecord)) return null
  
  const isNotification = isNotificationsRoute(routeRecord)
  
  return {
    group: inferGroup(routeRecord),
    name: routeRecord.meta?.navLabel || routeRecord.meta?.title || routeRecord.name || routeRecord.path,
    href: routeRecord.path,
    icon: routeRecord.meta?.icon || inferIcon(routeRecord),
    badge: isNotification ? formattedNotificationCount.value : null,
    order: routeRecord.meta?.navOrder || 0,
    hideInNav: routeRecord.meta?.hideInNav || false,
    requiresAuth: routeRecord.meta?.requiresAuth || false,
    roles: routeRecord.meta?.roles || [],
    permissions: routeRecord.meta?.permissions || [],
  }
}

// Group definitions with icons and collapsible settings
const groupDefinitions = {
  'Dashboard': { icon: 'fas fa-th-large', order: 1, collapsible: false },
  'Client Management': { icon: 'fas fa-address-book', order: 2, collapsible: true },
  'Work & Engagement': { icon: 'fas fa-briefcase', order: 3, collapsible: true },
  'Finance': { icon: 'fas fa-coins', order: 4, collapsible: true },
  'Vacancy': { icon: 'fas fa-bullhorn', order: 5, collapsible: false },
  'Notifications': { icon: 'fas fa-bell', order: 6, collapsible: false },
  'Settings': { icon: 'fas fa-cog', order: 7, collapsible: true },
  'Modules': { icon: 'fas fa-cubes', order: 8, collapsible: true },
  'System': { icon: 'fas fa-server', order: 9, collapsible: false },
}

const generatedNavigation = computed(() => {
  const grouped = new Map()
  
  // Process all route links
  for (const routeRecord of Array.isArray(links) ? links : []) {
    const navItem = normalizeNavigationLink(routeRecord)
    if (!navItem) continue
    
    // Use the route's name as key for duplicate checking
    const routeKey = routeRecord.name || routeRecord.path
    
    // Check if this route already exists in the group
    let existingGroup = null
    for (const [groupName, items] of grouped) {
      if (items.some(item => item.routeKey === routeKey)) {
        existingGroup = groupName
        break
      }
    }
    
    if (existingGroup) continue // Skip duplicates
    
    if (!grouped.has(navItem.group)) {
      grouped.set(navItem.group, [])
    }
    
    grouped.get(navItem.group).push({
      ...navItem,
      routeKey: routeKey
    })
  }
  
  // Sort links within each group by order
  const result = Array.from(grouped.entries()).map(([group, groupLinks]) => {
    const sortedLinks = groupLinks.sort((a, b) => (a.order || 0) - (b.order || 0))
    const groupDef = groupDefinitions[group] || groupDefinitions['Modules']
    
    return {
      group,
      icon: groupDef.icon,
      collapsible: groupDef.collapsible,
      order: groupDef.order,
      links: sortedLinks,
    }
  })
  
  // Sort groups by order
  return result.sort((a, b) => (a.order || 99) - (b.order || 99))
})

// Add System group with logout
const navigation = computed(() => {
  const nav = [...generatedNavigation.value]
  
  // Add System group if it doesn't exist
  if (!nav.some(g => g.group === 'System')) {
    nav.push({
      group: 'System',
      icon: 'fas fa-server',
      collapsible: false,
      order: 99,
      links: [
        {
          name: 'Log Out',
          href: '/logout',
          icon: 'fas fa-sign-out-alt',
          routeKey: 'logout',
          order: 1,
        }
      ]
    })
  } else {
    // Add logout to existing System group
    const systemGroup = nav.find(g => g.group === 'System')
    if (systemGroup && !systemGroup.links.some(l => l.routeKey === 'logout')) {
      systemGroup.links.push({
        name: 'Log Out',
        href: '/logout',
        icon: 'fas fa-sign-out-alt',
        routeKey: 'logout',
        order: 99,
      })
    }
  }
  
  return nav.sort((a, b) => (a.order || 99) - (b.order || 99))
})

const notificationsHref = computed(() => {
  const allLinks = generatedNavigation.value.flatMap((group) => group.links)
  const match = allLinks.find((link) => {
    const haystack = `${link.name} ${link.href}`.toLowerCase()
    return haystack.includes('notification') || haystack.includes('alert')
  })
  return match?.href || '/notifications'
})

function isActiveLink(href) {
  if (!href) return false
  if (route.path === href) return true
  if (href !== '/' && route.path.startsWith(`${href}/`)) return true
  return false
}

function getRoutePathByName(routeName) {
  // Helper to get path from route name
  const allRoutes = Array.isArray(links) ? links : []
  const route = allRoutes.find(r => r.name === routeName)
  return route?.path || `/${String(routeName).toLowerCase()}`
}

// --- Fetch Notification Count ---
const fetchNotificationCount = async () => {
  try {
    if (!store.currentUser?.uid) {
      console.warn('No user logged in')
      return
    }
    
    await store.notificationsActions?.fetchInitialPage({ read: false })
  } catch (error) {
    console.error('Failed to fetch notification count:', error)
  }
}

// --- Lifecycle Hooks ---
onMounted(async () => {
  AOS.init({ duration: 600, once: true })
  
  await fetchNotificationCount()
  
  notificationPolling.value = setInterval(fetchNotificationCount, 50000)
  
  // Restore collapsed state
  const saved = localStorage.getItem('collapsedGroups')
  if (saved) {
    try {
      collapsedGroups.value = JSON.parse(saved)
    } catch (e) {
      console.warn('Failed to parse collapsed groups state', e)
    }
  }
})

onUnmounted(() => {
  if (notificationPolling.value) {
    clearInterval(notificationPolling.value)
  }
})
</script>

<template>
  <div class="flex h-dvh bg-[var(--color-background)] text-[var(--color-text)] overflow-hidden">
    <!-- Desktop Sidebar -->
    <aside
      :class="[
        isSidebarOpen ? 'w-[var(--sidebar-width)]' : 'w-24',
        'hidden lg:flex h-full shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-xl transition-[width] duration-300 ease-out sticky top-0',
      ]"
    >
      <!-- Logo/Brand -->
      <div class="border-b border-[var(--color-border)] p-4">
        <div class="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--gradient-brand)] px-3 py-3 text-[var(--color-text-inverse)] shadow-lg">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-white/15 ring-1 ring-white/20">
            <i class="fa-solid fa-user-shield text-base"></i>
          </div>

          <div v-if="isSidebarOpen" class="min-w-0">
            <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/70">Portal</p>
            <h1 class="truncate text-lg font-bold leading-tight">EduPro</h1>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 py-4">
        <section v-for="group in navigation" :key="group.group" class="mb-6">
          <!-- Group Header -->
          <div 
            class="flex items-center justify-between mb-3 px-3 cursor-pointer select-none"
            @click="toggleGroup(group.group)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <i v-if="group.icon && isSidebarOpen" :class="[group.icon, 'text-[var(--color-text-muted)] text-sm shrink-0']"></i>
              <p v-if="isSidebarOpen" class="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-text-muted)] truncate">
                {{ group.group }}
              </p>
            </div>
            <i 
              v-if="group.collapsible && isSidebarOpen" 
              :class="[
                'fas fa-chevron-down text-[var(--color-text-muted)] text-xs transition-transform duration-200 shrink-0',
                { 'rotate-180': !collapsedGroups[group.group] }
              ]"
            ></i>
          </div>

          <!-- Group Links -->
          <div 
            v-show="!group.collapsible || !collapsedGroups[group.group]"
            class="space-y-1.5"
          >
            <router-link
              v-for="link in group.links"
              :key="link.routeKey || link.href"
              :to="link.href"
              class="group relative flex min-h-[3.25rem] items-center gap-3 rounded-[var(--radius-sm)] border border-transparent px-3 text-sm font-medium transition-all duration-200"
              :class="[
                isSidebarOpen ? 'justify-start' : 'justify-center',
                isActiveLink(link.href)
                  ? 'bg-[var(--color-surface-3)] text-[var(--color-primary)]'
                  : 'text-[var(--color-text-soft)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]',
              ]"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border transition-all"
                :class="
                  isActiveLink(link.href)
                    ? 'border-transparent bg-[var(--color-primary)] text-white'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]'
                "
              >
                <i :class="link.icon"></i>
              </span>

              <span v-if="isSidebarOpen" class="min-w-0 flex-1 truncate">{{ link.name }}</span>

              <!-- Badge -->
              <span
                v-if="isSidebarOpen && link.badge"
                class="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-[var(--color-primary)] px-2 py-1 text-[10px] font-bold text-[var(--color-text-inverse)] shadow"
              >
                {{ link.badge }}
              </span>

              <!-- Active Indicator -->
              <span 
                v-if="isActiveLink(link.href)"
                class="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[var(--color-primary)]"
              ></span>
            </router-link>
          </div>
        </section>
      </nav>

      <!-- User Footer -->
      <div class="shrink-0 border-t border-[var(--color-border)] p-3">
        <div 
          class="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3" 
          :class="isSidebarOpen ? '' : 'flex justify-center'"
        >
          <div class="flex items-center gap-3">
            <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[rgba(22,199,132,0.1)] text-[var(--color-success)]">
              <i class="fa-solid fa-server"></i>
            </span>
            <div v-if="isSidebarOpen" class="min-w-0">
              <p class="truncate text-sm font-semibold text-[var(--color-text)]">
                {{ store.currentUser?.firstName || 'User' }}
              </p>
              <p class="truncate text-xs text-[var(--color-text-muted)]">{{ store.currentUser?.role || 'Guest' }}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile Drawer -->
    <transition name="drawer">
      <div v-if="isMobileMenuOpen" class="lg:hidden fixed inset-0 z-[100] flex">
        <div
          class="absolute inset-0 bg-black/10 backdrop-blur-sm"
          @click="closeMobileMenu"
        ></div>
        <div
          class="relative w-80 h-full bg-accent/80 border-r border-white/10 p-6 flex flex-col shadow-2xl"
        >
          <div class="flex justify-between items-center mb-10">
            <span class="font-space font-bold text-xl text-white"
              >EduPro<span class="text-[var(--color-primary)]"> CRM</span></span
            >
            <button @click="closeMobileMenu" class="text-white/50">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <nav class="flex-1 overflow-y-auto space-y-6">
            <div v-for="group in navigation" :key="group.group">
              <p
                class="text-[10px] font-bold text-[var(--color-neutral)] uppercase tracking-widest mb-3 px-2"
              >
                {{ group.group }}
              </p>
              <div class="space-y-1">
                <router-link
                  v-for="link in group.links"
                  :key="link.routeKey || link.href"
                  :to="link.href"
                  @click="closeMobileMenu"
                  class="flex items-center gap-4 px-4 py-4 rounded-xl transition-all relative"
                  :class="{
                    'bg-[var(--color-primary)]/20 text-[var(--color-primary)]': route.path === link.href,
                    'text-[var(--color-neutral)] hover:bg-white/5': route.path !== link.href,
                  }"
                >
                  <i :class="link.icon"></i>
                  <span class="font-medium flex-1">{{ link.name }}</span>
                  
                  <!-- Notification Badge (mobile) -->
                  <span
                    v-if="link.badge"
                    class="px-2 py-0.5 text-[10px] font-bold bg-[var(--color-primary)] text-white rounded-full min-w-[20px] text-center"
                  >
                    {{ link.badge }}
                  </span>
                </router-link>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </transition>

    <!-- Main Content -->
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden bg-[var(--color-background)]">
      <!-- Header -->
      <header class="sticky top-0 z-30 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 px-6 py-3 backdrop-blur-xl">
        <div class="flex min-w-0 items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <button 
              @click="toggleSidebar" 
              class="hidden h-11 w-11 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] lg:inline-flex" 
              type="button"
            >
              <i class="fa-solid" :class="isSidebarOpen ? 'fa-indent' : 'fa-outdent'"></i>
            </button>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">{{ route.meta?.feature || 'Admin' }}</p>
              <h2 class="text-lg font-bold text-[var(--color-text)]">{{ route.meta?.title || route.name || 'Dashboard' }}</h2>
            </div>
          </div>

          <button
            @click="isMobileMenuOpen = true"
            class="lg:hidden w-10 h-10 flex items-center justify-center text-primary"
          >
            <i class="fas fa-bars-staggered text-xl"></i>
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="min-w-0 flex-1 overflow-y-auto custom-scrollbar p-6">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Animations */
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
.drawer-enter-to,
.drawer-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}
</style>