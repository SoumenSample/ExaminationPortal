"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import logo from "../dashboard/logo.png"
import { useAppDialog } from "../component/AppDialog"

export default function Login(){

  const router = useRouter()
  const { showAlert } = useAppDialog()

  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [useOtpLogin, setUseOtpLogin] = useState(false)
  const [otpInfo, setOtpInfo] = useState("")
  const [error, setError] = useState("")

  const redirectByRole = (data) => {
    localStorage.setItem("userId", data.userId)
    localStorage.setItem("userRole", data.role)
    localStorage.setItem("userName", data.name)

    if (data.role === "school") {
      router.push(`/school/${data.userId}`)
    }
    else if (data.role === "member") {
      router.push(`/staff/${data.userId}`)
    }
    else if (data.role === "staff") {
      router.push(`/staff/${data.userId}`)
    }
    else if (data.role === "student") {
      router.push("/dashboard")
    }
    else if (data.role === "admin") {
      router.push("/admin")
    }
  }

  const login = async() => {
    setLoading(true)
    setError("")
    setOtpInfo("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          loginId,
          password
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Login failed")
        setLoading(false)
        return
      }

      await showAlert("Login successful", { title: "Login" })
      redirectByRole(data)

    } catch (err) {
      setError("Something went wrong: " + err.message)
    }

    setLoading(false)
  }

  const sendLoginOtp = async () => {
    if (!loginId.trim()) {
      setError("Enter your email or phone first")
      return
    }

    setOtpSending(true)
    setError("")
    setOtpInfo("")

    try {
      const res = await fetch("/api/auth/login-otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ loginId })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Failed to send OTP")
        setOtpSending(false)
        return
      }

      setOtpInfo(data.message || "OTP sent to your registered email")
    } catch (err) {
      setError("Something went wrong: " + err.message)
    }

    setOtpSending(false)
  }

  const loginWithOtp = async () => {
    if (!loginId.trim() || !otp.trim()) {
      setError("Email or phone and OTP are required")
      return
    }

    setOtpVerifying(true)
    setError("")
    setOtpInfo("")

    try {
      const res = await fetch("/api/auth/login-otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          loginId,
          otp
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "OTP login failed")
        setOtpVerifying(false)
        return
      }

      await showAlert("Login successful", { title: "Login" })
      redirectByRole(data)
    } catch (err) {
      setError("Something went wrong: " + err.message)
    }

    setOtpVerifying(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (useOtpLogin) {
      await loginWithOtp()
      return
    }

    await login()
  }

  const toggleLoginMode = () => {
    setUseOtpLogin((prev) => !prev)
    setError("")
    setOtpInfo("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white text-slate-900 shadow-2xl rounded-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-2">
          Login
        </h2>
        
        <p className="text-center text-sm text-slate-500 mb-6">
          Divyanshi Saksharta Mission Foundation
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Image
            src={logo}
            alt="Examination Portal Logo"
            className="object-cover rounded-full w-24 h-24 mx-auto mb-4"
            priority
          />

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Email or Phone Number
            </label>
            <input
              type="text"
              placeholder="Enter email or phone number"
              className="w-full border border-slate-300 bg-white p-3 rounded-lg text-slate-900 placeholder:text-slate-400"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />
            {/* <p className="text-xs text-slate-500 mt-1">
              You can use either your email address or phone number
            </p> */}
          </div>

          {!useOtpLogin && (
            <div className="relative">
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                className="w-full border border-slate-300 bg-white p-3 rounded-lg pr-20 text-slate-900 placeholder:text-slate-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!useOtpLogin}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-sm text-blue-600"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          )}

          {useOtpLogin && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Enter OTP
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    className="w-full border border-slate-300 bg-white p-3 rounded-lg text-slate-900 placeholder:text-slate-400"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required={useOtpLogin}
                  />
                  <button
                    type="button"
                    onClick={sendLoginOtp}
                    className="shrink-0 bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-900 transition disabled:opacity-50"
                    disabled={otpSending}
                  >
                    {otpSending ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </div>

              {otpInfo && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-emerald-700 text-sm">
                  {otpInfo}
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`w-full text-white py-3 rounded-lg transition disabled:opacity-50 font-semibold ${
              useOtpLogin ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={useOtpLogin ? otpVerifying : loading}
          >
            {useOtpLogin
              ? (otpVerifying ? "Verifying OTP..." : "Login with OTP")
              : (loading ? "Logging in..." : "Login")}
          </button>

          <button
            type="button"
            onClick={toggleLoginMode}
            className="w-full text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            {useOtpLogin ? "Login using password instead" : "Login using OTP instead"}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-slate-600">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-blue-600 font-medium hover:underline">
            Sign Up
          </a>
        </p>

       
      </div>
    </div>
  )
}