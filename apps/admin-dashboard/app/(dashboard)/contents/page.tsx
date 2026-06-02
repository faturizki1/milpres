"use client"
import { useEffect, useState } from 'react'
import { useAuth } from '../../../components/AuthProvider'

export default function ContentsList(){
  useAuth()
  const [rows,setRows] = useState<any[]>([])
  useEffect(()=>{
    (async ()=>{
      const res = await fetch('/api/mock-contents')
      const j = await res.json()
      setRows(j)
    })()
  },[])
  return (
    <div className="container">
      <h1>Contents</h1>
      <div>Placeholder table (TanStack Table integration to be added)</div>
      <ul>{rows.map(r=> <li key={r.id}>{r.title} — {r.status}</li>)}</ul>
    </div>
  )
}
