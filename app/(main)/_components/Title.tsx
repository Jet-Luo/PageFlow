'use client'

import { useMutation } from 'convex/react'
import { Doc } from '@/convex/_generated/dataModel'
import { api } from '@/convex/_generated/api'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface TitleProps {
  initialData: Doc<'pages'>
}

export const Title = ({ initialData }: TitleProps) => {
  const updateTitle = useMutation(api.pages.updatePage)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialData.title || 'Untitled')
  const inputRef = useRef<HTMLInputElement>(null)

  const enableEditing = () => {
    setIsEditing(true)
    // 自动聚焦并选中全部文本
    // 使用 setTimeout 将其转变为微任务，在下一个事件循环中执行，以确保输入框已经渲染，等输入框渲染完成后再执行聚焦和选中操作
    setTimeout(() => {
      inputRef.current?.focus() // 聚焦
      inputRef.current?.setSelectionRange(0, inputRef.current.value.length) // 选中全部文本
    }, 0)
  }

  const disableEditing = () => {
    setIsEditing(false)
    // 已经在 onChange 中实时更新标题，无需在此处重复更新
  }

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value)
    // 实时更新标题
    updateTitle({
      id: initialData._id,
      title: event.target.value || 'Untitled' // 不允许标题为空
    })
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') disableEditing()
  }

  return (
    <div className="flex items-center gap-x-1">
      {!!initialData.icon && <p>{initialData.icon}</p>}
      {isEditing ? (
        <Input
          ref={inputRef}
          onClick={enableEditing}
          onBlur={disableEditing}
          onChange={onChange}
          onKeyDown={onKeyDown}
          value={title}
          className="h-7 px-2 focus-visible:ring-transparent"
        />
      ) : (
        <Button onClick={enableEditing} variant="ghost" size="sm" className="h-auto p-1">
          <span className="truncate">{initialData.title}</span>
        </Button>
      )}
    </div>
  )
}

Title.Skeleton = function TitleSkeleton() {
  return <Skeleton className="h-6 w-20 rounded-md" />
}
