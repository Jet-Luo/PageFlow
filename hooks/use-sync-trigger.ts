'use client'

/**
 * Core sync logic: reads all pending edits from IndexedDB and pushes them
 * to Convex.  This hook is intentionally lightweight – it only contains the
 * sync function and can be consumed by any component (e.g. the retry button
 * in Banner) without re-registering global event listeners.
 *
 * A module-level mutex flag (`isSyncing`) guarantees at most one concurrent
 * sync run even if the function is triggered from multiple places at once
 * (e.g. the `online` event + the retry button).
 */

import { useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { toast } from 'sonner'
import { useNetworkStatus } from './use-network-status'
import { getAllPendingEdits, deletePendingEdit } from '@/lib/offline-storage'

// Prevents concurrent sync runs regardless of which component calls syncAllPending
let isSyncing = false

export const useSyncTrigger = () => {
  const { setSyncStatus, removePendingPage } = useNetworkStatus()
  const update = useMutation(api.pages.updatePage)

  const syncAllPending = useCallback(async () => {
    if (isSyncing) return
    isSyncing = true

    try {
      const pending = await getAllPendingEdits()
      if (pending.length === 0) return

      setSyncStatus('syncing')

      const results = await Promise.allSettled(
        pending.map(async (edit) => {
          await update({ id: edit.pageId as Id<'pages'>, content: edit.content })
          // Only clear the local draft after the server confirms the write
          await deletePendingEdit(edit.pageId)
          removePendingPage(edit.pageId)
        })
      )

      const hasFailures = results.some((r) => r.status === 'rejected')

      if (!hasFailures) {
        setSyncStatus('success')
        toast.success('All changes have been synced to the cloud.')
        // Reset to idle after a brief moment so the banner can disappear gracefully
        setTimeout(() => setSyncStatus('idle'), 3000)
      } else {
        setSyncStatus('failed')
      }
    } finally {
      isSyncing = false
    }
  }, [update, setSyncStatus, removePendingPage])

  return { syncAllPending }
}
