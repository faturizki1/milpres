import './globals.css'

export const metadata = {
  title: 'Public Site',
  description: 'Milpers public site for tenant news, gallery and events.',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
