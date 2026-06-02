import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ storageKey: string }> }) {
  const { storageKey } = await params
  const base = process.env.MINIO_PUBLIC_URL || 'https://minio.local'
  const url = `${base}/${storageKey}`
  return NextResponse.redirect(url)
}
