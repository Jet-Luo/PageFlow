'use client'

import { Doc, Id } from '@/convex/_generated/dataModel'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Item } from './Item'
import { cn } from '@/lib/utils'
import { FileIcon } from 'lucide-react'

interface PageListProps {
  parentPageId?: Id<'pages'>
  level?: number
  data?: Doc<'pages'>
}

export const PageList = ({ parentPageId, level = 0 }: PageListProps) => {
  const params = useParams() // 获取路由参数
  const router = useRouter()
  // const [expandedPages, setExpandedPages] = useState<Set<Id<'pages'>>>(new Set())
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const onExpand = (pageId: Id<'pages'>) => {
    setExpanded((prevExpanded) => ({
      ...prevExpanded,
      [pageId]: !prevExpanded[pageId]
    }))
  }

  const pages = useQuery(api.pages.getSidebarPages, {
    parentPage: parentPageId
  })

  const onRedirect = (pageId: Id<'pages'>) => {
    router.push(`/documents/${pageId}`)
  }

  // 若 pages 还未加载完成（即为 undefined），则显示加载中状态
  if (pages === undefined) {
    return (
      <>
        <Item.Skeleton level={level} />
        {/* 可以根据需要添加更多的骨架屏占位符 */}
        {level === 0 && (
          <>
            <Item.Skeleton level={level} />
            <Item.Skeleton level={level} />
            <Item.Skeleton level={level} />
          </>
        )}
      </>
    )
  }

  return (
    <>
      <p
        style={{
          paddingLeft: level ? `${level * 12 + 25}px` : undefined
        }}
        className={cn(
          'text-muted-foreground/80 hidden text-sm font-medium',
          expanded && 'last:block',
          level === 0 && 'hidden'
        )}
      >
        No pages inside
      </p>
      {pages.map((page) => (
        <div key={page._id.toString()}>
          <Item
            label={page.title || 'Untitled'}
            icon={FileIcon}
            onClick={() => onRedirect(page._id)}
            id={page._id}
            pageIcon={page.icon}
            level={level}
            active={params.documentId === page._id.toString()}
            expanded={!!expanded[page._id.toString()]}
            onExpand={() => onExpand(page._id)}
          />
          {/* 递归渲染子页面列表，只有在该页面被展开时才渲染 */}
          {expanded[page._id.toString()] && (
            <PageList parentPageId={page._id} level={level + 1} data={page} />
          )}
        </div>
      ))}
    </>
  )
}
