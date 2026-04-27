/**
 * @file src/apps/finance/services/financeConfirmAdapter.js
 * @description Bridges finance commands to the host Totistack action modal without hard-coding one store API.
 */

function normalizeResult(result) {
  if (typeof result === 'boolean') return result
  if (result?.status === 'confirmed') return true
  if (result?.confirmed === true) return true
  if (result?.accepted === true) return true
  return false
}

function normalizePayload(payload = {}) {
  return {
    title: payload.title || 'Confirm finance action',
    message: payload.message || 'This finance action requires confirmation.',
    description: payload.description || payload.message || '',
    confirmText: payload.confirmText || 'Confirm',
    cancelText: payload.cancelText || 'Cancel',
    tone: payload.tone || 'danger',
    domain: 'finance',
    module: 'finance',
    meta: payload.meta || {},
  }
}

async function callCandidate(candidate, payload) {
  if (typeof candidate !== 'function') return null
  const result = await candidate(payload)
  return normalizeResult(result)
}

export function createFinanceConfirmHandler(hostStore = null) {
  return async function confirmFinanceAction(payload = {}) {
    const normalized = normalizePayload(payload)

    const candidates = [
      hostStore?.confirmAction,
      hostStore?.requestActionConfirmation,
      hostStore?.requestConfirmation,
      hostStore?.openConfirm,
      hostStore?.confirm,
      hostStore?.actionModal?.confirm,
      hostStore?.modals?.confirm,
    ]

    for (const candidate of candidates) {
      if (typeof candidate !== 'function') continue
      const accepted = await callCandidate(candidate.bind(hostStore), normalized)
      return accepted
    }

    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return window.confirm(`${normalized.title}\n\n${normalized.message}`)
    }

    return false
  }
}
