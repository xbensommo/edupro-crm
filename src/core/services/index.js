/**
 * @file src/core/services/index.js
 * @description Barrel exports for shared Totistack service-layer utilities.
 */

export * from './audit/audit.fields.js'
export * from './collections/createCollectionAdapter.js'
export * from './context/createServiceContext.js'
export * from './errors/ServiceError.js'
export * from './errors/normalizeServiceError.js'
export * from './hooks/createActivityLogger.js'
export * from './hooks/withActivityLog.js'
export * from './ids/id.generators.js'
export * from './normalizers/value.normalizers.js'
export * from './helpers/help.js'
