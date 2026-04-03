import type { CreatorProfile, Platform } from '../types'

export interface OnboardingFormState {
  name: string
  creatorType: string
  niche: string[]
  platforms: Platform[]
  platformFollowers: Record<string, string>
  tone: string[]
  strengths: string
  inspirations: string
  contentLanguage: CreatorProfile['contentLanguage']
  anthropicKey: string
  geminiKey: string
  openaiKey: string
  activeAIProvider: 'anthropic' | 'gemini' | 'openai'
  useDemoMode: boolean
}

export interface OnboardingValidation {
  valid: boolean
  missing: string[]
}

function hasAnyAIKey(form: OnboardingFormState) {
  return Boolean(form.anthropicKey.trim() || form.geminiKey.trim() || form.openaiKey.trim())
}

export function validateOnboardingForm(form: OnboardingFormState): OnboardingValidation {
  const missing: string[] = []
  if (!form.name.trim()) missing.push('name')
  if (form.niche.length === 0) missing.push('niche')
  if (form.platforms.length === 0) missing.push('platforms')
  if (form.tone.length === 0) missing.push('tone')
  if (!form.useDemoMode && !hasAnyAIKey(form)) missing.push('ai_key_or_demo_mode')
  return { valid: missing.length === 0, missing }
}

export function buildCreatorProfile(form: OnboardingFormState): CreatorProfile {
  return {
    name: form.name.trim() || 'New Creator',
    niche: form.niche.join(', ') || 'General Creator',
    handles: form.platforms.map((pid) => ({
      platform: pid,
      handle: '',
      followerCount: parseInt(form.platformFollowers[pid] || '0', 10) || 0,
    })),
    strengths: form.strengths || '',
    tone: form.tone.length > 0 ? form.tone : ['Professional'],
    inspirations: form.inspirations || '',
    contentLanguage: form.contentLanguage || 'hinglish',
    goals: [],
  }
}

export function buildSessionTokenPayload(form: OnboardingFormState) {
  const payload = {
    anthropic: form.anthropicKey.trim() || undefined,
    gemini: form.geminiKey.trim() || undefined,
    openai: form.openaiKey.trim() || undefined,
    aiProvider: form.activeAIProvider,
    ai: undefined as string | undefined,
  }
  payload.ai =
    (form.activeAIProvider === 'anthropic' ? payload.anthropic : undefined) ||
    (form.activeAIProvider === 'gemini' ? payload.gemini : undefined) ||
    (form.activeAIProvider === 'openai' ? payload.openai : undefined) ||
    payload.anthropic ||
    payload.gemini ||
    payload.openai ||
    undefined
  return payload
}
