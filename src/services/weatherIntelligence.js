import { convertTemperature, convertWindSpeed, formatTemperature, observationValue, temperatureToFahrenheit } from './weatherData.js'

const finite = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
const localTime = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}
const localDayTime = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString([], { weekday: 'short', hour: 'numeric' })
}
const valueF = period => finite(period?.temperature) ? temperatureToFahrenheit(period.temperature, period.temperatureUnit || 'F') : null

export function buildWeatherContext({ weather, location, units = 'imperial', now = Date.now() }) {
  if (!weather) return { location, units, status: 'No weather bundle is loaded yet.', source: 'National Weather Service (Weather.gov)' }
  const obs = weather.observation || {}
  const hourly = (weather.hourly?.periods || []).filter(period => !period.startTime || Date.parse(period.startTime) >= now).slice(0, 24)
  const periodList = (weather.forecast?.periods || []).slice(0, 8)
  const alerts = (weather.alerts || []).slice(0, 8).map(item => {
    const p = item.properties || {}
    return { event: p.event, headline: p.headline, severity: p.severity, urgency: p.urgency, effective: p.effective, expires: p.expires, area: p.areaDesc, instructions: p.instruction }
  })
  const temp = observationValue(obs, 'temperature', convertTemperature)
  const wind = observationValue(obs, 'windSpeed', convertWindSpeed)
  const gust = observationValue(obs, 'windGust', convertWindSpeed)
  const dewPoint = observationValue(obs, 'dewpoint', convertTemperature)
  const humidity = observationValue(obs, 'relativeHumidity')
  const windDisplay = wind === null ? null : units === 'metric' ? `${Math.round(wind * 1.60934)} km/h` : `${Math.round(wind)} mph`
  const gustDisplay = gust === null ? null : units === 'metric' ? `${Math.round(gust * 1.60934)} km/h` : `${Math.round(gust)} mph`
  return {
    location,
    units,
    source: 'National Weather Service (Weather.gov)',
    bundleUpdatedAt: weather.updatedAt || null,
    observation: {
      station: weather.stationName || weather.stationId || null,
      observedAt: obs.timestamp || null,
      description: obs.textDescription || null,
      temperatureF: temp,
      temperatureDisplayed: temp === null ? null : formatTemperature(temp, units),
      windMph: wind,
      windSpeedDisplayed: windDisplay,
      gustMph: gust,
      gustDisplayed: gustDisplay,
      windDirection: obs.windDirection?.value ?? null,
      dewPointF: dewPoint,
      humidityPercent: humidity,
      visibilityMeters: obs.visibility?.value ?? null,
      pressure: { value: obs.seaLevelPressure?.value ?? obs.barometricPressure?.value ?? null, unitCode: obs.seaLevelPressure?.unitCode ?? obs.barometricPressure?.unitCode ?? null }
    },
    hourly: hourly.map(period => ({
      startTime: period.startTime,
      endTime: period.endTime,
      temperature: period.temperature ?? null,
      temperatureUnit: period.temperatureUnit || null,
      temperatureF: valueF(period),
      shortForecast: period.shortForecast || null,
      precipitationChancePercent: period.probabilityOfPrecipitation?.value ?? null,
      windSpeed: period.windSpeed || null,
      windDirection: period.windDirection || null,
      isDaytime: period.isDaytime ?? null
    })),
    forecastPeriods: periodList.map(period => ({
      name: period.name,
      startTime: period.startTime,
      temperature: period.temperature ?? null,
      temperatureUnit: period.temperatureUnit || null,
      shortForecast: period.shortForecast || null,
      detailedForecast: period.detailedForecast || null,
      precipitationChancePercent: period.probabilityOfPrecipitation?.value ?? null,
      windSpeed: period.windSpeed || null,
      windDirection: period.windDirection || null
    })),
    alerts,
    productErrors: weather.errors || {},
    limitations: [
      'Station observations may not represent the exact selected coordinates and may be delayed.',
      'An empty alert list means no point-based alerts were returned by this query; it does not guarantee that no hazard exists.',
      'No radar image is included in this context. Do not claim to have visually inspected the radar.'
    ]
  }
}

