'use client'

import { useQuery } from 'convex/react'
import { useParams } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { MenuIcon } from 'lucide-react'
import { Title } from '@/app/(main)/_components/Title'

interface NavbarProps {
  isCollapsed: boolean
  onResetWidth: () => void
}

export const Navbar = ({ isCollapsed, onResetWidth }: NavbarProps) => {
  const params = useParams()
  const page = useQuery(api.pages.getPageById, { id: params.pageId as Id<'pages'> })
  if (page === undefined) {
    return (
      <div className="bg-background flex w-full items-center px-3 py-2 dark:bg-[#1f1f1f]">
        <Title.Skeleton />
      </div>
    )
  }
  if (page === null) {
    return null
  }

  return (
    <>
      <div className="bg-background flex w-full items-center gap-x-4 px-3 py-2 dark:bg-[#1f1f1f]">
        {isCollapsed && (
          <MenuIcon
            role="button"
            onClick={onResetWidth}
            className="text-muted-foreground h-6 w-6"
          />
        )}
        <div className="flex w-full items-center justify-between">
          <Title initialData={page} />
        </div>
      </div>
    </>
  )
}
