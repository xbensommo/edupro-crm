/**
 * @file crm/services.js
 * @description CRM service registry entry for Totistack generated assembly.
 */

import { createCrmService } from './services/crmService.js'

/**
 * Create CRM services from shared root infrastructure.
 *
 * @param {object} [_context]
 * @returns {{ crm: ReturnType<typeof createCrmService> }}
 */
export function createServices(_context) {
  return {
    crm: createCrmService(),
  }
}

export default createServices
