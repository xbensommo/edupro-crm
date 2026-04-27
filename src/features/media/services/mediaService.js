/**
 * @file media/services/mediaService.js
 * @description EduProLIC system file service with audit-friendly metadata and notifications.
 */
import { useAppStore } from '@app/stores/appStore'
import {
  assertAccess,
  createId,
  createLegacyService,
  fetchCollectionItems,
  getCollectionActions,
  normalizeError,
  runAction,
  slugify,
} from '../../shared/featureToolkit.js'

export function createMediaService({ appStore, access, config = {} } = {}) {
  const store = appStore || useAppStore()
  const featureAccess = access || store?.access || null
  const fileActions = getCollectionActions(store, 'mediaFiles')
  const folderActions = getCollectionActions(store, 'mediaFolders')
  const notificationActions = getCollectionActions(store, 'notifications')
  const settings = {
    maxFileSize: 25 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg','image/png','image/webp','application/pdf','text/plain',
      'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    ...config,
  }

  function getCurrentUser() {
    return store?.currentUser || {}
  }

  function getCurrentUserName() {
    const user = getCurrentUser()
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.displayName || user?.email || 'Unknown user'
  }

  async function notify(payload = {}) {
    if (!notificationActions) return null
    const targetUserId = String(payload.user_id  || '').trim()
    if (!targetUserId) return null
    const now = new Date().toISOString()
    const record = {
      user_id: targetUserId,
      title: payload.title || 'System file update',
      message: payload.message || '',
      event: payload.event || 'media.file_event',
      type: payload.type || 'info',
      domain: 'media',
      sourceModule: 'media',
      channel: 'in_app',
      status: 'unread',
      priority: payload.priority || 'low',
      actionUrl: payload.actionUrl || '/system/files',
      actionLabel: payload.actionLabel || 'Open system files',
      isActionRequired: Boolean(payload.isActionRequired),
      entityType: payload.entityType || 'media_file',
      entityId: payload.entityId || '',
      entityLabel: payload.entityLabel || '',
      roleScope: payload.roleScope || '',
      actorId: getCurrentUser()?.uid || '',
      actorName: getCurrentUserName(),
      meta: payload.meta || {},
      createdAt: now,
      updatedAt: now,
    }
    return runAction(notificationActions, ['add', 'create'], record)
  }

  async function listFiles(options = {}) {
    return fetchCollectionItems(store, 'mediaFiles', options)
  }

  async function listFolders(options = {}) {
    return fetchCollectionItems(store, 'mediaFolders', options)
  }

  async function createFolder(payload) {
    try {
      assertAccess(featureAccess, 'media.manage', 'You are not allowed to create system file folders.')
      const folderId = createId('folder')
      const now = new Date().toISOString()
      const record = {
        name: payload.name?.trim() || 'Untitled folder',
        slug: payload.slug?.trim() || slugify(payload.name || 'untitled-folder'),
        parentId: payload.parentId || '',
        visibility: payload.visibility || 'private',
        description: payload.description || '',
        createdAt: now,
        updatedAt: now,
      }
      await runAction(folderActions, ['setById', 'create', 'add'], folderId, record)
      return { id: folderId, ...record }
    } catch (error) {
      throw normalizeError(error, 'Unable to create the folder.')
    }
  }

  async function saveFile(payload) {
    try {
      assertAccess(featureAccess, 'media.manage', 'You are not allowed to manage system files.')
      if (payload.size && payload.size > settings.maxFileSize) throw new Error(`File exceeds the configured limit of ${settings.maxFileSize} bytes.`)
      if (payload.mimeType && !settings.allowedMimeTypes.includes(payload.mimeType)) throw new Error(`Unsupported file type: ${payload.mimeType}`)
      const fileId = payload.id || createId('media')
      const now = new Date().toISOString()
      const user = getCurrentUser()
      const record = {
        folderId: payload.folderId || '',
        name: payload.name?.trim() || payload.originalName || 'Untitled asset',
        originalName: payload.originalName || payload.name || 'file',
        mimeType: payload.mimeType || 'application/octet-stream',
        extension: payload.extension || '',
        size: payload.size || 0,
        storagePath: payload.storagePath || '',
        publicUrl: payload.publicUrl || '',
        altText: payload.altText || '',
        tags: payload.tags || [],
        metadata: payload.metadata || {},
        visibility: payload.visibility || 'internal',
        sourceModule: payload.sourceModule || 'media',
        clientId: payload.clientId || '',
        engagementId: payload.engagementId || '',
        uploadedBy: user?.uid || '',
        uploadedByName: getCurrentUserName(),
        uploadedByRole: user?.role || '',
        lastAction: payload.id ? 'updated' : 'uploaded',
        lastActionAt: now,
        lastActionBy: user?.uid || '',
        lastActionByName: getCurrentUserName(),
        downloadCount: payload.downloadCount || 0,
        updatedAt: now,
      }
      if (!record.storagePath) throw new Error('A storage path is required for file records.')
      if (payload.id) {
        await runAction(fileActions, ['update'], fileId, record)
      } else {
        await runAction(fileActions, ['setById', 'create', 'add'], fileId, { ...record, createdAt: now })
      }
      await notify({
        user_id : user?.uid,
        title: payload.id ? 'System file updated' : 'System file uploaded',
        message: `${record.name} was ${payload.id ? 'updated' : 'uploaded'} successfully.`,
        event: payload.id ? 'media.file_updated' : 'media.file_uploaded',
        type: 'success',
        entityId: fileId,
        entityLabel: record.name,
      })
      return { id: fileId, ...record }
    } catch (error) {
      throw normalizeError(error, 'Unable to save the file.')
    }
  }

  async function removeFile(fileId) {
    try {
      assertAccess(featureAccess, 'media.manage', 'You are not allowed to delete system files.')
      await runAction(fileActions, ['remove', 'delete'], fileId)
      return true
    } catch (error) {
      throw normalizeError(error, 'Unable to remove the file.')
    }
  }

  async function recordDownload(file) {
    try {
      assertAccess(featureAccess, 'media.view', 'You are not allowed to access system files.')
      const fileId = file?.id || ''
      if (!fileId) throw new Error('A file id is required to record a download.')
      const user = getCurrentUser()
      const nextCount = Number(file?.downloadCount || 0) + 1
      await runAction(fileActions, ['update'], fileId, {
        downloadCount: nextCount,
        lastDownloadedAt: new Date().toISOString(),
        lastDownloadedBy: user?.uid || '',
        lastDownloadedByName: getCurrentUserName(),
        lastAction: 'downloaded',
        lastActionAt: new Date().toISOString(),
        lastActionBy: user?.uid || '',
        lastActionByName: getCurrentUserName(),
      })
      await notify({
        user_id : user?.uid,
        title: 'System file downloaded',
        message: `${file?.name || 'A file'} was downloaded.`,
        event: 'media.file_downloaded',
        type: 'info',
        entityId: fileId,
        entityLabel: file?.name || '',
      })
      return true
    } catch (error) {
      throw normalizeError(error, 'Unable to record the download.')
    }
  }

  return { settings, listFiles, listFolders, createFolder, saveFile, removeFile, recordDownload }
}

const legacyService = createLegacyService(() => createMediaService({ appStore: useAppStore() }))
export default legacyService
