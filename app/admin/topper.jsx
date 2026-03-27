"use client"

import { useEffect, useState } from "react"

export default function ItemPage() {

  const [items,setItems] = useState([])
  const [showModal,setShowModal] = useState(false)

  const [form,setForm] = useState({
  name:"",
  year:"",
  description:"",
  file:null
})

  async function fetchItems(){
    const res = await fetch("/api/topper")
    const data = await res.json()
    setItems(data)
  }

  // FETCH DATA
  useEffect(()=>{
    let ignore = false

    async function loadItems(){
      const res = await fetch("/api/topper")
      const data = await res.json()

      if(!ignore){
        setItems(data)
      }
    }

    loadItems()

    return ()=>{
      ignore = true
    }
  },[])

  // SUBMIT
//   async function handleSubmit(e){
//     e.preventDefault()

//     await fetch("/api/topper",{
//       method:"POST",
//       headers:{ "Content-Type":"application/json" },
//       body:JSON.stringify(form)
//     })

//     setForm({
//       name:"",
//       year:"",
//       description:"",
//       image:""
//     })

//     setShowModal(false)
//     fetchItems()
//   }


async function handleSubmit(e){
  e.preventDefault()

  let imageUrl = ""

  // 🔥 UPLOAD IMAGE FIRST
  if(form.file){
    const formData = new FormData()
    formData.append("file", form.file)

    const res = await fetch("/api/upload",{
      method:"POST",
      body:formData
    })

    const data = await res.json()
    imageUrl = data.url
  }

  // 🔥 SAVE DATA IN DB
  await fetch("/api/topper",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({
      name: form.name,
      year: form.year,
      description: form.description,
      image: imageUrl
    })
  })

  setForm({
    name:"",
    year:"",
    description:"",
    file:null
  })

  setShowModal(false)
  fetchItems()
}
  return(

    <div className="p-6 bg-gray-100 min-h-screen">

      {/* BUTTON */}
      <button
        onClick={()=>setShowModal(true)}
        className="fixed top-24 right-6 bg-blue-600 text-white px-4 py-2 rounded shadow"
      >
        + Add Item
      </button>

      <h1 className="text-2xl font-bold mb-6">Items</h1>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {items.map((item)=>(
          <div key={item._id} className="bg-white p-4 rounded shadow">

           <img src={item.image} className="w-full h-40 object-cover rounded" />

            <h2 className="font-bold">{item.name}</h2>
            <p className="text-sm text-gray-500">{item.year}</p>
            <p className="text-sm mt-2">{item.description}</p>

          </div>
        ))}

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">

          <div className="bg-white p-6 rounded w-[400px] relative">

            <button
              onClick={()=>setShowModal(false)}
              className="absolute top-2 right-2 text-red-500"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Add Item</h2>

            <form onSubmit={handleSubmit} className="space-y-3">

              <input
                placeholder="Name"
                value={form.name}
                onChange={(e)=>setForm({...form,name:e.target.value})}
                className="w-full border p-2"
                required
              />

              <input
                placeholder="Year"
                value={form.year}
                onChange={(e)=>setForm({...form,year:e.target.value})}
                className="w-full border p-2"
                required
              />

              <input
  type="file"
  onChange={(e)=>setForm({...form, file:e.target.files[0]})}
  className="w-full border p-2"
  required
/>

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e)=>setForm({...form,description:e.target.value})}
                className="w-full border p-2"
                required
              />

              <button className="bg-blue-600 text-white w-full py-2 rounded">
                Save
              </button>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}