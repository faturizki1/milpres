"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import jwt_decode from 'jwt-decode'
import { useRouter } from 'next/navigation'

type AuthContextValue = {
  token: string | null
  role?: string | null
  login: (_email:string,_password:string)=>Promise<boolean>
  logout: ()=>void
  refresh: ()=>Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(){
  const ctx = useContext(AuthContext)
  if(!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }){
  const [token, setToken] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(()=>{
    // attempt silent refresh on mount
    (async () => { await refresh() })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  async function login(email:string, password:string){
    try{
      const res = await fetch(process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4001' + '/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), credentials: 'include'
      })
      const data = await res.json()
      if(data.access_token){
        setToken(data.access_token)
        try {
          const payload:any = jwt_decode(data.access_token)
          setRole(payload.role || null)
        } catch (e) {
          setRole(null)
        }
        // redirect based on role
        if(role === 'SUPER_ADMIN') router.push('/super-admin')
        else router.push('/dashboard')
        return true
      }
      return false
    }catch(e){ console.error(e); return false }
  }

  function logout(){ setToken(null); setRole(null); router.push('/(auth)/login') }

  async function refresh(){
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4001' + '/auth/refresh', { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if(data.access_token){
        setToken(data.access_token)
        try {
          const payload:any = jwt_decode(data.access_token)
          setRole(payload.role||null)
        } catch (e) {
          // ignore invalid token payload
        }
        return true
      }
      return false
    } catch (e) {
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ token, role, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
