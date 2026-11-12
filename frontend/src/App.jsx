import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownToLine, Braces, ChevronDown, CircleHelp, Clock3, Code2, Command, Copy, ExternalLink, FileJson2, Globe2, History, Moon, Plus, Search, Send, Settings2, ShieldCheck, Sparkles, Sun, Trash2, X } from 'lucide-react'
import { executeRequest } from './services/api'
import { formatSize, makeRequestUrl } from './utils/request'
import './App.css'

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const TABS = ['Params', 'Headers', 'Authorization', 'Body']
const emptyRow = () => ({ key: '', value: '', enabled: true })
const defaultUrl = 'https://jsonplaceholder.typicode.com/users'
const initialHistory = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('api-tester-history') || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}
const escapeText = (value) => String(value ?? '')

function JsonViewer({ value }) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  const highlighted = text.split(/("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b(?:true|false|null)\b)/g)
  return <pre className="json-viewer">{highlighted.map((part, index) => {
    let type = 'plain'
    if (/^"/.test(part)) type = /"\s*$/.test(part) ? (text.includes(`${part}:`) ? 'key' : 'string') : 'string'
    if (/^-?\d/.test(part)) type = 'number'
    if (/^(true|false)$/.test(part)) type = 'boolean'
    if (part === 'null') type = 'null'
    return <span className={`token-${type}`} key={`${index}-${part}`}>{part}</span>
  })}</pre>
}

function App() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState(defaultUrl)
  const [params, setParams] = useState([emptyRow()])
  const [headers, setHeaders] = useState([emptyRow()])
  const [authType, setAuthType] = useState('none')
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [body, setBody] = useState('')
  const [activeTab, setActiveTab] = useState('Params')
  const [responseTab, setResponseTab] = useState('Body')
  const [responseMode, setResponseMode] = useState('Pretty')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState(initialHistory)
  const [selectedHistory, setSelectedHistory] = useState(null)
  const [dark, setDark] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const bodySupported = ['POST', 'PUT', 'PATCH'].includes(method)

  useEffect(() => {
    localStorage.setItem('api-tester-history', JSON.stringify(history))
  }, [history])

  const requestUrl = useMemo(() => makeRequestUrl(url, params), [url, params])
  const filteredHistory = history.filter((item) => `${item.method} ${item.url}`.toLowerCase().includes(historySearch.toLowerCase()))

  const updateRows = (setter, rows, index, field, value) => setter(rows.map((row, i) => i === index ? { ...row, [field]: value } : row))
  const addRow = (setter, rows) => setter([...rows, emptyRow()])
  const removeRow = (setter, rows, index) => setter(rows.length > 1 ? rows.filter((_, i) => i !== index) : [emptyRow()])

  const buildHeaders = () => {
    const outgoing = {}
    headers.forEach(({ key, value, enabled }) => {
      if (enabled && key.trim()) outgoing[key.trim()] = value
    })
    if (authType === 'bearer' && token.trim()) outgoing.Authorization = `Bearer ${token.trim()}`
    if (authType === 'basic') {
      const bytes = new TextEncoder().encode(`${username}:${password}`)
      let binary = ''
      bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
      outgoing.Authorization = `Basic ${btoa(binary)}`
    }
    return outgoing
  }

  const sendRequest = async () => {
    setError('')
    setResponse(null)
    if (!url.trim()) {
      setError('Enter a request URL to continue.')
      return
    }
    try {
      new URL(requestUrl)
    } catch {
      setError('Enter a valid absolute URL, including http:// or https://.')
      return
    }
    if (bodySupported && body.trim()) {
      try {
        JSON.parse(body)
      } catch (validationError) {
        setError(`Invalid JSON body: ${validationError.message}`)
        setActiveTab('Body')
        return
      }
    }
    const request = { url: requestUrl, method, headers: buildHeaders(), body: bodySupported ? body : '' }
    setLoading(true)
    try {
      const result = await executeRequest(request)
      setResponse(result)
      setResponseTab('Body')
      setHistory((previous) => [{ ...request, id: `${Date.now()}-${Math.random()}`, createdAt: new Date().toISOString() }, ...previous].slice(0, 40))
    } catch (requestError) {
      setError(requestError.message || 'The request could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = (item) => {
    try {
      const parsed = new URL(item.url)
      const loadedParams = [...parsed.searchParams.entries()].map(([key, value]) => ({ key, value, enabled: true }))
      parsed.search = ''
      parsed.hash = ''
      setUrl(parsed.toString())
      setParams(loadedParams.length ? loadedParams : [emptyRow()])
    } catch {
      setUrl(item.url)
      setParams([emptyRow()])
    }
    setMethod(item.method)
    setHeaders(Object.entries(item.headers || {}).filter(([key]) => key.toLowerCase() !== 'authorization').map(([key, value]) => ({ key, value: String(value), enabled: true })).concat(emptyRow()))
    const authorization = Object.entries(item.headers || {}).find(([key]) => key.toLowerCase() === 'authorization')?.[1] || ''
    if (authorization.startsWith('Bearer ')) {
      setAuthType('bearer')
      setToken(authorization.slice(7))
    } else if (authorization.startsWith('Basic ')) {
      setAuthType('none')
      setToken('')
    } else {
      setAuthType('none')
    }
    setBody(item.body || '')
    setSelectedHistory(item.id)
    setResponse(null)
    setError('')
    setSidebarOpen(false)
  }

  const clearRequest = () => {
    setMethod('GET')
    setUrl('')
    setParams([emptyRow()])
    setHeaders([emptyRow()])
    setAuthType('none')
    setToken('')
    setUsername('')
    setPassword('')
    setBody('')
    setResponse(null)
    setError('')
    setSelectedHistory(null)
  }

  const deleteHistory = (id) => {
    setHistory((items) => items.filter((item) => item.id !== id))
    if (selectedHistory === id) setSelectedHistory(null)
  }

  const prettyResponse = response ? (typeof response.responseBody === 'string' ? response.responseBody : JSON.stringify(response.responseBody ?? '', null, 2)) : ''
  const responseSize = response ? formatSize(new Blob([prettyResponse]).size) : '—'
  const copyResponse = async () => {
    if (!prettyResponse) return
    await navigator.clipboard.writeText(prettyResponse)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className={`app-shell ${dark ? 'theme-dark' : 'theme-light'}`}>
      <header className="topbar">
        <div className="brand-group">
          <button className="mobile-menu icon-button" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}><Command size={17} /></button>
          <div className="brand-mark"><Activity size={19} strokeWidth={2.5} /></div>
          <div className="brand-copy"><strong>api<span>tester</span></strong><small>WORKSPACE</small></div>
          <span className="workspace-divider" />
          <button className="workspace-button">Personal workspace <ChevronDown size={14} /></button>
        </div>
        <div className="topbar-actions">
          <span className="connection-indicator"><i /> Local API</span>
          <button className="icon-button" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
          <button className="avatar" title="Profile">P</button>
        </div>
      </header>
      <div className="app-content">
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-heading"><div><span className="eyebrow">WORKSPACE</span><h2>Collections</h2></div><button className="icon-button" onClick={clearRequest} title="New request"><Plus size={17} /></button></div>
          <button className="collection-card" onClick={clearRequest}>
            <div className="collection-icon"><Braces size={16} /></div>
            <div><strong>My requests</strong><small>{history.length} {history.length === 1 ? 'request' : 'requests'}</small></div>
            <ChevronDown size={15} className="collection-chevron" />
          </button>
          <div className="history-title"><span>HISTORY</span><button className="text-button" onClick={() => { setHistory([]); setSelectedHistory(null) }} disabled={!history.length}>Clear</button></div>
          <label className="search-field"><Search size={14} /><input placeholder="Search requests..." value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} /><kbd>⌘ K</kbd></label>
          <div className="history-list">
            {filteredHistory.length ? filteredHistory.map((item) => (
              <div className={`history-item ${selectedHistory === item.id ? 'history-selected' : ''}`} key={item.id}>
                <button className="history-load" onClick={() => loadHistory(item)} title={`Load ${item.method} ${item.url}`}>
                  <span className={`method-pill method-${item.method.toLowerCase()}`}>{item.method}</span>
                  <span className="history-url">{item.url.replace(/^https?:\/\//, '')}</span>
                </button>
                <button className="history-delete icon-button" onClick={() => deleteHistory(item.id)} aria-label="Delete history item"><Trash2 size={13} /></button>
              </div>
            )) : <div className="history-empty"><History size={17} /><span>{historySearch ? 'No matching requests' : 'Your requests will appear here'}</span></div>}
          </div>
          <div className="sidebar-bottom">
            <button className="sidebar-link"><Settings2 size={15} /> Settings <span>⌘ ,</span></button>
            <button className="sidebar-link"><CircleHelp size={15} /> Help & feedback <ExternalLink size={13} /></button>
            <div className="sidebar-footer"><div className="sync-dot" /> History is saved locally</div>
          </div>
        </aside>
        {sidebarOpen && <button className="sidebar-scrim" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}
        <main className="main-panel">
          <div className="page-toolbar"><div className="breadcrumb"><span>My requests</span><span className="crumb-slash">/</span><strong>New request</strong><span className="unsaved-dot" /></div><div className="toolbar-right"><button className="subtle-button"><ShieldCheck size={14} /> Safe mode</button><button className="icon-button" title="More options"><Settings2 size={16} /></button></div></div>
          <section className="request-section">
            <div className="section-intro"><div className="section-symbol"><Globe2 size={19} /></div><div><div className="eyebrow">HTTP REQUEST</div><h1>Request builder</h1><p>Configure and send a request to any endpoint.</p></div><button className="shortcut-hint"><Sparkles size={14} /> Quick start</button></div>
            <div className="request-bar">
              <label className="method-select-wrap"><select className={`method-select method-color-${method.toLowerCase()}`} aria-label="HTTP method" value={method} onChange={(event) => setMethod(event.target.value)}>{METHODS.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={13} /></label>
              <div className="url-input-wrap"><input value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') sendRequest() }} placeholder="https://api.example.com/v1/resource" aria-label="Request URL" /><button className="url-options" title="URL options"><ChevronDown size={15} /></button></div>
              <button className="send-button" onClick={sendRequest} disabled={loading}><Send size={15} />{loading ? 'Sending...' : 'Send'}<kbd>⌘ ↵</kbd></button>
              <button className="clear-button" onClick={clearRequest} title="Clear request">Clear</button>
            </div>
            <div className="request-tabs" role="tablist">{TABS.filter((tab) => tab !== 'Body' || bodySupported).map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} className={`request-tab ${activeTab === tab ? 'tab-active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}{tab === 'Params' && params.filter((row) => row.enabled && row.key).length > 0 && <span className="tab-count">{params.filter((row) => row.enabled && row.key).length}</span>}{tab === 'Headers' && <span className="tab-count">{headers.filter((row) => row.enabled && row.key).length}</span>}{tab === 'Body' && <span className="tab-label">JSON</span>}</button>)}</div>
            <div className="tab-content">
              {activeTab === 'Params' && <KeyValueEditor title="Query parameters" description="Add parameters to your request URL." rows={params} onChange={(index, field, value) => updateRows(setParams, params, index, field, value)} onAdd={() => addRow(setParams, params)} onRemove={(index) => removeRow(setParams, params, index)} showEnabled={false} />}
              {activeTab === 'Headers' && <KeyValueEditor title="Request headers" description="Add custom headers to send with this request." rows={headers} onChange={(index, field, value) => updateRows(setHeaders, headers, index, field, value)} onAdd={() => addRow(setHeaders, headers)} onRemove={(index) => removeRow(setHeaders, headers, index)} showEnabled />}
              {activeTab === 'Authorization' && <AuthorizationEditor authType={authType} setAuthType={setAuthType} token={token} setToken={setToken} username={username} setUsername={setUsername} password={password} setPassword={setPassword} />}
              {activeTab === 'Body' && <BodyEditor body={body} setBody={setBody} onPretty={() => { try { setBody(JSON.stringify(JSON.parse(body || '{}'), null, 2)) } catch (validationError) { setError(`Invalid JSON body: ${validationError.message}`) } }} />}
            </div>
          </section>
          <section className="response-section">
            <div className="response-heading"><div className="response-heading-left"><div className="response-symbol"><ArrowDownToLine size={17} /></div><div><h2>Response</h2><p>{response ? 'Request completed successfully.' : 'The response from your endpoint will appear here.'}</p></div></div>{response && <div className="response-metrics"><span className={`status-pill ${response.statusCode < 400 ? 'status-success' : 'status-error'}`}><i />{response.statusCode} {response.statusText}</span><span><Clock3 size={13} />{response.responseTimeMs} ms</span><span><FileJson2 size={13} />{responseSize}</span></div>}</div>
            {error && <div className="error-banner" role="alert"><div className="error-icon">!</div><div><strong>Request failed</strong><span>{error}</span></div><button className="icon-button" onClick={() => setError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
            <div className={`response-card ${!response && !loading && !error ? 'response-card-empty' : ''}`}>
              {loading ? <div className="loading-state"><div className="loader" /><strong>Sending request</strong><span>Waiting for the API response…</span></div>
                : response ? <>
                  <div className="response-card-toolbar"><div className="response-tabs"><button className={responseTab === 'Body' ? 'response-tab-active' : ''} onClick={() => setResponseTab('Body')}>Body</button><button className={responseTab === 'Headers' ? 'response-tab-active' : ''} onClick={() => setResponseTab('Headers')}>Headers <span>{Object.keys(response.responseHeaders || {}).length}</span></button></div>{responseTab === 'Body' && <div className="body-actions"><div className="segmented-control"><button className={responseMode === 'Pretty' ? 'segment-active' : ''} onClick={() => setResponseMode('Pretty')}>Pretty</button><button className={responseMode === 'Raw' ? 'segment-active' : ''} onClick={() => setResponseMode('Raw')}>Raw</button></div><button className="icon-button copy-button" onClick={copyResponse} title="Copy response body"><Copy size={14} />{copied && <span>Copied</span>}</button></div>}</div>
                  <div className="response-body">{responseTab === 'Headers' ? <ResponseHeaders headers={response.responseHeaders || {}} /> : responseMode === 'Pretty' && typeof response.responseBody !== 'string' ? <JsonViewer value={response.responseBody} /> : <pre className="raw-viewer">{prettyResponse}</pre>}</div>
                </> : error ? <div className="response-error-state"><div className="empty-response-icon"><Activity size={21} /></div><strong>Couldn’t reach your API</strong><span>Check that Spring Boot is running at <code>localhost:8080</code>, then try again.</span><button className="retry-button" onClick={sendRequest}><Send size={14} /> Try again</button></div>
                  : <div className="empty-state"><div className="empty-illustration"><div className="empty-orbit orbit-one" /><div className="empty-orbit orbit-two" /><div className="empty-center"><Code2 size={24} /></div><span className="orbit-dot dot-a" /><span className="orbit-dot dot-b" /><span className="orbit-dot dot-c" /></div><strong>Ready when you are</strong><span>Send a request to see the response here.</span><div className="empty-tip"><kbd>⌘</kbd><kbd>↵</kbd><span>to send</span></div></div>}
            </div>
          </section>
          <footer className="statusbar"><div><span className="statusbar-dot" /> Ready</div><span>API Tester <b>·</b> Frontend workspace</span></footer>
        </main>
      </div>
    </div>
  )
}

function KeyValueEditor({ title, description, rows, onChange, onAdd, onRemove, showEnabled }) {
  return <div className="editor-content"><div className="editor-title"><div><h3>{title}</h3><p>{description}</p></div><button className="add-row-button" onClick={onAdd}><Plus size={14} /> Add row</button></div><div className="key-value-grid"><div className="grid-heading">{showEnabled && <span /> }<span>KEY</span><span>VALUE</span><span /></div>{rows.map((row, index) => <div className="key-value-row" key={index}>{showEnabled && <input className="row-checkbox" type="checkbox" checked={row.enabled} onChange={(event) => onChange(index, 'enabled', event.target.checked)} aria-label="Enable row" />}<input value={row.key} onChange={(event) => onChange(index, 'key', event.target.value)} placeholder="Key" aria-label="Parameter key" /><input value={row.value} onChange={(event) => onChange(index, 'value', event.target.value)} placeholder="Value" aria-label="Parameter value" /><button className="icon-button row-delete" onClick={() => onRemove(index)} aria-label="Remove row"><X size={14} /></button></div>)}</div></div>
}

function AuthorizationEditor({ authType, setAuthType, token, setToken, username, setUsername, password, setPassword }) {
  return <div className="editor-content auth-editor"><div className="editor-title"><div><h3>Authorization</h3><p>Credentials are added to the outgoing request.</p></div><span className="auth-lock"><ShieldCheck size={14} /> Secure</span></div><label className="field-label">AUTH TYPE<select className="auth-select" value={authType} onChange={(event) => setAuthType(event.target.value)}><option value="none">No Auth</option><option value="bearer">Bearer Token</option><option value="basic">Basic Auth</option></select></label>{authType === 'bearer' && <label className="field-label auth-field">TOKEN<input type="password" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Enter your bearer token" /></label>}{authType === 'basic' && <div className="basic-fields"><label className="field-label">USERNAME<input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" autoComplete="username" /></label><label className="field-label">PASSWORD<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete="current-password" /></label></div>}<div className="auth-note"><ShieldCheck size={15} /><span>{authType === 'none' ? 'No authorization will be sent with this request.' : 'An Authorization header will be generated automatically when sent.'}</span></div></div>
}

function BodyEditor({ body, setBody, onPretty }) {
  const [jsonError, setJsonError] = useState('')
  const prettyClick = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(body || '{}'), null, 2)
      setBody(formatted)
      setJsonError('')
    } catch (error) {
      setJsonError(error.message)
      onPretty()
    }
  }
  return <div className="editor-content body-editor"><div className="editor-title"><div><h3>Request body</h3><p>Provide a JSON payload for this request.</p></div><button className="format-button" onClick={prettyClick}><Braces size={14} /> Pretty-print</button></div><div className="body-format-row"><span className="json-badge">JSON</span><span>application/json</span>{jsonError && <span className="inline-json-error">{jsonError}</span>}</div><textarea className="body-textarea" value={body} onChange={(event) => { setBody(event.target.value); setJsonError('') }} placeholder={'{\n  \"name\": \"Jane Doe\",\n  \"email\": \"jane@example.com\"\n}'} spellCheck="false" aria-label="JSON request body" /></div>
}

function ResponseHeaders({ headers }) {
  const entries = Array.isArray(headers) ? headers.map((header) => [header.name, header.value]) : Object.entries(headers)
  return <div className="response-header-list">{entries.length ? entries.map(([key, value]) => <div className="response-header-row" key={key}><span>{key}</span><code>{escapeText(Array.isArray(value) ? value.join(', ') : value)}</code></div>) : <div className="no-headers">No response headers returned.</div>}</div>
}

export default App
