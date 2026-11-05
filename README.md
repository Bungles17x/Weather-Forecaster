# WeatherDesk 2.1.0 — Premium Weather Intelligence & Forecast Workstation

WeatherDesk is an independent educational weather workstation built with React, Vite, Leaflet, and an installable Progressive Web App (PWA). **All meteorological data feeds in this app are from the U.S. National Weather Service / NOAA**: point forecasts, hourly forecasts, gridded forecast fields, station observations, active alerts, and radar GIS products. This is not an official NWS product and must not replace official warnings or emergency instructions.

## Platform support

- **Desktop:** current Chrome, Edge, Firefox, and Safari browsers.
- **Android:** open the HTTPS site in a supported browser and choose Install app / Add to Home Screen when offered.
- **iPhone and iPad:** open the HTTPS site in Safari, tap Share, then Add to Home Screen.
- One responsive codebase powers the website and PWA. Native App Store or Google Play releases require separate packaging, device testing, and review.

## Main modules

- **Overview:** nearest available station report, current conditions, point-based active alerts, next forecast periods, and shortcuts.
- **Forecast:** NWS forecast periods and hourly forecast periods, with official descriptions and precipitation chances when available.
- **Radar & alerts:** interactive map; official NWS/NOAA national base reflectivity, composite reflectivity, precipitation-type, and echo-top WMS products; per-site base radial velocity, super-resolution reflectivity, hydrometeor classification, and precipitation accumulation products when advertised by a local radar; NWS alert polygons as a separate overlay; adjustable opacity; refresh/redraw and map controls; and a direct link to the official NWS radar viewer. The published NWS/NOAA OpenGeo WMS services do not require a commercial radar API key. Background map tiles are geographic context from third-party map providers, not weather data.
- **Alert center:** active point-based NWS alerts, severity filtering, search, timestamps, official instructions, and original product links.
- **Storm environment:** available NWS forecast-grid temperature, dew point, humidity, wind, gust, and thunder probability fields. Advanced indices not exposed by the NWS point/grid API are explicitly marked unavailable rather than filled with another provider's data.
- **Observations:** the latest available observation from a nearby station listed by the NWS API. A station may be operated by a partner rather than by NWS directly, and reports can be delayed or have missing fields.
- **Settings:** light/dark/system themes, temperature units, automatic refresh, source transparency, and local preferences. The first-run example is Washington, DC; visitors can search for their own location.
- **Daily briefing:** rule-based summaries of upcoming precipitation probabilities, below-freezing forecast periods, and alert-feed uncertainty. These are derived from loaded NWS data, not official warnings.
- **WeatherDesk AI:** dedicated conversation workspace. The local helper uses loaded weather context and meteorology explanations without an API key. An optional protected Node backend adds real model responses; see [AI-ASSISTANT.md](AI-ASSISTANT.md).

## Data-source policy

### Weather data

All meteorological data comes from official NWS/NOAA endpoints:

