'use client'

import { ChevronsLeft, MenuIcon, Plus, PlusCircle, Search, Settings, Trash } from 'lucide-react'
import React, { ComponentRef, useCallback, useEffect, useRef, useState } from 'react'
import { useMediaQuery } from 'usehooks-ts'
import { usePathname } from 'next/dist/client/components/navigation'
import { cn } from '@/lib/utils'
import UserItem from '@/app/(main)/_components/UserItem'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Item } from '@/app/(main)/_components/Item'
import { toast } from 'sonner'
import { PageList } from '@/app/(main)/_components/PageList'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { TrashBox } from '@/app/(main)/_components/TrashBox'
import { useSearch } from '@/hooks/use-search'
import { useSettings } from '@/hooks/use-settings'

export const Navigation = () => {
  // const search = useSearch() // 将导致 Navigation 在 isOpen 变化时重新渲染，但 Navigation 本身并不依赖 isOpen，所以无需整体订阅
  const onOpenSearch = useSearch((state) => state.onOpen) // 只订阅 onOpen 方法，避免不必要的渲染
  // console.log('🔵 Navigation 渲染') // ← 会在 isOpen 变化时打印
  const onOpenSettings = useSettings((state) => state.onOpen)

  const createPage = useMutation(api.pages.createPage)

  const pathname: string = usePathname()
  const isMobile: boolean = useMediaQuery('(max-width: 768px)')

  const isResizingRef = useRef<boolean>(false) // 指示是否正在拖动调整 sidebar 大小
  const sidebarRef = useRef<ComponentRef<'aside'>>(null) // sidebar 元素引用
  const navbarRef = useRef<ComponentRef<'nav'>>(null) // navbar 元素引用
  const [isResetting, setIsResetting] = useState<boolean>(false) // 指示是否正在重置（控制过渡动画）
  const [isCollapsed, setIsCollapsed] = useState<boolean>(isMobile) // 指示侧边栏是否折叠

  // 鼠标按下开始拖动
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    e.preventDefault()
    e.stopPropagation()

    isResizingRef.current = true // 开始调整大小
    document.addEventListener('mousemove', handleMouseMove) // handleMouseMove 调整 sidebar 宽度
    document.addEventListener('mouseup', handleMouseUp) // handleMouseUp 停止调整大小
  }

  // 鼠标移动调整宽度 (仅限 Desktop)
  const handleMouseMove = (e: MouseEvent): void => {
    if (!isResizingRef.current || !sidebarRef.current || !navbarRef.current) return

    const newWidth: number = e.clientX
    const minWidth: number = 200
    const maxWidth: number = 500

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      sidebarRef.current.style.width = `${newWidth}px`
      if (!isMobile) {
        navbarRef.current.style.left = `${newWidth}px`
        navbarRef.current.style.width = `calc(100% - ${newWidth}px)`
      }
    }
  }

  // 鼠标松开停止拖动
  const handleMouseUp = (): void => {
    isResizingRef.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // 展开侧边栏（对应触发按钮为 navbar 上的 菜单 图标）
  // mobile 状态下则为完全显示 sidebar
  const showSidebar = useCallback((): void => {
    if (sidebarRef.current && navbarRef.current) {
      setIsResetting(true)
      // 关键优化：如果已经是展开状态，就不要再触发 setState，防止级联渲染；prevState 代表当前这一刻的状态值
      setIsCollapsed((prevState) => (prevState ? false : prevState))
      // 注意：这里的 isCollapsed 还是旧值，因为 setState 是异步的，需要等下一次渲染才会更新，所以在这里无法立即读取最新值，只能通过 useEffect 监听变化来获取最新值
      // console.log('isCollapsed set to false. The value now is:', isCollapsed) // isCollapsed: true（旧值）

      sidebarRef.current.style.marginLeft = '0' // 重置 marginLeft
      if (isMobile) {
        // Mobile: Navbar 不动，Sidebar 覆盖在上面
        // sidebarRef.current.style.width = '100%'
        navbarRef.current.style.left = '0'
      } else {
        // Desktop: Navbar 让出空间
        if (sidebarRef.current.style.width === '100%') sidebarRef.current.style.width = '15rem'
        navbarRef.current.style.left = `${sidebarRef.current.style.width}`
        navbarRef.current.style.width = `calc(100% - ${sidebarRef.current.style.width})`
      }
      setTimeout(() => setIsResetting(false), 300) // 300ms 后取消过渡效果，与 CSS 过渡时间一致
    }
  }, [isMobile])

  // 折叠侧边栏（对应触发按钮为 sidebar 上的 折叠 图标）
  // mobile 状态下则为完全隐藏 sidebar
  const collapseSidebar = (): void => {
    if (sidebarRef.current && navbarRef.current) {
      setIsResetting(true)
      // 关键优化：如果已经是折叠状态，就不要再触发 setState，防止级联渲染；prevState 代表当前这一刻的状态值
      setIsCollapsed((prevState) => (prevState ? prevState : true))
      // 注意：这里的 isCollapsed 还是旧值，因为 setState 是异步的，需要等下一次渲染才会更新，所以在这里无法立即读取最新值，只能通过 useEffect 监听变化来获取最新值
      // console.log('isCollapsed set to true. The value now is:', isCollapsed) // isCollapsed: false（旧值）

      // sidebar 在 mobile 状态下脱离原有布局置于最上层，保持原有宽度，向左移出屏幕外；navbar 保持不动（即占满全屏）
      // Desktop: Sidebar 保持宽度，但通过负 margin 移出屏幕，防止内容换行；Navbar 占满全屏
      // sidebarRef.current.style.width = '0'
      // 上面的方法将导致 sidebar 内容在缩放时出现换行，所以改用负值 margin 向右移出屏幕
      sidebarRef.current.style.marginLeft = `-${sidebarRef.current.offsetWidth}px`
      navbarRef.current.style.left = '0'
      navbarRef.current.style.width = '100%'

      setTimeout(() => setIsResetting(false), 300) // 300ms 后取消过渡效果，与 CSS 过渡时间一致
    }
  }

  // 重置侧边栏到初始状态（对应触发按钮为 sidebar 上的 拖动条）
  const resetSidebar = useCallback((): void => {
    if (sidebarRef.current && navbarRef.current) {
      setIsResetting(true)
      // 重置时一定是展开状态（未展开无法点击拖动条），所以此时 isCollapsed 一定为 false，无需设置
      // setIsCollapsed(false)
      // setIsCollapsed((prevState) => (prevState ? false : prevState))

      sidebarRef.current.style.width = '15rem'
      if (!isMobile) {
        navbarRef.current.style.left = '15rem'
        navbarRef.current.style.marginLeft = '0'
        navbarRef.current.style.width = 'calc(100% - 15rem)'
      }
      setTimeout(() => setIsResetting(false), 300) // 300ms 后取消过渡效果，与 CSS 过渡时间一致
    }
  }, [isMobile])

  useEffect(() => {
    const handleResize = () => {
      if (isMobile) {
        collapseSidebar()
      } else {
        showSidebar()
      }
    }

    handleResize()
    // isMobile 已经自动监听了窗口变化，不需要额外监听
    // window.addEventListener('resize', handleResize)
    // return () => window.removeEventListener('resize', handleResize)
  }, [isMobile, showSidebar]) // useCallback 和 useEffect 的依赖项中不需要包含 collapseSidebar，因为它不会变化

  // 路由变化时，Mobile 自动收起，Desktop 保持原状(或根据需求展开)
  useEffect(() => {
    if (isMobile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      collapseSidebar()
    }
  }, [pathname, isMobile])

  // 使用 useCallback 原因：防止无限循环调用。以下是无限循环的分析过程：
  // 假设 showSidebar 没有用 useCallback 包裹。
  // 渲染 1：创建了 showSidebar (地址 A)。
  // useEffect 执行，依赖是 [地址 A]。
  // useEffect 内部调用 setState，触发渲染 2。
  // 渲染 2：组件函数重新跑一遍，创建了新的 showSidebar (地址 B)。
  // useEffect 检查依赖：发现 地址 A !== 地址 B（函数变了！）。
  // useEffect 再次执行。
  // 再次 setState -> 渲染 3 -> 创建地址 C -> 再次执行 Effect...
  // 结果：无限循环（Infinite Loop）。
  //
  // 用 useCallback 包裹后，showSidebar 只有在 isMobile 变化时才会变，从而打破循环。流程如下：
  // 渲染 1：useCallback 创建并缓存函数 (地址 A)。
  // useEffect 执行，依赖是 [地址 A]。
  // useEffect 内部调用 setState，触发渲染 2。
  // 渲染 2：useCallback 检查 [isMobile]。发现 isMobile 没变。
  // useCallback 直接返回缓存的地址 A（而不是创建新的）。
  // useEffect 检查依赖：发现 地址 A === 地址 A。
  // 结果：useEffect 不执行。循环终止。
  //
  // 总结：useCallback 用于稳定函数引用，防止因函数地址变化触发不必要的副作用调用，避免无限循环。

  // const handleCreatePage = async (): Promise<void> => {
  //   const newPage = await createPage({ title: 'Untitled Page' })
  //   // Redirect to the newly created page's page
  //   window.location.href = `/pages/${newPage._id.toString()}`
  // }

  const handleCreatePage = () => {
    const promise = createPage({ title: 'Untitled' })
    toast.promise(promise, {
      loading: 'Creating your new page...',
      success: (newPage) => {
        // Redirect to the newly created page's page
        // window.location.href = `/pages/${newPage._id.toString()}`
        return 'Page created successfully!'
      },
      error: 'Error creating page. Please try again.'
    })
  }

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          'group/sidebar bg-secondary relative z-99999 flex h-full w-60 flex-col overflow-y-auto',
          isResetting && 'transition-all duration-300',
          isMobile ? 'absolute' : 'relative'
        )}
      >
        <div
          onClick={collapseSidebar}
          role="button"
          className={cn(
            'text-muted-foreground absolute top-3 right-4 h-6 w-6 rounded-sm opacity-0 transition group-hover/sidebar:opacity-100 hover:bg-neutral-300 dark:bg-neutral-600',
            isMobile && 'opacity-100'
          )}
        >
          <ChevronsLeft className="h-6 w-6" />
        </div>
        <div>
          <UserItem />
          <Item label="Search" icon={Search} onClick={onOpenSearch} isSearch />
          <Item label="Settings" icon={Settings} onClick={onOpenSettings} />
          <Item label="New Page" icon={PlusCircle} onClick={handleCreatePage} />
        </div>
        <div className="mt-4">
          {/*{pages?.map((page) => (*/}
          {/*  <div*/}
          {/*    key={page._id.toString()}*/}
          {/*    className="hover:bg-primary/10 mb-2 cursor-pointer rounded-md px-4 py-2"*/}
          {/*  >*/}
          {/*    <p>{page.title || 'Untitled Page'}</p>*/}
          {/*  </div>*/}
          {/*))}*/}
          <PageList />
          <Item label="Add a page" icon={Plus} onClick={handleCreatePage} />
          <Popover>
            <PopoverTrigger className="mt-4 w-full">
              <Item label="Trash" icon={Trash} />
            </PopoverTrigger>
            <PopoverContent side={isMobile ? 'top' : 'right'} align="start">
              <TrashBox />
            </PopoverContent>
          </Popover>
        </div>
        {/* 拖动条 */}
        <div
          onMouseDown={handleMouseDown}
          onClick={resetSidebar}
          className="bg-primary/10 absolute top-0 right-0 h-full w-1 cursor-ew-resize opacity-0 transition group-hover/sidebar:opacity-100"
        />
      </aside>
      <nav
        ref={navbarRef}
        className={cn(
          'bg-secondary absolute top-0 left-60 z-9999 h-16 w-[calc(100%-15rem)]',
          isResetting && 'transition-all duration-300',
          isMobile && 'left-0 w-full'
        )}
      >
        <div className="w-full bg-transparent px-3 py-2">
          {isCollapsed && (
            <MenuIcon
              onClick={showSidebar}
              role="button"
              className="text-muted-foreground h-6 w-6 rounded-sm hover:bg-neutral-300 dark:bg-neutral-600"
            />
          )}
          123456789012345678901234567890123456789012345678901234567890
        </div>
      </nav>
    </>
  )
}
