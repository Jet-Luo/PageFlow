'use client'

import { use } from 'react'
import { Id } from '@/convex/_generated/dataModel'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Toolbar } from '@/components/toolbar'
import { Cover } from '@/components/cover'
import { Skeleton } from '@/components/ui/skeleton'
import { Editor } from '@/components/editor'
import { useMutation } from 'convex/react'

interface PageIdPageProps {
  params: Promise<{
    pageId: Id<'pages'>
  }>
}

const PageIdPage = ({ params }: PageIdPageProps) => {
  const id = use(params).pageId
  const page = useQuery(api.pages.getPageById, { id })
  const update = useMutation(api.pages.updatePage)

  const onContentChange = async (content: string) => {
    await update({
      id,
      content
    })
  }

  if (page === undefined) {
    return (
      <div>
        <Cover.Skeleton />
        <div className="mx-auto mt-10 md:max-w-3xl lg:max-w-4xl">
          <div className="space-y-4 pt-4 pl-8">
            <Skeleton className="h-14 w-[50%]" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        </div>
      </div>
    )
  }

  if (page === null) {
    return <div>Page not found</div>
  }
  return (
    <div className="pb-80">
      <Cover url={page.coverImage} />
      <div className="mx-auto md:max-w-3xl lg:max-w-4xl">
        <Toolbar initialData={page} />
        <Editor onChange={onContentChange} initialContent={page.content} />
      </div>
    </div>
  )
}

export default PageIdPage
