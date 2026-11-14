export function makeRequestUrl(baseUrl, params) {
  if (!baseUrl.trim()) return ''

  try {
    const url = new URL(baseUrl)

    const managedKeys = new Set(
      params.map(({ key }) => key.trim()).filter(Boolean)
    )

    managedKeys.forEach((key) => {
      url.searchParams.delete(key)
    })

    params.forEach(({ key, value, enabled }) => {
      const normalizedKey = key.trim()

      if (enabled && normalizedKey) {
        url.searchParams.append(normalizedKey, value)
      }
    })

    return url.toString()
  } catch {
    return baseUrl
  }
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}