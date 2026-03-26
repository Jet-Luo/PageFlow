/**
 * IndexedDB wrapper for offline content draft storage.
 *
 * Strategy: "Write locally first, sync to cloud second"
 * - Before attempting a Convex sync, always persist content here first.
 * - On successful Convex sync, delete the local draft.
 * - On page load, check if a local draft exists and prefer it over Convex
 *   content (since it represents unsaved changes from the last session).
 */

const DB_NAME = 'pageflow-offline'
const STORE_NAME = 'pending-edits'
const DB_VERSION = 1

export interface PendingEdit {
  pageId: string
  content: string
  timestamp: number
}

// Singleton DB promise – avoids re-opening on every call
let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'pageId' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      dbPromise = null // allow retry on next call
      reject(request.error)
    }
  })

  return dbPromise
}

/** Save (or overwrite) the pending edit for a page. */
export async function savePendingEdit(pageId: string, content: string): Promise<void> {
  try {
    const db = await getDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put({ pageId, content, timestamp: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('[PageFlow] savePendingEdit failed:', e)
  }
}

/** Retrieve the pending edit for a specific page, or undefined if none. */
export async function getPendingEdit(pageId: string): Promise<PendingEdit | undefined> {
  try {
    const db = await getDB()
    return await new Promise<PendingEdit | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(pageId)
      req.onsuccess = () => resolve(req.result as PendingEdit | undefined)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return undefined
  }
}

/** Retrieve all pending edits (used for bulk sync). */
export async function getAllPendingEdits(): Promise<PendingEdit[]> {
  try {
    const db = await getDB()
    return await new Promise<PendingEdit[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve(req.result as PendingEdit[])
      req.onerror = () => reject(req.error)
    })
  } catch {
    return []
  }
}

/** Remove the pending edit for a page after a successful sync. */
export async function deletePendingEdit(pageId: string): Promise<void> {
  try {
    const db = await getDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(pageId)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('[PageFlow] deletePendingEdit failed:', e)
  }
}
