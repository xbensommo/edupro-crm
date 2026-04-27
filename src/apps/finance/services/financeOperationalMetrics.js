/**
 * @file src/apps/finance/services/financeOperationalMetrics.js
 * @description EduProLIC operational finance metrics built from real finance collections.
 */

function numeric(value) {
  return Number(value || 0)
}

function sum(items, pick) {
  return Number(items.reduce((total, item) => total + numeric(pick(item)), 0).toFixed(2))
}

function notCancelled(record) {
  return !['cancelled', 'reversed', 'deleted'].includes(String(record?.status || '').toLowerCase())
}

export function buildWorkFinanceMetrics({ transactions = [], payments = [], refunds = [], expenses = [], consultantPayouts = [], invoices = [], paymentAllocations = [] }) {
  const cleanTransactions = transactions.filter(notCancelled)
  const cleanPayments = payments.filter(notCancelled)
  const cleanRefunds = refunds.filter(notCancelled)
  const cleanExpenses = expenses.filter(notCancelled)
  const cleanPayouts = consultantPayouts.filter(notCancelled)
  const cleanInvoices = invoices.filter(notCancelled)
  const cleanAllocations = paymentAllocations.filter((item) => String(item?.status || 'active').toLowerCase() === 'active')

  const invoiceTotal = sum(cleanInvoices, (item) => item.totalAmount)
  const allocatedToInvoices = cleanAllocations.length
    ? sum(cleanAllocations, (item) => item.amount)
    : sum(cleanInvoices, (item) => item.allocatedAmount || item.paidAmount)
  const legacyQuoted = sum(cleanTransactions.filter((item) => item.type === 'work_revenue'), (item) => item.amount)
  const totalQuoted = invoiceTotal || legacyQuoted
  const totalReceived = sum(cleanPayments, (item) => item.amount)
  const totalRefunds = sum(cleanRefunds, (item) => item.amount)
  const netCollected = Number((totalReceived - totalRefunds).toFixed(2))
  const totalExpenses = sum(cleanExpenses, (item) => item.amount)
  const totalPayouts = sum(cleanPayouts, (item) => item.paidAmount || item.consultantShareAmount)
  const totalCommissionDue = sum(
    cleanTransactions.filter((item) => item.type === 'consultant_commission_accrual'),
    (item) => item.consultantShareAmount || item.amount,
  )
  const totalOutstanding = Number(Math.max(totalQuoted - allocatedToInvoices, 0).toFixed(2))

  return {
    totalQuoted,
    totalInvoiced: invoiceTotal,
    allocatedToInvoices,
    totalReceived,
    totalRefunds,
    netCollected,
    totalExpenses,
    totalPayouts,
    totalCommissionDue,
    totalOutstanding,
    unappliedCash: Number(Math.max(totalReceived - allocatedToInvoices - totalRefunds, 0).toFixed(2)),
    unpaidCommission: Number(Math.max(totalCommissionDue - totalPayouts, 0).toFixed(2)),
  }
}
