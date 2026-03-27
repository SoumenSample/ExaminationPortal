

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import ChatBox from "@/app/component/chatBox.jsx"
import logo from "./WhatsApp Image 2026-03-18 at 9.04.15 PM.jpeg"

export default function Dashboard(){

  const router = useRouter()

  const [user,setUser] = useState(null)
  const [open,setOpen] = useState(false)
  const [mobileMenuOpen,setMobileMenuOpen] = useState(false)
  const [activeTab,setActiveTab] = useState("dashboard")

  const [hasSubmittedExam,setHasSubmittedExam] = useState(false)
  const [resultPublished,setResultPublished] = useState(false)
  const [scheduledAt,setScheduledAt] = useState(null)
  const [timeLeft,setTimeLeft] = useState(0)

  const [links,setLinks] = useState([])
  const [topScorerEmail,setTopScorerEmail] = useState("")

  const [chatOpen,setChatOpen] = useState(false)
  const [showTopModal, setShowTopModal] = useState(false)
  const [topperData, setTopperData] = useState(null)
  const [activeTopper, setActiveTopper] = useState(null)
   const [notifications,setNotifications] = useState([])

  // ---------------- FETCH LINKS ----------------
  // const fetchLinksAndNotifications = async (userId) => {
  //   if(!userId) return

  //   const res = await fetch(`/api/link?userId=${userId}`)
  //   const data = await res.json()

  //   setLinks(data)
  // }
  async function fetchLinksAndNotifications(userId){

if(!userId) return

const res = await fetch(`/api/link?userId=${userId}`)
const data = await res.json()

setLinks(data)

const unread = data.filter((l)=>l.isNew)
setNotifications(unread)

}


  // ---------------- FETCH USER ----------------
  useEffect(()=>{
    const userId = localStorage.getItem("userId")

    if(!userId){
      router.push("/login")
      return
    }

    fetch(`/api/auth/user?id=${userId}`)
      .then(res=>res.json())
      .then((data)=>{
        setUser(data)
        fetchLinksAndNotifications(data?._id)
      })

  },[router])

  // ---------------- CHECK RESULT ----------------
  useEffect(()=>{
    if(!user?.email) return

    fetch(`/api/result?email=${user.email}`)
      .then(res=>res.json())
      .then(data=>{
        if(data?._id){
          setHasSubmittedExam(true)
        }
        if(data?.isPublished){
          setResultPublished(true)
        }
      })
  },[user])
  
useEffect(()=>{

fetch("/api/result?top=1")
.then(res=>res.json())
.then(data=>{
if(data?.email){
setTopScorerEmail(data.email)
}
})

},[])

  useEffect(()=>{

    fetch("/api/exam-schedule")
      .then(res=>res.json())
      .then(data=>{
        if(data?.scheduleAt){
          setScheduledAt(data.scheduleAt)
        }
      })

  },[])

  useEffect(()=>{
    if(!scheduledAt){
      return
    }

    const updateCountdown = ()=>{
      const diff = new Date(scheduledAt).getTime() - Date.now()
      setTimeLeft(Math.max(0, Math.floor(diff / 1000)))
    }

    updateCountdown()
    const timer = setInterval(updateCountdown,1000)

    return ()=> clearInterval(timer)
  },[scheduledAt])
  const markAsRead = async ()=>{

if(!user?._id) return

await fetch("/api/link",{
method:"PATCH",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({ userId:user._id })
})

setNotifications([])

setLinks((prev)=>prev.map((item)=>({
...item,
isNew:false
})))

}


  const formatCountdown = (seconds)=>{
    const h = String(Math.floor(seconds / 3600)).padStart(2,"0")
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2,"0")
    const s = String(seconds % 60).padStart(2,"0")
    return `${h}:${m}:${s}`
  }
useEffect(() => {
  async function fetchTopper() {
    const res = await fetch("/api/topper")
    const data = await res.json()

    console.log("Topper Data:", data)

    setTopperData(data)
  }

  fetchTopper()
}, [])

  // ---------------- LOGOUT ----------------
  const logout = ()=>{
    localStorage.removeItem("userId")
    router.push("/login")
  }

  return(

    <div className="flex min-h-screen bg-gray-100 text-slate-900">

      {/* SIDEBAR */}
      <div className="hidden md:block w-64 bg-white shadow-md p-4">

        {/* <h2 className="text-xl font-bold mb-6">Dashboard</h2> */}
        <div className="flex items-center gap-3 mb-6">
          <Image
            src={logo}
            alt="Examination Portal Logo"
            width={60}
            height={60}
            className=" object-cover rounded-xl"
            priority
          />
          <h2 className="text-lg font-bold">Examination Portal</h2>
        </div>

        <div className="flex flex-col gap-2">

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`text-left px-4 py-2 rounded ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-200"
            }`}
          >
            🏠 Dashboard
          </button>

          <button
            onClick={() => setActiveTab("study")}
            className={`text-left px-4 py-2 rounded ${
              activeTab === "study"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-200"
            }`}
          >
            📚 Study Material
          </button>

        </div>

      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 md:p-6">

        {/* NAVBAR */}
        <div className="relative flex justify-between items-center bg-white shadow px-4 md:px-6 py-4 rounded-xl mb-6">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded border border-gray-300 flex items-center justify-center text-xl"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>

            <h1 className="text-base md:text-xl font-bold capitalize">Examination-Portal {activeTab}</h1>
          </div>

          {mobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/20 z-30 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg p-3 z-40 md:hidden">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">Menu</p>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setActiveTab("dashboard")
                    setMobileMenuOpen(false)
                  }}
                  className={`text-left px-4 py-2 rounded ${
                    activeTab === "dashboard"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-200"
                  }`}
                >
                  🏠 Dashboard
                </button>

                <button
                  onClick={() => {
                    setActiveTab("study")
                    setMobileMenuOpen(false)
                  }}
                  className={`text-left px-4 py-2 rounded ${
                    activeTab === "study"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-200"
                  }`}
                >
                  📚 Study Material
                </button>
                </div>
              </div>
            </>
          )}
          <div className="relative group cursor-pointer">

