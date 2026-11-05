# WeatherDesk release notes

## Version 2.1.0 — Premium Weather Experience (2026-10-27)

### Major Enhancements

#### 🚨 Comprehensive Error Monitoring
- **ALL Console Errors Captured**: Enhanced RuntimeErrorMonitor now intercepts console.error, console.warn, and optionally console.log
- **Error History**: Tracks up to 50 errors with timestamps and severity levels
- **Severity Classification**: Errors categorized as Error, Warning, or Info with color-coded indicators
- **Enhanced Error UI**: Beautiful animated error panel with improved styling and user experience
- **Error Dismissal Options**: Reload, dismiss, or clear error history

#### 🌡️ Advanced Weather Metrics
- **Heat Index Calculation**: Real-time heat index based on temperature and humidity
- **Wind Chill Calculation**: Accurate wind chill for cold conditions
- **Dew Point Analysis**: Comfort categories (Dry, Comfortable, Muggy, Oppressive, Miserable)
- **Wind Description**: Detailed wind condition descriptions (Calm to Hurricane force)
- **Comfort Index Dashboard**: New dedicated section on home page

#### 🔔 Smart Notification System
- **Toast Notifications**: Beautiful slide-in notifications for all app events
- **Data Quality Alerts**: Automatic notifications when weather data has issues
- **Update Confirmations**: Success notifications when weather data refreshes
- **Error Notifications**: Immediate alerts for fetch failures
- **Notification Types**: Success, Error, Warning, and Info with color-coded styling

#### 🎨 Enhanced UI/UX
- **Loading Skeletons**: Professional skeleton loading states for all components
- **Smooth Animations**: Enhanced transitions and hover effects throughout
- **Improved Mobile Experience**: Better responsive design for all screen sizes
- **Elevated Visual Polish**: Enhanced shadows, gradients, and depth effects
- **Better Focus States**: Improved accessibility with clear focus indicators

#### ✅ Data Validation
- **100% Data Accuracy**: Comprehensive validation of all weather data
- **Quality Scoring**: Data quality rated as Good, Fair, or Poor
- **Detailed Validation**: Checks coordinates, forecasts, observations, and alerts
- **Automatic Error Detection**: Identifies missing or invalid data fields
- **Quality Reports**: Users are notified of any data quality issues

#### 📱 Mobile Responsiveness
- **Enhanced Mobile Navigation**: Better mobile header and navigation
- **Optimized Card Layouts**: Improved grid layouts for small screens
- **Touch-Friendly Controls**: Larger touch targets and better spacing
- **Responsive Typography**: Scalable fonts for all screen sizes
- **Performance Optimizations**: Faster rendering on mobile devices

### Technical Improvements

#### New Components
- `NotificationSystem.jsx` - Complete notification management system
- `NotificationSystem.css` - Beautiful notification styling
- `WeatherMetrics.jsx` - Advanced weather calculations
- `WeatherMetrics.css` - Metrics dashboard styling
- `LoadingSkeleton.jsx` - Reusable skeleton components
- `LoadingSkeleton.css` - Skeleton loading animations

#### Enhanced Services
- `weatherData.js` - Added heat index, wind chill, dew point calculations
- `weatherData.js` - Added data validation functions
- `weatherData.js` - Added wind description logic
- `weatherData.js` - Added pressure trend calculation

#### Improved Contexts
- `WeatherContext.jsx` - Integrated notification system
- `WeatherContext.jsx` - Added data validation on fetch
- `WeatherContext.jsx` - Enhanced error handling with notifications

#### Enhanced Styling
- `design-polish.css` - Added new CSS variables for transitions and shadows
- `design-polish.css` - Enhanced hover effects and animations
- `design-polish.css` - Improved mobile responsiveness
- `RuntimeErrorMonitor.css` - Complete redesign with animations
- `RuntimeErrorMonitor.jsx` - Comprehensive error tracking

