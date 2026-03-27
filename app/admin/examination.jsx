"use client"

import React, { useState, useEffect } from "react"

const Examination = () => {

const [type,setType] = useState("mcq")
const [open,setOpen] = useState(false)
const [questions,setQuestions] = useState([])
const [scheduleInput,setScheduleInput] = useState("")
const [savedSchedule,setSavedSchedule] = useState(null)

const [form,setForm] = useState({
question:"",
answer:"",
time:"",
marks:"",
})

const handleChange = (e)=>{
setForm({...form,[e.target.name]:e.target.value})
}


// FETCH ALL QUESTIONS FROM DATABASE
useEffect(()=>{

fetch("/api/question")
.then(res=>res.json())
.then(data=>setQuestions(data))

},[])

useEffect(()=>{

fetch("/api/exam-schedule")
.then(res=>res.json())
.then(data=>{
if(data?.scheduleAt){
const date = new Date(data.scheduleAt)
setSavedSchedule(date.toISOString())
setScheduleInput(date.toISOString().slice(0,16))
}
})

},[])

const saveSchedule = async ()=>{

if(!scheduleInput){
alert("Please select schedule time")
return
}

const res = await fetch("/api/exam-schedule",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({ scheduleAt: new Date(scheduleInput).toISOString() })
})

const data = await res.json()

if(!res.ok){
alert(data.message || "Could not save schedule")
return
}

setSavedSchedule(data.scheduleAt)
setScheduleInput(new Date(data.scheduleAt).toISOString().slice(0,16))
alert("Schedule saved")

}

const resetSchedule = async ()=>{

const res = await fetch("/api/exam-schedule",{
method:"DELETE"
})

const data = await res.json()

if(!res.ok){
alert(data.message || "Could not reset schedule")
return
}

setSavedSchedule(null)
setScheduleInput("")
alert("Schedule reset")

}

const deleteQuestion = async (id)=>{

const confirmed = window.confirm("Delete this question?")

if(!confirmed) return

const res = await fetch(`/api/question?id=${id}`,{
method:"DELETE"
})

const data = await res.json()

if(!res.ok){
alert(data.message || "Could not delete question")
return
}

setQuestions(prev=>prev.filter((q)=>q._id !== id))

}



const handleSubmit = async(e)=>{
e.preventDefault()

if(!form.question.trim()){
alert("Question is required")
return
}

if(type === "mcq" && !form.answer.trim()){
alert("Correct answer required")
return
}

const res = await fetch("/api/question",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
...form,
type
})
})

const data = await res.json()

if(!res.ok){
alert(data.message || "Error")
return
}


// ADD NEW QUESTION TO LIST
setQuestions([data.question,...questions])


setForm({
question:"",
answer:"",
time:"",
marks:"",
})

setOpen(false)

}

return (

<div className="p-6 -mt-10">

<div className="bg-white border rounded p-4 mb-6">

<h3 className="font-semibold mb-3">
Exam Schedule
</h3>

<div className="flex flex-col md:flex-row md:items-end gap-3">

<div className="flex-1">
<label className="block text-sm text-gray-600 mb-1">Schedule Date & Time</label>
<input
type="datetime-local"
value={scheduleInput}
onChange={(e)=>setScheduleInput(e.target.value)}
className="w-full border p-2 rounded"
/>
</div>

<button
type="button"
onClick={saveSchedule}
className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
Save Schedule
</button>

<button
type="button"
onClick={resetSchedule}
className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
>
Reset Schedule
</button>

</div>

{savedSchedule && (
<p className="text-sm text-gray-600 mt-2">
Saved schedule: {new Date(savedSchedule).toLocaleString()}
</p>
)}

</div>

<div className="flex justify-end mb-4">

<button
onClick={()=>setOpen(true)}
className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
Add Question
</button>

</div>


{/* Question List */}

<div className="space-y-4 ">

{questions.map((q,index)=>(

<div key={q._id || index} className="border p-4 rounded shadow">

<p className="font-semibold">{q.question}</p>

<p className="text-sm text-gray-600">
Type: {q.type}
</p>

{q.answer && (
<p className="text-sm text-gray-600">
Answer: {q.answer}
</p>
)}

<p className="text-sm text-gray-600">
Time: {q.time}
</p>

<p className="text-sm text-gray-600">
Marks: {q.marks}
</p>

<button
type="button"
onClick={()=>deleteQuestion(q._id)}
className="mt-3 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
>
Delete Question
</button>

</div>

))}

</div>


{/* Modal */}

{open && (

<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">

<div className="bg-white p-6 rounded-lg shadow w-full max-w-xl">

<h2 className="text-xl font-semibold mb-4">
Create Question
</h2>

<form className="space-y-4" onSubmit={handleSubmit}>

<select
className="w-full border p-2 rounded"
value={type}
onChange={(e)=>setType(e.target.value)}
>
<option value="mcq">MCQ</option>
<option value="descriptive">Descriptive</option>
</select>

<input
name="question"
placeholder="Question"
className="w-full border p-2 rounded"
value={form.question}
onChange={handleChange}
/>

{type === "mcq" && (

<input
name="answer"
placeholder="Correct Answer"
className="w-full border p-2 rounded"
value={form.answer}
onChange={handleChange}
/>

)}

<input
name="time"
placeholder="Time (minutes)"
className="w-full border p-2 rounded"
value={form.time}
onChange={handleChange}
/>

<input
name="marks"
placeholder="Marks"
className="w-full border p-2 rounded"
value={form.marks}
onChange={handleChange}
/>

<div className="flex gap-3">

<button
type="submit"
className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
Save
</button>

<button
type="button"
onClick={()=>setOpen(false)}
className="bg-gray-400 text-white px-4 py-2 rounded"
>
Cancel
</button>

</div>

</form>

</div>

</div>

)}

</div>

)

}

export default Examination