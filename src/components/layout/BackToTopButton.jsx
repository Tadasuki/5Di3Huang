import { useEffect, useState } from 'react'
import './BackToTopButton.css'

const SHOW_AFTER_PX = 280

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      aria-label="返回顶部"
      className={`back-to-top${visible ? ' is-visible' : ''}`}
      onClick={scrollToTop}
    >
      <span className="back-to-top-icon">↑</span>
    </button>
  )
}
