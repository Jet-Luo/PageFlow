'use client'

import { LucideIcon } from 'lucide-react'

interface ItemProps {
  label: string
  onClick: () => void
  icon: LucideIcon
}

export const Item = ({ label, onClick, icon: Icon }: ItemProps) => {
  return (
    <div
      onClick={onClick}
      role="button"
      style={{ paddingLeft: '12px' }}
      className="group hover:bg-primary/5 text-muted-foreground flex min-h-[27px] w-full cursor-pointer items-center py-1 pr-3 text-sm font-medium"
    >
      <Icon className="text-muted-foreground mr-2 h-[18px] shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  )
}
