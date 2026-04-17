/**
 * @file src/apps/finance/services/createFinanceCommandBus.js
 * @description Command layer with confirm-gated finance actions.
 */

import {
  FINANCE_ACTIONS,
  requireFinance,
} from '../permissions/finance.permissions.js'
import { createPostedJournalEntry, createReversalJournalEntry } from './financePostingEngine.js'
import { FinanceError, invariant } from './financeErrors.js'

/**
 * @typedef {{
 *   getById: (id: string) => Promise<any>,
 *   add: (record: any) => Promise<any>,
 *   update: (id: string, patch: any) => Promise<any>,
 *   remove?: (id: string) => Promise<any>,
 * }} CrudRepository
 */

/**
 * @param {object} options
 * @param {{ transactions: CrudRepository, journalEntries: CrudRepository, periods?: CrudRepository }} options.repositories
 * @param {(context: { title: string, message: string, confirmText: string, tone?: string }) => Promise<boolean>} options.confirm
 * @param {() => ({ id?: string, roles?: string[] } | null)} options.getCurrentUser
 * @param {(args: { transaction: any, actor?: any }) => any} [options.postEntry]
 * @param {(args: { postedEntry: any, actor?: any, reason?: string }) => any} [options.reverseEntry]
 * @returns {{
 *   reviewTransaction: (transactionId: string) => Promise<any>,
 *   postTransaction: (transactionId: string) => Promise<any>,
 *   reverseJournalEntry: (entryId: string, reason?: string) => Promise<any>,
 *   deleteDraftTransaction: (transactionId: string) => Promise<any>,
 *   closePeriod: (periodId: string) => Promise<any>,
 * }}
 */
