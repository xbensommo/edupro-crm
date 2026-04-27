# Reusable Quotation PDF Generator

Project-neutral quotation PDF generator for Vue/Vite apps.

It is the quotation equivalent of the invoice generator, but it does **not** behave like an invoice. It uses quotation-specific wording: quotation number, quote date, valid-until date, estimated total, deposit required, terms, and acceptance block.

## Install

```bash
npm i pdfmake
```

## Files

```txt
src/config/quotationCompanyProfile.js
src/services/quotationPdfEngine.js
src/mappers/genericQuotationMapper.js
src/mappers/totisoftProjectQuotationMapper.js
src/components/QuotationDownloadButton.vue
```

## Logo

Configured by default:

```js
import logoUrl from '@/assets/images/logo.png'
```

Edit `src/config/quotationCompanyProfile.js` per project.

## Canonical quotation shape

```js
const quotation = {
  quoteCode: 'QT-001',
  status: 'draft',
  quoteDate: '2026-04-27',
  validUntil: '2026-05-04',

  client: {
    name: 'Client Name',
    number: 'CL-001',
    email: 'client@email.com',
    phone: '+264...',
    addressLines: ['Windhoek', 'Namibia'],
  },

  reference: {
    label: 'Project',
    value: 'Website Development',
  },

  lineItems: [
    {
      description: 'Website design and development',
      quantity: 1,
      unitPrice: 4500,
    },
  ],

  currency: 'NAD',
  discountAmount: 0,
  depositAmount: 2250,
  notes: 'Scope covers the listed deliverables only.',
  terms: [
    'Quotation is valid until the validity date shown above.',
    'Work starts after written approval and agreed payment confirmation.',
  ],
  showAcceptance: true,
}
```

## Direct use

```js
import { downloadQuotationPdf } from '@/services/quotationPdfEngine.js'

await downloadQuotationPdf(quotation)
```

## Mapper use

```js
import { downloadQuotationPdf } from '@/services/quotationPdfEngine.js'
import { mapTotisoftProjectToQuotation } from '@/mappers/totisoftProjectQuotationMapper.js'

await downloadQuotationPdf(mapTotisoftProjectToQuotation(project))
```

## Vue button use

```vue
<QuotationDownloadButton :quotation="quotation" />
```

## What to edit per project

```txt
src/config/quotationCompanyProfile.js
src/mappers/<project>QuotationMapper.js
```

Do not rewrite `quotationPdfEngine.js` for every project. The engine should stay stable.
