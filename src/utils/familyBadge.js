export function getFamilyBadgeText(family) {
  const customBadge = typeof family?.badge === 'string' ? family.badge.trim() : ''
  if (customBadge) return customBadge

  const name = typeof family?.name === 'string' ? family.name.trim() : ''
  if (!name) return '族'
  return name.charAt(0)
}
