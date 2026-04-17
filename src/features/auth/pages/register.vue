<template>
  <AuthCard
    eyebrow="Invitation required"
    title="Registration is by invitation only"
    description="Open sign-up has been disabled. Ask an administrator or receptionist to send you an access link."
  >
    <div class="space-y-5">
      <div class="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-5 text-sm text-muted">
        Invited team members should open the exact access link sent to them. That link carries the token required to activate an account.
      </div>

      <RouterLink class="btn-primary inline-flex w-full justify-center" to="/auth">
        Return to sign in
      </RouterLink>
    </div>
  </AuthCard>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import AuthCard from '../components/AuthCard.vue'
</script>
