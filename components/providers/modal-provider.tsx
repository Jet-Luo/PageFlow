// 该文件用于处理模态框的提供与渲染，确保在客户端正确挂载以避免水合问题
'use client'

import { useState, useEffect } from 'react'
import { SettingsModal } from '@/components/modals/settings-modal'
import { CoverImageModal } from '../modals/cover-image-modal'

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false)

  // Ensure component is mounted before rendering to avoid hydration issues
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)
  }, [])

  // If the component is not mounted yet, do not render anything to avoid hydration issues
  if (!isMounted) {
    return null
  }

  return (
    <>
      <SettingsModal />
      <CoverImageModal />
    </>
  )
}
