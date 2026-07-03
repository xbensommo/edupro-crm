/**
 * @file media/routes.js
 * @description Route records contributed by the media feature.
 */
export default [
  {
    path: '/system/files',
    name: 'MediaLibrary',
    component: () => import('./pages/MediaLibraryPage.vue'),
    meta: {
      requiresAuth: true,
      roles: ['admin', 'receptionist', 'consultant', 'consultant_editor', 'sysadmin'],
      feature: 'media',
      permissions: ['media.view'],
      hideInNav: true,
      title: 'System files',
    },
  },
  {
    path: '/system/files/upload',
    name: 'MediaUpload',
    component: () => import('./pages/MediaUploadPage.vue'),
    meta: {
      requiresAuth: true,
      hideInNav: true,
      roles: ['admin', 'receptionist', 'consultant', 'consultant_editor', 'sysadmin'],
      feature: 'media',
      permissions: ['media.manage'],
      title: 'Upload system files',
    },
  },
]
