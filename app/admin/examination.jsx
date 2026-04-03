"use client"

import React, { useState, useEffect } from "react"
import { useAppDialog } from "../component/AppDialog"

const AGE_SLAB_OPTIONS = [
{ value: "8-12", label: "Age 8-12 years" },
{ value: "13-16", label: "Age 13-16 years" },
{ value: "17-22", label: "Age 17-22 years" },
]

const Examination = () => {
const { showAlert, showConfirm } = useAppDialog()

const [type,setType] = useState("mcq")
const [open,setOpen] = useState(false)
const [questions,setQuestions] = useState([])
const [scheduleInput,setScheduleInput] = useState("")
const [savedSchedule,setSavedSchedule] = useState(null)
const [activeCategory,setActiveCategory] = useState("8-12")
const [savingQuestion,setSavingQuestion] = useState(false)
const [modalMode,setModalMode] = useState("create")
const [editingQuestionId,setEditingQuestionId] = useState("")

const [form,setForm] = useState({
question:"",
answer:"",
option1:"",
option2:"",
option3:"",
option4:"",
time:"",
marks:"",
ageSlab:"8-12",
})

const isViewMode = modalMode === "view"
const isEditMode = modalMode === "edit"

const handleChange = (e)=>{
setForm({...form,[e.target.name]:e.target.value})
}

const fetchQuestions = async ()=>{
try{
const res = await fetch("/api/admin/question")
const data = await res.json()
setQuestions(Array.isArray(data) ? data : [])
}catch{
setQuestions([])
}
}

const openCreateQuestionModal = (ageSlab)=>{
setModalMode("create")
setEditingQuestionId("")
setType("mcq")
setForm({
question:"",
answer:"",
option1:"",
option2:"",
option3:"",
option4:"",
time:"",
marks:"",
ageSlab,
})
setOpen(true)
}

const openViewQuestionModal = (question)=>{
setModalMode("view")
setEditingQuestionId(question._id)
setType(question.type || "mcq")
setForm({
question: question.question || "",
answer: question.answer || "",
option1: question?.options?.[0] || "",
option2: question?.options?.[1] || "",
option3: question?.options?.[2] || "",
option4: question?.options?.[3] || "",
time: String(question.time ?? ""),
marks: String(question.marks ?? ""),
ageSlab: question.ageSlab || "8-12",
})
setOpen(true)
}

const openEditQuestionModal = (question)=>{
setModalMode("edit")
setEditingQuestionId(question._id)
setType(question.type || "mcq")
setForm({
question: question.question || "",
answer: question.answer || "",
option1: question?.options?.[0] || "",
option2: question?.options?.[1] || "",
option3: question?.options?.[2] || "",
option4: question?.options?.[3] || "",
time: String(question.time ?? ""),
marks: String(question.marks ?? ""),
ageSlab: question.ageSlab || "8-12",
})
setOpen(true)
}


// FETCH ALL QUESTIONS FROM DATABASE
useEffect(()=>{
fetchQuestions()

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
await showAlert("Please select schedule time", { title: "Exam Schedule" })
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
await showAlert(data.message || "Could not save schedule", { title: "Exam Schedule" })
return
}

setSavedSchedule(data.scheduleAt)
setScheduleInput(new Date(data.scheduleAt).toISOString().slice(0,16))
await showAlert("Schedule saved", { title: "Exam Schedule" })

}

const resetSchedule = async ()=>{

const res = await fetch("/api/exam-schedule",{
method:"DELETE"
})

const data = await res.json()

if(!res.ok){
await showAlert(data.message || "Could not reset schedule", { title: "Exam Schedule" })
return
}

setSavedSchedule(null)
setScheduleInput("")
await showAlert("Schedule reset", { title: "Exam Schedule" })

}

const deleteQuestion = async (id)=>{

const confirmed = await showConfirm("Delete this question?", {
title: "Delete Question",
confirmLabel: "Delete",
cancelLabel: "Cancel",
})

if(!confirmed) return

const res = await fetch(`/api/admin/question?id=${id}` ,{
method:"DELETE"
})

const data = await res.json()

if(!res.ok){
await showAlert(data.message || "Could not delete question", { title: "Delete Question" })
return
}

setQuestions(prev=>prev.filter((q)=>q._id !== id))

}



const handleSubmit = async(e)=>{
e.preventDefault()

if(savingQuestion) return
if(isViewMode) return

if(!form.question.trim()){
await showAlert("Question is required", { title: isEditMode ? "Edit Question" : "Create Question" })
return
}

if(type === "mcq" && !form.answer.trim()){
await showAlert("Correct answer required", { title: isEditMode ? "Edit Question" : "Create Question" })
return
}

const mcqOptions = [form.option1,form.option2,form.option3,form.option4].map((item)=>item.trim())

if(type === "mcq"){
if(mcqOptions.some((item)=>!item)){
await showAlert("Please provide all 4 options for MCQ", { title: isEditMode ? "Edit Question" : "Create Question" })
return
}

if(!mcqOptions.includes(form.answer.trim())){
await showAlert("Correct answer must match one of the 4 options", { title: isEditMode ? "Edit Question" : "Create Question" })
return
}
}

if(!form.ageSlab){
await showAlert("Age slab is required", { title: isEditMode ? "Edit Question" : "Create Question" })
return
}

setSavingQuestion(true)

try{

const endpoint = isEditMode ? `/api/admin/question?id=${editingQuestionId}` : "/api/admin/question"
const method = isEditMode ? "PATCH" : "POST"

const res = await fetch(endpoint,{
method,
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
...form,
options: mcqOptions,
type
})
})

const data = await res.json()

if(!res.ok){
await showAlert(
data.message || data.error || (isEditMode ? "Could not update question" : "Could not create question"),
{ title: isEditMode ? "Edit Question" : "Create Question" }
)
return
}


// ADD/UPDATE QUESTION IN LIST
if(data?.question){
if(isEditMode){
setQuestions((prev)=>prev.map((item)=> item._id === data.question._id ? data.question : item))
}else{
setQuestions((prev)=>[data.question,...prev])
}
setActiveCategory(data.question.ageSlab || form.ageSlab)
}else{
await fetchQuestions()
setActiveCategory(form.ageSlab)
}

await showAlert(
isEditMode ? "Question updated successfully" : "Question saved successfully",
{ title: isEditMode ? "Edit Question" : "Create Question" }
)


setForm({
question:"",
answer:"",
option1:"",
option2:"",
option3:"",
option4:"",
time:"",
marks:"",
ageSlab:activeCategory,
})
setEditingQuestionId("")
setModalMode("create")

setOpen(false)

}catch{
await showAlert(
isEditMode ? "Could not update question. Please try again." : "Could not save question. Please try again.",
{ title: isEditMode ? "Edit Question" : "Create Question" }
)
}finally{
setSavingQuestion(false)
}

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

