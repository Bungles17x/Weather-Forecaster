import { buildWeatherContext, getLocalAssistantReply } from './weatherIntelligence.js'

const ASSISTANT_ENDPOINT = String(import.meta.env.VITE_WEATHERDESK_AI_ENDPOINT || '').trim()
const REVIEWS_KEY = 'weatherforecasterReviewsV1'
const REVIEW_INTENT = /\b(review|reviews|feedback|rate the app|bug report|feature request|suggestion for (?:the|this) app|what do you think of (?:the|this) app|love (?:this|the) app|hate (?:this|the) app|review weather forecaster)\b/i
const ISSUES_URL = 'https://github.com/Bungles17x/Weather-Forecaster/issues'

export function isRemoteAssistantConfigured() {
  return Boolean(ASSISTANT_ENDPOINT)
}

export function getReviews() {
  try {
    const value = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]')
    return Array.isArray(value) ? value.filter(item => item && typeof item.text === 'string') : []
  } catch { return [] }
}

export function clearReviews() {
  try { localStorage.removeItem(REVIEWS_KEY) } catch { /* storage may be unavailable */ }
}

function saveReview(text) {
  const review = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: String(text).slice(0, 1000), createdAt: new Date().toISOString() }
  const reviews = [review, ...getReviews()].slice(0, 50)
  try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews)) } catch { /* keep in-memory confirmation anyway */ }
  return { review, count: reviews.length }
}

function reviewReply(saved) {
  return `Thank you for the feedback — I've recorded your review of Weather Forecaster (${saved.count} review${saved.count === 1 ? '' : 's'} stored locally in this browser). Reviews stay on this device; nothing is sent to a server automatically.\n\nIf you'd like to share it publicly or report a bug, you can also open an issue at ${ISSUES_URL} — include "review" or "feedback" in the title so it's easy to spot.\n\nIs there anything else I can help with — weather, writing, coding, or planning?`
}

export async function askWeatherDesk({ question, weather, location, units, signal }) {
  const context = buildWeatherContext({ weather, location, units })

  // Reviews are captured locally so feedback works with or without an AI backend.
  if (REVIEW_INTENT.test(String(question || ''))) {
    return { text: reviewReply(saveReview(question)), mode: 'local', context, reviewSaved: true }
  }

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
