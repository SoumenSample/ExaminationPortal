"use client"

import React, { useEffect, useState } from "react"

const Commission = () => {

const [users,setUsers] = useState([])

const fetchUsers = async()=>{

const res = await fetch("/api/users")
const data = await res.json()

const filtered = data.filter(
user => user.role === "staff" || user.role === "school"
)

setUsers(filtered)

}

useEffect(()=>{
const loadUsers = async()=>{
const res = await fetch("/api/users")
const data = await res.json()

const filtered = data.filter(
user => user.role === "staff" || user.role === "school"
)

setUsers(filtered)
}

loadUsers()
},[])


const updateCommission = async(userId,value)=>{

await fetch("/api/users/commision",{
method:"PATCH",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
userId,
commission:Number(value)
})
})

fetchUsers()

}


return (

<div className="p-6">

<div className="bg-white p-6 rounded shadow">

<h2 className="text-xl font-semibold mb-6">
Staff & School Commission
</h2>

<div className="overflow-hidden">
<div
className="overflow-x-auto touch-pan-x pb-2 border border-gray-300 rounded max-w-100 md:max-w-full"
style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "thin", scrollbarColor: "#888 #f1f1f1" }}
>

<table className="w-max min-w-full border whitespace-nowrap">

<thead className="bg-gray-100">

<tr>
<th className="border p-2 min-w-30">Name</th>
<th className="border p-2 min-w-45">Email</th>
<th className="border p-2 min-w-25">Role</th>
<th className="border p-2 min-w-32.5">Referral Code</th>
<th className="border p-2 min-w-32.5">Referral Count</th>
<th className="border p-2 min-w-42.5">Commission Per Referral</th>
<th className="border p-2 min-w-32.5">Total Commission</th>
</tr>

</thead>

<tbody>

{users.map((user)=>(
<tr key={user._id} className="text-center">

<td className="border p-2 min-w-30">{user.name}</td>
<td className="border p-2 min-w-45">{user.email}</td>
<td className="border p-2 min-w-25">{user.role}</td>
<td className="border p-2 min-w-32.5">{user.referralCode}</td>
<td className="border p-2 min-w-32.5">{user.referralCount || 0}</td>

<td className="border p-2 min-w-42.5">

<input
type="number"
defaultValue={user.commissionPerReferral || 0}
className="border p-1 w-24"
onBlur={(e)=>updateCommission(user._id,e.target.value)}
/>

</td>

<td className="border p-2 min-w-32.5">
₹ {user.totalCommission || 0}
</td>

</tr>
))}

</tbody>

</table>

</div>
</div>

</div>

</div>

)

}

export default Commission