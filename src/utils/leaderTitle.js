export function getLeaderShortTitle(leader) {
  if (!leader) return ''

  const shortTitle = typeof leader.shortTitle === 'string' ? leader.shortTitle.trim() : ''
  if (shortTitle) return shortTitle

  // 庙号本身就足够短，且更像“外部标签”
  const templeName = typeof leader.templeName === 'string' ? leader.templeName.trim() : ''
  if (templeName) return templeName

  const title = typeof leader.title === 'string' ? leader.title.trim() : ''
  if (!title) return ''

  // 优先抽取最常见且“外部可读”的核心头衔
  const preferred = [
    '主席',
    '皇帝',
    '天皇',
    '国王',
    '女王',
    '总统',
    '总理',
    '首相',
    '可汗',
    '大汗',
    '书记',
  ]
  for (const key of preferred) {
    if (title.includes(key)) return key
  }

  // 否则按分隔符拆分，取最短的一个片段
  const parts = title
    .split(/[、,，/／\s]+/g)
    .map(s => s.trim())
    .filter(Boolean)

  if (parts.length === 0) return title
  return parts.slice().sort((a, b) => a.length - b.length)[0]
}

