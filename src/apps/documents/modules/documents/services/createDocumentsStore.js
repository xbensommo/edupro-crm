/** @file src/modules/documents/services/createDocumentsStore.js */
import { FireShardProvider, createShardedActions } from '@xbensommo/shard-provider';
export function createDocumentsStore({ db, state = {} }) {
  const provider = new FireShardProvider({ db, nonShardedCollections: ['document_templates', 'document_sequences'], onError(error) { console.error('[documents-store]', error); } });
  return { provider, documents: createShardedActions('documents', state, provider), auditLogs: createShardedActions('document_audit_logs', state, provider), templates: createShardedActions('document_templates', state, provider), sequences: createShardedActions('document_sequences', state, provider) };
}
