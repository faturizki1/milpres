"use client"
import React, { createContext, useContext, useState } from 'react'

const ToastContext = createContext<any>(null)

export function useToast(){ return useContext(ToastContext) }

export function ToastProvider({ children }:{children:React.ReactNode}){
  const [toasts,setToasts] = useState<string[]>([])
  function push(msg:string){ setToasts(s=>[...s,msg]); setTimeout(()=>setToasts(s=>s.slice(1)),4000) }
  return (
    <ToastContext.Provider value={{push}}>
      {children}
      <div style={{position:'fixed',right:16,top:16,zIndex:9999}}>
        {toasts.map((t,i)=>(<div key={i} style={{background:'#111',color:'#fff',padding:'8px 12px',marginBottom:8,borderRadius:6}}>{t}</div>))}
      </div>
    </ToastContext.Provider>
  )
}
