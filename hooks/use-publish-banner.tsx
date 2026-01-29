import { create } from 'zustand'

type PublishBannerStore = {
  hiddenPageIds: string[]
  onHide: (pageId: string) => void
}

export const usePublishBanner = create<PublishBannerStore>((set) => ({
  hiddenPageIds: [],
  onHide: (pageId) =>
    set((state) => ({
      hiddenPageIds: [...state.hiddenPageIds, pageId]
    }))
}))
