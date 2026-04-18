import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import './AnnotatedText.css'

function normalizeAnnotations(list) {
  if (!Array.isArray(list)) return []
  return list
    .map((x, i) => ({
      id: String(x?.id || `note_${i + 1}`),
      label: typeof x?.target === 'string' ? x.target.trim() : '',
      title: typeof x?.title === 'string' ? x.title.trim() : '',
      content: typeof x?.content === 'string' ? x.content.trim() : '',
      source: typeof x?.source === 'string' ? x.source.trim() : '',
    }))
    .filter(x => x.label && (x.title || x.content || x.source))
}

function parseInlineAnnotation(raw) {
  const text = String(raw || '')
  const parts = []
  let cursor = 0
  for (let i = 0; i < text.length && parts.length < 3; i += 1) {
    if (text[i] === '|') {
      parts.push(text.slice(cursor, i))
      cursor = i + 1
    }
  }
  parts.push(text.slice(cursor))
  if (parts.length < 4) return null
  const [label, title, content, ...rest] = parts
  const clean = s => (typeof s === 'string' ? s.trim() : '')
  const out = {
    label: clean(label),
    title: clean(title),
    content: clean(content),
    source: clean(rest.join('|')),
  }
  if (!out.label || !out.content) return null
  return out
}

function parseInlineLink(raw) {
  const text = String(raw || '')
  const idx = text.indexOf('|')
  if (idx <= 0 || idx >= text.length - 1) return null
  const target = text.slice(0, idx)
  const label = text.slice(idx + 1)
  return {
    target: target.trim(),
    label: label.trim()
  }
}

function splitByTargets(text, notes) {
  let segments = [{ type: 'text', value: text }]
  notes.forEach(note => {
    const next = []
    segments.forEach(seg => {
      if (seg.type !== 'text') {
        next.push(seg)
        return
      }
      const parts = seg.value.split(note.label)
      if (parts.length === 1) {
        next.push(seg)
        return
      }
      parts.forEach((part, i) => {
        if (part) next.push({ type: 'text', value: part })
        if (i < parts.length - 1) next.push({ type: 'ann', value: note })
      })
    })
    segments = next
  })
  return segments
}

function parseInlineSegments(text) {
  const input = typeof text === 'string' ? text : String(text ?? '')
  // Support both closed `{{ann|...}}` and accidental unclosed tags till end of text.
  const regex = /\{\{(ann|link)\|([\s\S]*?)(?:\}\}|$)/g
  const nodes = []
  let last = 0
  let m
  while ((m = regex.exec(input)) !== null) {
    if (m.index > last) nodes.push({ type: 'text', value: input.slice(last, m.index) })
    const type = m[1]
    const raw = m[2]
    
    if (type === 'ann') {
      const ann = parseInlineAnnotation(raw)
      if (ann) nodes.push({ type: 'ann', value: ann })
      else nodes.push({ type: 'text', value: m[0] })
    } else if (type === 'link') {
      const lk = parseInlineLink(raw)
      if (lk) nodes.push({ type: 'link', value: lk })
      else nodes.push({ type: 'text', value: m[0] })
    }
    
    last = regex.lastIndex
  }
  if (last < input.length) nodes.push({ type: 'text', value: input.slice(last) })
  return nodes
}

function InlineAnnotation({ ann }) {
  const [hoveredAnchor, setHoveredAnchor] = useState(false)
  const [hoveredPopover, setHoveredPopover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState(null)
  const rootRef = useRef(null)
  const hideTimerRef = useRef(null)
  const visible = hoveredAnchor || hoveredPopover || pinned

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  useEffect(() => {
    function onDocDown(e) {
      const el = rootRef.current
      if (!el) return
      if (!el.contains(e.target)) setPinned(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

  useEffect(() => {
    if (!visible) return
    function updatePosition() {
      const el = rootRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const sideGap = 12
      const desiredWidth = Math.min(560, Math.max(300, Math.floor(vw * 0.84)))
      const leftMin = sideGap
      const leftMax = vw - desiredWidth - sideGap
      const left = Math.max(leftMin, Math.min(leftMax, rect.left))

      // Keep popover close to the trigger; flip above on short screens.
      const estimatedHeight = vw <= 1024 ? 210 : 190
      const belowTop = rect.bottom + 8
      const canShowBelow = belowTop + estimatedHeight <= vh - sideGap
      const top = canShowBelow ? belowTop : Math.max(sideGap, rect.top - estimatedHeight - 8)
      setPopoverStyle({ top, left, width: desiredWidth })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [visible])

  return (
    <span
      className={`annotated-text ${visible ? 'is-active' : ''}`}
      ref={rootRef}
      onMouseEnter={() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
        setHoveredAnchor(true)
      }}
      onMouseLeave={() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
        hideTimerRef.current = setTimeout(() => setHoveredAnchor(false), 120)
      }}
    >
      <span
        role="button"
        tabIndex={0}
        className={`annotated-text-trigger ${pinned ? 'is-pinned' : ''}`}
        onClick={() => setPinned(v => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setPinned(v => !v)
          }
        }}
      >
        {ann.label}
      </span>
      {visible && popoverStyle && createPortal(
        <div
          className="annotation-popover annotation-popover-portal"
          role="note"
          style={popoverStyle}
          onMouseEnter={() => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
            setHoveredPopover(true)
            setPinned(true)
          }}
          onMouseLeave={() => setHoveredPopover(false)}
        >
          {ann.title && <div className="annotation-title">{ann.title}</div>}
          <div className="annotation-content">{ann.content}</div>
          {ann.source && <div className="annotation-source">{ann.source}</div>}
        </div>,
        document.body
      )}
    </span>
  )
}

export default function AnnotatedText({ text, annotations }) {
  const input = useMemo(() => (typeof text === 'string' ? text : String(text ?? '')), [text])
  const notes = useMemo(() => normalizeAnnotations(annotations), [annotations])

  const segments = useMemo(() => {
    const pre = splitByTargets(input, notes)
    const out = []
    pre.forEach(seg => {
      if (seg.type !== 'text') {
        out.push(seg)
      } else {
        out.push(...parseInlineSegments(seg.value))
      }
    })
    return out
  }, [input, notes])

  const lines = useMemo(() => segments.reduce((acc, seg) => {
    if (seg.type !== 'text') {
      acc[acc.length - 1].push(seg)
      return acc
    }
    const split = seg.value.split('\n')
    split.forEach((part, idx) => {
      acc[acc.length - 1].push({ type: 'text', value: part })
      if (idx < split.length - 1) acc.push([])
    })
    return acc
  }, [[]]), [segments])

  return (
    <>
      {lines.map((line, li) => (
        <Fragment key={li}>
          {line.map((seg, si) => {
            if (seg.type === 'ann') {
              return <InlineAnnotation key={`${li}-${si}`} ann={seg.value} />
            } else if (seg.type === 'link') {
              const isExternal = seg.value.target.startsWith('http')
              const commonStyle = {
                color: 'inherit',
                textDecoration: 'underline',
                textDecorationColor: 'currentColor',
                textUnderlineOffset: '3px',
                font: 'inherit',
              }
              return isExternal ? (
                <a 
                  key={`${li}-${si}`} 
                  href={seg.value.target} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={commonStyle}
                >
                  {seg.value.label}
                </a>
              ) : (
                <Link 
                  key={`${li}-${si}`} 
                  to={seg.value.target}
                  style={commonStyle}
                >
                  {seg.value.label}
                </Link>
              )
            }
            return <Fragment key={`${li}-${si}`}>{seg.value}</Fragment>
          })}
          {li < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  )
}
