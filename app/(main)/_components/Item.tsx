'use client'

import { ChevronDown, ChevronRight, LucideIcon, MoreHorizontal, Plus, Trash } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
// import { router } from 'next/navigation'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface ItemProps {
  label: string // 必填：必须传一个字符串（比如 "Settings"）
  icon: LucideIcon // 必填：必须传一个 Lucide 的图标组件
  onClick: () => void // 必填：必须传一个函数，点击时执行
  // 下面带有 '?' 的都是“可选”的（Optional）
  isSearch?: boolean // 选填：如果是 true/false，不传默认就是 undefined
  id?: Id<'pages'> // 选填：特定的 ID 类型
  pageIcon?: string // 选填：字符串
  level?: number // 选填：数字（用于缩进层级）
  active?: boolean // 选填：是否处于激活状态
  expanded?: boolean // 选填：是否展开
  onExpand?: () => void // 选填：展开时的回调函数
}

export const Item = ({
  label,
  icon: Icon,
  onClick,
  isSearch,
  id,
  pageIcon,
  level = 0,
  active,
  expanded,
  onExpand
}: ItemProps) => {
  const { user } = useUser()
  const ChevronIcon = expanded ? ChevronDown : ChevronRight

  const handleExpandClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发父元素的 onClick
    onExpand?.() // ?. 是可选链操作符，确保 onExpand 存在时才调用
  }

  const create = useMutation(api.pages.createPage)
  const onCreateClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发父元素的 onClick
    if (!id) return
    const promise = create({ title: 'Untitled Page', parentPage: id }).then((pageId) => {
      if (!expanded) onExpand?.()
      // router.push(`/pages/${pageId}`)
    })
    toast.promise(promise, {
      loading: 'Creating your new page...',
      success: 'Page created successfully!',
      error: 'Error creating page. Please try again.'
    })
  }

  const archive = useMutation(api.pages.archivePage)
  const onArchiveClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发父元素的 onClick
    if (!id) return
    const promise = archive({ id })
    // const promise = archive({ pageId: id })
    toast.promise(promise, {
      loading: 'Moving to trash...',
      success: 'Page moved to trash!',
      error: 'Error moving page to trash. Please try again.'
    })
  }

  return (
    <div
      onClick={onClick}
      role="button"
      style={{ paddingLeft: level ? `${level * 12 + 12}px` : '12px' }} // 根据层级调整左侧内边距
      className={cn(
        'group hover:bg-primary/5 text-muted-foreground flex min-h-[27px] w-full cursor-pointer items-center py-1 pr-3 text-sm font-medium',
        active && 'bg-primary/5 text-primary font-semibold'
      )}
    >
      {/* 可展开图标：仅当id存在（表示可展开）时显示 */}
      {!!id && (
        <div
          role="button"
          className="mr-1 h-full cursor-pointer rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600"
          onClick={handleExpandClick}
        >
          <ChevronIcon className="text-muted-foreground/50 h-4 w-4 shrink-0" />
        </div>
      )}

      {/* 默认图标或自定义图标：如果pageIcon存在则显示pageIcon，否则显示默认Icon */}
      {pageIcon ? (
        <div className="mr-2 shrink-0 text-[18px]">{pageIcon}</div>
      ) : (
        <Icon className="text-muted-foreground mr-2 h-[18px] shrink-0" />
      )}

      {/* Item标签文字 */}
      <span className="truncate">{label}</span>

      {/* 搜索快捷键提示：当isSearch为true时显示 */}
      {isSearch && (
        <kbd className="bg-muted text-muted-foreground pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium select-none">
          <span className="translate-y-px text-sm">⌘</span>K
        </kbd>
      )}

      {/* 右侧添加图标：仅当id存在时显示 */}
      {!!id && (
        <div className="ml-auto flex items-center gap-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} asChild>
              <div
                role="button"
                className="ml-auto h-full rounded-sm opacity-0 group-hover:opacity-100 hover:bg-neutral-300 dark:hover:bg-neutral-600"
              >
                <MoreHorizontal className="text-muted-foreground h-4 w-4" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="start" side="right" forceMount>
              <DropdownMenuItem className="cursor-pointer" onClick={onArchiveClick}>
                <Trash className="mr-2 h-4 w-4" />
                Delete Page
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="text-muted-foreground p-2 text-sm">
                Last edited by: {user ? user.fullName : 'You'}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <div
            role="button"
            onClick={onCreateClick}
            className="ml-auto h-full rounded-sm opacity-0 group-hover:opacity-100 hover:bg-neutral-300 dark:hover:bg-neutral-600"
          >
            <Plus className="text-muted-foreground h-4 w-4" />
          </div>
        </div>
      )}
    </div>
  )
}

Item.Skeleton = function ItemSkeleton({ level }: { level?: number }) {
  return (
    <div
      style={{ paddingLeft: level ? `${level * 12 + 25}px` : '12px' }} // 根据层级调整左侧内边距
      // className="bg-muted-foreground/10 flex min-h-[27px] w-full animate-pulse cursor-pointer items-center py-1 pr-3"
      className="flex gap-x-2 py-[3px]"
    >
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 w-[30%]" />
    </div>
  )
}
