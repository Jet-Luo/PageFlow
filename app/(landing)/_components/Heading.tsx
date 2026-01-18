// app/(landing)/_components/Heading.tsx
// _components 表示这是 landing 中会用到的组件，而非通用组件，所以放在这里而不是放在 components 目录下，
// components 目录下的组件是整个应用通用的组件，比如 Button、Input 等等，而不是某个特定页面或模块使用的组件。
'use client' // 用处： 指示这是一个客户端组件

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useConvexAuth, Unauthenticated } from 'convex/react'
import { Spinner } from '@/components/spinner'
import Link from 'next/dist/client/link'
import { SignInButton } from '@clerk/nextjs'

export const Heading = () => {
  const { isAuthenticated, isLoading } = useConvexAuth()
  return (
    // <>
    //     <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Welcome to Our App</h1>
    //     <p className="text-lg text-gray-700 mb-8">Discover amazing features and seamless experience.</p>
    //     <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
    //         Get Started
    //     </button>
    // </>
    <div className="max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold sm:text-5xl md:text-6xl">
        {/* Welcome to <span className="text-blue-600">PageFlow</span> */}
        Your Ideas, Documents & Knowledge, Flow. <br />
        Welcome to{' '}
        <span className="underline">
          Page<span className="italic">Flow</span>
        </span>
      </h1>
      <h3 className="text-base font-medium sm:text-xl md:text-2xl">
        PageFlow is a Notion-like workspace built with Next.js and Tailwind CSS, designed to help
        you capture, organize, and share your ideas effortlessly.
      </h3>
      {isLoading && (
        <div className="flex w-full items-center justify-center">
          <Spinner size="icon" />
        </div>
      )}
      {!isLoading && isAuthenticated && (
        <Button asChild>
          <Link href="/pages">
            Flow Your Ideas Now
            {/*<ArrowRight className="h-4 2-4 ml-2"/>*/}
            <ArrowRight />
          </Link>
        </Button>
      )}
      {/*{!isLoading && !isAuthenticated && (*/}
      {/*  <SignInButton mode="modal">*/}
      {/*    <Button>*/}
      {/*      Flow Your Ideas Now*/}
      {/*      /!*<ArrowRight className="h-4 2-4 ml-2"/>*!/*/}
      {/*      <ArrowRight />*/}
      {/*    </Button>*/}
      {/*  </SignInButton>*/}
      {/*)}*/}
      {/*使用 Unauthenticated 组件来包裹未认证用户的内容，也能达到同样的效果*/}
      <Unauthenticated>
        <SignInButton mode="modal">
          <Button>
            Flow Your Ideas Now
            {/*<ArrowRight className="h-4 2-4 ml-2"/>*/}
            <ArrowRight />
          </Button>
        </SignInButton>
      </Unauthenticated>
    </div>
  )
}
