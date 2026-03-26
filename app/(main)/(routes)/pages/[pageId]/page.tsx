'use client'

import { use, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Toolbar } from '@/components/toolbar'
import { Cover } from '@/components/cover'
import { Skeleton } from '@/components/ui/skeleton'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { savePendingEdit, getPendingEdit, deletePendingEdit } from '@/lib/offline-storage'

interface PageIdPageProps {
  params: Promise<{
    pageId: Id<'pages'>
  }>
}

const PageIdPage = ({ params }: PageIdPageProps) => {
  const id = use(params).pageId
  const page = useQuery(api.pages.getPageById, { id })
  const update = useMutation(api.pages.updatePage)

  const { addPendingPage, removePendingPage } = useNetworkStatus()

  // Track the resolved initial content: undefined = not checked yet, null = no local draft
  const [localDraftContent, setLocalDraftContent] = useState<string | null | undefined>(undefined)

  const Editor = useMemo(() => dynamic(() => import('@/components/editor'), { ssr: false }), [])

  // ── Draft restore ──────────────────────────────────────────────────────────
  // On mount, check IndexedDB for an unsynced draft from a previous session.
  // If found, prefer it over the Convex content (it is more recent) and
  // immediately mark the page as having pending changes.
  useEffect(() => {
    getPendingEdit(id)
      .then((pending) => {
        if (pending) {
          setLocalDraftContent(pending.content)
          addPendingPage(id)
        } else {
          setLocalDraftContent(null) // no draft – signal that check is done
        }
      })
      .catch(() => setLocalDraftContent(null))
  }, [id, addPendingPage])

  // ── Offline-aware save ─────────────────────────────────────────────────────
  const onContentChange = async (content: string) => {
    // ① Write to IndexedDB first – this is instantaneous and never fails silently.
    //    The user's work is safe regardless of what happens next.
    await savePendingEdit(id, content)
    addPendingPage(id)

    try {
      // ② Attempt to sync to Convex.
      await update({ id, content })
      // ③ Sync confirmed – clean up the local draft.
      await deletePendingEdit(id)
      removePendingPage(id)
    } catch (err) {
      // ④ Sync failed (network issue, auth expiry, etc.).
      //    The IndexedDB draft keeps the content safe.
      //    The Banner will surface the pending state to the user.
      console.warn('[PageFlow] Convex sync failed – content saved locally:', err)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  // Wait for both the Convex query AND the IndexedDB draft check to complete
  // before mounting the Editor, so it always initialises with the right content.
  if (page === undefined || localDraftContent === undefined) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="mx-auto mt-10 md:max-w-3xl lg:max-w-4xl">
          <div className="space-y-4 pt-4 pl-8">
            <Skeleton className="h-14 w-[50%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </div>
    )
  }

  if (page === null) {
    return <div>Page not found</div>
  }

  // Prefer the local draft (unsynced changes) over the Convex snapshot.
  const initialContent = localDraftContent ?? page.content

  return (
    <div className="pb-80">
      <Cover url={page.coverImage} />
      <div className="mx-auto md:max-w-3xl lg:max-w-4xl">
        <Toolbar initialData={page} />
        <Editor
          onChange={onContentChange}
          initialContent={initialContent}
          editable={!page.isArchived}
        />
      </div>
    </div>
  )
}

export default PageIdPage