export function createFinanceCommandBus({
  repositories,
  confirm,
  getCurrentUser,
  postEntry = createPostedJournalEntry,
  reverseEntry = createReversalJournalEntry,
}) {
  invariant(typeof confirm === 'function', 'Finance confirm handler is required.', {
    code: 'FINANCE_CONFIRM_HANDLER_REQUIRED',
  })

  async function confirmOrReturn(payload) {
    const accepted = await confirm(payload)
    if (!accepted) return { status: 'cancelled' }
    return null
  }

  return {
    async reviewTransaction(transactionId) {
      const user = getCurrentUser()
      requireFinance(user, FINANCE_ACTIONS.TRANSACTION_REVIEW)

      const transaction = await repositories.transactions.getById(transactionId)
      invariant(transaction, 'Transaction not found.', {
        code: 'FINANCE_TRANSACTION_NOT_FOUND',
        meta: { transactionId },
      })
      invariant(transaction.status === 'draft', 'Only draft transactions can be reviewed.', {
        code: 'FINANCE_INVALID_TRANSACTION_STATE',
        meta: { status: transaction.status },
      })

      await repositories.transactions.update(transactionId, {
        status: 'reviewed',
        reviewedAt: new Date().toISOString(),
        reviewedBy: user?.id || null,
      })

      return { status: 'reviewed', transactionId }
    },

    async postTransaction(transactionId) {
      const user = getCurrentUser()
      requireFinance(user, FINANCE_ACTIONS.TRANSACTION_POST)

      const transaction = await repositories.transactions.getById(transactionId)
      invariant(transaction, 'Transaction not found.', {
        code: 'FINANCE_TRANSACTION_NOT_FOUND',
        meta: { transactionId },
      })
      invariant(
        ['draft', 'reviewed'].includes(transaction.status),
        'Only draft or reviewed transactions can be posted.',
        {
          code: 'FINANCE_INVALID_TRANSACTION_STATE',
          meta: { status: transaction.status },
        },
      )

      const cancelled = await confirmOrReturn({
        title: 'Post transaction',
        message: 'This will create a ledger entry and affect reports and balances.',
        confirmText: 'Post transaction',
        tone: 'danger',
      })
      if (cancelled) return cancelled

      const entry = postEntry({ transaction, actor: user })
      await repositories.journalEntries.add(entry)
      await repositories.transactions.update(transactionId, {
        status: 'posted',
        postedAt: entry.postedAt,
        postedBy: user?.id || null,
        postedJournalEntryId: entry.id,
      })

      return {
        status: 'posted',
        transactionId,
        journalEntryId: entry.id,
      }
    },

    async reverseJournalEntry(entryId, reason = 'Manual reversal') {
      const user = getCurrentUser()
      requireFinance(user, FINANCE_ACTIONS.JOURNAL_REVERSE)

      const postedEntry = await repositories.journalEntries.getById(entryId)
      invariant(postedEntry, 'Journal entry not found.', {
        code: 'FINANCE_JOURNAL_ENTRY_NOT_FOUND',
        meta: { entryId },
      })
      invariant(postedEntry.status === 'posted', 'Only posted entries can be reversed.', {
        code: 'FINANCE_INVALID_JOURNAL_STATE',
        meta: { status: postedEntry.status },
      })

      const cancelled = await confirmOrReturn({
        title: 'Reverse journal entry',
        message: 'This creates a reversal entry and keeps the audit trail intact.',
        confirmText: 'Reverse entry',
        tone: 'danger',
      })
      if (cancelled) return cancelled

      const reversal = reverseEntry({ postedEntry, actor: user, reason })
      await repositories.journalEntries.add(reversal)
      await repositories.journalEntries.update(entryId, {
        reversedEntryId: reversal.id,
      })
      await repositories.transactions.update(postedEntry.transactionId, {
        status: 'reversed',
        reversedAt: reversal.postedAt,
        reversalJournalEntryId: reversal.id,
      })

      return {
        status: 'reversed',
        entryId,
        reversalEntryId: reversal.id,
      }
    },

    async deleteDraftTransaction(transactionId) {
      const user = getCurrentUser()
      requireFinance(user, FINANCE_ACTIONS.TRANSACTION_DELETE_DRAFT)

      const transaction = await repositories.transactions.getById(transactionId)
      invariant(transaction, 'Transaction not found.', {
        code: 'FINANCE_TRANSACTION_NOT_FOUND',
        meta: { transactionId },
      })
      invariant(transaction.status === 'draft', 'Only draft transactions can be deleted.', {
        code: 'FINANCE_INVALID_TRANSACTION_STATE',
        meta: { status: transaction.status },
      })
      invariant(typeof repositories.transactions.remove === 'function', 'Draft delete repository method is missing.', {
        code: 'FINANCE_DELETE_METHOD_REQUIRED',
      })

      const cancelled = await confirmOrReturn({
        title: 'Delete draft transaction',
        message: 'This removes the draft before it reaches the ledger.',
        confirmText: 'Delete draft',
        tone: 'danger',
      })
      if (cancelled) return cancelled

      await repositories.transactions.remove(transactionId)
      return { status: 'deleted', transactionId }
    },

    async closePeriod(periodId) {
      const user = getCurrentUser()
      requireFinance(user, FINANCE_ACTIONS.PERIOD_CLOSE)
      invariant(repositories.periods, 'Periods repository is required to close a period.', {
        code: 'FINANCE_PERIODS_REPOSITORY_REQUIRED',
      })

      const period = await repositories.periods.getById(periodId)
      invariant(period, 'Period not found.', {
        code: 'FINANCE_PERIOD_NOT_FOUND',
        meta: { periodId },
      })
      invariant(period.status === 'open', 'Only open periods can be closed.', {
        code: 'FINANCE_INVALID_PERIOD_STATE',
        meta: { status: period.status },
      })

      const cancelled = await confirmOrReturn({
        title: 'Close accounting period',
        message: 'Closing a period locks operational posting for that range.',
        confirmText: 'Close period',
        tone: 'danger',
      })
      if (cancelled) return cancelled

      await repositories.periods.update(periodId, {
        status: 'closed',
        closedAt: new Date().toISOString(),
        closedBy: user?.id || null,
      })

      return { status: 'closed', periodId }
    },
  }
}
