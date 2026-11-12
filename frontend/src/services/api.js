const API_BASE_URL = 'http://localhost:8080'

export async function executeRequest(request) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}/api/requests/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch (error) {
    throw new Error(`Unable to connect to the API Tester backend at ${API_BASE_URL}. ${error.message}`)
  }

  const responseText = await response.text()
  let data
  try {
    data = responseText ? JSON.parse(responseText) : {}
  } catch {
    throw new Error(`Backend returned an unreadable response (HTTP ${response.status}).`)
  }

  if (!response.ok) {
    const message = typeof data.message === 'string' ? data.message : typeof data.error === 'string' ? data.error : response.statusText
    throw new Error(`Backend request failed (${response.status}): ${message || 'Unknown error'}`)
  }

  if (typeof data.statusCode !== 'number' || typeof data.statusText !== 'string' || !('responseBody' in data)) {
    throw new Error('Backend response is missing required fields: statusCode, statusText, or responseBody.')
  }

  return {
    statusCode: data.statusCode,
    statusText: data.statusText,
    responseTimeMs: Number(data.responseTimeMs) || 0,
    responseHeaders: data.responseHeaders && typeof data.responseHeaders === 'object' ? data.responseHeaders : {},
    responseBody: data.responseBody,
  }
}
