import './globals.css'
import { AuthProvider } from '../components/AuthProvider'
import { ToastProvider } from '../components/ToastProvider'

export const metadata = {
  title: 'Admin Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }){
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
