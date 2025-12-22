'use client'

import { ChevronsLeft } from 'lucide-react'

export const Navigation = () => {
  return (
    <>
      <aside className="group/sidebar bg-secondary relative z-99999 flex h-full w-60 flex-col overflow-y-auto">
        <div
          role="button"
          className="text-muted-foreground absolute top-3 right-4 h-6 w-6 rounded-sm opacity-0 transition group-hover/sidebar:opacity-100 hover:bg-neutral-300 dark:bg-neutral-600"
        >
          <ChevronsLeft className="h-6 w-6" />
        </div>
        <div>
          <p>action items</p>
        </div>
        <div className="mt-4">
          <p>documents list</p>
        </div>
        <div className="bg-primary/10 absolute top-0 right-0 h-full w-1 cursor-ew-resize opacity-0 transition group-hover/sidebar:opacity-100" />
      </aside>
    </>
  )
}
