"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppDialog } from "../../component/AppDialog"

const AGE_SLAB_LABELS = {
"8-12": "Age 8-12 years",
"13-16": "Age 13-16 years",
"17-22": "Age 17-22 years",
}

function DashboardContent(){
const { showAlert } = useAppDialog()

const router = useRouter()
const searchParams = useSearchParams()

const [user,setUser] = useState(null)
const [open,setOpen] = useState(false)

const [questions,setQuestions] = useState([])
const [current,setCurrent] = useState(0)
const [questionMessage,setQuestionMessage] = useState("")
const [questionsLoaded,setQuestionsLoaded] = useState(false)

const [answer,setAnswer] = useState("")
const [answers,setAnswers] = useState([])

const [time,setTime] = useState(0)

const [showResult,setShowResult] = useState(false)
const [startExam,setStartExam] = useState(false)
const [resultPublished,setResultPublished] = useState(false)
const [hasSubmittedExam,setHasSubmittedExam] = useState(false)
const [scheduledAt,setScheduledAt] = useState(null)
const [timeLeft,setTimeLeft] = useState(0)

useEffect(()=>{

if(searchParams.get("exam") !== "1"){
return
}

if(!questionsLoaded){
return
}

if(hasSubmittedExam || resultPublished || timeLeft > 0 || questions.length === 0){
setStartExam(false)
return
}

const starter = setTimeout(()=>{
setStartExam(true)
},0)

return ()=> clearTimeout(starter)

},[searchParams,questionsLoaded,hasSubmittedExam,resultPublished,timeLeft,questions.length])

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
setTimeLeft(Math.max(0,Math.floor(diff / 1000)))
}

updateCountdown()
const timer = setInterval(updateCountdown,1000)

return ()=> clearInterval(timer)
},[scheduledAt])

const formatCountdown = (seconds)=>{
const h = String(Math.floor(seconds / 3600)).padStart(2,"0")
const m = String(Math.floor((seconds % 3600) / 60)).padStart(2,"0")
const s = String(seconds % 60).padStart(2,"0")
return `${h}:${m}:${s}`
}



// FETCH USER
useEffect(()=>{

fetch("/api/auth/session", { cache: "no-store" })
.then(async (res)=>{
if(!res.ok){
router.push("/login")
return null
}
return res.json()
})
.then((data)=>{
if(data?.user){
setUser(data.user)
}
})

},[router])



// FETCH QUESTIONS
useEffect(()=>{

fetch("/api/question")
.then(res=>res.json())
.then(data=>{
const rows = Array.isArray(data) ? data : []
setQuestions(rows)
setCurrent(0)
setStartExam(false)

if(rows.length > 0){
setTime(rows[0].time *60)
setQuestionMessage("")
}else{
setQuestionMessage("No exam is available for you yet.")

// setAnswer("")
// setTime(questions[next].time * 60)
}

// setCurrent(next)
// setAnswer("")
// setTime(questions[next].time * 60)

})
.finally(()=>setQuestionsLoaded(true))

},[])


// NEXT QUESTION
const calculateResult = useCallback(async (submittedAnswers)=>{

let score = 0
let totalMarks = 0

const normalizedAnswers = questions.map((q,index)=>{
const maxMarks = Number(q.marks) || 0
const givenAnswer = submittedAnswers[index]?.answer || ""
const normalizedGivenAnswer = givenAnswer.trim().toLowerCase()
const normalizedCorrectAnswer = (q.answer || "").trim().toLowerCase()
const isMcq = q.type === "mcq"
const isCorrect = isMcq ? normalizedGivenAnswer === normalizedCorrectAnswer : false
const autoAwardedMarks = isMcq && isCorrect ? maxMarks : 0

totalMarks += maxMarks
score += autoAwardedMarks

return {
questionId: q._id,
question: q.question,
type: q.type || "mcq",
answer: givenAnswer,
maxMarks,
isCorrect,
autoAwardedMarks,
awardedMarks: autoAwardedMarks,
}
})

const email = user?.email

if(!email){
await showAlert("User email not loaded. Please refresh and try again.", { title: "Exam" })
return
}

const response = await fetch("/api/result",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email,
score,
totalMarks,
answers:normalizedAnswers
})
})

const payload = await response.json()

if(!response.ok){
if(response.status === 409){
setHasSubmittedExam(true)
setStartExam(false)
await showAlert(payload.message || "You can submit exam only once", { title: "Exam" })
router.push("/dashboard")
return
}

await showAlert(payload.message || payload.error || "Could not submit result", { title: "Exam" })
return
}

setHasSubmittedExam(true)
setShowResult(true)

},[questions,user,router,showAlert])


const nextQuestion = useCallback(()=>{

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

},[questions,current,answers,answer,calculateResult])


useEffect(()=>{

if(!showResult) return

const redirectTimer = setTimeout(()=>{
router.push("/dashboard")
},5000)

return ()=> clearTimeout(redirectTimer)

},[showResult,router])



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

},[time,nextQuestion,questions.length,showResult])


