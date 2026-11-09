import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import lazyWithRetry from './utils/lazyWithRetry'
import ConnectivityStatus from './components/ConnectivityStatus'
import LoadingSkeleton from './components/LoadingSkeleton'
import MobileNav from './components/MobileNav'

import HomePage from './pages/HomePage'

const MapPage = lazyWithRetry(() => import('./pages/MapPage'))
const ForecastPage = lazyWithRetry(() => import('./pages/ForecastPage'))
const SettingsPage = lazyWithRetry(() => import('./pages/SettingsPage'))
const AlertsPage = lazyWithRetry(() => import('./pages/AlertsPage'))
const AnalysisPage = lazyWithRetry(() => import('./pages/AnalysisPage'))
const ObservationsPage = lazyWithRetry(() => import('./pages/ObservationsPage'))
const AssistantPage = lazyWithRetry(() => import('./pages/AssistantPage'))
const ErrorHistoryPage = lazyWithRetry(() => import('./pages/ErrorHistoryPage'))

function RouteFallback() {
  return (
    <main className="route-loading" aria-busy="true" aria-label="Loading page">
      <LoadingSkeleton type="card" count={3} />
    </main>
  )
}

export default function App() {
  return (
    <>
      <ConnectivityStatus />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/observations" element={<ObservationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/errors" element={<ErrorHistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <MobileNav />
    </>
  )
}