<div className="w-full flex flex-wrap gap-2">
{AGE_SLAB_OPTIONS.map((category)=>(
<button
key={category.value}
type="button"
onClick={()=>setActiveCategory(category.value)}
className={`px-4 py-2 rounded border ${activeCategory === category.value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-gray-300"}`}
>
{category.label}
</button>
))}
</div>

</div>


{/* Question List */}

<div className="space-y-5">

{AGE_SLAB_OPTIONS.filter((category)=>category.value === activeCategory).map((category)=>{
const categoryQuestions = questions.filter((q)=>q.ageSlab === category.value)

return (
<div
key={category.value}
className="border rounded-lg p-4 bg-blue-50 border-blue-200"
>
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
<div>
<h3 className="font-semibold text-lg">{category.label}</h3>
<p className="text-sm text-gray-600">Question Set ({categoryQuestions.length})</p>
</div>

<button
type="button"
onClick={()=>openCreateQuestionModal(category.value)}
className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
Add Question In This Category
</button>
</div>

{categoryQuestions.length === 0 ? (
<p className="text-sm text-gray-500">No questions added for this age category yet.</p>
) : (
<div className="space-y-4">
{categoryQuestions.map((q,index)=>(
<div key={q._id || index} className="border p-4 rounded shadow-sm bg-white">
<p className="font-semibold">{q.question}</p>

<p className="text-sm text-gray-600">
Type: {q.type}
</p>

{q.answer && (
<p className="text-sm text-gray-600">
Answer: {q.answer}
</p>
)}

{q.type === "mcq" && Array.isArray(q.options) && q.options.length > 0 && (
<div className="text-sm text-gray-600">
<p className="font-medium">Options:</p>
<ol className="list-decimal pl-5">
{q.options.map((option,optionIndex)=>(
<li key={`${q._id}-option-${optionIndex}`}>{option}</li>
))}
</ol>
</div>
)}

<p className="text-sm text-gray-600">
Time: {q.time}
</p>

<p className="text-sm text-gray-600">
Marks: {q.marks}
</p>

<div className="mt-3 flex flex-wrap gap-2">
<button
type="button"
onClick={()=>openViewQuestionModal(q)}
className="bg-slate-600 text-white px-3 py-1 rounded hover:bg-slate-700"
>
View
</button>

<button
type="button"
onClick={()=>openEditQuestionModal(q)}
className="bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600"
>
Edit
</button>

<button
type="button"
onClick={()=>deleteQuestion(q._id)}
className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
>
Delete
</button>
</div>

</div>
))}
</div>
)}
</div>
)
})}

