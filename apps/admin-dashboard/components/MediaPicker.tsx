"use client"
export default function MediaPicker({ onSelect }:{ onSelect?: (_url:string)=>void }){
  return (
    <div style={{border:'1px dashed #ccc', padding:12}}>
      <div>Media picker placeholder (dropzone + grid)</div>
      <button onClick={()=>onSelect && onSelect('/media/example.jpg')}>Select example</button>
    </div>
  )
}
