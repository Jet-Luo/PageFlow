'use client'

import { useState } from 'react'
import { Doc } from '@/convex/_generated/dataModel'
import { useOrigin } from '@/hooks/use-origin'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Check, Copy, Send } from 'lucide-react'

interface PublishProps {
  initialData: Doc<'pages'>
}

export const Publish = ({ initialData }: PublishProps) => {
  const origin = useOrigin()
  const update = useMutation(api.pages.updatePage)
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const url = `${origin}/preview/${initialData._id}`

  const onPublish = () => {
    setIsSubmitting(true)
    const promise = update({
      id: initialData._id,
      isPublished: true
    })
    toast.promise(promise, {
      loading: 'Flowing your page...',
      success: () => {
        navigator.clipboard.writeText(url)
        setCopied(true)
        setIsSubmitting(false)
        setTimeout(() => setCopied(false), 1000)
        return 'Page flowed! Link copied to clipboard!'
      },
      error: 'Error flowing your page. Please try again.'
    })
  }

  const onUnpublish = () => {
    setIsSubmitting(true)
    const promise = update({
      id: initialData._id,
      isPublished: false
    })
    toast.promise(promise, {
      loading: 'Unflowing your page...',
      success: () => {
        setIsSubmitting(false)
        return 'Page unflowed!'
      },
      error: 'Error unflowing your page. Please try again.'
    })
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('Flow link copied to clipboard!')
      setTimeout(() => setCopied(false), 1000)
    } catch {
      toast.error('Failed to copy the link. Please try again.')
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost">
          {initialData.isPublished ? (
            <>
              <Send className="h-4 w-4 text-sky-500" />
              <div className="text-sky-500">Page Flowing</div>
            </>
          ) : (
            <>
              <Send className="text-muted-foreground h-4 w-4" />
              <div className="text-muted-foreground">Flow this Page</div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end" alignOffset={8} forceMount>
        {initialData.isPublished ? (
          <div className="space-y-4">
            <div className="flex items-center gap-x-2">
              <Send className="h-10 w-10 animate-pulse text-sky-500" />
              <p className="mb-2 text-sm font-medium text-sky-500">
                Your page is currently flowing. Share the link below:
              </p>
            </div>
            <div className="flex items-center">
              <input
                className="bg-muted h-8 flex-1 truncate rounded-l-md border px-2 text-xs"
                value={url}
                disabled
              />
              <Button onClick={onCopy} className="h-8 rounded-l-none">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              disabled={isSubmitting}
              onClick={onUnpublish}
              className="w-full text-xs"
              size="sm"
            >
              Stop Flowing
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <Send className="text-muted-foreground mb-2 h-8 w-8" />
            <p className="mb-2 text-center text-sm font-medium">
              Flow this page to generate a public link that anyone can access.
            </p>
            <Button
              disabled={isSubmitting}
              onClick={onPublish}
              className="w-full text-xs"
              size="sm"
            >
              Flow it!
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
