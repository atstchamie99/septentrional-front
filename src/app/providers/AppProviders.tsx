import { StrictMode, ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@features/auth/AuthContext'
import { HelmetProvider } from 'react-helmet-async'
import { ConfirmProvider } from '@shared/components/ConfirmDialog'
import ErrorBoundary from '@shared/components/ErrorBoundary'

interface AppProvidersProps {
  children: ReactNode
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <StrictMode>
      <ErrorBoundary>
        <HelmetProvider>
        <BrowserRouter>
          <ConfirmProvider>
          <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '14px',
                background: '#ffffff',
                color: '#1f2937',
                border: '1px solid #e5e7eb',
                boxShadow: '0 14px 34px rgba(15, 23, 42, 0.16)',
                padding: '14px 16px',
                fontWeight: 600,
                maxWidth: '420px',
              },
              success: {
                iconTheme: { primary: '#38A5F8', secondary: '#ffffff' },
              },
              error: {
                iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
              },
            }}
          />
          {children}
        </AuthProvider>
        </ConfirmProvider>
      </BrowserRouter>
      </HelmetProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}