export function buildDailyBriefing(weather, units = 'imperial', now = Date.now()) {
  const items = []
  if (!weather) {
    return [{ id: 'loading', icon: 'info', title: 'Waiting for weather data', detail: 'Once the NWS forecast loads, Weather Forecaster will summarize precipitation timing and notable temperature changes.', kind: 'neutral' }]
  }

  const alerts = weather.alerts || []
  if (alerts.length) {
    const top = alerts[0]?.properties || {}
    items.push({ id: 'alerts', icon: 'alerts', title: `${alerts.length} active alert${alerts.length === 1 ? '' : 's'}`, detail: `${top.event || 'Official weather alert'}${top.expires ? ` · expires ${new Date(top.expires).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}` : ''}. Open the alert center to read the full official instructions.`, kind: 'warning' })
  } else if (weather.errors?.alerts) {
    items.push({ id: 'alerts-unavailable', icon: 'info', title: 'Alert status not confirmed', detail: 'The NWS alert request failed. Do not interpret this as an all-clear; check weather.gov/alerts.', kind: 'warning' })
  }

  const hourly = (weather.hourly?.periods || []).filter(period => !period.startTime || Date.parse(period.startTime) >= now).slice(0, 24)
  const precipitation = hourly.filter(period => finite(period.probabilityOfPrecipitation?.value)).map(period => ({ chance: Number(period.probabilityOfPrecipitation.value), startTime: period.startTime, shortForecast: period.shortForecast })).sort((a, b) => b.chance - a.chance)
  if (precipitation.length) {
    const peak = precipitation[0]
    if (peak.chance >= 40) {
      const time = localTime(peak.startTime)
      items.push({ id: 'precipitation', icon: 'precipitation', title: `Precipitation chance peaks at ${Math.round(peak.chance)}%`, detail: `${time ? `The highest listed chance in the available hourly periods is around ${time}` : 'An upcoming hour'}${peak.shortForecast ? ` (${peak.shortForecast.toLowerCase()})` : ''}. Probability is not a guarantee and is not the expected rainfall amount.`, kind: 'info' })
    } else {
      items.push({ id: 'precipitation', icon: 'precipitation', title: 'Lower precipitation chances nearby in time', detail: `The highest reported hourly probability in the available period is ${Math.round(peak.chance)}%. Forecast details can change; check again before plans that depend on dry weather.`, kind: 'positive' })
    }
  } else if (!weather.errors?.hourly) {
    items.push({ id: 'precipitation-unknown', icon: 'info', title: 'Precipitation timing unavailable', detail: 'The hourly forecast did not include usable precipitation probabilities, so this briefing will not guess.', kind: 'neutral' })
  }

  const freezing = hourly.map(period => ({ period, tempF: valueF(period) })).filter(item => item.tempF !== null && item.tempF <= 32).sort((a, b) => Date.parse(a.period.startTime || '') - Date.parse(b.period.startTime || ''))
  if (freezing.length) {
    const first = freezing[0]
    const time = localDayTime(first.period.startTime)
    items.push({ id: 'freezing', icon: 'ice', title: 'Below-freezing temperatures appear in the hourly forecast', detail: `${time ? `A forecast period at or below 32°F begins around ${time}` : 'At least one upcoming forecast period is at or below 32°F'}. If surfaces are wet, ice may be possible; the forecast temperature alone does not confirm icing.`, kind: 'warning' })
  } else if (hourly.some(period => finite(period.temperature))) {
    const min = Math.min(...hourly.map(valueF).filter(finite))
    if (min > 32) items.push({ id: 'freezing', icon: 'temperature', title: 'No below-freezing hour found in the available forecast', detail: `The lowest available hourly forecast temperature is about ${formatTemperature(min, units)} over the selected period. Missing hours and later forecast changes can affect this assessment.`, kind: 'positive' })
  }

  const temps = hourly.map(valueF).filter(finite)
  if (temps.length >= 6) {
    const delta = temps[5] - temps[0]
    if (Math.abs(delta) >= 8) {
      items.push({ id: 'trend', icon: 'temperature', title: delta > 0 ? 'Temperatures trend warmer' : 'Temperatures trend cooler', detail: `The forecast changes by about ${Math.round(Math.abs(delta) * (units === 'metric' ? 5 / 9 : 1))}°${units === 'metric' ? 'C' : 'F'} over the first six available hourly periods.`, kind: 'info' })
    }
  }

  if (!items.length) items.push({ id: 'general', icon: 'info', title: 'Your forecast is ready to explore', detail: 'No strong signal could be derived from the currently available data. Review the hourly forecast and active alerts before making weather-sensitive plans.', kind: 'neutral' })
  return items.slice(0, 4)
}

