'use client'

import { Doc } from '@/convex/_generated/dataModel'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/modals/confirm-modal'
import { CloudOff, Loader2, RefreshCw, Send, Trash, WifiOff, X } from 'lucide-react'
import { usePublishBanner } from '@/hooks/use-publish-banner'
import { useOrigin } from '@/hooks/use-origin'
import { useNetworkStatus } from '@/hooks/use-network-status'
import { useSyncTrigger } from '@/hooks/use-sync-trigger'

interface BannerProps {
  // pageId: Id<'pages'>
  initialData: Doc<'pages'>
}

export const Banner = ({ initialData }: BannerProps) => {
  const router = useRouter()
  const origin = useOrigin()
  const url = `${origin}/preview/${initialData._id}`
  const restore = useMutation(api.pages.restorePage)
  const deletePermanently = useMutation(api.pages.deletePagePermanently)
  const { hiddenPageIds, onHide } = usePublishBanner()
  const showPublishBanner = !hiddenPageIds.includes(initialData._id)
  const { isOnline, syncStatus, hasPendingPage } = useNetworkStatus()
  const { syncAllPending } = useSyncTrigger()
  const hasPendingForPage = hasPendingPage(initialData._id)
  const showOfflineBanner = !isOnline || hasPendingForPage

  const onDeletePermanently = () => {
    const promise = deletePermanently({ id: initialData._id })
    toast.promise(promise, {
      loading: 'Deleting page...',
      success: 'Page deleted permanently!',
      error: 'Error deleting page. Please try again.'
    })
    router.push('/pages')
  }

  const onRestore = () => {
    const promise = restore({ id: initialData._id })
    toast.promise(promise, {
      loading: 'Restoring page...',
      success: 'Page restored successfully!',
      error: 'Error restoring page. Please try again.'
    })
    // router.push('/pages')
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      // setCopied(true)
      toast.success('Flow link copied to clipboard!')
      // setTimeout(() => setCopied(false), 1000)
    } catch {
      toast.error('Failed to copy the link. Please try again.')
    }
  }

  return (
    // <div className="bg-yellow-200 px-4 py-2 text-center text-yellow-900">
    //   This is a banner for archived pages.
    // </div>
    <div className="flex w-full flex-col">
      {initialData.isArchived && (
        <div className="flex w-full items-center justify-center gap-x-2 bg-rose-500 p-2 text-center text-sm text-white">
          <Trash className="h-4 w-4" />
          <p className="font-semibold">This page is in the Trash.</p>
          <Button
            size="sm"
            onClick={onRestore}
            variant="outline"
            className="h-auto border-white bg-transparent p-1 px-2 text-white hover:bg-white hover:text-rose-500 dark:hover:bg-white dark:hover:text-rose-500"
          >
            Restore
          </Button>
          <ConfirmModal onConfirm={onDeletePermanently}>
            <Button
              size="sm"
              variant="outline"
              className="h-auto border-white bg-transparent p-1 px-2 text-white hover:bg-white hover:text-rose-500 dark:hover:bg-white dark:hover:text-rose-500"
            >
              Delete Permanently
            </Button>
          </ConfirmModal>
        </div>
      )}
      {initialData.isPublished && showPublishBanner && (
        <div className="flex w-full items-center justify-center gap-x-2 bg-sky-500/90 p-2 text-center text-sm text-white">
          <Send className="h-4 w-4" />
          <p className="font-semibold">This page is currently flowing.</p>
          <Button
            size="sm"
            onClick={onCopy}
            variant="outline"
            className="h-auto border-white bg-transparent p-1 px-2 text-white hover:bg-white hover:text-sky-500 dark:hover:bg-white dark:hover:text-sky-500"
          >
            Copy Flow Link
          </Button>
          <Button
            size="icon-sm"
            onClick={() => onHide(initialData._id)}
            variant="outline"
            className="h-auto border-white bg-transparent p-1.5 text-white hover:bg-white hover:text-sky-500 dark:hover:bg-white dark:hover:text-sky-500"
          >
            <X />
          </Button>
        </div>
      )}
      {showOfflineBanner && (
        <div className="flex w-full items-center justify-center gap-x-2 bg-neutral-500/90 p-2 text-center text-sm text-white">
          {!isOnline ? (
            <WifiOff className="h-4 w-4 shrink-0" />
          ) : syncStatus === 'syncing' ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <CloudOff className="h-4 w-4 shrink-0" />
          )}
          <p className="font-semibold">
            {syncStatus === 'syncing'
              ? 'Syncing changes to cloud…'
              : !isOnline && !hasPendingForPage
                ? 'Offline · New edits will be saved locally.'
                : !isOnline && hasPendingForPage
                  ? 'Offline · Changes saved locally.'
                  : syncStatus === 'failed'
                    ? 'Sync failed · Changes still saved locally.'
                    : 'Changes saved locally · Not yet synced.'}
          </p>
          {hasPendingForPage && syncStatus !== 'syncing' && (
            <Button
              size="sm"
              onClick={syncAllPending}
              variant="outline"
              className="h-auto border-white bg-transparent p-1 px-2 text-white hover:bg-white hover:text-neutral-600 dark:hover:bg-white dark:hover:text-neutral-600"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Retry Sync
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
