"use client"

import { useEffect, useMemo, useState } from "react"

export default function BankDetailsSection(){
const [users,setUsers] = useState([])
const [loading,setLoading] = useState(true)
const [roleFilter,setRoleFilter] = useState("all")
const [search,setSearch] = useState("")

useEffect(()=>{
const fetchUsers = async ()=>{
try{
const res = await fetch("/api/users")
const data = await res.json()
setUsers(Array.isArray(data) ? data : [])
}catch(error){
console.log("Error fetching users",error)
setUsers([])
}

setLoading(false)
}

fetchUsers()
},[])

const bankUsers = useMemo(()=>{
const trimmedSearch = search.trim().toLowerCase()

return users
.filter((user)=>user.role === "school" || user.role === "member" || user.role === "staff")
.filter((user)=>roleFilter === "all" || user.role === roleFilter)
.filter((user)=>{
if(!trimmedSearch){
return true
}

const name = (user.name || "").toLowerCase()
const email = (user.email || "").toLowerCase()
const bankDetails = (user.bankDetails || "").toLowerCase()
const code = (user.uniqueCode || "").toLowerCase()

return (
name.includes(trimmedSearch) ||
email.includes(trimmedSearch) ||
bankDetails.includes(trimmedSearch) ||
code.includes(trimmedSearch)
)
})
},[users,roleFilter,search])

return (
<div className="p-4 md:p-6 w-full min-w-0">
<div className="bg-white p-4 md:p-6 rounded shadow w-full max-w-full min-w-0">

<h2 className="text-xl font-semibold mb-6">
Bank Details
</h2>

<div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
<p className="text-sm font-semibold text-gray-700 mb-3">Filters</p>

<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
<div>
<label className="block text-xs font-medium text-gray-600 mb-1">User Type</label>
<select
value={roleFilter}
onChange={(e)=>setRoleFilter(e.target.value)}
className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
>
<option value="all">All (School + Member)</option>
<option value="school">School</option>
<option value="member">Member</option>
</select>
</div>

<div className="md:col-span-2">
<label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
<input
value={search}
onChange={(e)=>setSearch(e.target.value)}
placeholder="Search by name, email, code or bank details"
className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
/>
</div>
</div>

<p className="text-xs text-gray-600 mt-3">
Showing {bankUsers.length} of {users.filter((u)=>u.role === "school" || u.role === "member" || u.role === "staff").length} users
</p>
</div>

{loading ? (
<p>Loading bank details...</p>
) : (
<div className="w-full max-w-full min-w-0">
<div
className="w-full max-w-full overflow-x-auto overscroll-x-contain border border-gray-300 rounded"
style={{ 
scrollbarWidth: "thin", 
scrollbarColor: "#888 #f1f1f1" 
}}
>

<table className="w-max min-w-full border-collapse border border-gray-300 whitespace-nowrap">

<thead className="bg-gray-100">
<tr>
<th className="border p-2 min-w-30">Name</th>
<th className="border p-2 min-w-40">Email</th>
<th className="border p-2 min-w-20">Role</th>
<th className="border p-2 min-w-25">Code</th>
<th className="border p-2 min-w-70">Bank Details</th>
</tr>
</thead>

<tbody>
{bankUsers.length === 0 ? (
<tr>
<td colSpan="5" className="text-center p-4">
No school or member bank details found
</td>
</tr>
) : (
bankUsers.map((user)=>(
<tr key={user._id} className="text-center align-top">
<td className="border p-2 min-w-30">{user.name || "-"}</td>
<td className="border p-2 min-w-40">{user.email || "-"}</td>
<td className="border p-2 min-w-20 capitalize">{user.role || "-"}</td>
<td className="border p-2 min-w-25">{user.uniqueCode || "-"}</td>
<td className="border p-2 min-w-70 text-left whitespace-pre-wrap wrap-break-word">{user.bankDetails || "-"}</td>
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