- Forecast point metadata: `https://api.weather.gov/points/{lat},{lon}`
- Text forecast: the `forecast` link returned by the point lookup
- Hourly forecast: the `forecastHourly` link returned by the point lookup
- Forecast grid: the `forecastGridData` link returned by the point lookup
- Active alerts: `https://api.weather.gov/alerts/active?point={lat},{lon}`
- Station observations: NWS `/observationStations` list and `/stations/{stationId}/observations/latest`
- Radar GIS products: NWS/NOAA IDP GeoServer listed on the [NWS CloudGIS page](https://www.weather.gov/gis/cloudgiswebservices)

The NWS API does not provide a free-text city geocoder, so Nominatim is used **only to convert user-entered U.S. place names and ZIP codes to coordinates**. No weather values come from the geocoder. If a user enters coordinates directly, that geocoder request is skipped.

### Important product limitations

- The NWS point forecast API does **not** provide a complete atmospheric sounding. CAPE, CIN, 0–6 km bulk shear, and storm-relative helicity therefore remain unavailable in this NWS-only version unless a compatible official NWS source is added. Surface observations cannot be used as a valid substitute.
- National reflectivity comes from the NWS/NOAA CONUS composite radar GIS service. Base velocity is a local radar product and may be unavailable for a given radar/layer. Use the linked official NWS radar viewer to select an available station and product when needed.
- Radar images can be delayed, absent, or limited by radar range, beam height, maintenance, and product availability. A velocity couplet does not independently confirm a tornado.
- NWS API station observations can be delayed and may be missing or quality-controlled. The app labels these as station reports, not observations at the user's exact coordinates.
- Empty alerts means no alerts were returned for that query at that time; it does not guarantee that no hazard exists. Confirm urgent information at [weather.gov/alerts](https://www.weather.gov/alerts).
- Public NWS APIs use reasonable rate limits. Requests are refreshed periodically and should not be polled aggressively.

## Radar troubleshooting

The default national radar mosaics are available without selecting a radar site. Local velocity and other site-specific products are looked up through each site's published WMS GetCapabilities catalog. If a browser blocks that catalog request, WeatherDesk attempts the documented site/product name directly and displays a status message if imagery still fails. Enter a four-character NEXRAD site ID in the radar toolbar to try a different site. A failed product stays clearly identified; the app does not silently present reflectivity as velocity. If a published layer remains unavailable, compare with the official [NWS radar viewer](https://radar.weather.gov/).

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm ci
npm test
npm run lint
npm run dev
```

For a production build:

```bash
npm run build
npm run preview
```

## Troubleshooting

### Build fails with "vite: not found"
If you see an error about vite not being found, run:
```bash
npm install
```

### Tests fail
Ensure all dependencies are installed:
```bash
npm ci
npm test
```

### Linting errors
Fix linting issues automatically:
```bash
npm run lint:fix
```

### Map/radar not loading
- Check that you have an internet connection
- Ensure you're using HTTPS or localhost (browser security requirements)
- Some radar layers may be temporarily unavailable from NWS
- Try refreshing the page or selecting a different radar site

Vite outputs the static site to `docs/` for GitHub Pages. Hash-based routing supports client-side navigation on static hosting without server-side rewrite rules.

## GitHub Pages deployment

1. Push the project to your repository's `main` branch.
2. Confirm `vite.config.js` has `base: '/Weather-Forecaster/'` for a repository named `Weather-Forecaster`. Set `VITE_BASE_PATH=/` for a custom root domain, or adjust the base path for a different repository name.
3. Open GitHub **Settings → Pages** and choose **GitHub Actions** as the source.
4. Push to `main` or run the workflow manually.
5. After deployment, test the live URL on a PC, Android, and iPhone/iPad over HTTPS.

## Public-release checklist

- [ ] Run `npm ci`, `npm test`, `npm run lint`, and `npm run build` locally and resolve errors.
- [ ] Verify current forecasts, hourly forecasts, grid fields, latest station observation, and point-based alerts on weather.gov/API responses.
- [ ] Confirm radar reflectivity and the configured local velocity product return real imagery. If the local velocity layer is unsupported, use the official NWS radar viewer and adjust configuration rather than displaying a false layer.
- [ ] Test geolocation, city/ZIP search, invalid search terms, alert feed failure, empty station responses, slow network, and offline app-shell launch.
- [ ] Test small phones, landscape orientation, keyboard access, high contrast, reduced motion, and screen-reader labels.
- [ ] Confirm third-party geographic basemap terms and attribution. Basemaps are not weather data.
- [ ] Add a privacy policy/contact address if the app later adds accounts, analytics, or feedback collection. Location preferences are stored locally in the browser.
- [ ] Keep the independence disclaimer visible and point users to official NWS warnings and local emergency authorities.

## Stack

React 18 · React Router · Vite 5 · Leaflet · NWS API (`api.weather.gov`) · NWS/NOAA CloudGIS radar services · Nominatim for location-name geocoding only · third-party geographic basemap tiles.

## Original WeatherDesk icon system

The UI uses local reusable SVG icons from `src/components/WeatherIcons.jsx`, styled by `src/components/WeatherIcons.css`. The same neon radar-cloud-lightning brand mark is supplied as `public/weather-icon.svg` and the generated PWA/Apple icon PNGs in `public/icons/`. Weather symbols are selected locally from official NWS forecast wording; icon artwork is local and does not make or alter weather-data requests.



## WeatherDesk 2.0 status

WeatherDesk 2.0 introduces token-based visual themes, accessibility-oriented display controls, and groundwork for broader AI provider configuration. This release remains an independent educational app; meteorological data must come from official NWS/NOAA services. See `RELEASE-NOTES.md` for implemented scope and verification limits.
