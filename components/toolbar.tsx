'use client'

import { ComponentRef, useRef, useState } from 'react'
import { ImageIcon, Smile, X } from 'lucide-react'
import { IconPicker } from '@/components/icon-picker'
import { Button } from '@/components/ui/button'
import { Doc } from '@/convex/_generated/dataModel'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import TextareaAutosize from 'react-textarea-autosize'

interface ToolbarProps {
  initialData: Doc<'pages'>
  preview?: boolean
}

export const Toolbar = ({ initialData, preview = false }: ToolbarProps) => {
  const inputRef = useRef<ComponentRef<'textarea'>>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialData.title)
  const update = useMutation(api.pages.updatePage)
  const removeIcon = useMutation(api.pages.removeIcon)

  const enableEditing = () => {
    if (preview) return // 预览模式下不允许编辑
    setIsEditing(true)
    // 使用 setTimeout 将其转变为微任务，在下一个事件循环中执行，以确保输入框已经渲染，等输入框渲染完成后再执行聚焦和选中操作
    setTimeout(() => {
      setValue(initialData.title)
      inputRef.current?.focus() // 聚焦
    }, 0)
  }
  const disableEditing = () => {
    setIsEditing(false)
    // 已经在 onInput 中实时更新标题，无需在此处重复更新
  }
  const onInput = (value: string) => {
    setValue(value)
    // 实时更新标题
    update({
      id: initialData._id,
      title: value || 'Untitled' // 不允许标题为空
    })
  }
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      disableEditing()
    }
  }

  const onIconSelect = (icon: string) => {
    update({
      id: initialData._id,
      icon
    })
  }

  const onRemoveIcon = () => {
    removeIcon({
      id: initialData._id
    })
  }

  return (
    <div className="group relative pl-[54px]">
      {/* 有图标且非预览模式下显示图标和删除按钮 */}
      {!!initialData.icon && !preview && (
        <div className="group/icon flex items-center gap-x-2 pt-6">
          <IconPicker onChange={onIconSelect}>
            <p className="text-6xl transition hover:opacity-75">{initialData.icon}</p>
          </IconPicker>
          <Button
            onClick={onRemoveIcon}
            className="text-muted-foreground rounded-full text-xs opacity-0 transition group-hover/icon:opacity-100"
            variant="outline"
            size="icon"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* 有图标且预览模式下只显示图标 */}
      {!!initialData.icon && preview && <p className="pt-6 text-6xl">{initialData.icon}</p>}
      <div className="flex items-center gap-x-1 py-4 opacity-0 group-hover:opacity-100">
        {/* 无图标且非预览模式下显示添加图标按钮 */}
        {!initialData.icon && !preview && (
          <IconPicker asChild onChange={onIconSelect}>
            <Button className="text-muted-foreground text-xs" variant="outline" size="sm">
              <Smile className="h-4 w-4" />
              Add Icon
            </Button>
          </IconPicker>
        )}
        {/* 无封面且非预览模式下显示添加封面按钮 */}
        {!initialData.coverImage && !preview && (
          <Button
            onClick={() => {}}
            className="text-muted-foreground text-xs"
            variant="outline"
            size="sm"
          >
            <ImageIcon className="h-4 w-4" />
            Add Cover
          </Button>
        )}
      </div>
      {isEditing && !preview ? (
        <TextareaAutosize
          ref={inputRef}
          value={value}
          onChange={(e) => onInput(e.target.value)}
          onBlur={disableEditing}
          onKeyDown={onKeyDown}
          className="resize-none bg-transparent text-5xl font-bold wrap-break-word text-[#3f3f3f] outline-none dark:text-[#cfcfcf]"
        />
      ) : (
        <div
          onClick={enableEditing}
          className="pb-[11.5px] text-5xl font-bold wrap-break-word text-[#3f3f3f] outline-none dark:text-[#cfcfcf]"
        >
          {initialData.title}
        </div>
      )}
    </div>
  )
}
