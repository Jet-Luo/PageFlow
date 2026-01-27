import { create } from 'zustand'

type coverImageStore = {
  url?: string // 即将被替换的封面图片 URL，即将被新上传的图片替换的旧图片 URL
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onReplace: (url: string) => void
}

export const useCoverImage = create<coverImageStore>((set) => ({
  url: undefined,
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false, url: undefined }), // 关闭模态框并清除 URL
  onReplace: (url: string) => set({ isOpen: true, url }) // 替换封面图片并打开模态框
}))
