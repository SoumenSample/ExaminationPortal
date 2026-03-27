"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SchoolDashboard(){

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



{/* QUESTION SECTION */}
{/* <div className="grid grid-cols-2 gap-6 p-6">

<div className="flex items-center justify-center h-[85vh]">

{!startExam ? (

<div className="bg-white p-10 rounded shadow w-[400px] text-center">

<h2 className="text-2xl font-bold mb-4">
Online Examination
</h2>

<p className="text-gray-600 mb-6">
Click the button below to start the exam.
</p>

{!resultPublished &&<button
onClick={()=>setStartExam(true)}
className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
>
Start Exam
</button>
}

</div>

) : showResult ? (

<div className="bg-white p-10 rounded shadow w-[700px]">

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

</div>

) : (

questions[current] && (

<div className="bg-white p-10 rounded shadow w-[700px]">

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

<input
type="text"
placeholder="Type your answer..."
value={answer}
onChange={(e)=>setAnswer(e.target.value)}
className="w-full border p-3 rounded mb-4"
/>

<button
onClick={nextQuestion}
className="bg-blue-600 text-white px-4 py-2 rounded"
>
{current === questions.length - 1 ? "Finish" : "Next Question"}
</button>

</div>

)

)}

</div>

<div className="flex items-center justify-center h-[85vh]">
{resultPublished && (

<div className="bg-white p-10 rounded shadow w-[400px] text-center">

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
</div> */}



</div>

)

}