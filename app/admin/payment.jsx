"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Dashboard() {

  const router = useRouter()

  const [user,setUser] = useState(null)

  // PAYMENT STATES
  const [paymentForm,setPaymentForm] = useState({
    name:"",
    email:"",
    amount:"",
    type:"inward"
  })

  const [payments,setPayments] = useState([])
  const [showPaymentModal,setShowPaymentModal] = useState(false)

  // ---------------- FETCH USER ----------------
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

  async function fetchPayments(){
    const res = await fetch("/api/payment")
    const data = await res.json()
    setPayments(data)
  }

  // ---------------- FETCH PAYMENTS ----------------
  useEffect(()=>{
    const loadPayments = async () => {
      const res = await fetch("/api/payment")
      const data = await res.json()
      setPayments(data)
    }

    loadPayments()
  },[])

  // ---------------- ADD PAYMENT ----------------
  async function handlePaymentSubmit(e){
    e.preventDefault()

    await fetch("/api/payment",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify(paymentForm)
    })

    setPaymentForm({
      name:"",
      email:"",
      amount:"",
      type:"inward"
    })

    setShowPaymentModal(false)
    fetchPayments()
  }

  return(
    <div className="min-h-screen bg-gray-100">

      {/* NAVBAR */}
     

      {/* ➕ ADD PAYMENT BUTTON */}
     
      <div className="flex justify-end mb-4">


 <button
        onClick={()=>setShowPaymentModal(true)}
        className="bg-blue-600 text-white px-4 mr-5 py-2 rounded hover:bg-blue-700"
      >
        + Add Payment
      </button>
</div>

      {/* PAYMENT TABLE */}
      <div className="p-6">

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Payment History</h2>

          <div className="overflow-hidden">
          <div
            className="overflow-x-auto touch-pan-x pb-2 border border-gray-300 rounded max-w-100 md:max-w-full"
            style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "thin", scrollbarColor: "#888 #f1f1f1" }}
          >
            <table className="w-max min-w-full border whitespace-nowrap">

              <thead className="bg-gray-200">
                <tr>
                  <th className="border p-2 min-w-30">Name</th>
                  <th className="border p-2 min-w-45">Email</th>
                  <th className="border p-2 min-w-30">Amount</th>
                  <th className="border p-2 min-w-25">Type</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((p)=>(
                  <tr key={p._id} className="text-center">
                    <td className="border p-2 min-w-30">{p.name}</td>
                    <td className="border p-2 min-w-45">{p.email}</td>
                    <td className="border p-2 min-w-30">₹{p.amount}</td>
                    <td className={`border p-2 min-w-25 font-semibold ${
                      p.type === "inward"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                      {p.type}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
          </div>
        </div>

      </div>

      {/* MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

          <div className="bg-white p-6 rounded shadow w-[92%] max-w-100 relative">

            <button
              onClick={()=>setShowPaymentModal(false)}
              className="absolute top-2 right-2 text-red-500"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Add Payment</h2>

            <form onSubmit={handlePaymentSubmit} className="space-y-3">

              <input
                placeholder="Name"
                value={paymentForm.name}
                onChange={(e)=>setPaymentForm({...paymentForm,name:e.target.value})}
                className="border p-2 w-full"
                required
              />

              <input
                placeholder="Email"
                value={paymentForm.email}
                onChange={(e)=>setPaymentForm({...paymentForm,email:e.target.value})}
                className="border p-2 w-full"
                required
              />

              <input
                type="number"
                placeholder="Amount"
                value={paymentForm.amount}
                onChange={(e)=>setPaymentForm({...paymentForm,amount:e.target.value})}
                className="border p-2 w-full"
                required
              />

              <select
                value={paymentForm.type}
                onChange={(e)=>setPaymentForm({...paymentForm,type:e.target.value})}
                className="border p-2 w-full"
              >
                <option value="inward">Inward</option>
                <option value="outward">Outward</option>
              </select>

              <button className="bg-blue-600 text-white w-full py-2 rounded">
                Save Payment
              </button>

            </form>
          </div>
        </div>
      )}
    </div>
  )
}