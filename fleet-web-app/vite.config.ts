// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor libraries:
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['react-redux', '@reduxjs/toolkit'],
          'pdf-vendor': ['html2canvas', 'jspdf'],
          // Feature modules:
          'auth': [
            './src/features/auth/pages/Signin.tsx',
            './src/features/auth/services/auth.service.ts',
          ],
          'dashboard': [
            './src/features/dashboard/pages/DashboardPage.tsx',
          ],
          'vehicles': [
            './src/features/vehicles/pages/VehiclesPage.tsx',
          ],
          'drivers': [
            './src/features/drivers/pages/DriversPage.tsx',
          ],
          'trips': [
            './src/features/trips/pages/TripsPage.tsx',
          ],
          // Split reports into smaller chunks
          'reports-main': [
            './src/features/reports/pages/ReportsPage.tsx',
          ],
          'reports-charts': [
            './src/features/reports/components/MonthlyTrends.tsx',
            './src/features/reports/components/FuelAnalysis.tsx',
            './src/features/reports/components/DriverInsights.tsx',
            './src/features/reports/components/MaintenanceSummary.tsx',
          ],
          'reports-stats': [
            './src/features/reports/components/OverviewStats.tsx',
            './src/features/reports/components/VehiclePerformanceTable.tsx',
          ],
          'maintenance': [
            './src/features/maintenance/pages/MaintenancePage.tsx',
          ],
          'reclamations': [
            './src/features/reclamations/pages/DriverIssuesPage.tsx',
          ],
          'settings': [
            './src/features/settings/pages/SettingsPage.tsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Warn for chunks > 600kb
    sourcemap: false, // Disable sourcemaps in production for smaller build
  },});