'use client'

import { Id } from '@/convex/_generated/dataModel'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Trash } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface MenuProps {
  pageId: Id<'pages'>
}

export const Menu = ({ pageId }: MenuProps) => {
  const router = useRouter()
  const { user } = useUser()
  const archive = useMutation(api.pages.archivePage)
  const onArchiveClick = () => {
    const promise = archive({ id: pageId })
    toast.promise(promise, {
      loading: 'Moving to trash...',
      success: 'Page moved to trash!',
      error: 'Error moving page to trash. Please try again.'
    })

    // router.push('/pages')
  }

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60" align="end" alignOffset={8} forceMount>
          <DropdownMenuItem onClick={onArchiveClick}>
            <Trash className="mr-2 h-4 w-4" />
            Move to Trash
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="text-muted-foreground p-2 text-sm">
            Last edited by: {user?.fullName || 'You'}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

Menu.Skeleton = function MenuSkeleton() {
  return <Skeleton className="h-8 w-8" />
}
