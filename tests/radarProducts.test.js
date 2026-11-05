import test from 'node:test'
import assert from 'node:assert/strict'
import {
  OPEN_GEO,
  NATIONAL_RADAR_PRODUCTS,
  SITE_RADAR_PRODUCTS,
  findSiteRadarProduct,
  buildSiteWmsUrl,
  buildFallbackSiteLayerName
} from '../src/services/radarProducts.js'

test('national radar products point to the official public NWS OpenGeo endpoints', () => {
  assert.equal(NATIONAL_RADAR_PRODUCTS.bref.layerName, 'conus_bref_qcd')
  assert.equal(NATIONAL_RADAR_PRODUCTS.cref.layerName, 'conus_cref_qcd')
  assert.equal(NATIONAL_RADAR_PRODUCTS.ptype.layerName, 'conus_pcpn_typ')
  assert.equal(NATIONAL_RADAR_PRODUCTS.echoTops.layerName, 'conus_neet_v18')
  for (const product of Object.values(NATIONAL_RADAR_PRODUCTS)) {
    assert.ok(product.url.startsWith(OPEN_GEO))
    assert.equal(product.url.includes('api_key'), false)
  }
})

test('local radar catalog matching recognizes the advertised NEXRAD velocity layer', () => {
  const layers = [
    { name: 'KCCX_SR_BREF', title: 'Super Resolution Base Reflectivity' },
    { name: 'KCCX_SR_BVEL', title: 'Super Resolution Base Velocity' },
    { name: 'KCCX_BDHC', title: 'Digital Hydrometeor Classification' }
  ]
  assert.equal(findSiteRadarProduct(layers, SITE_RADAR_PRODUCTS.velocity).name, 'KCCX_SR_BVEL')
  assert.equal(findSiteRadarProduct(layers, SITE_RADAR_PRODUCTS.siteReflectivity).name, 'KCCX_SR_BREF')
  assert.equal(findSiteRadarProduct(layers, SITE_RADAR_PRODUCTS.hydrometeor).name, 'KCCX_BDHC')
  assert.equal(findSiteRadarProduct(layers, SITE_RADAR_PRODUCTS.oneHour), null)
})

test('site WMS helpers validate IDs and construct the documented product naming fallback', () => {
  assert.equal(buildSiteWmsUrl('KCCX'), `${OPEN_GEO}/kccx/ows`)
  assert.equal(buildFallbackSiteLayerName('kccx', SITE_RADAR_PRODUCTS.velocity), 'KCCX_SR_BVEL')
  assert.throws(() => buildSiteWmsUrl('not a site'), /four letters\/numbers/)
  assert.throws(() => buildFallbackSiteLayerName('X', SITE_RADAR_PRODUCTS.velocity), /four-character/)
})
