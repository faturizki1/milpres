"use client"
import React, { useState } from 'react'
import { useAuth } from '../../components/AuthProvider'

export default function LoginPage(){
  const { login } = useAuth()
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [err,setErr] = useState('')

  async function handle(e:React.FormEvent){
    e.preventDefault()
    const ok = await login(email,password)
    if(!ok) setErr('Login failed')
  }

  return (
    <div className="container">
      <h1>Login</h1>
      <form onSubmit={handle}>
        <div><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email"/></div>
        <div><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password"/></div>
        <button type="submit">Login</button>
        {err && <div style={{color:'red'}}>{err}</div>}
      </form>
    </div>
  )
}
