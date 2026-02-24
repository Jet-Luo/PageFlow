import { useCallback, useEffect, useRef } from 'react'

/**
 * 手写防抖 hook：将高频调用合并，在最后一次调用的 delay 毫秒后执行一次。
 *
 * 设计要点：
 * 1. timerRef  —— 跨渲染保持 timer id，不触发重渲染
 * 2. callbackRef —— 始终持有最新的 callback，避免 stale closure 问题，
 *                   同时让返回函数的引用稳定（不依赖 callback 本身）
 * 3. 返回函数通过 useCallback + [delay] 依赖保证引用稳定，
 *    调用方可安全地将其放入 useEffect 依赖数组
 * 4. 组件卸载时清除未执行的 timer，防止调用已卸载组件的状态
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 每次渲染后同步最新的 callback，不加依赖数组 = 每次渲染后都更新
  const callbackRef = useRef<T>(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  // 组件卸载时清理残留 timer
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      // 每次调用先清除上一个 timer，实现"重置计时"
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        callbackRef.current(...args)
      }, delay)
    },
    [delay] // 只有 delay 改变时才重建函数
  )
}
