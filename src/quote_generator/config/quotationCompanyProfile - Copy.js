/**
 * @file src/config/quotationCompanyProfile.js
 * @description Company identity used by the reusable quotation PDF generator.
 */

import logoUrl from '@/assets/images/logo.png'

export const quotationCompanyProfile = {
  name: 'EduPro LIC',
  legalName: 'EduPro Learning & Innovation Center Cc',
  tagline: 'Trusted Academic Support',
  email: 'info@eduprolic.com',
  phone: '+264 81 448 9950',
  website: 'www.eduprolic.com',
  addressLines: [
    'Windhoek',
    'Namibia',
  ],
  taxNumber: '',
  registrationNumber: '',

  bankingDetails: {
    bankName: 'First National Bank',
    accountName: 'Edupro Learning & Inno',
    accountNumber: '64286054736',
    branchCode: '281173',
    accountType: 'Current',
    referenceNote: 'Use your fullname as reference',
  },
}
