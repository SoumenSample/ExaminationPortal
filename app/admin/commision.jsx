"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useAppDialog } from "../component/AppDialog"

const Commission = () => {
const { showAlert } = useAppDialog()

const [users,setUsers] = useState([])
const [loading,setLoading] = useState(true)
const [statusUpdatingId,setStatusUpdatingId] = useState(null)

const fetchUsers = async()=>{

const res = await fetch("/api/users")
const data = await res.json()

setUsers(data)
setLoading(false)

}

useEffect(()=>{
fetchUsers()
},[])


const commissionRows = useMemo(()=>{
  return users.filter(
    (user)=> user.role === "member" || user.role === "staff" || user.role === "school"
  )
},[users])

const getPaymentStatusClass = (status)=>{
  if(status === "paid"){
    return "border-green-600"
  }

  return "border-orange-600"
}

const getPaymentStatusStyle = (status)=>{
  if(status === "paid"){
    return { backgroundColor: "#16a34a", color: "#ffffff" }
  }

  return { backgroundColor: "#ea580c", color: "#ffffff" }
}

const handlePaymentStatusChange = async(userId,nextStatus)=>{
  try{
    setStatusUpdatingId(userId)

    const res = await fetch("/api/users/commision", {
      method:"PATCH",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ userId, paymentStatus: nextStatus })
    })

    if(!res.ok){
      throw new Error("Failed to update payment status")
    }

    await fetchUsers()
  }catch(error){
    console.error(error)
    await showAlert("Could not update payment status", { title: "Commission" })
  }finally{
    setStatusUpdatingId(null)
  }
}


return (

<div className="p-6">

<div className="bg-white p-6 rounded shadow">

<h2 className="text-xl font-semibold mb-6">
Member & School Commission
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
<th className="border p-2 min-w-28">Rs 100 Referrals</th>
<th className="border p-2 min-w-28">Rs 150 Referrals</th>
<th className="border p-2 min-w-28">Rs 200 Referrals</th>
<th className="border p-2 min-w-28">Current Referrals</th>
<th className="border p-2 min-w-28">Total Referrals</th>
<th className="border p-2 min-w-32.5">Payment Status</th>
<th className="border p-2 min-w-45">Bank Details</th>
<th className="border p-2 min-w-32.5">Current Commission</th>
<th className="border p-2 min-w-32.5">Total Commission</th>
</tr>

</thead>

<tbody>

{loading ? (
<tr>
<td colSpan="13" className="text-center p-4">Loading...</td>
</tr>
) : commissionRows.length === 0 ? (
<tr>
<td colSpan="13" className="text-center p-4">No member or school data found</td>
</tr>
) : commissionRows.map((user)=>(
<tr key={user._id} className="text-center">

<td className="border p-2 min-w-30">{user.name}</td>
<td className="border p-2 min-w-45">{user.email}</td>
<td className="border p-2 min-w-25">{user.role}</td>
<td className="border p-2 min-w-32.5">{user.referralCode}</td>
<td className="border p-2 min-w-28">{user.referral100Count || 0}</td>
<td className="border p-2 min-w-28">{user.referral150Count || 0}</td>
<td className="border p-2 min-w-28">{user.referral200Count || 0}</td>
<td className="border p-2 min-w-28">{user.referralCount || 0}</td>
<td className="border p-2 min-w-28">{user.totalReferralCount || 0}</td>

<td className="border p-2 min-w-32.5">
<select
value={user.paymentStatus || "pending"}
onChange={(e)=>handlePaymentStatusChange(user._id, e.target.value)}
disabled={statusUpdatingId === user._id}
className={`border rounded px-2 py-1 font-medium transition-colors ${getPaymentStatusClass(user.paymentStatus || "pending")}`}
style={getPaymentStatusStyle(user.paymentStatus || "pending")}
>
<option value="pending" className="text-black bg-white">Pending</option>
<option value="paid" className="text-black bg-white">Paid</option>
</select>
</td>

<td className="border p-2 min-w-45">
{(user.totalReferralCount || 0) > 0
? ((user.paymentStatus || "pending") === "paid" ? "-" : (user.bankDetails || ""))
: ""}
</td>

<td className="border p-2 min-w-32.5">
₹ {user.currentCommission || 0}
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