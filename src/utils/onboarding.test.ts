import { describe, expect, it } from 'vitest'
import { buildCreatorProfile, buildSessionTokenPayload, validateOnboardingForm, type OnboardingFormState } from './onboarding'

function makeForm(overrides: Partial<OnboardingFormState> = {}): OnboardingFormState {
  return {
    name: 'Harshit',
    creatorType: 'educator',
    niche: ['Tech'],
    platforms: ['youtube'],
    platformFollowers: { youtube: '12000' },
    tone: ['Educational'],
    strengths: 'Explainers',
    inspirations: 'Docs',
    contentLanguage: 'english',
    anthropicKey: 'sk-ant-x',
    geminiKey: '',
    openaiKey: '',
    activeAIProvider: 'anthropic',
    useDemoMode: false,
    ...overrides,
  }
}

describe('onboarding data flow', () => {
  it('validates required onboarding fields', () => {
    const invalid = makeForm({ name: '', tone: [] })
    const result = validateOnboardingForm(invalid)
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('name')
    expect(result.missing).toContain('tone')
  })

  it('allows demo mode with no AI key', () => {
    const demo = makeForm({ anthropicKey: '', useDemoMode: true })
    const result = validateOnboardingForm(demo)
    expect(result.valid).toBe(true)
  })

  it('builds creator profile correctly', () => {
    const profile = buildCreatorProfile(makeForm())
    expect(profile.name).toBe('Harshit')
    expect(profile.niche).toBe('Tech')
    expect(profile.handles[0].followerCount).toBe(12000)
  })

  it('builds integration payload with provider priority', () => {
    const payload = buildSessionTokenPayload(
      makeForm({
        anthropicKey: '',
        geminiKey: 'AIza-test',
        activeAIProvider: 'gemini',
      })
    )
    expect(payload.aiProvider).toBe('gemini')
    expect(payload.ai).toBe('AIza-test')
  })
})