<div className="text-xl relative">
🔔

{notifications.length > 0 && (
<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
{notifications.length}
</span>
)}

</div>

<div className="absolute right-0 mt-2 w-64 bg-white shadow rounded p-4 
opacity-0 invisible group-hover:visible group-hover:opacity-100 transition z-50">

<h3 className="font-bold mb-2">Notifications</h3>

{notifications.length === 0 ? (
<p className="text-sm text-gray-500">No new notifications</p>
) : (
<div className="space-y-2 max-h-40 overflow-y-auto">
{notifications.map((n)=>(
<div key={n._id} className="border p-2 rounded text-sm">
📚 {n.title}
</div>
))}
</div>
)}

<button
onClick={markAsRead}
className="mt-3 w-full bg-blue-600 text-white py-1 rounded"
>
Mark as Read
</button>

</div>
</div>

          {/* AVATAR */}
          <div className="relative">
            

            <div
              onClick={() => setOpen(!open)}
              className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-full cursor-pointer font-bold"
            >
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>

            {open && (
              <div className="absolute right-0 mt-3 w-60 bg-white border rounded shadow-lg p-4 z-50">

                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium mb-3">{user?.email}</p>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium mb-3">{user?.role}</p>

                <button
                  onClick={logout}
                  className="w-full bg-red-500 text-white py-2 rounded"
                >
                  Logout
                </button>

              </div>
            )}

          </div>

        </div>

        {/* TAB CONTENT */}

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          
         <div className="flex flex-col items-center gap-10">

  {/* 🏆 TOPPER LIST (SCROLL ANIMATION) */}
  {topperData && (
  <div className="w-full overflow-hidden">

    <div className="flex gap-6 animate-scrollX">

      {topperData.map((topper, index) => (
        <div
          key={topper._id}
          className="relative flex-shrink-0 cursor-pointer"
          onClick={() =>
            setActiveTopper(
              activeTopper === topper._id ? null : topper._id
            )
          }
        >

          {/* IMAGE */}
          <img
            src={topper.image}
            alt={topper.name || "Topper image"}
            className="w-40 h-40 md:w-24 md:h-24 rounded-full object-cover border-4 border-black shadow"
          />

          {/* OVERLAY (ON CLICK) */}
          {activeTopper === topper._id && (
            <div className="absolute inset-0 bg-black bg-opacity-70 rounded-full flex flex-col items-center justify-center text-white text-[10px] px-2 text-center">

              <p className="font-bold">Name-{topper.name}</p>
              <p>Year-{topper.year}</p>
              <p className="truncate">Desc-{topper.description}</p>

            </div>
          )}

          {index < topperData.length - 1 && (
            <div
              className="absolute top-1/2 left-full -translate-y-1/2 w-6 h-1 bg-orange-300 rounded-full"
              aria-hidden="true"
            />
          )}

        </div>
      ))}

    </div>

  </div>
)}

  {/* 📦 EXAM CARD BELOW */}
  <div className="bg-white p-6 md:p-10 rounded shadow w-full max-w-[400px] text-center">

    <h2 className="text-2xl font-bold mb-4">
      Online Examination
    </h2>

    {!resultPublished && !hasSubmittedExam && timeLeft > 0 && (
      <>
      <p className="text-sm text-gray-600 mb-2">
        Exam starts in
      </p>
      <p className="text-2xl font-bold text-blue-700 mb-4">
        {formatCountdown(timeLeft)}
      </p>
      </>
    )}

    {!resultPublished && !hasSubmittedExam && timeLeft === 0 && (
      <button
        onClick={() => window.open("/dashboard/student?exam=1","_blank")}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        Start Exam
      </button>
    )}

    {hasSubmittedExam && !resultPublished && (
      <p className="text-gray-600 text-sm">
        You already submitted the exam. Wait for result.
      </p>
    )}

    {resultPublished && (
      <button
        onClick={() => router.push("/result")}
        className="bg-green-600 text-white px-6 py-2 rounded"
      >
        Show Result
      </button>
    )}

  </div>

</div>
        )}

        {/* STUDY MATERIAL TAB */}
        {activeTab === "study" && (
          <div className="bg-white p-6 rounded shadow">

            <h2 className="text-xl font-bold mb-4">Study Materials</h2>

            {links.length === 0 ? (
              <p className="text-gray-500">No materials available</p>
            ) : (
              <div className="space-y-3 max-h-100 overflow-y-auto">
                {links.map((l)=>(
                  <div key={l._id} className="border p-3 rounded">

                    <p className="font-semibold">{l.title}</p>

                    <a
                      href={l.url}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      Open Link
                    </a>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>

      {/* CHAT */}
      <button
        onClick={()=>setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full"
      >
        Chat
      </button>

      {chatOpen && <ChatBox user={user} />}

    </div>
  )
}