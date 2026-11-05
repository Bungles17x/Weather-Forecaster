const finite = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))

export const WEATHER_TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_current_conditions',
      description: 'Retrieve the selected location and latest station-observation data already loaded by WeatherDesk, including its timestamp and source limitations.',
      parameters: { type: 'object', properties: {}, additionalProperties: false }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_forecast',
      description: 'Retrieve actual forecast periods already loaded by WeatherDesk. Use hourly for near-term timing, or daily for named daytime/nighttime periods.',
      parameters: {
        type: 'object', required: ['periodType'], additionalProperties: false,
        properties: { periodType: { type: 'string', enum: ['hourly', 'daily'] }, limit: { type: 'integer', minimum: 1, maximum: 24 } }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_active_alerts',
      description: 'Check the last loaded point-based NWS alert result, including whether the request failed. Never interpret a failed feed as an all-clear.',
      parameters: { type: 'object', properties: {}, additionalProperties: false }
    }
  },
  {
    type: 'function',
    function: {
      name: 'find_precipitation_windows',
      description: 'Find upcoming hourly periods meeting a precipitation-probability threshold from the loaded NWS hourly forecast. These are probabilities, not guarantees or rainfall amounts.',
      parameters: {
        type: 'object', additionalProperties: false,
        properties: { minProbability: { type: 'integer', minimum: 0, maximum: 100 }, limit: { type: 'integer', minimum: 1, maximum: 12 } }
      }
    }
  }
]

export function executeWeatherTool(name, args = {}, context = {}) {
  switch (name) {
    case 'get_current_conditions':
      return {
        location: context.location || null,
        source: context.source || 'Unknown source',
        bundleUpdatedAt: context.bundleUpdatedAt || null,
        observation: context.observation || null,
        dataAvailable: Boolean(context.observation?.temperatureDisplayed || context.observation?.description || context.observation?.observedAt),
        note: 'Station observations may come from a station away from the selected coordinates and may be delayed.'
      }
    case 'get_forecast': {
      const type = args.periodType === 'daily' ? 'daily' : args.periodType === 'hourly' ? 'hourly' : null
      if (!type) return { error: 'periodType must be hourly or daily.' }
      const source = type === 'hourly' ? context.hourly : context.forecastPeriods
      const limit = Math.max(1, Math.min(24, Number.isInteger(args.limit) ? args.limit : type === 'hourly' ? 12 : 8))
      return { location: context.location || null, periodType: type, source: context.source || 'Unknown source', bundleUpdatedAt: context.bundleUpdatedAt || null, dataAvailable: Array.isArray(source) && source.length > 0, periods: Array.isArray(source) ? source.slice(0, limit) : [], error: context.productErrors?.[type === 'hourly' ? 'hourly' : 'forecast'] || null }
    }
    case 'get_active_alerts': {
      const failed = Boolean(context.productErrors?.alerts)
      const alerts = Array.isArray(context.alerts) ? context.alerts : []
      return {
        location: context.location || null,
        source: context.source || 'Unknown source',
        bundleUpdatedAt: context.bundleUpdatedAt || null,
        status: failed ? 'unavailable' : context.status ? 'not_loaded' : alerts.length ? 'alerts_returned' : 'no_point_based_alerts_returned',
        dataAvailable: !failed && !context.status,
        alerts,
        error: context.productErrors?.alerts || null,
        caveat: 'An empty point-based alert result does not guarantee that no hazard exists. A failed or not-yet-loaded feed is not an all-clear.'
      }
    }
    case 'find_precipitation_windows': {
      const periods = Array.isArray(context.hourly) ? context.hourly : []
      const minProbability = Math.max(0, Math.min(100, finite(args.minProbability) ? Number(args.minProbability) : 30))
      const limit = Math.max(1, Math.min(12, Number.isInteger(args.limit) ? args.limit : 6))
      const reported = periods.filter(period => finite(period.precipitationChancePercent))
      const matches = reported.filter(period => Number(period.precipitationChancePercent) >= minProbability).sort((a, b) => Number(b.precipitationChancePercent) - Number(a.precipitationChancePercent)).slice(0, limit)
      return {
        location: context.location || null,
        source: context.source || 'Unknown source',
        bundleUpdatedAt: context.bundleUpdatedAt || null,
        minProbability,
        probabilitiesAvailable: reported.length > 0,
        periods: matches,
        note: 'Probability is not a guarantee and is not the expected rainfall amount. No matches does not imply zero precipitation risk if data is missing.'
      }
    }
    default:
      return { error: `Unsupported weather tool: ${String(name).slice(0, 80)}` }
  }
}
