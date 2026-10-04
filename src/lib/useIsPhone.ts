import { useEffect, useState } from 'react'

const BREAKPOINT = 768

export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(() => (typeof window === 'undefined' ? false : window.innerWidth < BREAKPOINT))

  useEffect(() => {
    const onResize = () => setIsPhone(window.innerWidth < BREAKPOINT)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return isPhone
}
