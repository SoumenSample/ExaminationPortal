"use client"

import React, { useEffect, useMemo, useState } from "react"

const Entry = () => {
const [users,setUsers] = useState([])
const [loading,setLoading] = useState(true)
const [roleFilter,setRoleFilter] = useState("all")
const [districtFilter,setDistrictFilter] = useState("")
const [stateFilter,setStateFilter] = useState("")
const [studentAgeFilter,setStudentAgeFilter] = useState("all")

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

const districtOptions = useMemo(()=>{
const districts = users
  .map((user)=>user.district)
  .filter(Boolean)
  .map((district)=>district.trim())

return [...new Set(districts)].sort((a,b)=>a.localeCompare(b))
},[users])

const stateOptions = useMemo(()=>{
const states = users
  .map((user)=>user.state)
  .filter(Boolean)
  .map((state)=>state.trim())

return [...new Set(states)].sort((a,b)=>a.localeCompare(b))
},[users])

const isStudentAgeMatch = (user)=>{
if(studentAgeFilter === "all"){
return true
}

if(user.role !== "student"){
return false
}

const age = Number(user.age)
if(Number.isNaN(age)){
return false
}

if(studentAgeFilter === "8-12") return age >= 8 && age <= 12
if(studentAgeFilter === "13-16") return age >= 13 && age <= 16
if(studentAgeFilter === "17-22") return age >= 17 && age <= 22

return true
}

const filteredUsers = useMemo(()=>{
return users.filter((user)=>{
const userRole = (user.role || "").toLowerCase()
const roleMatch = roleFilter === "all" || userRole === roleFilter
const districtMatch = !districtFilter || (user.district || "").toLowerCase() === districtFilter.toLowerCase()
const stateMatch = !stateFilter || (user.state || "").toLowerCase() === stateFilter.toLowerCase()
const ageMatch = isStudentAgeMatch(user)

return roleMatch && districtMatch && stateMatch && ageMatch
})
},[users,roleFilter,districtFilter,stateFilter,studentAgeFilter])

const clearFilters = ()=>{
setRoleFilter("all")
setDistrictFilter("")
setStateFilter("")
setStudentAgeFilter("all")
}

return (

<div className="p-4 md:p-6 w-full min-w-0">

<div className="bg-white p-4 md:p-6 rounded shadow w-full max-w-full min-w-0">

<h2 className="text-xl font-semibold mb-6">
All Users
</h2>

<div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
<p className="text-sm font-semibold text-gray-700 mb-3">Filters</p>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
<div>
<label className="block text-xs font-medium text-gray-600 mb-1">User Type</label>
<select
value={roleFilter}
onChange={(e)=>setRoleFilter(e.target.value)}
className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
>
<option value="all">All</option>
<option value="student">Student</option>
<option value="school">School</option>
<option value="member">Member</option>
</select>
</div>

<div>
<label className="block text-xs font-medium text-gray-600 mb-1">District</label>
<select
value={districtFilter}
onChange={(e)=>setDistrictFilter(e.target.value)}
className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
>
<option value="">All Districts</option>
{districtOptions.map((district)=>(
<option key={district} value={district}>{district}</option>
))}
</select>
</div>

<div>
<label className="block text-xs font-medium text-gray-600 mb-1">State</label>
<select
value={stateFilter}
onChange={(e)=>setStateFilter(e.target.value)}
className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
>
<option value="">All States</option>
{stateOptions.map((state)=>(
<option key={state} value={state}>{state}</option>
))}
</select>
</div>

<div>
<label className="block text-xs font-medium text-gray-600 mb-1">Student Age</label>
<select
value={studentAgeFilter}
onChange={(e)=>setStudentAgeFilter(e.target.value)}
className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
>
<option value="all">All Ages</option>
<option value="8-12">Age 8-12</option>
<option value="13-16">Age 13-16</option>
<option value="17-22">Age 17-22</option>
</select>
</div>

<div className="flex items-end">
<button
type="button"
onClick={clearFilters}
className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white hover:bg-gray-100"
>
Clear Filters
</button>
</div>
</div>

<p className="text-xs text-gray-600 mt-3">
Showing {filteredUsers.length} of {users.length} users
</p>
</div>

{loading ? (

<p>Loading users...</p>

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
<th className="border p-2 min-w-37.5">Email</th>
<th className="border p-2 min-w-30">Phone</th>
<th className="border p-2 min-w-25">Role</th>
<th className="border p-2 min-w-25">Roll No</th>
<th className="border p-2 min-w-25">Section</th>
<th className="border p-2 min-w-25">Code</th>
<th className="border p-2 min-w-37.5">Address</th>
<th className="border p-2 min-w-30">Aadhaar</th>
<th className="border p-2 min-w-30">Reg Date</th>
</tr>

</thead>

<tbody>

{filteredUsers.length === 0 ? (

<tr>
<td colSpan="10" className="text-center p-4">
No users found
</td>
</tr>

) : (

filteredUsers.map((user)=>(
<tr key={user._id} className="text-center">

<td className="border p-2 min-w-30">{user.name}</td>
<td className="border p-2 min-w-37.5">{user.email}</td>
<td className="border p-2 min-w-30">{user.phone}</td>
<td className="border p-2 min-w-25">{user.role}</td>
<td className="border p-2 min-w-25">{user.role === "student" ? (user.rollNo || "-") : "-"}</td>
<td className="border p-2 min-w-25">{user.role === "student" ? (user.section || "-") : "-"}</td>
<td className="border p-2 min-w-25">{user.uniqueCode || "Self"}</td>
<td className="border p-2 min-w-37.5">{user.address || "-"}</td>
<td className="border p-2 min-w-30">{user.aadhaar || "-"}</td>
<td className="border p-2 min-w-30">{new Date(user.createdAt).toLocaleDateString()}</td>


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