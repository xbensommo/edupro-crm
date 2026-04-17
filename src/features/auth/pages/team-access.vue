<template>
  <CrmPageShell title="Team Access" description="Invite staff, manage onboarding links, and suspend or restore system access.">
    <div class="space-y-6">
      <InviteStatsGrid :metrics="teamAccess.snapshot.metrics" />

      <div class="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <InviteCreateCard :loading="teamAccess.loading" @submit="handleCreateInvite" />
        <InviteTableCard
          v-model:activeTab="activeInviteTab"
          :items="visibleInvites"
          @copy="handleCopyInvite"
          @extend="handleExtendInvite"
          @revoke="handleRevokeInvite"
          @recreate="handleRecreateInvite"
        />
      </div>

      <UserAccessTableCard
        :users="teamAccess.snapshot.users"
        @suspend="openSuspendModal"
        @reactivate="handleReactivateUser"
      />
    </div>

    <SuspendUserModal
      :open="suspendModalOpen"
      :user="selectedUser"
      @close="closeSuspendModal"
      @confirm="handleSuspendConfirm"
    />
  </CrmPageShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useAppStore } from '@app/stores/appStore/index.js'
import CrmPageShell from '../components/CrmPageShell.vue'
import InviteCreateCard from '../components/InviteCreateCard.vue'
import InviteStatsGrid from '../components/InviteStatsGrid.vue'
import InviteTableCard from '../components/InviteTableCard.vue'
import SuspendUserModal from '../components/SuspendUserModal.vue'
import UserAccessTableCard from '../components/UserAccessTableCard.vue'
import { useTeamAccessStore } from '../stores/useTeamAccessStore.js'
import createInviteAccessService from '../services/createInviteAccessService.js'

const appStore = useAppStore()
const teamAccess = useTeamAccessStore()
const activeInviteTab = ref('pending')
const suspendModalOpen = ref(false)
const selectedUser = ref(null)

const inviteService = createInviteAccessService(appStore)

// const visibleInvites = computed(() => teamAccess.snapshot.invites.filter((invite) => invite.status === activeInviteTab.value))

const visibleInvites = computed(() => appStore.user_invites.items)

console.trace(visibleInvites.value)

async function refresh() {
  try {
    await teamAccess.load(inviteService)
  } catch (error) {
    toast.error('Unable to load team access.', {
      description: error?.message || 'Please try again.',
    })
  }
}

async function handleCreateInvite(payload) {
  try {
    const created = await teamAccess.createInvite(inviteService, payload)
    if (payload.copyAfterCreate && created?.inviteUrl) {
      await navigator.clipboard.writeText(created.inviteUrl).catch(() => undefined)
      toast.success('Invite created and link copied.')
    } else {
      toast.success('Invite created successfully.')
    }
  } catch (error) {
    toast.error('Unable to create invite.', {
      description: error?.message || 'Please check the form and try again.',
    })
  }
}

async function handleCopyInvite(invite) {
  if (!invite?.inviteUrl) return
  await navigator.clipboard.writeText(invite.inviteUrl).catch(() => undefined)
  toast.success('Invite link copied.')
}

async function handleExtendInvite(invite) {
  const next = new Date(invite.expiresAt || Date.now())
  next.setDate(next.getDate() + 7)

  try {
    await teamAccess.extendInvite(appStore, invite.id, next)
    toast.success('Invite extended by 7 days.')
  } catch (error) {
    toast.error('Unable to extend invite.', {
      description: error?.message || 'Please try again.',
    })
  }
}

async function handleRevokeInvite(invite) {
  try {
    await teamAccess.revokeInvite(appStore, invite.id)
    toast.success('Invite revoked.')
  } catch (error) {
    toast.error('Unable to revoke invite.', {
      description: error?.message || 'Please try again.',
    })
  }
}

async function handleRecreateInvite(invite) {
  await handleCreateInvite({
    email: invite.email,
    firstName: invite.firstName,
    lastName: invite.lastName,
    role: invite.role,
    department: invite.department,
    jobTitle: invite.jobTitle,
    note: invite.note,
    expiryPreset: '72h',
    copyAfterCreate: true,
  })
}

function openSuspendModal(user) {
  selectedUser.value = user
  suspendModalOpen.value = true
}

function closeSuspendModal() {
  suspendModalOpen.value = false
  selectedUser.value = null
}

async function handleSuspendConfirm(reason) {
  if (!selectedUser.value) return

  try {
    await teamAccess.suspendUser(appStore, selectedUser.value.id || selectedUser.value.uid, reason)
    toast.success('User suspended successfully.')
    closeSuspendModal()
  } catch (error) {
    toast.error('Unable to suspend user.', {
      description: error?.message || 'Please try again.',
    })
  }
}

async function handleReactivateUser(user) {
  try {
    await teamAccess.reactivateUser(appStore, user.id || user.uid)
    toast.success('User reactivated successfully.')
  } catch (error) {
    toast.error('Unable to reactivate user.', {
      description: error?.message || 'Please try again.',
    })
  }
}

onMounted(refresh)
</script>
