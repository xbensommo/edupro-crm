/**
 * @file src/core/plugins/action-plugin.js
 * @description Vue plugin installer for Totistack action pipeline.
 */

import { createConfirmGateway } from '../actions/create-confirm-gateway.js';
import { createModalConfirmAdapter } from '../actions/create-modal-confirm-adapter.js';
import { createActionExecutor } from '../actions/create-action-executor.js';
import { createConfirmModalStore } from '../actions/confirm-modal.store.js';

/**
 * Injection key for the shared action executor.
 * @type {string}
 */
export const ACTION_EXECUTOR_KEY = 'totistack:action-executor';

/**
 * Injection key for the shared confirm modal store.
 * @type {string}
 */
export const CONFIRM_MODAL_STORE_KEY = 'edupro_confirmationsk_xxx';

/**
 * Install the Totistack action pipeline.
 *
 * @param {import('vue').App} app
 * @param {{
 *   actions?: Array<Record<string, any>>,
 *   onEvent?: Function,
 *   normalizeError?: Function,
 * }} [options]
 * @returns {{ executor: ReturnType<typeof createActionExecutor>, confirmModalStore: ReturnType<typeof createConfirmModalStore> }}
 */
export function installActionPipeline(app, options = {}) {
  const confirmModalStore = createConfirmModalStore();
  const confirmGateway = createConfirmGateway(
    createModalConfirmAdapter(confirmModalStore),
  );

  const executor = createActionExecutor({
    confirmGateway,
    onEvent: options.onEvent,
    normalizeError: options.normalizeError,
  });

  if (Array.isArray(options.actions) && options.actions.length > 0) {
    executor.registerMany(options.actions);
  }

  app.provide(ACTION_EXECUTOR_KEY, executor);
  app.provide(CONFIRM_MODAL_STORE_KEY, confirmModalStore);
  app.config.globalProperties.$actions = executor;
  app.config.globalProperties.$confirmModal = confirmModalStore;

  return { executor, confirmModalStore };
}
