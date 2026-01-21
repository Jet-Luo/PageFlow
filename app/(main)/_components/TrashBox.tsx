'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { toast } from 'sonner'
import { Spinner } from '@/components/spinner'
import { Search, Trash, Undo } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ConfirmModal } from '@/components/modals/confirm-modal'

export const TrashBox = () => {
  const router = useRouter()
  const params = useParams()
  const pages = useQuery(api.pages.getTrashPages)
  const restore = useMutation(api.pages.restorePage)
  const deletePermanently = useMutation(api.pages.deletePagePermanently)

  const [search, setSearch] = useState('')

  const filteredPages = pages?.filter((page) =>
    page.title.toLowerCase().includes(search.toLowerCase())
  )

  const onClickPage = (pageId: string) => {
    router.push(`/pages/${pageId}`)
  }

  const onRestorePage = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    pageId: Id<'pages'>
  ) => {
    event.stopPropagation()
    const promise = restore({ id: pageId })
    toast.promise(promise, {
      loading: 'Restoring page...',
      success: 'Page restored successfully!',
      error: 'Error restoring page. Please try again.'
    })
  }

  const onDeletePermanently = (pageId: Id<'pages'>) => {
    const promise = deletePermanently({ id: pageId })
    toast.promise(promise, {
      loading: 'Deleting page permanently...',
      success: 'Page deleted permanently!',
      error: 'Error deleting page. Please try again.'
    })

    // 如果当前查看的页面正是被删除的页面，则跳转回 pages 页面
    if (params.pageId === pageId) router.push('/pages')
  }

  // 若 pages 还未加载完成（即为 undefined），则显示加载中状态
  if (pages === undefined) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Spinner size="large" />
      </div>
    )
  }

  return (
    <div className="text-sm">
      <div className="flex items-center gap-x-1 p-2">
        <Search className="h-4 w-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-secondary h-7 px-2 focus-visible:ring-transparent"
          placeholder="Filter by page title..."
        />
      </div>
      <div className="mt-2 px-1 pb-1">
        {/* last:block 意思是：当这是父元素的最后一个子元素时，应用 block 样式 */}
        <p className="text-muted-foreground hidden pb-2 text-center text-xs last:block">
          No pages in trash
        </p>
        {filteredPages?.map((page) => (
          <div
            key={page._id.toString()}
            role="button"
            onClick={() => onClickPage(page._id.toString())}
            className="hover:bg-primary/5 text-primary flex w-full items-center justify-between rounded-sm text-sm"
          >
            <span className="truncate pl-2">{page.title}</span>
            <div className="flex items-center">
              <div
                onClick={(e) => onRestorePage(e, page._id)}
                role="button"
                className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
              >
                <Undo className="text-muted-foreground h-4 w-4" />
              </div>
              <ConfirmModal onConfirm={() => onDeletePermanently(page._id)}>
                <div
                  role="button"
                  className="rounded-sm p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600"
                >
                  <Trash className="text-muted-foreground h-4 w-4" />
                </div>
              </ConfirmModal>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
