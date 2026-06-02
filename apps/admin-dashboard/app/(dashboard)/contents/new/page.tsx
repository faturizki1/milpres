"use client"
import React, { useState } from 'react'
import MediaPicker from '../../../../components/MediaPicker'

const TiptapPlaceholder = ({ onInsert }:{onInsert?:(url:string)=>void}) => (
  <div style={{border:'1px solid #ddd', minHeight:200, padding:8}}>
    <div>Tiptap editor placeholder</div>
    <div style={{marginTop:8}}>
      <button onClick={()=>onInsert && onInsert('/images/example.jpg')}>Insert example image</button>
    </div>
  </div>
)

export default function NewContent(){
  const [title,setTitle] = useState('')
  const [body,setBody] = useState('')
  async function save(){
    await fetch('/api/mock-create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, body }) })
    alert('Saved as DRAFT (mock)')
  }
  return (
    <div className="container">
      <h1>New Content</h1>
      <input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} style={{width:'100%'}}/>
      <div style={{marginTop:8}}>
        <TiptapPlaceholder onInsert={(url)=> setBody(b=> b + `<img src="${url}"/>`) } />
      </div>
      <div style={{marginTop:8}}>
        <h4>Media</h4>
        <MediaPicker onSelect={(url)=> setBody(b=> b + `<img src="${url}"/>`) } />
      </div>
      <div style={{marginTop:8}}>
        <button onClick={save}>Save as Draft</button>
      </div>
    </div>
  )
}
