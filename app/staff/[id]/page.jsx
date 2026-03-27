"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ChatBox from "@/app/component/chatBox.jsx"

export default function StaffDashboard(){

const router = useRouter()

const [user,setUser] = useState(null)
const [open,setOpen] = useState(false)

const [questions,setQuestions] = useState([])
const [current,setCurrent] = useState(0)

const [answer,setAnswer] = useState("")
const [answers,setAnswers] = useState([])

const [time,setTime] = useState(0)

const [showResult,setShowResult] = useState(false)
const [startExam,setStartExam] = useState(false)
const [resultPublished,setResultPublished] = useState(false)
const [chatOpen,setChatOpen] = useState(false)



// FETCH USER
useEffect(()=>{

const userId = localStorage.getItem("userId")

if(!userId){
router.push("/login")
return
}

fetch(`/api/auth/user?id=${userId}`)
.then(res=>res.json())
.then(data=>setUser(data))

},[router])



// FETCH QUESTIONS
useEffect(()=>{

fetch("/api/question")
.then(res=>res.json())
.then(data=>{

setQuestions(data)
console.log("Fetched questions:", data);

if(data.length > 0){
setTime(data[0].time *60)

// setAnswer("")
// setTime(questions[next].time * 60)
}

// setCurrent(next)
// setAnswer("")
// setTime(questions[next].time * 60)

})

},[])


// NEXT QUESTION
function nextQuestion(){

if(!questions[current]) return

const updatedAnswers = [

...answers,
{
question: questions[current].question,
answer: answer
}

]

setAnswers(updatedAnswers)

if(current < questions.length - 1){

const next = current + 1

setCurrent(next)
setAnswer("")
setTime(questions[next].time * 60)

}else{

setShowResult(true)
calculateResult(updatedAnswers)

}

}

async function calculateResult(submittedAnswers){

let score = 0
let totalMarks = 0

questions.forEach((q,index)=>{

totalMarks += q.marks

if(submittedAnswers[index]?.answer?.trim().toLowerCase() === q.answer?.trim().toLowerCase()){
score += q.marks
}

})

const email = user?.email

await fetch("/api/result",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email,
score,
totalMarks,
answers:submittedAnswers
})
})

setShowResult(true)

}



// TIMER
useEffect(()=>{

if(showResult || questions.length === 0) return

if(time === 0){
const submitTimeout = setTimeout(()=>{
nextQuestion()
},0)

return ()=> clearTimeout(submitTimeout)
}

const timer = setInterval(()=>{
setTime(prev => prev - 1)
},1000)

return ()=> clearInterval(timer)

},[time])


useEffect(()=>{

if(!user?.email) return

fetch(`/api/result?email=${user.email}`)
.then(res=>res.json())
.then(data=>{
if(data?.isPublished){
setResultPublished(true)
}
})

},[user])


// LOGOUT
const logout = ()=>{

localStorage.removeItem("userId")

router.push("/login")

}
const addStudent = ()=>{

router.push("/signup");
}



return(

<div className="min-h-screen bg-gray-100 text-slate-900">

{/* NAVBAR */}

<div className="flex justify-between items-center bg-white shadow px-6 py-4">

<h1 className="text-xl font-bold">
Dashboard
</h1>


{/* PROFILE */}

<div className="relative">

<button
onClick={()=>setOpen(!open)}
className="bg-blue-600 text-white px-4 py-2 rounded"
>
Profile
</button>


{open && (

<div className="absolute right-0 mt-2 w-60 bg-white border rounded shadow-lg p-4">

<p className="text-sm text-gray-500">
Role
</p>

<p className="font-medium mb-2">
{user?.role}
</p>

<p className="text-sm text-gray-500">
Email
</p>

<p className="font-medium mb-3">
{user?.email}
</p>


{user?.uniqueCode && (

<>
<p className="text-sm text-gray-500">
Unique Code
</p>

<p className="font-medium mb-2">
{user.uniqueCode}
</p>

</>

)}

<button
onClick={logout}
className="w-full bg-red-500 text-white py-2 rounded"
>
Logout
</button>
<button className="w-full bg-green-500 mt-5 text-white py-2 rounded" onClick={addStudent}>Add Student</button>

</div>

)}

</div>

</div>

<button
onClick={()=>setChatOpen(!chatOpen)}
className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg"
>
Chat
</button>
{chatOpen && <ChatBox user={user} />}


</div>

)

}