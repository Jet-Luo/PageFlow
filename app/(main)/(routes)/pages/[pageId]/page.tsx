'use client'

import { use } from 'react'
import { Id } from '@/convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Toolbar } from '@/components/toolbar'

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
    <div className="pt-40 pb-40">
      <div className="mx-auto md:max-w-3xl lg:max-w-4xl">
        <Toolbar initialData={page} />
      </div>
    </div>
  )
}

export default PageIdPage
