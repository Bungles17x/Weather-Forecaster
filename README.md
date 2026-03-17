# 🌤️ Weather Forecaster

A professional weather forecasting application with real-time radar, severe weather alerts, and comprehensive meteorological data visualization.

## 🚀 Features

### 🌡️ Weather Data
- **Current Conditions**: Real-time temperature, humidity, wind speed, and atmospheric pressure
- **7-Day Forecast**: Detailed hourly and daily weather predictions
- **Weather Maps**: Interactive maps with multiple weather layers
- **Severe Weather Alerts**: Real-time NWS alerts with interactive polygons

### 🛡️ Advanced Radar System
- **6 Radar Sources**: Multiple redundant sources for maximum reliability
  - RainViewer (Primary)
  - Ventusky
  - Weather.gov (NOAA)
  - RadarScope
- **Real-time Status**: Live radar health monitoring
- **Smart Fallbacks**: Automatic source switching for uninterrupted coverage
- **Multiple Layers**: Precipitation, wind, temperature, clouds, and pressure

### 🗺️ Interactive Maps
- **Multiple Base Maps**: OpenStreetMap, Satellite, Terrain, Dark Mode
- **Weather Overlays**: Radar, satellite, and weather data layers
- **Alert Polygons**: Click-to-center severe weather warning areas
- **Location Tracking**: GPS-based location with automatic updates

### 📱 Responsive Design
- **Mobile Optimized**: Works seamlessly on all devices
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Accessibility**: WCAG compliant with keyboard navigation

## 🛠️ Technology Stack

- **Frontend**: React 18 with modern hooks
- **Mapping**: Leaflet.js with OpenStreetMap
- **Build Tool**: Vite 5 for fast development and optimized builds
- **Deployment**: GitHub Pages with automated deployment

## 🌐 Live Demo

Visit the live application: [Weather Forecaster](https://Bungles17x.github.io/Weather-Forecaster/)

## 📦 Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bungles17x/Weather-Forecaster.git
   cd Weather-Forecaster
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## 🚀 Deployment

### GitHub Pages
The application is configured for automatic deployment to GitHub Pages:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to GitHub Pages**
   ```bash
   npm run deploy
   ```

### Manual Deployment
The build output is located in the `docs/` directory and can be deployed to any static hosting service.

## 📊 API Sources

### Weather Data
- **OpenWeatherMap**: Current conditions and forecasts
- **National Weather Service**: Alerts and radar data
- **NOAA**: Satellite and meteorological data

### Radar Sources
- **RainViewer**: Real-time precipitation radar
- **Ventusky**: Weather visualization
- **Weather.gov**: Official NOAA radar
- **RadarScope**: Aviation weather data

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_OPENWEATHER_API_KEY=your_api_key_here
```

### API Keys
- **OpenWeatherMap**: Register for free API key at [openweathermap.org](https://openweathermap.org/api)
- **Other sources**: Used without API keys (free tier)

## 🎯 Usage

### Basic Navigation
1. **Location Search**: Use the search bar to find any location
2. **Map Controls**: Zoom, pan, and switch between map layers
3. **Weather Layers**: Toggle radar, satellite, and weather overlays
4. **Alert Interaction**: Click on alert polygons for detailed information

### Advanced Features
- **Layer Control**: Bottom-left panel for map and overlay selection
- **Status Indicators**: Real-time radar and system status
- **Location Updates**: Click anywhere on the map to update location
- **Alert Centering**: Click weather alerts to center map on warning areas

## 🐛 Troubleshooting

### Common Issues

1. **Radar Not Loading**
   - Check internet connection
   - Wait for automatic fallback to activate
   - Status indicator shows active radar sources

2. **Location Not Found**
   - Enable location services in browser
   - Try manual location search
   - Check browser permissions

3. **Alerts Not Displaying**
   - Some areas may not have active alerts
   - Check NWS service status
   - Refresh the page for latest data

### Performance Tips
- Use modern browsers for best performance
- Disable unused map layers for faster loading
- Clear browser cache if experiencing issues

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Development Guidelines
- Follow React best practices
- Use semantic HTML5 elements
- Ensure mobile responsiveness
- Test on multiple browsers
- Document new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenWeatherMap** for weather data APIs
- **National Weather Service** for alert data
- **Leaflet.js** for mapping functionality
- **RainViewer** for radar imagery
- **GitHub** for hosting and CI/CD

## 📞 Support

For support, please:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the documentation

---

**Made with ❤️ for weather enthusiasts and emergency preparedness**

---

## 🔗 Quick Links

- [Live Demo](https://Bungles17x.github.io/Weather-Forecaster/)
- [GitHub Repository](https://github.com/Bungles17x/Weather-Forecaster)
- [Issues](https://github.com/Bungles17x/Weather-Forecaster/issues)
- [Pull Requests](https://github.com/Bungles17x/Weather-Forecaster/pulls)

---

**Last Updated**: 2026-03-17
**Version**: 1.0.0
