import { NextResponse } from 'next/server'

const samples = [
  { id: 'c1', title: 'Contoh Artikel 1', status: 'DRAFT' },
  { id: 'c2', title: 'Contoh Artikel 2', status: 'PUBLISHED' },
  { id: 'c3', title: 'Contoh Artikel 3', status: 'IN_REVIEW' },
]

export async function GET(){
  return NextResponse.json(samples)
}
