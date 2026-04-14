/**
 * Adjust color opacity
 */
export function withOpacity(hexColor, opacity) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Lighten a hex color
 */
export function lighten(hexColor, amount = 0.2) {
  const r = Math.min(255, parseInt(hexColor.slice(1, 3), 16) + 255 * amount);
  const g = Math.min(255, parseInt(hexColor.slice(3, 5), 16) + 255 * amount);
  const b = Math.min(255, parseInt(hexColor.slice(5, 7), 16) + 255 * amount);
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
