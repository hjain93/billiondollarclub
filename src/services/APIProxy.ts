/**
 * BFF (Backend-For-Frontend) Proxy Simulation
 * In a real production environment, this would be a Node.js/Go server.
 * Here, we simulate the security boundary by logic-locking the credentials.
 */

import { useStore } from '../store'

export class APIProxyService {
  private static instance: APIProxyService
  private requestLog: { timestamp: number; type: string }[] = []
  private readonly RATE_LIMIT = 50 // requests per minute
  private aiCache: Map<string, { timestamp: number; response: any }> = new Map()
  private readonly CACHE_TTL = 3600000 // 1 hour

  private constructor() {}

  static getInstance(): APIProxyService {
    if (!APIProxyService.instance) {
      APIProxyService.instance = new APIProxyService()
    }
    return APIProxyService.instance
  }

  private checkRateLimit() {
    const now = Date.now()
    this.requestLog = this.requestLog.filter(t => now - t.timestamp < 60000)
    if (this.requestLog.length >= this.RATE_LIMIT) {
      throw new Error('SEC_ERR: Global Rate Limit Exceeded. Cooling down...')
    }
  }

  async secureRequest(type: 'youtube' | 'instagram' | 'ai' | 'web', endpoint: string, data: any = {}): Promise<{ status: string; response?: string; data?: any; error?: string; source?: 'live' | 'mock' }> {
    this.checkRateLimit()
    
    // Simulate server processing time
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400))
    console.log(`[APIProxy] Secure Gate: ${type.toUpperCase()} -> ${endpoint}`)

    const { tokens = {} } = data
    const appState = useStore.getState() as any
    const globalAIKey =
      appState.aiKey ||
      (
        appState.activeAIProvider === 'anthropic'
          ? appState.anthropicKey
          : appState.activeAIProvider === 'gemini'
            ? appState.geminiKey
            : appState.openaiKey
      ) ||
      appState.anthropicKey ||
      appState.geminiKey ||
      appState.openaiKey

    const token =
      type === 'youtube'
        ? tokens.youtube
        : type === 'instagram'
          ? tokens.instagram
          : type === 'web'
            ? tokens.search
            : tokens.ai || tokens.anthropic || tokens.gemini || tokens.openai || data.key || globalAIKey

    try {
      if (!token && endpoint !== 'validate-key') {
         return { status: 'error', error: 'MISSING_API_KEY', source: 'mock' as const }
      }

      if (type === 'ai' && endpoint !== 'validate-key') {
        // Enforce monthly AI generation limit based on plan tier
        const store = useStore.getState() as any
        store.resetAIGenerationsIfNewMonth?.()
        const { planTier, aiGenerationsUsed } = useStore.getState() as any
        const { TIER_LIMITS } = await import('../utils/entitlements')
        const limit = TIER_LIMITS[planTier as keyof typeof TIER_LIMITS]?.aiGenerationsPerMonth ?? 10
        if (aiGenerationsUsed >= limit) {
          return { status: 'error', error: 'GENERATION_LIMIT_REACHED', source: 'mock' as const }
        }
      }

      if (type === 'ai') {
        const cacheKey = `${endpoint}:${data.prompt || ''}:${data.model || 'default'}`
        const cached = this.aiCache.get(cacheKey)
        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
          console.log(`[APIProxy.AI] Cache Hit: ${endpoint}`)
          return { status: 'success', source: 'live' as const, ...cached.response }
        }

        const result = await this.handleAI(endpoint, data, token)
        // Increment counter only on successful live response
        if (result.source === 'live' && endpoint !== 'validate-key') {
          const store = useStore.getState() as any
          store.incrementAIGenerations?.()
          
          // Cache the successful result
          this.aiCache.set(cacheKey, { timestamp: Date.now(), response: result })
        }
        return { status: 'success', source: 'live' as const, ...result }
      }
      if (type === 'youtube') return { status: 'success', ...await this.handleYouTube(endpoint, data, token) as any }
      if (type === 'instagram') return { status: 'success', ...await this.handleInstagram(endpoint, data, token) as any }
      if (type === 'web') return { status: 'success', ...await this.handleWebSearch(data.query, token) as any }
    } catch (e: any) {
      console.error(`[APIProxy] Error:`, e)
      return { status: 'error', error: e.message || 'API Request Failed' }
    }

    return { status: 'success', source: 'mock' }
  }

  private async handleAI(endpoint: string, data: any, token: string, attempt: number = 1): Promise<{ response?: string; source?: 'live' | 'mock'; status?: string; error?: string }> {
    if (endpoint === 'validate-key') return { response: 'valid' }

    const maxRetries = 3
    const baseDelay = 1000 // 1 second

    if (token) {
      const provider =
        data.provider ||
        data.tokens?.aiProvider ||
        (token.startsWith('sk-ant') ? 'anthropic' : token.startsWith('AIza') ? 'gemini' : token.startsWith('sk-') ? 'openai' : 'gemini')

      const model = data.model ||
        (provider === 'anthropic' ? 'claude-haiku-4-5-20251001' :
         provider === 'gemini' ? 'gemini-3-flash-preview' : 'gpt-4o-mini')

      const maxTokens = data.max_tokens || 4000
      const temperature = data.temperature ?? 0.7

      console.log(`[APIProxy.AI] Request: provider=${provider}, model=${model}, attempt=${attempt}/${maxRetries}`)

      try {
        let responseText = ""
        let httpStatus = 0

        if (provider === 'anthropic') {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': token,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
              'anthropic-dangerous-direct-browser-access': 'true',
              'x-creator-command-bypass-bridge': '1',
            },
            body: JSON.stringify({
              model,
              max_tokens: maxTokens,
              temperature,
              messages: [{ role: 'user', content: data.prompt || `Perform analysis for ${endpoint}` }]
            })
          })
          httpStatus = res.status

          // Handle rate limiting with exponential backoff
          if (res.status === 429 && attempt < maxRetries) {
            const retryAfter = parseInt(res.headers.get('retry-after') || '5') * 1000
            const delay = Math.min(retryAfter, baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000)
            console.log(`[APIProxy.AI] Rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt}/${maxRetries})`)
            await new Promise(r => setTimeout(r, delay))
            return this.handleAI(endpoint, data, token, attempt + 1)
          }

          if (!res.ok) {
            const errorJson = await res.json().catch(() => ({}))
            throw new Error(`Anthropic API ${res.status}: ${errorJson.error?.message || 'Unknown error'}`)
          }

          const json = await res.json()
          responseText = json.content?.[0]?.text || JSON.stringify(json)

        } else if (provider === 'gemini') {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: data.prompt || `Perform analysis for ${endpoint}` }] }],
              generationConfig: { temperature, maxOutputTokens: maxTokens }
            })
          })
          httpStatus = res.status

          if (res.status === 429 && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
            console.log(`[APIProxy.AI] Gemini rate limited, retrying in ${Math.round(delay)}ms`)
            await new Promise(r => setTimeout(r, delay))
            return this.handleAI(endpoint, data, token, attempt + 1)
          }

          if (!res.ok) {
            const errorJson = await res.json().catch(() => ({}))
            throw new Error(`Gemini API ${res.status}: ${errorJson.error?.message || 'Unknown error'}`)
          }

          const json = await res.json()
          responseText = json.candidates?.[0]?.content?.parts?.[0]?.text || JSON.stringify(json)

        } else {
          const res = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              input: data.prompt || `Perform analysis for ${endpoint}`,
              max_output_tokens: maxTokens,
              temperature,
            }),
          })
          httpStatus = res.status

          if (res.status === 429 && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
            console.log(`[APIProxy.AI] OpenAI rate limited, retrying in ${Math.round(delay)}ms`)
            await new Promise(r => setTimeout(r, delay))
            return this.handleAI(endpoint, data, token, attempt + 1)
          }

          if (!res.ok) {
            const errorJson = await res.json().catch(() => ({}))
            throw new Error(`OpenAI API ${res.status}: ${errorJson.error?.message || errorJson.message || 'Unknown error'}`)
          }

          const json = await res.json()
          responseText = json.output_text || json.output?.[0]?.content?.[0]?.text || JSON.stringify(json)
        }

        console.log(`[APIProxy.AI] Success: provider=${provider}, status=${httpStatus}, responseLength=${responseText.length}`)
        return { response: responseText, source: 'live' as const }

      } catch (e: any) {
        console.error(`[APIProxy.AI] Error (attempt ${attempt}/${maxRetries}):`, e.message)

        // Retry on network errors (not auth errors)
        const isRetryable = e.message.includes('network') || e.message.includes('timeout') || e.message.includes('fetch')
        if (isRetryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
          console.log(`[APIProxy.AI] Retrying after network error in ${Math.round(delay)}ms`)
          await new Promise(r => setTimeout(r, delay))
          return this.handleAI(endpoint, data, token, attempt + 1)
        }

        // Map error codes to user-friendly messages
        const errorMsg = e.message || 'API Request Failed'
        let userMessage = errorMsg

        if (errorMsg.includes('401') || errorMsg.includes('api key')) {
          userMessage = 'Invalid API key. Please check your key in Settings and try again.'
        } else if (errorMsg.includes('429')) {
          userMessage = 'Rate limit exceeded. Please wait a moment and try again.'
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          userMessage = 'Network error. Please check your internet connection.'
        } else if (errorMsg.includes('timeout')) {
          userMessage = 'Request timed out. Please try again.'
        }

        return { response: userMessage, status: 'error', error: userMessage }
      }
    }
    return { response: "Please set your AI key in Settings to enable live AI analysis.", status: 'error', error: 'MISSING_API_KEY' }
  }

  private async handleWebSearch(query: string, token: string) {
    if (!token) return { error: 'Search API key missing' }
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'in', hl: 'en', autostop: true })
      })
      const json = await res.json()
      return { source: 'live', data: json.organic || [] }
    } catch (e) {
      return { error: 'Search failed' }
    }
  }

  private async handleYouTube(endpoint: string, data: any, token: string) {
    const BASE = 'https://www.googleapis.com/youtube/v3'
    
    if (endpoint === 'stats' && token && data.channelId) {
      try {
        const chanRes = await fetch(`${BASE}/channels?part=statistics&id=${data.channelId}&key=${token}`)
        const chanJson = await chanRes.json()
        if (chanJson.items?.[0]) return { source: 'live', data: chanJson.items[0].statistics }
      } catch (e) { console.warn('YouTube stats failed') }
    }

    if (endpoint === 'trends' && token) {
      try {
        const res = await fetch(`${BASE}/videos?part=snippet,statistics&chart=mostPopular&maxResults=10&regionCode=IN&key=${token}`)
        const json = await res.json()
        return { 
          source: 'live', 
          data: (json.items || []).map((v: any) => ({
            id: v.id,
            topic: v.snippet.title,
            channel: v.snippet.channelTitle,
            viewCount: v.statistics.viewCount,
            publishedAt: v.snippet.publishedAt
          }))
        }
      } catch (e) {
        console.warn('YouTube Trends fetch failed.')
      }
    }
    
    // MOCK SKELETON RESPONSES (Phase 2 stub)
    if (endpoint === 'stats') {
      return { 
        status: 'success', 
        source: 'mock' as const, 
        data: { viewCount: "1450200", subscriberCount: "12500", videoCount: "42" } 
      }
    }
    
    if (endpoint === 'trends') {
      return {
        status: 'success',
        source: 'mock' as const,
        data: [
          { id: 'm1', topic: 'Will AI Replace Creators?', channel: 'Tech Guru', viewCount: '150000', publishedAt: new Date().toISOString() },
          { id: 'm2', topic: 'How I reached $10k/mo', channel: 'Biz Life', viewCount: '80000', publishedAt: new Date().toISOString() },
        ]
      }
    }

    return { status: 'error', error: 'API_FETCH_FAILED', source: 'mock' as const }
  }

  private async handleInstagram(endpoint: string, _data: any, token: string) {
    const BASE = 'https://graph.instagram.com'
    if (endpoint === 'real-data' && token) {
       try {
         const profileRes = await fetch(`${BASE}/me?fields=id,username,account_type,media_count&access_token=${token}`)
         const profileJson = await profileRes.json()
         
         const mediaRes = await fetch(`${BASE}/me/media?fields=id,caption,media_type,timestamp,like_count,comments_count&access_token=${token}&limit=12`)
         const mediaJson = await mediaRes.json()
         
         return { 
           source: 'live', 
           data: { 
             profile: profileJson, 
             posts: mediaJson.data || [] 
           } 
         }
       } catch (e) {
         console.warn('Instagram API fetch failed.')
       }
    }
    
    // MOCK SKELETON RESPONSES (Phase 2 stub)
    if (endpoint === 'real-data') {
      return {
        status: 'success',
        source: 'mock' as const,
        data: {
          profile: { id: "12345", username: "mocked_creator", account_type: "BUSINESS", media_count: 85 },
          posts: [
            { id: "p1", caption: "Day 1 of building in public! #growth", media_type: "IMAGE", timestamp: new Date().toISOString(), like_count: 450, comments_count: 24 },
            { id: "p2", caption: "New workflow optimization video out now.", media_type: "VIDEO", timestamp: new Date().toISOString(), like_count: 890, comments_count: 112 },
          ]
        }
      }
    }
    
    return { status: 'error', error: 'API_FETCH_FAILED', source: 'mock' as const }
  }
}


export const APIProxy = APIProxyService.getInstance()
