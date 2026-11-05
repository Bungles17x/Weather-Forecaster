import { buildWeatherContext, getLocalAssistantReply } from './weatherIntelligence.js'

const ASSISTANT_ENDPOINT = String(import.meta.env.VITE_WEATHERDESK_AI_ENDPOINT || '').trim()

export function isRemoteAssistantConfigured() {
  return Boolean(ASSISTANT_ENDPOINT)
}

export async function askWeatherDesk({ question, weather, location, units, signal }) {
  const context = buildWeatherContext({ weather, location, units })
  if (!ASSISTANT_ENDPOINT) {
    return { text: getLocalAssistantReply(question, context), mode: 'local', context }
  }

  try {
    const response = await fetch(ASSISTANT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal,
      body: JSON.stringify({ message: question, context })
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const reason = payload?.error || `AI service returned HTTP ${response.status}.`
      throw new Error(reason)
    }
    if (typeof payload?.answer !== 'string' || !payload.answer.trim()) throw new Error('The AI service returned an empty answer.')
    return { text: payload.answer.trim(), mode: 'ai', context, model: payload.model || null }
  } catch (error) {
    if (signal?.aborted) throw error
    return {
      text: `${getLocalAssistantReply(question, context)}\n\nThe configured AI endpoint could not be reached (${error.message || 'connection error'}), so this response came from Weather Forecaster’s local helper rather than the AI model.`,
      mode: 'local-fallback', context, error: error.message || 'AI service unavailable'
    }
  }
}
