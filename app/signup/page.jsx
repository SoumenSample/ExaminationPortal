"use client"

import Image from "next/image";
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import logo from "../dashboard/WhatsApp Image 2026-03-18 at 9.04.15 PM.jpeg"

const initialForm = {
  name:"",
  email:"",
  phone:"",
  address:"",
  aadhaar:"",
  age:"",
  class:"",
  registrationSchool:"",
  registrationType:"individual",
  referralCode:"",
  password:"",
  confirm:""
}

export default function Signup() {
  const router = useRouter();
  const [role, setRole] = useState("student")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [step, setStep] = useState("role") // role, otp, details, confirmation
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [schools, setSchools] = useState([])
  const [registrationFee, setRegistrationFee] = useState(0)
  const [message, setMessage] = useState("")

  // Fetch schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await fetch("/api/school/list")
        if (res.ok) {
          const data = await res.json()
          setSchools(data.schools || [])
        }
      } catch (error) {
        console.error("Error fetching schools:", error)
      }
    }
    fetchSchools()
  }, [])

  // Calculate registration fee based on age
  useEffect(() => {
    if (form.age && role === "student") {
      const age = parseInt(form.age)
      if (age >= 8 && age <= 12) {
        setRegistrationFee(100)
      } else if (age >= 13 && age <= 16) {
        setRegistrationFee(150)
      } else if (age >= 17 && age <= 22) {
        setRegistrationFee(200)
      }
    }
  }, [form.age, role])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Step 1: Send OTP for all roles
  const handleSendOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, role })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || data.error || "Failed to send OTP")
        return
      }

      setMessage("OTP sent to your email!")
      setOtpSent(true)
      setOtp("")
      setStep("otp")
    } catch (error) {
      setMessage("Error sending OTP: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp, role })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || data.error || "OTP verification failed")
        return
      }

      setMessage("Email verified successfully!")
      setStep("details")
    } catch (error) {
      setMessage("Error verifying OTP: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Final Signup
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      if (form.password !== form.confirm) {
        setMessage("Passwords do not match")
        return
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          role,
          otp: "verified"
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.message || data.error || "Signup failed")
        return
      }

      const generatedCode = data.uniqueCode || data.referralCode

      alert(`${data.message}\n${generatedCode ? `Your unique code: ${generatedCode}` : ""}`)

      setForm(initialForm)
      setRole("student")
      setShowPassword(false)
      setShowConfirmPassword(false)
      setStep("role")
      setOtp("")
      setOtpSent(false)
      
      router.push("/login")
    } catch (error) {
      setMessage("Error during signup: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 shadow-2xl rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
          Create Account
        </h2>
        <Image
          src={logo}
          alt="Examination Portal Logo"
          className="object-cover rounded-xl w-30 h-15 ml-33 -mt-5 mb-6"
          priority
        />

        {/* Step 1: Select Role */}
        {step === "role" && (
          <form onSubmit={(e) => {
            e.preventDefault()
            setStep("otp")
          }} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Select Role</label>
            <select
              className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="school">School</option>
              <option value="staff">Staff</option>
              <option value="student">Student</option>
            </select>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Continue
            </button>
          </form>
        )}

        {/* Step 2: OTP for All Roles */}
        {step === "otp" && (
          <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            {!otpSent ? (
              <button
                type="submit"
                disabled={loading || !form.email}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Enter OTP</label>
                  <input
                    type="text"
                    placeholder="6-digit OTP"
                    maxLength="6"
                    className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !otp}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading || !form.email}
                  className="w-full border border-blue-600 text-blue-600 py-2 rounded hover:bg-blue-50 transition disabled:opacity-50"
                >
                  {loading ? "Please wait..." : "Resend OTP"}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setStep("role")
                setOtpSent(false)
                setOtp("")
                setMessage("")
              }}
              className="w-full text-slate-600 py-2"
            >
              Back
            </button>

            {message && (
              <p className={`text-sm ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </p>
            )}
          </form>
        )}

        {/* Step 3: Details Form (Students & Others) */}
        {step === "details" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-xs text-slate-500 mb-4">
              {role === "student" ? "Step 1 of 2: Student Details" : "Account Details"}
            </div>

            <input
              name="name"
              placeholder="Full Name"
              className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
              value={form.name}
              onChange={handleChange}
              required
            />

            {role === "student" && (
              <>
                <input
                  name="phone"
                  placeholder="Phone Number"
                  className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />

                <input
                  name="age"
                  type="number"
                  placeholder="Age (8-22)"
                  min="8"
                  max="22"
                  className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
                  value={form.age}
                  onChange={handleChange}
                  required
                />

                <select
                  name="class"
                  className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900"
                  value={form.class}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Class</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(c => (
                    <option key={c} value={`Class ${c}`}>Class {c}</option>
                  ))}
                </select>

                <select
                  name="registrationType"
                  className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900"
                  value={form.registrationType}
                  onChange={handleChange}
                >
                  <option value="individual">Individual Registration</option>
                  <option value="school">Registered Through School</option>
                </select>

                {form.registrationType === "school" && (
                  <>
                    <select
                      name="registrationSchool"
                      className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900"
                      value={form.registrationSchool}
                      onChange={handleChange}
                      required={form.registrationType === "school"}
                    >
                      <option value="">Select School</option>
                      {schools.length > 0 ? (
                        schools.map(school => (
                          <option key={school._id} value={school._id}>{school.name}</option>
                        ))
                      ) : (
                        <option disabled>No schools available</option>
                      )}
                    </select>
                    {schools.length === 0 && (
                      <p className="text-xs text-orange-600 mt-1">ℹ️ No schools found. Please contact admin or choose Individual Registration.</p>
                    )}
                  </>
                )}

                <input
                  name="aadhaar"
                  placeholder="Aadhaar Number"
                  className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
                  value={form.aadhaar}
                  onChange={handleChange}
                  required
                />

                <input
                  name="referralCode"
                  placeholder="Referral Code (optional)"
                  className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
                  value={form.referralCode}
                  onChange={handleChange}
                />

                {registrationFee > 0 && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                    <p className="text-sm text-slate-700">
                      <strong>Registration Fee:</strong> <span className="text-lg text-blue-600 font-bold">₹{registrationFee}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Age {form.age}: ₹{registrationFee}
                    </p>
                  </div>
                )}
              </>
            )}

            {role !== "student" && (
              <>
                <input
                  name="email"
                  placeholder="Email"
                  className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
                  value={form.email}
                  onChange={handleChange}
                  required
                />

                <input
                  name="phone"
                  placeholder="Phone"
                  className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
                  value={form.phone}
                  onChange={handleChange}
                />

                <input
                  name="address"
                  placeholder="Address"
                  className="w-full border border-slate-300 bg-white p-2 rounded text-slate-900 placeholder:text-slate-400"
                  value={form.address}
                  onChange={handleChange}
                />

                <p className="text-xs text-slate-500">
                  Unique code will be generated automatically after signup.
                </p>
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
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("role")
                setMessage("")
              }}
              className="w-full text-slate-600 py-2"
            >
              Back
            </button>

            {message && (
              <p className={`text-sm text-center ${message.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                {message}
              </p>
            )}
          </form>
        )}

        <p className="text-center mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 font-medium">
            Login
          </a>
        </p>
      </div>
    </div>
  )
}