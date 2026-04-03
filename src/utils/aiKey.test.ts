import { describe, expect, it } from 'vitest'
import { resolveAIKeyFromState } from './aiKey'

describe('resolveAIKeyFromState', () => {
  it('uses provider-specific key first', () => {
    const value = resolveAIKeyFromState({
      aiKey: null,
      activeAIProvider: 'openai',
      anthropicKey: 'ant',
      geminiKey: 'gem',
      openaiKey: 'open',
    })
    expect(value).toBe('open')
  })

  it('falls back to first available key when provider key is missing', () => {
    const value = resolveAIKeyFromState({
      aiKey: null,
      activeAIProvider: 'openai',
      anthropicKey: '',
      geminiKey: 'gem',
      openaiKey: '',
    })
    expect(value).toBe('gem')
  })

  it('returns null when no key exists', () => {
    const value = resolveAIKeyFromState({
      aiKey: null,
      activeAIProvider: 'anthropic',
      anthropicKey: '',
      geminiKey: '',
      openaiKey: '',
    })
    expect(value).toBe(null)
  })
})
