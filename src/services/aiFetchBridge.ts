import { APIProxy } from './APIProxy'
import { getResolvedAIKey } from '../utils/aiKey'

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages'
const BRIDGE_BYPASS_HEADER = 'x-creator-command-bypass-bridge'

function readHeader(input: RequestInfo | URL, init: RequestInit | undefined, name: string) {
  const fromInit = init?.headers ? new Headers(init.headers).get(name) : null
  if (fromInit && fromInit !== 'undefined' && fromInit !== 'null') return fromInit
  if (typeof Request !== 'undefined' && input instanceof Request) {
    const fromReq = input.headers.get(name)
    if (fromReq && fromReq !== 'undefined' && fromReq !== 'null') return fromReq
  }
  return null
}

async function readBody(input: RequestInfo | URL, init: RequestInit | undefined) {
  if (typeof init?.body === 'string') return init.body
  if (typeof Request !== 'undefined' && input instanceof Request) {
    try {
      return await input.clone().text()
    } catch {
      return ''
    }
  }
  return ''
}

export function installAIFetchBridge() {
  if (typeof window === 'undefined' || (window as any).__creatorAIFetchBridgeInstalled) return
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const bypass = readHeader(input, init, BRIDGE_BYPASS_HEADER)

    if (url === ANTHROPIC_MESSAGES_URL && !bypass) {
      try {
        const rawBody = await readBody(input, init)
        const payload = rawBody ? JSON.parse(rawBody) : {}
        const prompt = payload?.messages?.[0]?.content || payload?.input || ''
        const apiKey = readHeader(input, init, 'x-api-key') || getResolvedAIKey()

        const response = await APIProxy.secureRequest('ai', 'anthropic-bridge', {
          key: apiKey,
          prompt,
          model: payload?.model,
          max_tokens: payload?.max_tokens,
          temperature: payload?.temperature,
          tokens: { ai: apiKey },
        })

        const text = response.response || ''
        return new Response(
          JSON.stringify({ content: [{ type: 'text', text }] }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      } catch (e: any) {
        return new Response(
          JSON.stringify({ error: { message: e?.message || 'AI bridge failure' } }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    return originalFetch(input, init)
  }

  ;(window as any).__creatorAIFetchBridgeInstalled = true
}
