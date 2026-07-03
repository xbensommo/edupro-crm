<template>
  <AccessLayoutShell>
    <AuthCard
      v-if="state === 'loading'"
      eyebrow="Checking invitation"
      title="Checking your invitation"
      description="Please wait while we validate your access link."
    >
      <div class="space-y-4">
        <div class="h-2 w-full overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
          <div class="h-full w-1/2 animate-pulse rounded-full bg-[var(--color-primary)]" />
        </div>
        <p class="text-sm text-soft">Invitation security check in progress.</p>
      </div>
    </AuthCard>

    <AuthCard
      v-else-if="state === 'invalid'"
      eyebrow="Invitation unavailable"
      title="This invitation cannot be used"
      :description="invalidMessage"
    >
      <div class="space-y-4">
        <RouterLink class="btn-primary inline-flex w-full justify-center" to="/auth">Return to sign in</RouterLink>
      </div>
    </AuthCard>

    <AuthCard
      v-else
      eyebrow="Accept invitation"
      title="Activate your team account"
      description="Your access was prepared by an administrator. Finish setup to enter the system."
    >
      <form class="space-y-5" @submit.prevent="handleSubmit">
        <div class="grid gap-5 sm:grid-cols-2">
          <AuthField v-model="form.firstName" label="First name" autocomplete="given-name" placeholder="John" :error="errors.firstName" />
          <AuthField v-model="form.lastName" label="Last name" autocomplete="family-name" placeholder="Doe" :error="errors.lastName" />
        </div>

        <AuthField :model-value="invite.email" label="Invited email" type="email" autocomplete="email" disabled />

        <div class="grid gap-5 sm:grid-cols-2">
          <AuthField :model-value="invite.role || 'user'" label="Assigned role" disabled />
          <AuthField :model-value="invite.department || 'Not specified'" label="Department" disabled />
        </div>

        <AuthField v-model="form.password" label="Password" type="password" autocomplete="new-password" placeholder="Minimum 8 characters" :error="errors.password" />
        <AuthField v-model="form.confirmPassword" label="Confirm password" type="password" autocomplete="new-password" placeholder="Repeat your password" :error="errors.confirmPassword" />

        <label class="option-card items-start">
          <input v-model="form.acceptTerms" type="checkbox" class="mt-1 h-4 w-4 rounded border-theme text-[var(--color-primary)]" />
          <span>I accept the platform terms and privacy policy.</span>
        </label>
        <p v-if="errors.acceptTerms" class="field-error">{{ errors.acceptTerms }}</p>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Activating account...' : 'Activate account' }}
        </button>

        <p class="text-sm text-soft">
          Already have an account?
          <RouterLink class="font-semibold text-primary transition hover:opacity-80" to="/auth">Sign in</RouterLink>
        </p>
      </form>
    </AuthCard>
  </AccessLayoutShell>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import accessConfig from '@config/access.config.js'
import { useAppStore } from '@app/stores/appStore/index.js'
import AccessLayoutShell from '../components/AccessLayoutShell.vue'
import AuthCard from '../components/AuthCard.vue'
import AuthField from '../components/AuthField.vue'
import { useTeamAccessStore } from '../stores/useTeamAccessStore.js'
import createInviteAccessService from '../services/createInviteAccessService.js'

const teamStore = useTeamAccessStore();
const route = useRoute()
const router = useRouter()
const store = useAppStore()
const loading = ref(false)
const state = ref('loading')
const invalidMessage = ref('This invitation is invalid or expired.')
const invite = ref({})
const errors = ref({})
const form = reactive({
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
})
const inviteService = createInviteAccessService(store);

function validate() {
  const nextErrors = {}
  if (!form.firstName) nextErrors.firstName = 'First name is required.'
  if (!form.lastName) nextErrors.lastName = 'Last name is required.'
  if (!form.password || form.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.'
  if (form.confirmPassword !== form.password) nextErrors.confirmPassword = 'Passwords do not match.'
  if (!form.acceptTerms) nextErrors.acceptTerms = 'You must accept the terms to continue.'
  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

async function loadInvite() {
  const token = String(route.query.token || '')

  if (!token) {
    state.value = 'invalid'
    invalidMessage.value = 'No invitation token was provided.'
    return
  }

  try {
    const resolved = await inviteService.validateInviteToken(token)
    invite.value = resolved.data
    form.firstName = resolved.data.firstName || ''
    form.lastName = resolved.data.lastName || ''
    state.value = 'ready'
  } catch (error) {
    state.value = 'invalid'
    invalidMessage.value = error?.message || 'This invitation is invalid or expired.'
  }
}

async function handleSubmit() {
  if (!validate()) return

  loading.value = true
  try {
    await inviteService.acceptInviteRegistration({
      token: String(route.query.token || ''),
      password: form.password,
      profileData: {
        firstName: form.firstName,
        lastName: form.lastName,
        displayName: `${form.firstName} ${form.lastName}`.trim(),
      },
    })

    toast.success('Account activated successfully.')
    router.push(accessConfig.routes.defaultAuthenticated || '/a')
  } catch (error) {
    toast.error('Unable to activate account.', {
      description: error?.message || 'Please review the form and try again.',
    })
  } finally {
    loading.value = false
  }
}

onMounted(loadInvite)
</script>
