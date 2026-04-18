function cleanPart(s) {
  return typeof s === 'string' ? s.trim() : ''
}

export function inlineMarkupToPlain(input) {
  const raw = typeof input === 'string' ? input : String(input ?? '')
  if (!raw) return ''

  // {{ann|label|title|content|source}} -> label
  let out = raw.replace(/\{\{ann\|([\s\S]*?)(?:\}\}|$)/gi, (_m, body) => {
    const text = String(body || '')
    const idx = text.indexOf('|')
    if (idx < 0) return cleanPart(text)
    return cleanPart(text.slice(0, idx))
  })

  // {{link|target|label}} -> label
  out = out.replace(/\{\{link\|([\s\S]*?)(?:\}\}|$)/gi, (_m, body) => {
    const text = String(body || '')
    const idx = text.indexOf('|')
    if (idx < 0) return cleanPart(text)
    return cleanPart(text.slice(idx + 1))
  })

  return out
}

export function inlineMarkupInitial(input, fallback = '?') {
  const plain = inlineMarkupToPlain(input).trim()
  return plain ? plain.charAt(0) : fallback
}

