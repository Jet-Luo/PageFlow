'use client'

import { cn } from '@/lib/utils'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ImageIcon, X } from 'lucide-react'
import { useCoverImage } from '@/hooks/use-cover-image'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useParams } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import { useEdgeStore } from '@/lib/edgestore'
import { Skeleton } from '@/components/ui/skeleton'

interface CoverProps {
  url?: string
  preview?: boolean
}

export const Cover = ({ url, preview }: CoverProps) => {
  const params = useParams()
  const { edgestore } = useEdgeStore()
  // const onOpenCoverImageModal = useCoverImage((state) => state.onOpen)
  const onReplaceCover = useCoverImage((state) => state.onReplace)
  const removeCoverImage = useMutation(api.pages.removeCoverImage)

  const onRemoveCover = async () => {
    if (url) await edgestore.publicFiles.delete({ url })
    await removeCoverImage({
      id: params.pageId as Id<'pages'>
    })
  }

  return (
    // <div className="flex h-48 w-full items-center justify-center bg-gray-300 dark:bg-gray-700">
    //   <span className="text-gray-600 dark:text-gray-400">Cover Image Placeholder</span>
    // </div>
    <div className={cn('group relative h-[35vh] w-full', !url && 'h-[20vh]', url && 'bg-muted')}>
      {!!url && (
        <Image
          src={url}
          alt="Cover Image"
          fill
          loading="eager"
          className="object-cover"
          unoptimized
        />
      )}
      {url && !preview && (
        <div className="absolute right-5 bottom-5 flex items-center gap-x-2 opacity-0 group-hover:opacity-100">
          <Button
            onClick={() => onReplaceCover(url)}
            className="text-muted-foreground text-xs"
            variant="outline"
            size="sm"
          >
            <ImageIcon className="h-4 w-4" />
            Change Cover
          </Button>
          <Button
            onClick={onRemoveCover}
            className="text-muted-foreground text-xs"
            variant="outline"
            size="sm"
          >
            <X className="h-4 w-4" />
            Remove Cover
          </Button>
        </div>
      )}
    </div>
  )
}

Cover.Skeleton = function CoverSkeleton() {
  return <Skeleton className="h-[20vh] w-full" />
}
