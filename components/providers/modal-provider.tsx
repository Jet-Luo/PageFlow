'use client'

import { useState, useEffect } from 'react'
import { SettingsModal } from '@/components/modals/settings-modal'

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
    </>
  )
}
