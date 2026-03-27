"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Dashboard from "../../dashboard/page"

export default function StudentPage(){

const router = useRouter()
const params = useParams()
const userId = params?.id

useEffect(()=>{

if(!userId || typeof userId !== "string"){
router.replace("/login")
return
}

localStorage.setItem("userId",userId)

},[router,userId])

if(!userId || typeof userId !== "string"){
return (
<div className="min-h-screen flex items-center justify-center">
<p>Loading...</p>
</div>
)
}

return <Dashboard />

}
