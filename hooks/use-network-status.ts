import { create } from 'zustand'

export type SyncStatus = 'idle' | 'syncing' | 'failed' | 'success'

interface NetworkStatusStore {
  /** Whether the browser believes it has network connectivity. */
  isOnline: boolean
  /** Current cloud sync status for pending edits. */
  syncStatus: SyncStatus
  /** Page IDs that have local draft changes not yet confirmed synced to Convex. */
  pendingPageIds: string[]

  setOnline: (online: boolean) => void
  setSyncStatus: (status: SyncStatus) => void
  addPendingPage: (pageId: string) => void
  removePendingPage: (pageId: string) => void
  hasPendingPage: (pageId: string) => boolean
}

export const useNetworkStatus = create<NetworkStatusStore>((set, get) => ({
  // Safe SSR default: assume online
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncStatus: 'idle',
  pendingPageIds: [],

  setOnline: (online) => set({ isOnline: online }),
  setSyncStatus: (status) => set({ syncStatus: status }),

  addPendingPage: (pageId) =>
    set((state) => ({
      pendingPageIds: state.pendingPageIds.includes(pageId)
        ? state.pendingPageIds
        : [...state.pendingPageIds, pageId]
    })),

  removePendingPage: (pageId) =>
    set((state) => ({
      pendingPageIds: state.pendingPageIds.filter((id) => id !== pageId)
    })),

  hasPendingPage: (pageId) => get().pendingPageIds.includes(pageId)
}))