</div>


{/* Modal */}

{open && (

<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">

<div className="bg-white p-6 rounded-lg shadow w-full max-w-xl">

<h2 className="text-xl font-semibold mb-4">
{isViewMode ? "View Question" : isEditMode ? "Edit Question" : "Create Question"} ({AGE_SLAB_OPTIONS.find((option)=>option.value === form.ageSlab)?.label || "Category"})
</h2>

<form className="space-y-4" onSubmit={handleSubmit}>

<select
className="w-full border p-2 rounded"
value={type}
onChange={(e)=>setType(e.target.value)}
disabled={isViewMode}
>
<option value="mcq">MCQ</option>
<option value="descriptive">Descriptive</option>
</select>

{isEditMode ? (
<select
name="ageSlab"
className="w-full border p-2 rounded"
value={form.ageSlab}
onChange={handleChange}
>
{AGE_SLAB_OPTIONS.map((option)=>(
<option key={option.value} value={option.value}>{option.label}</option>
))}
</select>
) : (
<div className="w-full border p-2 rounded bg-gray-50 text-gray-700">
Category: {AGE_SLAB_OPTIONS.find((option)=>option.value === form.ageSlab)?.label || "-"}
</div>
)}

<input
name="question"
placeholder="Question"
className="w-full border p-2 rounded"
value={form.question}
onChange={handleChange}
disabled={isViewMode}
/>

{type === "mcq" && (

<>

<input
name="option1"
placeholder="Option 1"
className="w-full border p-2 rounded"
value={form.option1}
onChange={handleChange}
disabled={isViewMode}
/>

<input
name="option2"
placeholder="Option 2"
className="w-full border p-2 rounded"
value={form.option2}
onChange={handleChange}
disabled={isViewMode}
/>

<input
name="option3"
placeholder="Option 3"
className="w-full border p-2 rounded"
value={form.option3}
onChange={handleChange}
disabled={isViewMode}
/>

<input
name="option4"
placeholder="Option 4"
className="w-full border p-2 rounded"
value={form.option4}
onChange={handleChange}
disabled={isViewMode}
/>

{isViewMode ? (
<input
name="answer"
placeholder="Correct Answer"
className="w-full border p-2 rounded"
value={form.answer}
readOnly
disabled
/>
) : (
<select
name="answer"
className="w-full border p-2 rounded"
value={form.answer}
onChange={handleChange}
>
<option value="">Select Correct Answer</option>
{[form.option1,form.option2,form.option3,form.option4]
.map((item)=>item.trim())
.filter(Boolean)
.map((item)=>(
<option key={item} value={item}>{item}</option>
))}
</select>
)}

</>

)}

<input
name="time"
placeholder="Time (minutes)"
className="w-full border p-2 rounded"
value={form.time}
onChange={handleChange}
disabled={isViewMode}
/>

<input
name="marks"
placeholder="Marks"
className="w-full border p-2 rounded"
value={form.marks}
onChange={handleChange}
disabled={isViewMode}
/>

<div className="flex gap-3">

{!isViewMode && (
<button
type="submit"
disabled={savingQuestion}
className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
{savingQuestion ? "Saving..." : isEditMode ? "Update" : "Save"}
</button>
)}

<button
type="button"
onClick={()=>{
setOpen(false)
setEditingQuestionId("")
setModalMode("create")
}}
className="bg-gray-400 text-white px-4 py-2 rounded"
>
{isViewMode ? "Close" : "Cancel"}
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