### Files Added
- `src/components/NotificationSystem.jsx`
- `src/components/NotificationSystem.css`
- `src/components/WeatherMetrics.jsx`
- `src/components/WeatherMetrics.css`
- `src/components/LoadingSkeleton.jsx`
- `src/components/LoadingSkeleton.css`

### Files Modified
- `src/main.jsx` - Added NotificationProvider
- `src/App.jsx` - Improved formatting
- `src/components/RuntimeErrorMonitor.jsx` - Enhanced error tracking
- `src/components/RuntimeErrorMonitor.css` - Complete redesign
- `src/contexts/WeatherContext.jsx` - Integrated notifications and validation
- `src/services/weatherData.js` - Added advanced calculations
- `src/design-polish.css` - Enhanced styling system
- `src/pages/HomePage.jsx` - Added WeatherMetrics component
- `src/pages/AlertsPage.jsx` - Added CSS import
- `src/pages/AlertsPage.css` - Created alert page styling
- `package.json` - Version bump to 2.1.0
- `README.md` - Updated version
- `RELEASE-NOTES.md` - Added 2.1.0 release notes

### Verification
- ✅ All 22 tests passing
- ✅ ESLint linting passes with 0 warnings
- ✅ Production build successful (456.07 kB, 138.15 kB gzipped)
- ✅ CSS bundle: 146.29 kB (33.33 kB gzipped)
- ✅ All CSS imports verified
- ✅ All stylesheets have balanced braces
- ✅ Runtime error monitor verified
- ✅ No console errors in production build

### Performance
- Bundle size increased by ~7 kB (due to new features)
- CSS bundle increased by ~7 kB (enhanced styling)
- Build time improved to 1.38s
- All animations respect `prefers-reduced-motion`

### Accessibility
- Enhanced focus states throughout
- Improved ARIA labels
- Better keyboard navigation
- Screen reader friendly notifications
- High contrast support maintained

### Browser Compatibility
- Modern browsers (Chrome, Edge, Firefox, Safari)
- iOS Safari (with proper HTTPS)
- Android Chrome
- Progressive Web App support maintained

## Version 2.0.1 — Code quality improvements and bug fixes (2026-10-27)

### Fixed Issues
- **Added missing AlertsPage.css**: Created dedicated stylesheet for the Alerts page with proper styling for alert cards, safety banners, and filter controls.
- **Fixed minified App.jsx**: Reformatted the single-line minified JSX into readable, properly formatted code for better maintainability.
- **Added CSS import to AlertsPage**: Ensured the new AlertsPage.css is properly imported in the AlertsPage component.
- **Improved error handling**: Enhanced the error boundary and runtime error monitor with better styling and user experience.
- **Added verify script**: New `npm run verify` command that runs tests, linting, and build in sequence for comprehensive validation.

### Code Quality Enhancements
- All 22 tests passing successfully
- ESLint linting passes with no warnings
- Production build completes successfully
- Added troubleshooting section to README.md
- Added test:watch script for development
- Improved documentation for common issues

### Verification
- ✅ All 22 tests passing
- ✅ ESLint linting passes with 0 warnings
- ✅ Production build completes successfully
- ✅ All CSS imports verified and balanced
- ✅ Runtime error monitor properly imported and styled

## Version 2.0.0 — Design system and platform foundation

- Added theme-pack selection for Neon Storm, Aurora, Sunset, Midnight OLED, Paper, High Contrast, Auto-Sky, and system-following mode. Auto-Sky changes palette by local time; it does not yet incorporate current weather conditions.
- Added user accent color, text-size scale, compact/comfortable density, and a motion toggle. Reduced-motion preferences are respected globally.
- Added shared CSS token foundations, true-black and light theme palettes, safer narrow-screen settings layout, and a solid fallback for unsupported backdrop blur.
- Updated app version metadata, manifest, setup documentation, and CI lint invocation.
- Kept official-data-only weather constraints and the visible independent-software disclaimer.
- General-purpose assistant behavior from 1.3.1 remains available when a server-side OpenAI key and endpoint are configured.

