'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCoverImage } from '@/hooks/use-cover-image'
import { SingleImageDropzone } from '@/components/upload/single-image'
import { useCallback, useState } from 'react'
import { useEdgeStore } from '@/lib/edgestore'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useParams } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import { UploaderProvider, type UploadFn } from '@/components/upload/uploader-provider'

export const CoverImageModal = () => {
  // const [file, setFile] = useState<File>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const coverImage = useCoverImage()
  const { edgestore } = useEdgeStore()
  const update = useMutation(api.pages.updatePage)
  const params = useParams()

  // const onClose = () => {
  //   // setFile(undefined)
  //   setIsSubmitting(false)
  //   coverImage.onClose()
  // }

  const onChange: UploadFn = useCallback(
    async ({ file, onProgressChange, signal }) => {
      setIsSubmitting(true)
      // setFile(file)

      const res = await edgestore.publicFiles.upload({
        file,
        signal,
        onProgressChange,
        options: {
          replaceTargetUrl: coverImage.url // 如果有旧的封面图片（coverImage.url），就替换它
        }
      })

      await update({
        id: params.pageId as Id<'pages'>,
        coverImage: res.url
      })

      // onClose()
      setIsSubmitting(false)
      coverImage.onClose()
      return res
    },
    [coverImage, edgestore.publicFiles, params.pageId, update]
  )

  // const uploadFn: UploadFn = useCallback(
  //   async ({ file, onProgressChange, signal }) => {
  //     setIsSubmitting(true)
  //     setFile(file)
  //
  //     const res = await edgestore.publicImages.upload({
  //       file,
  //       signal,
  //       onProgressChange
  //     })
  //
  //     await update({
  //       id: params.pageId as Id<'pages'>,
  //       coverImage: res.url
  //     })
  //
  //     onClose()
  //     // you can run some server action or api here
  //     // to add the necessary data to your database
  //     console.log(res)
  //     return res
  //   },
  //   [edgestore]
  // )

  return (
    <Dialog open={coverImage.isOpen} onOpenChange={coverImage.onClose}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            Cover Image Settings
          </DialogTitle>
        </DialogHeader>
        <UploaderProvider uploadFn={onChange} autoUpload>
          <SingleImageDropzone className="w-full outline-none" disabled={isSubmitting} />
        </UploaderProvider>
      </DialogContent>
    </Dialog>
  )
}
