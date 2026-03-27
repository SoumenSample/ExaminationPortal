"use client"

import { useEffect, useState } from "react"

export default function LinkPage(){

const [open,setOpen] = useState(false)
const [links,setLinks] = useState([])

const [form,setForm] = useState({
title:"",
url:""
})

const fetchLinks = async()=>{
const res = await fetch("/api/link")
const data = await res.json()
setLinks(data)
}

// fetch links
useEffect(()=>{
const loadLinks = async ()=>{
const res = await fetch("/api/link")
const data = await res.json()
setLinks(data)
}

loadLinks()
},[])

// handle input
const handleChange = (e)=>{
setForm({...form,[e.target.name]:e.target.value})
}

// submit
const handleSubmit = async(e)=>{
e.preventDefault()

await fetch("/api/link",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(form)
})

setForm({title:"",url:""})
setOpen(false)
fetchLinks()
}

return(

<div className="p-6">

{/* RIGHT BUTTON */}
<div className="flex justify-end mb-4">

<button
onClick={()=>setOpen(true)}
className="bg-blue-600 text-white px-4 py-2 rounded"
>
Upload Link
</button>

</div>


{/* LINK LIST */}

<div className="space-y-3">

{links.map((l)=>(
<div key={l._id} className="p-4 border rounded shadow">

<p className="font-semibold">{l.title}</p>

<a
href={l.url}
target="_blank"
className="text-blue-600 underline"
>
{l.url}
</a>

</div>
))}

</div>


{/* MODAL FORM */}

{open && (

<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">

<div className="bg-white p-6 rounded w-[92%] max-w-100">

<h2 className="text-xl font-bold mb-4">
Upload Link
</h2>

<form onSubmit={handleSubmit} className="space-y-4">

<input
name="title"
placeholder="Title"
value={form.title}
onChange={handleChange}
className="w-full border p-2 rounded"
/>

<input
name="url"
placeholder="Enter URL"
value={form.url}
onChange={handleChange}
className="w-full border p-2 rounded"
/>

<div className="flex gap-3">

<button
type="submit"
className="bg-blue-600 text-white px-4 py-2 rounded"
>
Save
</button>

<button
type="button"
onClick={()=>setOpen(false)}
className="bg-gray-400 text-white px-4 py-2 rounded"
>
Cancel
</button>

</div>

</form>

</div>

</div>

)}

</div>

)

}