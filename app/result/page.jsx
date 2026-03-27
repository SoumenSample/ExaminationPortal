"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ResultPage(){

const router = useRouter()

const [result,setResult] = useState(null)
const [loading,setLoading] = useState(true)
const [errorMessage,setErrorMessage] = useState("")

useEffect(()=>{

const userId = localStorage.getItem("userId")

if(!userId){
router.push("/login")
return
}

fetch(`/api/auth/user?id=${userId}`)
.then(res=>res.json())
.then(user=>{

if(!user?.email){
setErrorMessage("Could not load user email")
setLoading(false)
return
}

fetch(`/api/result?email=${user.email}`)
.then(res=>res.json())
.then(data=>{
if(data?.error || data?.message){
setErrorMessage(data.error || data.message)
setResult(null)
}else{
setResult(data)
}
})
.finally(()=>setLoading(false))

})

},[router])

if(loading){
return(
<div className="flex items-center justify-center h-screen">
<p>Loading result...</p>
</div>
)
}

if(errorMessage){
return(
<div className="flex items-center justify-center h-screen">
<div className="bg-white p-8 rounded shadow text-center">
<h2 className="text-2xl font-bold mb-4">Unable to load result</h2>
<p className="text-gray-600">{errorMessage}</p>
</div>
</div>
)
}

if(!result){
return(
<div className="flex items-center justify-center h-screen">
<div className="bg-white p-8 rounded shadow text-center">
<h2 className="text-2xl font-bold mb-4">Result Not Found</h2>
<p className="text-gray-600">No result record exists for your email yet.</p>
</div>
</div>
)
}

if(!result.isPublished){
return(
<div className="flex items-center justify-center h-screen">

<div className="bg-white p-8 rounded shadow text-center">

<h2 className="text-2xl font-bold mb-4">
Result Not Published
</h2>

<p className="text-gray-600">
Admin has not published your result yet.
</p>

</div>

</div>
)
}

return(

<div className="flex items-center justify-center h-screen bg-gray-100">

<div className="bg-white p-6 md:p-10 rounded shadow w-[92%] max-w-100 text-center">

<h2 className="text-3xl font-bold text-green-600 mb-6">
Exam Result
</h2>

<p className="text-lg mb-2">
<strong>Email:</strong> {result.email}
</p>

<p className="text-lg mb-2">
<strong>Score:</strong> {result.score}
</p>

<p className="text-lg mb-2">
<strong>Total Marks:</strong> {result.totalMarks}
</p>

<p className="text-lg">
<strong>Percentage:</strong> {((result.score/result.totalMarks)*100).toFixed(2)}%
</p>

</div>

</div>

)

}