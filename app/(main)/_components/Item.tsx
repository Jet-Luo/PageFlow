'use client'

import { ChevronDown, ChevronRight, LucideIcon } from 'lucide-react'
import { Id } from '@/convex/_generated/dataModel'
import { cn } from '@/lib/utils'

interface ItemProps {
  label: string
  icon: LucideIcon
  onClick: () => void
  isSearch?: boolean
  id?: Id<'pages'>
  pageIcon?: string
  level?: number
  active?: boolean
  expanded?: boolean
  onExpand?: () => void
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
  const ChevronIcon = expanded ? ChevronDown : ChevronRight

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
          className="mr-1 h-full cursor-pointer rounded-sm hover:bg-neutral-300 dark:bg-neutral-600"
          onClick={() => {}}
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
    </div>
  )
}
