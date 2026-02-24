'use client'

import { BlockNoteEditor, PartialBlock } from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import '@blocknote/mantine/style.css'
import { useTheme } from 'next-themes'
import { useEdgeStore } from '@/lib/edgestore'
import { useDebounceCallback } from '@/hooks/use-debounce-callback'

interface EditorProps {
  onChange?: (value: string) => void
  initialContent?: string
  editable?: boolean
}

const Editor = ({ onChange, initialContent, editable }: EditorProps) => {
  const { resolvedTheme } = useTheme()
  const { edgestore } = useEdgeStore()

  // 防抖 500ms：用户快速连续编辑时，只在停止输入 500ms 后才向数据库保存一次
  const debouncedOnChange = useDebounceCallback((value: string) => {
    onChange?.(value)
  }, 500)

  const handleUpload = async (file: File): Promise<string> => {
    const res = await edgestore.publicFiles.upload({
      file
    })
    return res.url // 返回上传后的文件 URL
  }
  const handleEditorChange = () => {
    debouncedOnChange(JSON.stringify(editor.document, null, 2))
  }

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: initialContent ? (JSON.parse(initialContent) as PartialBlock[]) : undefined,
    uploadFile: handleUpload
  })

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      onChange={handleEditorChange}
    />
  )
}

export default Editor
