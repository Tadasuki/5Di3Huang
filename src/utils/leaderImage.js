/**
 * 人物 JSON 中 `image` 字段：须为可直接用于 <img src> 的地址。
 * 支持 https?:// 外链，或站内 /public 下的路径（以 / 开头）。
 */
export function getLeaderImageSrc(leader) {
  const raw = leader?.image
  if (typeof raw !== 'string') return ''
  const s = raw.trim()
  if (!s) return ''
  if (s.startsWith('https://') || s.startsWith('http://') || s.startsWith('/')) {
    return s
  }
  return ''
}