export function getLocalAssistantReply(question, context) {
  const q = String(question || '').toLowerCase()
  const obs = context?.observation || {}
  const hourly = context?.hourly || []
  const forecasts = context?.forecastPeriods || []
  const alerts = context?.alerts || []
  const available = context?.status ? false : Boolean(context?.bundleUpdatedAt || hourly.length || forecasts.length || alerts.length || obs.temperatureDisplayed)
  const place = context?.location || 'the selected location'
  const fmtTemp = f => {
    if (!finite(f)) return 'not available in the current feed'
    return formatTemperature(Number(f), context?.units || 'imperial')
  }
  const time = value => localDayTime(value) || 'an upcoming period'

  if (/\b(tornado|severe thunderstorm|flash flood|dangerous weather|is it safe|safe outside|safety)\b/.test(q)) {
    if (context?.status || context?.productErrors?.alerts) return `I cannot confirm whether ${place} is safe because the current weather or alert status is not fully available. Check the official NWS alerts at https://www.weather.gov/alerts and follow local emergency instructions. A missing or failed feed is not an all-clear.`
    if (alerts.length) return `Weather Forecaster has ${alerts.length} active point-based NWS alert${alerts.length === 1 ? '' : 's'} for ${place}, including ${alerts.slice(0, 3).map(a => a.event || 'Weather alert').join(', ')}. Open the Alert Center and read the full official instructions. I cannot independently confirm a tornado or determine that an outdoor area is safe from this data alone.`
    return `No active point-based NWS alerts were returned for ${place} in the loaded data, but that does not prove there is no hazard or mean conditions are safe. I cannot confirm a tornado from this weather summary. Check https://www.weather.gov/alerts and follow local emergency instructions.`
  }

  if (/\b(alerts?|warnings?|watches?|advisories?)\b/.test(q)) {
    if (context?.status) return `Weather data has not loaded for ${place} yet, so I cannot confirm the current alert status. Check https://www.weather.gov/alerts directly while the app loads. An unavailable or not-yet-loaded feed is not an all-clear.`
    if (alerts.length) return `Weather Forecaster has ${alerts.length} active point-based NWS alert${alerts.length === 1 ? '' : 's'} for ${place}:\n\n${alerts.slice(0, 5).map(a => `• ${a.event || 'Alert'}${a.severity ? ` (${a.severity})` : ''}${a.expires ? ` — expires ${time(a.expires)}` : ''}${a.headline ? `\n  ${a.headline}` : ''}`).join('\n\n')}\n\nOpen the Alert Center for the complete official text and instructions. This list reflects the last loaded query, not a guarantee that no other hazard exists.`
    if (context?.productErrors?.alerts) return `Weather Forecaster couldn't confirm current alerts for ${place} because the alert request failed. Please check https://www.weather.gov/alerts directly. An unavailable feed is not an all-clear.`
    return `No active point-based NWS alerts were returned for ${place} in the loaded data. That does not guarantee there is no hazard. For current official notices, check https://www.weather.gov/alerts.`
  }

  if (/\b(rain|precip|umbrella|dry window|wet|no rain)\b/.test(q)) {
    const candidates = hourly.filter(h => finite(h.precipitationChancePercent)).sort((a, b) => b.precipitationChancePercent - a.precipitationChancePercent)
    if (!candidates.length) return `The currently loaded hourly forecast has no usable precipitation probabilities for ${place}, so I can't responsibly estimate a rain window. Refresh Weather Forecaster or open the Forecast page to check for a newer feed.`
    if (/\b(dry window|no rain|when will it be dry|without rain)\b/.test(q)) {
      const lower = [...candidates].sort((a, b) => a.precipitationChancePercent - b.precipitationChancePercent)[0]
      return `The lowest listed precipitation probability in the loaded hourly periods for ${place} is ${Math.round(lower.precipitationChancePercent)}% around ${time(lower.startTime)}${lower.shortForecast ? ` (${lower.shortForecast.toLowerCase()})` : ''}. That is the best lower-risk window I can identify from the available probabilities, not a guarantee of dry weather. Compare neighboring hours in the Forecast page before choosing your plan.`
    }
    const peak = candidates[0]
    return `For ${place}, the highest precipitation probability shown in the loaded hourly forecast is ${Math.round(peak.precipitationChancePercent)}% around ${time(peak.startTime)}${peak.shortForecast ? ` (${peak.shortForecast.toLowerCase()})` : ''}. This is a forecast probability, not a guarantee or rainfall amount. ${candidates.some(x => x.precipitationChancePercent >= 40) ? 'Consider a backup plan for outdoor activities near the higher-probability period.' : 'The listed probabilities are relatively low over the available periods, but forecasts can change.'}`
  }

  if (/\b(freez|ice|icy|frost|below zero|cold enough)\b/.test(q)) {
    const below = hourly.filter(h => finite(h.temperatureF) && h.temperatureF <= 32).sort((a, b) => Date.parse(a.startTime || '') - Date.parse(b.startTime || ''))
    if (below.length) return `The loaded hourly forecast for ${place} includes temperatures at or below 32°F, beginning around ${time(below[0].startTime)}. That indicates freezing air temperatures are forecast, but it does not prove that frost or ice will form. Surface temperature, moisture, and local conditions matter. If roads or walkways may be wet, use caution and check official updates.`
    if (hourly.some(h => finite(h.temperatureF))) return `I don't see an upcoming hourly temperature at or below 32°F in the loaded periods for ${place}. This only covers the forecast data currently available; missing periods or later updates may change the picture.`
    return `The current hourly forecast lacks usable temperature values for ${place}, so I can't confirm freezing conditions. Check the Forecast page or refresh the NWS data.`
  }

  if (/\b(current temperature|what.*temperature|temp right now|current wind|wind speed|humidity right now|current conditions)\b/.test(q)) {
    const details = []
    if (obs.temperatureDisplayed || finite(obs.temperatureF)) details.push(`temperature ${obs.temperatureDisplayed || fmtTemp(obs.temperatureF)}`)
    if (obs.description) details.push(String(obs.description).toLowerCase())
    if (obs.windSpeedDisplayed) details.push(`wind ${obs.windSpeedDisplayed}`)
    if (obs.gustDisplayed) details.push(`gusts ${obs.gustDisplayed}`)
    if (finite(obs.humidityPercent)) details.push(`humidity ${Math.round(obs.humidityPercent)}%`)
    if (!details.length) return `The latest station observation for ${place} does not include those measurements. Refresh Weather Forecaster or open the Observations page; missing fields are not estimated.`
    return `The latest loaded station report for ${place} shows ${details.join(', ')}${obs.observedAt ? `, observed at ${new Date(obs.observedAt).toLocaleString()}` : ''}. This is a station report and may not reflect conditions at your exact coordinates.`
  }

  if (/\b(jacket|coat|wear|dress|outside|outdoor|commute|school|work|walk|bike|cycling)\b/.test(q)) {
    const next = hourly[0]
    const tempF = finite(next?.temperatureF) ? next.temperatureF : obs.temperatureF
    const desc = next?.shortForecast || obs.description
    const chance = next?.precipitationChancePercent
    if (!finite(tempF) && !desc) return `Weather data for ${place} is not complete enough to make a clothing recommendation yet. Open the Forecast page or refresh the current NWS feed.`
    let answer = `For ${place}, the ${next ? 'next hourly forecast' : 'latest station observation'} is ${fmtTemp(tempF)}${desc ? ` with ${desc.toLowerCase()}` : ''}.`
    if (finite(chance) && chance >= 40) answer += ` The listed precipitation chance is ${Math.round(chance)}%, so a rain layer may be useful.`
    if (finite(tempF) && tempF < 45) answer += ' A warm outer layer is worth considering, especially if you will be outside for a while.'
    else if (finite(tempF) && tempF >= 45 && tempF < 65) answer += ' A light jacket or extra layer may be comfortable, especially in wind or shade.'
    else if (finite(tempF) && tempF >= 65) answer += ' Lighter clothing may be comfortable, but account for wind, rain, and how long you will be outdoors.'
    answer += ' This is general planning guidance; check the forecast closer to departure.'
    return answer
  }

  if (/\b(tomorrow|forecast|next hours|hourly|what's it like|what is it like|weather today|current weather|weather now|weather like|conditions)\b/.test(q)) {
    const tomorrow = forecasts.filter(f => /tomorrow/i.test(f.name || ''))
    const selected = tomorrow.length ? tomorrow : forecasts.slice(0, 4)
    if (selected.length) return `Here's the loaded NWS forecast for ${place}:\n\n${selected.slice(0, 5).map(f => `**${f.name || time(f.startTime)}** — ${f.temperature == null ? 'Temperature not reported' : `${f.temperature}°${f.temperatureUnit || 'F'}`}\n${f.shortForecast || f.detailedForecast || 'No description provided'}${finite(f.precipitationChancePercent) ? `\nPrecipitation chance: ${Math.round(f.precipitationChancePercent)}%` : ''}`).join('\n\n')}\n\nThese are the forecast periods returned by the last successful Weather.gov fetch; check timestamps and refresh before time-sensitive plans.`
    if (!available) return `Weather data for ${place} has not loaded yet. Wait for Weather Forecaster's NWS feed to load, then ask again. You can also open the Forecast page.`
  }

  if (/\b(dew.?point|humidity|pressure|wind chill|heat index|reflectivity|velocity|radar|watch versus warning|watch vs warning|meteorology|learn|explain)\b/.test(q)) {
    const educational = [
      [/dew.?point/, 'Dew point is the temperature air would need to reach, at roughly constant pressure with water vapor unchanged, to become saturated. A dew point closer to the air temperature usually means higher relative humidity.'],
      [/humidity/, 'Relative humidity compares the water vapor present with the amount needed for saturation at the current temperature. It can rise as air cools even without adding moisture.'],
      [/pressure/, 'Air pressure is the force exerted by the weight of the air above a location. Pressure patterns help meteorologists understand larger-scale wind and weather systems; pressure alone does not identify a specific hazard.'],
      [/wind chill/, 'Wind chill describes how wind increases heat loss from exposed skin in cold conditions. It is not the actual air temperature and is not used as a heat index.'],
      [/heat index/, 'Heat index combines air temperature and humidity to estimate how hot conditions feel in shade with light wind. Sun exposure and activity can increase heat stress beyond that estimate.'],
      [/reflectivity/, 'Radar reflectivity measures the strength of returned energy from targets such as precipitation. Stronger returns can be associated with heavier precipitation or hail, but reflectivity alone cannot establish a tornado.'],
      [/velocity|radar/, 'Doppler radar velocity shows motion toward or away from the radar. Adjacent inbound and outbound velocities can indicate rotation, but interpretation depends on radar geometry, beam height, range, storm structure, and other evidence. A velocity signature by itself does not confirm a tornado.'],
      [/watch versus warning|watch vs warning/, 'In general, a watch means conditions are favorable for a hazard in a defined area; a warning means the hazard is occurring, imminent, or indicated according to the issuing authority criteria. Always follow the wording and instructions of the actual official alert.']
    ]
    const match = educational.find(([pattern]) => pattern.test(q))
    if (match) return match[1]
  }

  // General knowledge responses for non-weather questions
  const generalResponses = [
    [/hello|hi|hey|greetings/, 'Hello! I\'m Weather Forecaster\'s assistant. I can help you with weather questions using the loaded NWS data, and I can also answer general questions. What would you like to know?'],
    [/how are you|how's it going/, 'I\'m functioning well and ready to help! I have access to weather data and can assist with various questions.'],
    [/what can you do|help|capabilities/, 'I can:\n• Answer weather questions using loaded NWS data\n• Explain meteorology concepts\n• Help with general knowledge questions\n• Assist with planning and recommendations\n• Provide explanations on various topics\n\nFor full AI capabilities, you can configure the optional secure AI backend.'],
    [/who are you|what are you/, 'I\'m Weather Forecaster\'s assistant, an AI helper designed to assist with weather information and general questions. I can access loaded National Weather Service data and provide helpful responses.'],
    [/thank|thanks|appreciate/, 'You\'re welcome! I\'m happy to help. Feel free to ask if you have more questions.'],
    [/bye|goodbye|see you/, 'Goodbye! Stay safe and check the weather before heading out.'],
    [/joke|funny|humor/, 'Why did the weather report go to school? To improve its forecasting skills! ☺️'],
    [/meaning of life|purpose|existence/, 'That\'s a deep philosophical question! Many philosophers have explored this topic. From a practical standpoint, purpose often comes from contributing to others, learning, and finding what brings you joy.'],
    [/how to learn|study tips|better at/, 'Effective learning strategies include:\n• Active recall and spaced repetition\n• Teaching concepts to others\n• Breaking complex topics into smaller parts\n• Getting enough sleep and exercise\n• Staying curious and asking questions'],
    [/motivation|inspire|stay motivated/, 'Motivation often comes from:\n• Setting clear, achievable goals\n• Understanding your "why"\n• Celebrating small wins\n• Surrounding yourself with supportive people\n• Remembering that progress isn\'t always linear'],
    [/time|what time|current time/, `The current time is ${new Date().toLocaleTimeString()}. For weather-specific timing, I can help you understand forecast periods from the loaded data.`],
    [/date|what day|today/, `Today is ${new Date().toLocaleDateString()}. If you need weather for specific dates, check the Forecast page!`],
    [/programming|coding|code/, 'Programming involves writing instructions for computers. Popular languages include JavaScript, Python, Java, and more. Would you like help with a specific coding topic?'],
    [/math|calculation|calculate/, 'I can help with math concepts! What kind of math problem are you working on? I can explain concepts like algebra, calculus, statistics, and more.'],
    [/science|physics|chemistry|biology/, 'Science is the systematic study of the natural world. I can explain concepts in physics, chemistry, biology, and other scientific fields. What interests you?'],
    [/history|historical|past/, 'History helps us understand how we got here. I can discuss various historical periods, events, and figures. What era or topic interests you?'],
    [/recommend|suggestion|advice/, 'I\'d be happy to provide recommendations! For the best advice, it helps to know:\n• What you\'re trying to achieve\n• Your constraints or preferences\n• Any relevant context\n\nFeel free to share more details!'],
    [/random|surprise|tell me something/, 'Here\'s something interesting: The National Weather Service was established in 1870! It was originally called the Weather Bureau and was part of the U.S. Army Signal Corps before becoming a civilian agency.'],
    [/weather desk|about this app|what is this/, 'Weather Forecaster is an independent educational weather workstation that displays official National Weather Service data. It shows forecasts, radar, alerts, and observations from api.weather.gov. It\'s not an official NWS product but is designed to help you understand weather conditions.']
  ]

  const generalMatch = generalResponses.find(([pattern]) => pattern.test(q))
  if (generalMatch) return generalMatch[1]

  const summary = available
    ? `For ${place}, the latest loaded station report is ${obs.temperatureDisplayed || (finite(obs.temperatureF) ? fmtTemp(obs.temperatureF) : 'missing a temperature')}${obs.description ? ` and reports ${obs.description.toLowerCase()}` : ''}. There ${alerts.length === 1 ? 'is 1 active point-based alert' : `are ${alerts.length} active point-based alerts`} in the loaded response. The data bundle was updated ${context.bundleUpdatedAt ? new Date(context.bundleUpdatedAt).toLocaleString() : 'at an unknown time'}.`
    : `Weather data for ${place} is not loaded yet.`
  return `${summary}\n\nI'm currently using Weather Forecaster's on-device weather helper. I can answer weather questions from the loaded NWS data, explain meteorology concepts, and handle general knowledge questions. For more advanced AI capabilities like creative writing, complex reasoning, or specialized knowledge, you can configure the optional secure AI backend as described in AI-ASSISTANT.md.`
}
