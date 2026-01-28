import { useEffect, useState } from 'react'

export const useOrigin = () => {
  const [mounted, setMounted] = useState(false)
  // origin 是当前页面的源地址，例如 https://example.com，包括协议、主机名和端口，但不包括路径和查询参数
  // 在服务器端渲染时，window 对象是不存在的，因此需要确保代码只在客户端执行
  // 这里通过 useEffect 确保只在客户端渲染时获取 origin，避免水合问题
  // 如果 window.location.origin 不存在，则返回空字符串
  // https://developer.mozilla.org/zh-CN/docs/Web/API/Window/location
  const origin =
    typeof window !== 'undefined' && window.location.origin ? window.location.origin : ''

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true) // 为了避免水合问题，确保只在客户端渲染时获取 origin
  }, [])

  return mounted ? origin : ''
}
