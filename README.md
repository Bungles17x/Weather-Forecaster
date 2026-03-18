# 🌤️ Weather Forecaster

A professional weather forecasting application with real-time radar, severe weather alerts, and comprehensive meteorological data visualization.

## 🚀 Features

### 🌡️ Weather Data
- **Current Conditions**: Real-time temperature, humidity, wind speed, and atmospheric pressure
- **7-Day Forecast**: Detailed hourly and daily weather predictions
- **Weather Maps**: Interactive maps with multiple weather layers
- **Severe Weather Alerts**: Real-time NWS alerts with interactive polygons

### 🛡️ Advanced Radar System
- **IEM NEXRAD**: Official Iowa State Environmental Mesonet radar (Primary)
- **Smart Fallbacks**: 3-tier reliability system
  - IEM NEXRAD (Primary)
  - RainViewer (Backup)
  - Ventusky (Final)
- **Real-time Status**: Automatic source switching for uninterrupted coverage
- **Optimized Performance**: Fast loading with minimal lag
- **Clean Interface**: No UI clutter for maximum map visibility

### 🗺️ Interactive Maps
- **Full-Screen Display**: Maximum map visibility with clean interface
- **OpenStreetMap**: CartoDB Positron tiles optimized for mobile & PC
- **Weather Overlays**: IEM NEXRAD radar with severe weather polygons
- **Alert Polygons**: 448+ NWS severe weather warnings with interactive popups
- **Location Tracking**: Pulsing location marker with GPS updates
- **Scrolling Enabled**: Users can navigate through all app sections

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
- **Iowa State Environmental Mesonet**: Official NEXRAD reflectivity data
- **RainViewer**: Real-time precipitation radar (backup)
- **Ventusky**: Weather visualization (final backup)
- **National Weather Service**: Severe weather alerts and polygons

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
1. **Map Interaction**: Pan, zoom, and scroll through the full-screen map
2. **Weather Alerts**: Click on severe weather polygons for detailed information
3. **Location Tracking**: Pulsing marker shows your current location
4. **Radar Display**: IEM NEXRAD radar with automatic fallbacks

### Advanced Features
- **Smart Fallbacks**: Automatic radar source switching for reliability
- **Optimized Performance**: Fast loading with minimal UI elements
- **Clean Interface**: Maximum map visibility without clutter
- **Responsive Design**: Works seamlessly on mobile and desktop
- **Real-time Data**: Live severe weather alerts and radar updates

## 🐛 Troubleshooting

### Common Issues

1. **Radar Not Loading**
   - Check internet connection
   - Wait for automatic fallback to activate (IEM → RainViewer → Ventusky)
   - Refresh the page for latest data

2. **JavaScript Errors**
   - Clear browser cache
   - Ensure modern browser (Chrome, Firefox, Safari, Edge)
   - Check console for specific error messages

3. **Alerts Not Displaying**
   - Some areas may not have active alerts
   - Check NWS service status
   - Click on polygons to view alert details

4. **Scrolling Issues**
   - Ensure CSS is properly loaded
   - Check that map container is positioned correctly
   - Refresh page if scrolling is disabled

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

- **Iowa State Environmental Mesonet** for official NEXRAD radar data
- **National Weather Service** for severe weather alerts
- **RainViewer** for backup radar imagery
- **Ventusky** for weather visualization
- **Leaflet.js** for mapping functionality
- **OpenStreetMap** for base map tiles
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
