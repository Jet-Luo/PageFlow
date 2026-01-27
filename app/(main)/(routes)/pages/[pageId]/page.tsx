'use client'

import { use } from 'react'
import { Id } from '@/convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Toolbar } from '@/components/toolbar'
import { Cover } from '@/components/cover'

interface PageIdPageProps {
  params: Promise<{
    pageId: Id<'pages'>
  }>
}

const PageIdPage = ({ params }: PageIdPageProps) => {
  const id = use(params).pageId
  const page = useQuery(api.pages.getPageById, { id })

  if (page === undefined) {
    return <div>Loading...</div>
  }

  if (page === null) {
    return <div>Page not found</div>
  }
  return (
    <div className="pb-40">
      <Cover url={page.coverImage} />
      <div className="mx-auto md:max-w-3xl lg:max-w-4xl">
        <Toolbar initialData={page} />
      </div>
    </div>
  )
}

export default PageIdPage
