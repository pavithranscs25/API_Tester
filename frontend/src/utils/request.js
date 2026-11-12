export function makeRequestUrl(baseUrl, params) {
  if (!baseUrl.trim()) return ''
  try {
    const url = new URL(baseUrl)
    params.forEach(({ key, value, enabled }) => {
      if (enabled && key.trim()) url.searchParams.set(key.trim(), value)
    })
    return url.toString()
  } catch {
    return baseUrl
  }
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