useEffect(()=>{

if(!user?.email) return

fetch(`/api/result?email=${user.email}`)
.then(res=>res.json())
.then(data=>{
if(data?._id){
setHasSubmittedExam(true)
setStartExam(false)
}
if(data?.isPublished){
setResultPublished(true)
}
})

},[user])


// LOGOUT
const logout = ()=>{
fetch("/api/auth/session", { method: "DELETE" })
.finally(()=>{
localStorage.removeItem("userId")
localStorage.removeItem("userRole")
localStorage.removeItem("userName")
router.push("/login")
})

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

<p className="text-sm text-gray-500">
Age
</p>

<p className="font-medium mb-2">
{user?.age || "-"}
</p>

<p className="text-sm text-gray-500">
Age Slab
</p>

<p className="font-medium mb-3">
{AGE_SLAB_LABELS[user?.ageSlab] || "-"}
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



{/* QUESTION SECTION */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-6">

<div className="flex items-center justify-center min-h-[60vh] md:h-[85vh]">

{!startExam ? (

<div className="bg-white p-6 md:p-10 rounded shadow w-full max-w-100 text-center">

<h2 className="text-2xl font-bold mb-4">
Online Examination
</h2>

<p className="text-gray-600 mb-6">
Click the button below to start the exam.
</p>

{questionMessage && (
<p className="text-sm text-orange-600 mb-4">{questionMessage}</p>
)}

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

{hasSubmittedExam && (
<p className="text-sm text-orange-600 mb-4">
You have already submitted the exam. You can attempt only once.
</p>
)}

{!resultPublished && !hasSubmittedExam && timeLeft === 0 && questions.length > 0 && <button
onClick={()=>setStartExam(true)}
className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
>
Start Exam
</button>
}

</div>

) : showResult ? (

<div className="bg-white p-6 md:p-10 rounded shadow w-full md:w-175">

<h2 className="text-2xl font-bold mb-6">
Your Answers
</h2>

{answers.map((item,index)=>(
<div key={index} className="mb-4 border-b pb-3">

<p className="font-semibold">
Q{index+1}: {item.question}
</p>

<p className="text-blue-600">
Your Answer: {item.answer || "No Answer"}
</p>

</div>
))}

<p className="text-sm text-gray-500 mt-4">
Redirecting to dashboard in 5 seconds...
</p>

</div>

) : (

questions[current] ? (

<div className="bg-white p-6 md:p-10 rounded shadow w-full md:w-175">

<div className="flex justify-between mb-6">

<h2 className="text-xl font-semibold">
Question {current + 1}
</h2>

<p className="text-red-600 font-bold">
Time: {Math.floor(time/60)}:{time%60 < 10 ? "0" : ""}{time%60}
</p>

</div>

<p className="text-lg mb-6">
{questions[current].question}
</p>

<p className="text-gray-600 mb-4">
Marks: {questions[current].marks}
</p>

{questions[current].type === "mcq" && Array.isArray(questions[current].options) && questions[current].options.length === 4 ? (
<div className="space-y-2 mb-4">
{questions[current].options.map((option,optionIndex)=>(
<label key={`${questions[current]._id}-option-${optionIndex}`} className="flex items-center gap-2 border rounded p-2 cursor-pointer hover:bg-gray-50">
<input
type="radio"
name={`question-${questions[current]._id}`}
value={option}
checked={answer === option}
onChange={(e)=>setAnswer(e.target.value)}
/>
<span>{option}</span>
</label>
))}
</div>
) : (
<input
type="text"
placeholder="Type your answer..."
value={answer}
onChange={(e)=>setAnswer(e.target.value)}
className="w-full border p-3 rounded mb-4"
/>
)}

<button
onClick={nextQuestion}
className="bg-blue-600 text-white px-4 py-2 rounded"
>
{current === questions.length - 1 ? "Finish" : "Next Question"}
</button>

</div>

) : (

<div className="bg-white p-6 md:p-10 rounded shadow w-full max-w-100 text-center">
<h2 className="text-2xl font-bold mb-4">No Questions Available</h2>
<p className="text-gray-600 mb-6">No exam is available for you yet.</p>
<button
onClick={()=>{
setStartExam(false)
router.push("/dashboard")
}}
className="bg-blue-600 text-white px-6 py-2 rounded"
>
Back to Dashboard
</button>
</div>

)

)}

</div>

<div className="flex items-center justify-center min-h-[60vh] md:h-[85vh]">
<div className="w-full max-w-100 space-y-4">



{resultPublished && (

<div className="bg-white p-6 md:p-10 rounded shadow w-full max-w-100 text-center">

<h2 className="text-2xl font-bold mb-4">
Result Available
</h2>

<p className="text-gray-600 mb-6">
Admin has published your result.
</p>

<button
onClick={()=>router.push("/result")}
className="bg-green-600 text-white px-6 py-2 rounded"
>
Show Result
</button>

</div>

)}
</div>
</div>
</div>



</div>

)

}

export default function Dashboard(){
return (
<Suspense fallback={<div className="min-h-screen bg-gray-100" />}>
<DashboardContent />
</Suspense>
)
}