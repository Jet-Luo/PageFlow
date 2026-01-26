'use client'

import { Id } from '@/convex/_generated/dataModel'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/modals/confirm-modal'

interface BannerProps {
  pageId: Id<'pages'>
}

export const Banner = ({ pageId }: BannerProps) => {
  const router = useRouter()
  const restore = useMutation(api.pages.restorePage)
  const deletePermanently = useMutation(api.pages.deletePagePermanently)

  const onDeletePermanently = () => {
    const promise = deletePermanently({ id: pageId })
    toast.promise(promise, {
      loading: 'Deleting page...',
      success: 'Page deleted permanently!',
      error: 'Error deleting page. Please try again.'
    })
    router.push('/pages')
  }

  const onRestore = () => {
    const promise = restore({ id: pageId })
    toast.promise(promise, {
      loading: 'Restoring page...',
      success: 'Page restored successfully!',
      error: 'Error restoring page. Please try again.'
    })
    // router.push('/pages')
  }

  return (
    // <div className="bg-yellow-200 px-4 py-2 text-center text-yellow-900">
    //   This is a banner for archived pages.
    // </div>
    <div className="flex w-full items-center justify-center gap-x-2 bg-rose-500 p-2 text-center text-sm text-white">
      <p>This page is in the Trash.</p>
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
  )
}
