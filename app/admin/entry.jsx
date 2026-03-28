"use client"

import React, { useEffect, useState } from "react"

const Entry = () => {

const [users,setUsers] = useState([])
const [loading,setLoading] = useState(true)
const [publishing,setPublishing] = useState(false)

 const publishResult = async()=>{

setPublishing(true)

try{
const res = await fetch("/api/result",{
method:"PATCH",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({})
})

if(!res.ok){
throw new Error("Failed to publish results")
}

alert("All results published")

}catch(error){
alert(error.message || "Failed to publish results")
}finally{
setPublishing(false)
}

}

useEffect(()=>{

const fetchUsers = async () => {

try{

const res = await fetch("/api/users")
const data = await res.json()

setUsers(data)
console.log("Fetched users:", data);

}catch(error){
console.log("Error fetching users",error)
}

setLoading(false)

}

fetchUsers()

},[])

return (

<div className="p-4 md:p-6 overflow-x-hidden">

<div className="bg-white p-4 md:p-6 rounded shadow max-w-full">

<h2 className="text-xl font-semibold mb-6">
Entry Section
</h2>

<button
onClick={publishResult}
disabled={publishing}
className="bg-green-600 text-white px-4 py-2 rounded mb-6 disabled:opacity-60"
>
{publishing ? "Publishing..." : "Publish All Results"}
</button>

{loading ? (

<p>Loading users...</p>

) : (

<div className="w-full">
<div
className="overflow-x-auto border border-gray-300 rounded"
style={{ 
  scrollbarWidth: "thin", 
  scrollbarColor: "#888 #f1f1f1" 
}}
>

<table className="border-collapse border border-gray-300 whitespace-nowrap">

<thead className="bg-gray-100">

<tr>
<th className="border p-2 min-w-[120px]">Name</th>
<th className="border p-2 min-w-[150px]">Email</th>
<th className="border p-2 min-w-[120px]">Phone</th>
<th className="border p-2 min-w-[100px]">Role</th>
<th className="border p-2 min-w-[100px]">Code</th>
<th className="border p-2 min-w-[150px]">Address</th>
<th className="border p-2 min-w-[120px]">Aadhaar</th>
<th className="border p-2 min-w-[120px]">Reg Date</th>
</tr>

</thead>

<tbody>

{users.length === 0 ? (

<tr>
<td colSpan="8" className="text-center p-4">
No users found
</td>
</tr>

) : (

users.map((user)=>(
<tr key={user._id} className="text-center">

<td className="border p-2 min-w-[120px]">{user.name}</td>
<td className="border p-2 min-w-[150px]">{user.email}</td>
<td className="border p-2 min-w-[120px]">{user.phone}</td>
<td className="border p-2 min-w-[100px]">{user.role}</td>
<td className="border p-2 min-w-[100px]">{user.uniqueCode || "Self"}</td>
<td className="border p-2 min-w-[150px]">{user.address || "-"}</td>
<td className="border p-2 min-w-[120px]">{user.aadhaar || "-"}</td>
<td className="border p-2 min-w-[120px]">{new Date(user.createdAt).toLocaleDateString()}</td>


</tr>
))

)}

</tbody>

</table>

</div>
</div>

)}

</div>

</div>

)

}

export default Entry