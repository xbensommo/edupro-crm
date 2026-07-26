/**
 * @file functions/financeAutoPost.js
 * @description Auto-post draft finance transactions.
 * Runs daily to post any draft transactions that are older than 1 day.
 */

const admin = require('firebase-admin')
const { FieldValue } = require('firebase-admin/firestore')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { FUNCTION_CONFIG } = require('./config.js')

const db = admin.firestore()

/**
 * Create a posted journal entry from a transaction.
 * Simplified version – uses the same logic as financePostingEngine.
 */
async function postTransaction(transactionId, transactionData) {
  const amount = Number(transactionData.amount || 0)
  const lines = []
  // const accountMap = {
  //   cash: 'cash',
  //   accounts_receivable: 'accounts_receivable',
  //   service_revenue: 'service_revenue',
  //   consultant_payable: 'consultant_payable',
  //   consultant_cost: 'consultant_cost',
  //   operating_expense: 'operating_expense',
  // }

  // Build ledger lines based on transaction type
  const type = transactionData.type || 'adjustment'
  switch (type) {
    case 'client_payment':
      lines.push(
        { accountId: 'cash', side: 'debit', amount, memo: 'Client payment' },
        { accountId: 'accounts_receivable', side: 'credit', amount, memo: 'Reduce receivable' }
      )
      break
    case 'refund':
      lines.push(
        { accountId: 'service_revenue', side: 'debit', amount, memo: 'Refund' },
        { accountId: 'cash', side: 'credit', amount, memo: 'Cash refund' }
      )
      break
    case 'consultant_payout':
      lines.push(
        { accountId: 'consultant_payable', side: 'debit', amount, memo: 'Payout' },
        { accountId: 'cash', side: 'credit', amount, memo: 'Cash payout' }
      )
      break
    case 'expense':
      lines.push(
        { accountId: 'operating_expense', side: 'debit', amount, memo: transactionData.memo || 'Expense' },
        { accountId: 'cash', side: 'credit', amount, memo: 'Cash expense' }
      )
      break
    case 'work_revenue':
    case 'invoice_revenue':
      lines.push(
        { accountId: 'accounts_receivable', side: 'debit', amount, memo: 'Revenue' },
        { accountId: 'service_revenue', side: 'credit', amount, memo: 'Revenue' }
      )
      break
    default:
      // Fallback: debit cash, credit revenue
      lines.push(
        { accountId: 'cash', side: 'debit', amount, memo: 'Default' },
        { accountId: 'service_revenue', side: 'credit', amount, memo: 'Default' }
      )
  }

  const totalDebit = lines.reduce((sum, l) => l.side === 'debit' ? sum + l.amount : sum, 0)
  const totalCredit = lines.reduce((sum, l) => l.side === 'credit' ? sum + l.amount : sum, 0)

  const journalEntry = {
    transactionId,
    transactionType: type,
    status: 'posted',
    memo: transactionData.memo || '',
    reference: transactionData.reference || '',
    currency: transactionData.currency || 'NAD',
    postedAt: FieldValue.serverTimestamp(),
    periodKey: new Date().toISOString().slice(0, 7),
    entityId: transactionData.clientId || null,
    lines,
    totalDebit,
    totalCredit,
    createdBy: 'auto-post',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    isDeleted: false,
  }

  const entryRef = await db.collection('finance_journal_entries').add(journalEntry)

  // Update transaction status
  await db.collection('finance_transactions').doc(transactionId).update({
    status: 'posted',
    postedAt: FieldValue.serverTimestamp(),
    postedBy: 'auto-post',
    isDeleted: false,
    postedJournalEntryId: entryRef.id,
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Also update linked records (payments, invoices, etc.) if needed
  // (simplified – you may want to extend)

  return entryRef.id
}

exports.autoPostDraftTransactions = onSchedule(
  {
    region: FUNCTION_CONFIG.region,
    memory: FUNCTION_CONFIG.memory,
    schedule: '0 2 * * *', // 2 AM daily
    timeZone: 'Africa/Windhoek',
    retry: true,
    retryCount: 3,
  },
  async (context) => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 1) // older than 1 day

    const snapshot = await db.collection('finance_transactions')
      .where('status', '==', 'draft')
      .where('createdAt', '<=', cutoff)
      .limit(50) // batch size
      .get()

    if (snapshot.empty) {
      console.log('[auto-post] No draft transactions to post.')
      return
    }

    let posted = 0
    for (const doc of snapshot.docs) {
      const data = doc.data()
      try {
        await postTransaction(doc.id, data)
        posted++
      } catch (error) {
        console.error(`[auto-post] Failed to post transaction ${doc.id} ${context}:`, error.message)
        // Log failure but continue
      }
    }

    console.log(`[auto-post] Posted ${posted} draft transactions.`)
  }
)