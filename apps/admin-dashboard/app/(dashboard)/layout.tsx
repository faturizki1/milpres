"use client"
import React from 'react'
import { useAuth } from '../../components/AuthProvider'

export default function DashboardLayout({ children }: { children: React.ReactNode }){
  const { role } = useAuth()
  if(!role || (role !== 'ADMIN' && role !== 'STAFF')) return <div className="container"><h2>403 — Forbidden</h2></div>
  return (
    <div style={{display:'flex'}}>
      <aside style={{width:220, padding:16, borderRight:'1px solid #eee'}}>
        <h3>Menu</h3>
        <ul>
          <li><a href="/dashboard">Overview</a></li>
          <li><a href="/dashboard/contents">Contents</a></li>
          <li><a href="/dashboard/media">Media</a></li>
          <li><a href="/dashboard/settings">Settings</a></li>
        </ul>
      </aside>
      <main style={{flex:1, padding:16}}>{children}</main>
    </div>
  )
}
