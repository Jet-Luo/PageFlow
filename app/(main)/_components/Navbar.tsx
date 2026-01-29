'use client'

import { MenuIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Title } from '@/app/(main)/_components/Title'
import { Banner } from '@/app/(main)/_components/Banner'
import { Menu } from '@/app/(main)/_components/Menu'
import { Publish } from '@/app/(main)/_components/Publish'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

interface NavbarProps {
  isCollapsed: boolean
  showSidebar: () => void
}

export const Navbar = ({ isCollapsed, showSidebar }: NavbarProps) => {
  const params = useParams()
  const page = useQuery(api.pages.getPageById, { id: params.pageId as Id<'pages'> })
  if (page === undefined) {
    return (
      <div className="bg-background flex w-full items-center justify-between px-3 py-2 dark:bg-[#1f1f1f]">
        <Title.Skeleton />
        <div className="flex items-center gap-x-2">
          <Menu.Skeleton />
        </div>
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
          <div
            onClick={showSidebar}
            role="button"
            className="text-muted-foreground hover:bg-primary/5 h-6 w-6 rounded-sm p-0.5"
          >
            <MenuIcon className="h-5 w-5" />
          </div>
        )}
        <div className="flex w-full items-center justify-between">
          <Title initialData={page} />
          <div className="flex items-center gap-x-2">
            <Publish initialData={page} />
            <Menu pageId={page._id} />
          </div>
        </div>
      </div>
      {/*{page.isArchived && <Banner pageId={page._id} />}*/}
      <Banner initialData={page} />
    </>
  )
}
