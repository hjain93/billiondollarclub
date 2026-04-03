import { useStore } from '../store'

export function resolveAIKeyFromState(s: any) {
  return (
    s.aiKey ||
    (
      s.activeAIProvider === 'anthropic'
        ? s.anthropicKey
        : s.activeAIProvider === 'gemini'
          ? s.geminiKey
          : s.openaiKey
    ) ||
    s.anthropicKey ||
    s.geminiKey ||
    s.openaiKey ||
    s.profile?.apiKey ||
    null
  )
}

export function getResolvedAIKey() {
  const s = useStore.getState() as any
  return resolveAIKeyFromState(s)
}

export function hasResolvedAIKey() {
  return Boolean(getResolvedAIKey())
}
