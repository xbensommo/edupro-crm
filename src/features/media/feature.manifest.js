/**
 * @file media/feature.manifest.js
 * @description Declarative manifest for the Totistack media feature.
 */
export default {
  id: 'media',
  type: 'feature',
  name: 'Media',
  version: '3.1.0',
  description: 'EduProLIC system file library with upload, download, and audit-ready metadata.',
  dependencies: {
    features: ['auth', 'rbac', 'notifications'],
    apps: [],
  },
  collections: ['mediaFiles', 'mediaFolders'],
  services: ['mediaService'],
  routes: ['./routes.js'],
}
