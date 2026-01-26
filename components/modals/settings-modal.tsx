'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSettings } from '@/hooks/use-settings'
import { ModeToggle } from '@/components/mode-toggle'
import { Label } from '@/components/ui/label'

export const SettingsModal = () => {
  const settings = useSettings()

  return (
    <Dialog open={settings.isOpen} onOpenChange={settings.onClose}>
      <DialogContent>
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-medium">Settings</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-1">
            <Label>Appearance</Label>
            <span className="text-muted-foreground text-[0.8rem]">Customize your experience</span>
          </div>
          <ModeToggle />
        </div>
      </DialogContent>
    </Dialog>
  )
}