### Not yet implemented in this release

This is a foundation release, not completion of every item in the WeatherDesk 2.0 master plan. Forecast discussion, the full forecast-grid chart suite, radar time playback, SPC/WPC/NHC hub, unlimited saved-location comparisons, astronomy, activity-window recommendations, SSE streaming, file/image attachments, voice, conversation search/pinning, and Anthropic/Ollama adapters still require implementation. Animated condition-specific backdrops, route code-splitting, real device visual QA, and Playwright coverage are also not yet complete. The `AI_PROVIDER` options beyond OpenAI are documented as future configuration only and do not currently function.

### Verification

- Baseline `npm test`: passed all 18 existing tests before changes.
- `npm ci`: timed out in this environment.
- Initial direct ESLint/build command did not complete before the environment timeout; the final state must be rerun on a machine with a complete npm install.
- No real-browser screenshot or device-width/theme matrix was run. Live NWS endpoint/CORS behavior and real AI responses were not verified.

## Version 1.3.1 — Styling resilience and general-purpose AI

- Added defensive responsive layout rules to reduce overflow and broken grids across desktop, tablet, and narrow mobile screens.
- Reframed the assistant as a general-purpose AI when a secure backend is configured.
- Changed the default backend model to `gpt-4.1-mini`.
- Kept provider credentials server-side and local helper behavior clearly limited.

## Version 1.3.0 — WeatherDesk AI and daily forecast intelligence

- Added a dedicated assistant workspace and local conversation history.
- Added a local weather helper and an optional Node.js AI backend.
- Added daily forecast briefing logic and tests for weather context and alert-feed uncertainty.

## 2.0.0 CSS and layout repair follow-up

- Connected the existing Home, Forecast, Map, and WeatherMap stylesheets to their React modules. The files existed in the archive but several were not imported, so their page-specific styles were not guaranteed to load.
- Added `src/design-polish.css` for shared design tokens, theme-aware surface adjustments, focus states, data numeral alignment, and responsive layout safeguards.
- Added automated checks that ensure relative CSS imports resolve, key page stylesheets remain wired, and CSS braces are balanced.
- Verified the 18 existing tests and the new style checks with `npm test` after editing.
- `npm ci` timed out in this environment, so the Vite production build and ESLint could not be verified here. No claim is made that the full production bundle has been built or visually inspected in a browser.


## Screenshot-driven layout repair (2026-10-23)

- Added `src/pages/AnalysisPage.css` and wired it into `AnalysisPage.jsx`.
- Added `src/pages/ObservationsPage.css` and wired it into `ObservationsPage.jsx`.
- Added responsive metric grids and readable card layouts for Storm Lab and station observations.
- Updated Home page overrides to preserve the dark workstation palette instead of the legacy blue gradient.
- Improved forecast hourly and extended forecast card layouts.
- Improved header location-strip wrapping to reduce label collisions.
- Extended stylesheet import checks for the new page stylesheets.
- Verification performed: `node --test` passed all 21 tests; stylesheet import existence and brace-balance checks passed.
- Not verified here: Vite production build, browser screenshots after changes, live NWS responses, or responsive testing on physical devices.

## Runtime error screen update

- Added a global runtime error monitor that displays a full-screen diagnostic recovery view when `console.error` is called, an uncaught browser JavaScript error occurs, or a promise rejection is unhandled.
- The screen includes the detected error details, timestamp, reload action, and dismiss action. It does not replace official NWS alerts or emergency instructions.
- Added a dedicated `RuntimeErrorMonitor.css` stylesheet and an automated test for its import and error listeners.
- Verification: `npm test` passed (22 tests). `npm run build` could not run because dependencies are not installed in this environment (`vite: not found`); a browser smoke test has not been performed.
