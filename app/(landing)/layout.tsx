import { Navbar } from '@/app/(landing)/_components/Navbar'

const LandingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    // h-full 似乎导致了一些问题
    // <div className="h-full dark:bg-[#1F1F1F]">
    <div className="min-h-full dark:bg-[#1F1F1F]">
      <Navbar />
      <main className="h-full pt-40">{children}</main>
    </div>
  )
}

export default LandingLayout
