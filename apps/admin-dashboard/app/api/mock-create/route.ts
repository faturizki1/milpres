import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

export async function POST(req: Request){
  const body = await req.json()
  const id = nanoid()
  const created = { id, title: body.title || 'Untitled', status: 'DRAFT' }
  return NextResponse.json(created)
}
