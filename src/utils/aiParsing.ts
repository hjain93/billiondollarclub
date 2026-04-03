function sanitizeJsonCandidate(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
}

export function extractJSONArray(raw: string): any[] | null {
  if (!raw) return null
  const cleaned = sanitizeJsonCandidate(raw)

  const parseCandidates: string[] = [cleaned]
  const codeFenceMatch = raw.match(/```json([\s\S]*?)```/i) || raw.match(/```([\s\S]*?)```/i)
  if (codeFenceMatch?.[1]) parseCandidates.push(sanitizeJsonCandidate(codeFenceMatch[1]))

  const arrayMatch = raw.match(/\[[\s\S]*\]/)
  if (arrayMatch?.[0]) parseCandidates.push(arrayMatch[0])

  const objectMatch = raw.match(/\{[\s\S]*\}/)
  if (objectMatch?.[0]) parseCandidates.push(objectMatch[0])

  for (const candidate of parseCandidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (Array.isArray(parsed)) return parsed
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray((parsed as any).ideas)) return (parsed as any).ideas
        if (Array.isArray((parsed as any).trends)) return (parsed as any).trends
        if (Array.isArray((parsed as any).data)) return (parsed as any).data
        if (Array.isArray((parsed as any).items)) return (parsed as any).items
      }
    } catch {
      // Try next candidate.
    }
  }

  return null
}
