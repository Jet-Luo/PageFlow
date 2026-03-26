'use client'

import { useOfflineSync } from '@/hooks/use-offline-sync'

/**
 * Thin wrapper that mounts the offline-sync hook at layout level.
 * This ensures event listeners and polling run globally – not just for the
 * currently visible page – so all pending drafts get synced when connectivity
 * is restored, regardless of which page the user happens to have open.
 */
export const OfflineSyncMount = () => {
  useOfflineSync()
  return null
}
