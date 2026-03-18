@echo off
echo 🚀 Deploying Weather Forecaster to GitHub Pages...

REM Build the application
echo 📦 Building application...
call npm run build

REM Deploy to GitHub Pages
echo 📤 Deploying to GitHub Pages...
npx gh-pages --dist docs --repo https://github.com/Bungles17x/Weather-Forecaster.git

echo ✅ Deployment complete!
echo 🌐 Live at: https://Bungles17x.github.io/Weather-Forecaster/
pause
