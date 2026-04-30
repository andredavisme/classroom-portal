/**
 * Apply school branding to CSS variables on <html>.
 * Call with a school object from the API.
 */
export function applyTheme(school) {
  if (!school) return
  const r = document.documentElement
  r.style.setProperty('--accent',   school.accent_color    || '#6366F1')
  r.style.setProperty('--accent2',  school.secondary_color || '#818CF8')
  // Derive a soft tint for backgrounds
  r.style.setProperty('--accent-bg', hexToRgba(school.accent_color || '#6366F1', 0.08))
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${alpha})`
}
