export const OPEN_GEO = 'https://opengeo.ncep.noaa.gov/geoserver'

// Official public NWS/NOAA OpenGeo national mosaics. These endpoints do not
// require a commercial API key; map imagery is separate from api.weather.gov JSON.
export const NATIONAL_RADAR_PRODUCTS = {
  bref: {
    label: 'Base reflectivity · CONUS', title: 'National base reflectivity',
    url: `${OPEN_GEO}/conus/conus_bref_qcd/ows`, layerName: 'conus_bref_qcd', style: '',
    description: 'Quality-controlled MRMS base reflectivity (dBZ). Good for precipitation coverage and storm structure.',
    source: 'NWS / NOAA OpenGeo · CONUS BREF.QCD'
  },
  cref: {
    label: 'Composite reflectivity · CONUS', title: 'National composite reflectivity',
    url: `${OPEN_GEO}/conus/conus_cref_qcd/ows`, layerName: 'conus_cref_qcd', style: '',
    description: 'Quality-controlled composite reflectivity (dBZ), showing the maximum reflectivity through the storm column.',
    source: 'NWS / NOAA OpenGeo · CONUS CREF.QCD'
  },
  ptype: {
    label: 'Precipitation type · CONUS', title: 'Radar precipitation type',
    url: `${OPEN_GEO}/conus/conus_pcpn_typ/ows`, layerName: 'conus_pcpn_typ', style: '',
    description: 'MRMS precipitation classification, including rain, snow, and hail categories where available.',
    source: 'NWS / NOAA OpenGeo · CONUS PCPN.TYP'
  },
  echoTops: {
    label: 'Echo tops · CONUS', title: 'Radar echo tops',
    url: `${OPEN_GEO}/conus/conus_neet_v18/ows`, layerName: 'conus_neet_v18', style: '',
    description: 'MRMS echo-top height product. This is a storm-structure aid, not a direct measurement of cloud top.',
    source: 'NWS / NOAA OpenGeo · CONUS NEET.V18'
  }
}

// These products are advertised for NEXRAD sites by the NWS OpenGeo directory.
// Actual WMS layer names are discovered through GetCapabilities where possible.
export const SITE_RADAR_PRODUCTS = {
  velocity: { label: 'Base radial velocity · local radar', title: 'Local base radial velocity', suffix: 'SR_BVEL', tokens: ['SR_BVEL', 'BASE RADIAL VELOCITY'], explanation: 'Radial motion toward or away from a radar; a velocity signature alone does not confirm a tornado.' },
  siteReflectivity: { label: 'Super-resolution reflectivity · local radar', title: 'Local super-resolution reflectivity', suffix: 'SR_BREF', tokens: ['SR_BREF', 'SUPER RESOLUTION BASE REFLECTIVITY'], explanation: 'Single-radar 0.5° base reflectivity (dBZ), useful for examining local storm structure.' },
  hydrometeor: { label: 'Hydrometeor classification · local radar', title: 'Local hydrometeor classification', suffix: 'BDHC', tokens: ['BDHC', 'DIGITAL HYDROMETEOR CLASSIFICATION'], explanation: 'Radar algorithm classification of likely targets such as rain, ice, and hail; classifications can be uncertain.' },
  oneHour: { label: '1-hour precipitation · local radar', title: 'Local 1-hour precipitation', suffix: 'BOHA', tokens: ['BOHA', 'ONE HOUR PRECIPITATION', '1 HOUR PRECIPITATION'], explanation: 'Radar-estimated one-hour precipitation accumulation. It is an estimate, not a rain gauge measurement.' },
  stormTotal: { label: 'Storm-total precipitation · local radar', title: 'Local storm-total precipitation', suffix: 'BDSA', tokens: ['BDSA', 'STORM TOTAL PRECIPITATION'], explanation: 'Radar-estimated accumulation since the precipitation event began; interpret with local rain gauges and official guidance.' }
}

export function findSiteRadarProduct(layers, definition) {
  if (!Array.isArray(layers) || !definition?.tokens) return null
  const tokenMatches = item => {
    const text = `${item.name || ''} ${item.title || ''}`.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
    return definition.tokens.some(token => text.includes(token.toUpperCase().replace(/[^A-Z0-9]+/g, '_')))
  }
  return layers.find(tokenMatches) || null
}

export function buildSiteWmsUrl(site) {
  const normalized = String(site || '').trim().toLowerCase()
  if (!/^[a-z0-9]{4}$/.test(normalized)) throw new Error('Radar site IDs must be four letters/numbers, such as KCCX.')
  return `${OPEN_GEO}/${normalized}/ows`
}

export function buildFallbackSiteLayerName(site, definition) {
  const normalized = String(site || '').trim().toUpperCase()
  if (!/^[A-Z0-9]{4}$/.test(normalized) || !definition?.suffix) throw new Error('A valid four-character radar site and product are required.')
  return `${normalized}_${definition.suffix}`
}
