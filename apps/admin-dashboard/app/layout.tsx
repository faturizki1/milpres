import './globals.css'
import { ReactNode } from 'react'
import { AuthProvider } from '../components/AuthProvider'
import { ToastProvider } from '../components/ToastProvider'

export const metadata = {
  title: 'Admin Dashboard',
}

export default function RootLayout({ children }: { children: ReactNode }){
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
