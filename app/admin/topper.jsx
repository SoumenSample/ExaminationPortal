"use client"

import { useEffect, useState } from "react"

export default function ItemPage() {

  const [items,setItems] = useState([])
  const [showModal,setShowModal] = useState(false)
  const [showEditModal,setShowEditModal] = useState(false)
  const [deletingId,setDeletingId] = useState(null)
  const [updatingId,setUpdatingId] = useState(null)
  const [deleteTarget,setDeleteTarget] = useState(null)
  const [deleteError,setDeleteError] = useState("")
  const [editError,setEditError] = useState("")

  const [form,setForm] = useState({
  name:"",
  year:"",
  ageGroupCategory:"",
  description:"",
  file:null
})

  const [editForm,setEditForm] = useState({
  id:"",
  name:"",
  year:"",
  ageGroupCategory:"",
  description:"",
  image:"",
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
      ageGroupCategory: form.ageGroupCategory,
      description: form.description,
      image: imageUrl
    })
  })

  setForm({
    name:"",
    year:"",
    ageGroupCategory:"",
    description:"",
    file:null
  })

  setShowModal(false)
  fetchItems()
}

async function handleDelete(id){
  try{
    setDeleteError("")
    setDeletingId(id)

    const res = await fetch(`/api/topper/${id}`,{
      method:"DELETE"
    })

    if(!res.ok){
      const data = await res.json().catch(()=>null)
      throw new Error(data?.message || "Failed to delete topper")
    }

    setItems((prev)=>prev.filter((item)=>item._id !== id))
    setDeleteTarget(null)
  }catch(error){
    setDeleteError(error.message || "Failed to delete topper")
  }finally{
    setDeletingId(null)
  }
}

function openEditModal(item){
  setEditError("")
  setEditForm({
    id:item._id,
    name:item.name || "",
    year:item.year || "",
    ageGroupCategory:item.ageGroupCategory || "",
    description:item.description || "",
    image:item.image || "",
    file:null
  })
  setShowEditModal(true)
}

async function handleEditSubmit(e){
  e.preventDefault()

  try{
    setEditError("")
    setUpdatingId(editForm.id)

    let imageUrl = editForm.image || ""

    if(editForm.file){
      const formData = new FormData()
      formData.append("file", editForm.file)

      const uploadRes = await fetch("/api/upload",{
        method:"POST",
        body:formData
      })

      if(!uploadRes.ok){
        throw new Error("Failed to upload image")
      }

      const uploadData = await uploadRes.json()
      imageUrl = uploadData.url || imageUrl
    }

    const res = await fetch(`/api/topper/${editForm.id}`,{
      method:"PATCH",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        name: editForm.name,
        year: editForm.year,
        ageGroupCategory: editForm.ageGroupCategory,
        description: editForm.description,
        image: imageUrl
      })
    })

    if(!res.ok){
      const data = await res.json().catch(()=>null)
      throw new Error(data?.message || "Failed to update topper")
    }

    const updatedItem = await res.json()
    setItems((prev)=>prev.map((item)=>item._id === updatedItem._id ? updatedItem : item))
    setShowEditModal(false)
  }catch(error){
    setEditError(error.message || "Failed to update topper")
  }finally{
    setUpdatingId(null)
  }
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

      {deleteError && (
        <div className="mb-4 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">
          {deleteError}
        </div>
      )}

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {items.map((item)=>(
          <div key={item._id} className="bg-white p-4 rounded shadow">

           <img src={item.image} className="w-full h-40 object-cover rounded" />

            <h2 className="font-bold">{item.name}</h2>
            <p className="text-sm text-gray-500">{item.year}</p>
            <p className="text-sm text-gray-500">Age Group: {item.ageGroupCategory || "-"}</p>
            <p className="text-sm mt-2">{item.description}</p>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={()=>openEditModal(item)}
                disabled={updatingId === item._id}
                className="flex-1 bg-amber-500 text-white py-2 rounded disabled:opacity-50"
              >
                {updatingId === item._id ? "Updating..." : "Edit"}
              </button>

              <button
                type="button"
                onClick={()=>{
                  setDeleteError("")
                  setDeleteTarget(item)
                }}
                disabled={deletingId === item._id}
                className="flex-1 bg-red-600 text-white py-2 rounded disabled:opacity-50"
              >
                {deletingId === item._id ? "Deleting..." : "Delete"}
              </button>
            </div>

          </div>
        ))}

      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">

          <div className="bg-white p-6 rounded w-100 relative">

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

              <select
                value={form.ageGroupCategory}
                onChange={(e)=>setForm({...form,ageGroupCategory:e.target.value})}
                className="w-full border p-2"
                required
              >
                <option value="">Select Age Group Category</option>
                <option value="8-12">8-12</option>
                <option value="13-16">13-16</option>
                <option value="17-22">17-22</option>
              </select>

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

      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-100">
            <h2 className="text-xl font-bold mb-2">Delete Topper</h2>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={()=>setDeleteTarget(null)}
                disabled={deletingId === deleteTarget._id}
                className="px-4 py-2 rounded border border-gray-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={()=>handleDelete(deleteTarget._id)}
                disabled={deletingId === deleteTarget._id}
                className="px-4 py-2 rounded bg-red-600 text-white disabled:opacity-50"
              >
                {deletingId === deleteTarget._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded w-100 relative">
            <button
              type="button"
              onClick={()=>setShowEditModal(false)}
              className="absolute top-2 right-2 text-red-500"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Edit Item</h2>

            {editError && (
              <div className="mb-3 rounded bg-red-100 text-red-700 px-3 py-2 text-sm">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <input
                placeholder="Name"
                value={editForm.name}
                onChange={(e)=>setEditForm({...editForm,name:e.target.value})}
                className="w-full border p-2"
                required
              />

              <input
                placeholder="Year"
                value={editForm.year}
                onChange={(e)=>setEditForm({...editForm,year:e.target.value})}
                className="w-full border p-2"
                required
              />

              <select
                value={editForm.ageGroupCategory}
                onChange={(e)=>setEditForm({...editForm,ageGroupCategory:e.target.value})}
                className="w-full border p-2"
                required
              >
                <option value="">Select Age Group Category</option>
                <option value="8-12">8-12</option>
                <option value="13-16">13-16</option>
                <option value="17-22">17-22</option>
              </select>

              <input
                type="file"
                onChange={(e)=>setEditForm({...editForm, file:e.target.files[0]})}
                className="w-full border p-2"
              />

              <textarea
                placeholder="Description"
                value={editForm.description}
                onChange={(e)=>setEditForm({...editForm,description:e.target.value})}
                className="w-full border p-2"
                required
              />

              <button
                type="submit"
                disabled={updatingId === editForm.id}
                className="bg-amber-500 text-white w-full py-2 rounded disabled:opacity-50"
              >
                {updatingId === editForm.id ? "Updating..." : "Update"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}