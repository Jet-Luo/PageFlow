'use client'

import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { useSearch } from '@/hooks/use-search'
import { useEffect, useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { File } from 'lucide-react'

export const SearchCommand = () => {
  const { user } = useUser()
  const router = useRouter()
  const pages = useQuery(api.pages.getSearchPages)
  const [isMounted, setIsMounted] = useState(false)

  const toggle = useSearch((state) => state.toggle)
  const isOpen = useSearch((state) => state.isOpen)
  const onClose = useSearch((state) => state.onClose)

  const onSelect = (id: string) => {
    router.push(`/pages/${id}`)
    onClose()
  }

  // Ensure component is mounted before rendering to avoid hydration issues
  // This is especially important for components that rely on client-side state
  // such as modals or command palettes
  // 确保组件在渲染前已挂载，以避免水合问题
  // 这对于依赖客户端状态的组件尤为重要，例如模态框或命令面板
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [toggle])

  // 如果组件尚未挂载，则不渲染任何内容，以避免水合问题
  if (!isMounted) {
    return null
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder={`Search ${user?.fullName}'s PageFlow...`} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {pages?.map((page) => (
            <CommandItem
              key={page._id}
              value={`${page._id}-${page.title}`}
              title={page.title}
              onSelect={() => onSelect(page._id)}
              // onSelect={onSelect} // 将自动把 value 作为参数传递，即 onSelect(value)
            >
              {page.icon ? (
                <p className="mr-2 text-[18px]">{page.icon}</p>
              ) : (
                <File className="mr-2 h-4 w-4" />
              )}
              <span>{page.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
