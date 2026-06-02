"use client"
import React from 'react'
export default function EditContent({ params }: any){
  const { id } = params
  return (
    <div className="container">
      <h1>Edit Content {id}</h1>
      <div>Tiptap editor pre-filled placeholder</div>
    </div>
  )
}
