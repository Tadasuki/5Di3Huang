import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Only smooth scroll if the user has not disabled it in OS settings,
    // though for page transitions 'auto' is usually preferred so it's instant.
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    })
  }, [pathname])

  return null
}
