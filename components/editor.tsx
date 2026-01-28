'use client'

import { BlockNoteEditor, PartialBlock } from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import '@blocknote/mantine/style.css'
import { useTheme } from 'next-themes'
import { useEdgeStore } from '@/lib/edgestore'

interface EditorProps {
  onChange: (value: string) => void
  initialContent?: string
  editable?: boolean
}

const Editor = ({ onChange, initialContent, editable }: EditorProps) => {
  const { resolvedTheme } = useTheme()
  const { edgestore } = useEdgeStore()

  const handleUpload = async (file: File): Promise<string> => {
    const res = await edgestore.publicFiles.upload({
      file
    })
    return res.url // 返回上传后的文件 URL
  }
  const handleEditorChange = () => {
    onChange(JSON.stringify(editor.document, null, 2))
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
