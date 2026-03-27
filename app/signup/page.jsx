"use client"

import Image from "next/image";
import { useRouter } from "next/navigation"
import { useState } from "react"
import logo from "../dashboard/WhatsApp Image 2026-03-18 at 9.04.15 PM.jpeg"

const initialForm = {
name:"",
email:"",
phone:"",
address:"",
aadhaar:"",
referralCode:"",
password:"",
confirm:""
}

export default function Signup() {
const router = useRouter();
const [role,setRole] = useState("student")
const [showPassword,setShowPassword] = useState(false)
const [showConfirmPassword,setShowConfirmPassword] = useState(false)

const [form,setForm] = useState(initialForm)

const handleChange = (e)=>{
setForm({...form,[e.target.name]:e.target.value})
}

const handleSubmit = async(e)=>{
e.preventDefault()

if(form.password !== form.confirm){
alert("Passwords do not match")
return
}

const res = await fetch("/api/auth/signup",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
...form,
role
})
})

const data = await res.json()
const generatedCode = data.uniqueCode || data.referralCode


if(!res.ok){
alert(data.message || data.error || "Signup failed")
return
}

if(generatedCode){
alert(`${data.message}\nYour unique code: ${generatedCode}`)

}else{
alert(data.message)
}

setForm(initialForm)
setRole("student")
setShowPassword(false)
setShowConfirmPassword(false)
router.push("/login")
}

return (

<div className="min-h-screen bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">

<div className="bg-white text-slate-900 shadow-2xl rounded-xl p-8 w-full max-w-md">

<h2 className="text-2xl font-bold text-slate-900 text-center mb-6">
Create Account
</h2>
<Image
            src={logo}
            alt="Examination Portal Logo"
            // width={140}
            // height={60}
            className=" object-cover rounded-xl w-30 h-15 ml-33 -mt-5 mb-6"
            priority
          />

<form onSubmit={handleSubmit} className="space-y-4">

<select
className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900"
value={role}
onChange={(e)=>setRole(e.target.value)}
>

<option value="school">School</option>
<option value="staff">Staff</option>
<option value="student">Student</option>
{/* <option value="admin">Admin</option> */}

</select>

<input
name="name"
placeholder="Full Name"
className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
value={form.name}
onChange={handleChange}
/>

<input
name="email"
placeholder="Email"
className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
value={form.email}
onChange={handleChange}
/>

<input
name="phone"
placeholder="Phone"
className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
value={form.phone}
onChange={handleChange}
/>

{role !== "student" && (
<>

<p className="text-xs text-slate-500">
Unique code will be generated automatically after signup.
</p>

<input
name="address"
placeholder="Address"
className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
value={form.address}
onChange={handleChange}
/>


</>

)}

{role === "student" && (
    <>

<input
name="aadhaar"
placeholder="Aadhaar Number"
className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
value={form.aadhaar}
onChange={handleChange}
/>
<input
name="referralCode"
placeholder="Referral Code (optional)"
className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
value={form.referralCode}
onChange={handleChange}
/>
</>

)}

<div className="relative">
<input
type={showPassword ? "text" : "password"}
name="password"
placeholder="Password"
className="w-full border border-slate-300 bg-white p-2 rounded pr-16 text-slate-900 placeholder:text-slate-400"
value={form.password}
onChange={handleChange}
/>

<button
type="button"
onClick={()=>setShowPassword(!showPassword)}
className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600"
>
{showPassword ? "Hide" : "Show"}
</button>
</div>

<div className="relative">
<input
type={showConfirmPassword ? "text" : "password"}
name="confirm"
placeholder="Confirm Password"
className="w-full border border-slate-300 bg-white p-2 rounded pr-16 text-slate-900 placeholder:text-slate-400"
value={form.confirm}
onChange={handleChange}
/>

<button
type="button"
onClick={()=>setShowConfirmPassword(!showConfirmPassword)}
className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600"
>
{showConfirmPassword ? "Hide" : "Show"}
</button>
</div>

<button
className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
>

Sign Up

</button>

</form>

<p className="text-center mt-4 text-sm text-slate-600">

Already have an account?  
<a href="/login" className="text-blue-600 font-medium">
 Login
</a>

</p>

</div>

</div>

)

}