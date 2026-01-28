'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const Error = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <Image src="/error.png" alt="Error" height={300} width={300} className="dark:hidden" />
      <Image
        src="/error-dark.png"
        alt="Error"
        height={300}
        width={300}
        className="hidden dark:block"
      />
      <h1 className="text-2xl font-semibold">Something went wrong!</h1>
      <p className="text-muted-foreground text-center">
        An unexpected error has occurred. Please try again later.
      </p>
      <Link href="/pages">
        <Button>Go to Pages</Button>
      </Link>
    </div>
  )
}

export default Error
