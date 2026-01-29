'use client'

// import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { Spinner } from '@/components/spinner'
import { redirect } from 'next/navigation'
import { Navigation } from '@/app/(main)/_components/Navigation'
import { SearchCommand } from '@/components/search-command'

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useConvexAuth()
  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="icon" />
      </div>
    )
  if (!isAuthenticated) {
    redirect('/')
  }
  return (
    <div className="flex h-full dark:bg-[#1f1f1f]">
      <Navigation />
      <main className="h-full flex-1 overflow-x-hidden">
        <SearchCommand />
        {children}
      </main>
    </div>
  )
}

export default MainLayout
