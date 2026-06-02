"use client"
import React from 'react'
import { useAuth } from '../../components/AuthProvider'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }){
  const { role } = useAuth()
  if(role !== 'SUPER_ADMIN') return <div className="container"><h2>403 — Forbidden</h2></div>
  return (
    <div className="container">
      <nav><a href="/super-admin">Super Admin</a></nav>
      <main>{children}</main>
    </div>
  )
}
