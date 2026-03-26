'use client'

/**
 * Orchestration hook: registers global online/offline listeners and a
 * 30-second polling interval so pending edits are synced automatically
 * whenever connectivity is restored.
 *
 * Mount this hook ONCE at the layout level via <OfflineSyncMount />.
 * Individual components (e.g. Banner) should use useSyncTrigger directly
 * for manual retries – no listener duplication.
 */

import { useEffect } from 'react'
import { useNetworkStatus } from './use-network-status'
import { useSyncTrigger } from './use-sync-trigger'
import { getAllPendingEdits } from '@/lib/offline-storage'

export const useOfflineSync = () => {
  const { pendingPageIds, setOnline, setSyncStatus, addPendingPage } = useNetworkStatus()
  const { syncAllPending } = useSyncTrigger()

  // ── Initialise ──────────────────────────────────────────────────────────────
  // On first mount, hydrate the Zustand store from IndexedDB so the Banner
  // reflects any drafts left over from a previous session.
  useEffect(() => {
    const init = async () => {
      const pending = await getAllPendingEdits()
      pending.forEach((edit) => addPendingPage(edit.pageId))
      if (navigator.onLine && pending.length > 0) {
        await syncAllPending()
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount

  // ── Online / offline events ──────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true)
      syncAllPending()
    }

    const handleOffline = () => {
      setOnline(false)
      setSyncStatus('idle') // clear any previous syncing/failed state
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnline, setSyncStatus, syncAllPending])

  // ── Polling (handles partial / intermittent connectivity) ────────────────
  // navigator.onLine can be true even when the server is unreachable.
  // Every 30 s, if the browser thinks we're online and there are pending
  // edits, attempt a sync.
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine && pendingPageIds.length > 0) {
        syncAllPending()
      }
    }, 30_000)

    return () => clearInterval(interval)
  }, [pendingPageIds.length, syncAllPending])
}
