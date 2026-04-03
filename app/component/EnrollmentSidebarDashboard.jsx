"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import logo from "../dashboard/WhatsApp Image 2026-03-18 at 9.04.15 PM.jpeg"
import { useAppDialog } from "./AppDialog"

function formatDate(value) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatDateInput(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function todayDateKey() {
  return formatDateInput(new Date())
}

function formatTime12Hour(value) {
  if (!value) return "-"

  const parts = String(value).split(":")
  if (parts.length < 2) return value

  const hour = Number(parts[0])
  const minute = parts[1]

  if (Number.isNaN(hour)) return value

  const suffix = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12

  return `${hour12}:${minute} ${suffix}`
}

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function EnrollmentSidebarDashboard({ title }) {
  const router = useRouter()
  const { showAlert } = useAppDialog()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openProfile, setOpenProfile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tab, setTab] = useState("enrollments")
  const [error, setError] = useState("")
  const [students, setStudents] = useState([])
  const [searchText, setSearchText] = useState("")
  const [minCost, setMinCost] = useState("")
  const [maxCost, setMaxCost] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [bankDetails, setBankDetails] = useState("")
  const [savingBankDetails, setSavingBankDetails] = useState(false)
  const [MemberActivities, setMemberActivities] = useState([])
  const [loadingMemberActivity, setLoadingMemberActivity] = useState(false)
  const [savingMemberActivity, setSavingMemberActivity] = useState(false)
  const [activityDate, setActivityDate] = useState(todayDateKey())
  const [dailyReport, setDailyReport] = useState("")

  useEffect(() => {
    if (!activityDate) return

    const existing = MemberActivities.find((row) => row.date === activityDate)

    if (existing) {
      setDailyReport(existing.report || "")
      return
    }

    setDailyReport("")
  }, [activityDate, MemberActivities])

  const fetchMemberActivity = async (MemberUserId) => {
    if (!MemberUserId) return

    setLoadingMemberActivity(true)

    try {
      const response = await fetch(`/api/member-activity?userId=${MemberUserId}`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || "Could not load member activity")
      }

      const rows = Array.isArray(payload?.activities) ? payload.activities : []
      setMemberActivities(rows)

      const today = todayDateKey()
      const existingForToday = rows.find((row) => row.date === today)

      if (existingForToday) {
        setActivityDate(existingForToday.date || today)
        setDailyReport(existingForToday.report || "")
      }
    } catch (activityError) {
      await showAlert(activityError.message || "Could not load member activity", { title: "Member Activity" })
    } finally {
      setLoadingMemberActivity(false)
    }
  }

  useEffect(() => {
    const userId = localStorage.getItem("userId")

    if (!userId) {
      router.push("/login")
      return
    }

    let isMounted = true

    async function loadDashboard() {
      try {
        setLoading(true)
        setError("")

        const userResponse = await fetch(`/api/auth/user?id=${userId}`)
        const userData = await userResponse.json()

        if (!userResponse.ok) {
          throw new Error(userData?.message || "Could not load user")
        }

        if (!isMounted) return
        setUser(userData)
        setBankDetails(userData?.bankDetails || "")

        const enrollmentResponse = await fetch(`/api/dashboard/enrollments?userId=${userId}`)
        const enrollmentData = await enrollmentResponse.json()

        if (!enrollmentResponse.ok) {
          throw new Error(enrollmentData?.message || "Could not load enrollments")
        }

        if (!isMounted) return
        setStudents(Array.isArray(enrollmentData.students) ? enrollmentData.students : [])

        if (userData?.role === "member" || userData?.role === "staff") {
          await fetchMemberActivity(userId)
        }
      } catch (loadError) {
        if (!isMounted) return
        setError(loadError.message || "Failed to load dashboard data")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [router])

  const logout = () => {
    localStorage.removeItem("userId")
    router.push("/login")
  }

  const addStudent = () => {
    router.push("/signup")
  }

  const menu = useMemo(() => {
    const baseMenu = [
      { name: "Student Enrollments", value: "enrollments" },
      { name: "Bank Details", value: "bank-details" },
    ]

    if (user?.role === "member" || user?.role === "staff") {
      baseMenu.push({ name: "Member Activity", value: "member-activity" })
    }

    return baseMenu
  }, [user?.role])

  const saveBankDetails = async () => {
    if (!user?._id) {
      await showAlert("User is not loaded yet. Please try again.", { title: "Bank Details" })
      return
    }

    try {
      setSavingBankDetails(true)

      const response = await fetch("/api/auth/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user._id,
          bankDetails,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to save bank details")
      }

      const savedDetails = payload?.bankDetails || ""
      setBankDetails(savedDetails)
      setUser((prev) => (prev ? { ...prev, bankDetails: savedDetails } : prev))

      await showAlert("Bank details saved successfully", { title: "Bank Details" })
    } catch (saveError) {
      await showAlert(saveError.message || "Failed to save bank details", { title: "Bank Details" })
    } finally {
      setSavingBankDetails(false)
    }
  }

  const currentActivityForDate = useMemo(() => {
    if (!activityDate) return null
    return MemberActivities.find((row) => row.date === activityDate) || null
  }, [activityDate, MemberActivities])

  const markAttendance = async (action) => {
    if (!user?._id) {
      await showAlert("User is not loaded yet. Please try again.", { title: "Attendance" })
      return
    }

    try {
      setSavingMemberActivity(true)

      const response = await fetch("/api/member-activity", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          action,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || `Failed to ${action}`)
      }

      if (payload?.activity?.date) {
        setActivityDate(payload.activity.date)
      }

      await fetchMemberActivity(user._id)
      await showAlert(action === "check-in" ? "Checked in successfully" : "Checked out successfully", {
        title: "Attendance",
      })
    } catch (saveError) {
      await showAlert(saveError.message || `Failed to ${action}`, { title: "Attendance" })
    } finally {
      setSavingMemberActivity(false)
    }
  }

  const saveDailyReport = async () => {
    if (!user?._id) {
      await showAlert("User is not loaded yet. Please try again.", { title: "Daily Report" })
      return
    }

    if (!activityDate) {
      await showAlert("Please select report date.", { title: "Daily Report" })
      return
    }

    if (!dailyReport.trim()) {
      await showAlert("Please enter report details.", { title: "Daily Report" })
      return
    }

    try {
      setSavingMemberActivity(true)

      const response = await fetch("/api/member-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          date: activityDate,
          checkIn: currentActivityForDate?.checkIn || "",
          checkOut: currentActivityForDate?.checkOut || "",
          report: dailyReport,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to save report")
      }

      await fetchMemberActivity(user._id)
      await showAlert("Daily report saved", { title: "Daily Report" })
    } catch (saveError) {
      await showAlert(saveError.message || "Failed to save report", { title: "Daily Report" })
    } finally {
      setSavingMemberActivity(false)
    }
  }

  const filteredStudents = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    const min = minCost === "" ? null : Number(minCost)
    const max = maxCost === "" ? null : Number(maxCost)

    return students.filter((student) => {
      const studentName = String(student.name || "").toLowerCase()
      const studentClass = String(student.class || "").toLowerCase()
      const studentRollNo = String(student.rollNo || "").toLowerCase()
      const studentSection = String(student.section || "").toLowerCase()
      const registrationAmount = Number(student.registrationAmount || 0)
      const enrolled = formatDateInput(student.enrolledAt)

      const textOk = !q || studentName.includes(q) || studentClass.includes(q) || studentRollNo.includes(q) || studentSection.includes(q)
      const minOk = min === null || registrationAmount >= min
      const maxOk = max === null || registrationAmount <= max
      const fromOk = !fromDate || (enrolled && enrolled >= fromDate)
      const toOk = !toDate || (enrolled && enrolled <= toDate)

      return textOk && minOk && maxOk && fromOk && toOk
    })
  }, [students, searchText, minCost, maxCost, fromDate, toDate])

  const filteredSummary = useMemo(() => {
    return filteredStudents.reduce(
      (acc, student) => {
        acc.totalStudents += 1
        acc.totalRegistrationAmount += Number(student.registrationAmount || 0)
        return acc
      },
      { totalStudents: 0, totalRegistrationAmount: 0 }
    )
  }, [filteredStudents])

  const resetFilters = () => {
    setSearchText("")
    setMinCost("")
    setMaxCost("")
    setFromDate("")
    setToDate("")
  }

  const exportExcel = () => {
    const headers = ["Student Name", "Class", "Roll No", "Section", "Date", "Registration Cost"]
    const rows = filteredStudents.map((student) => [
      student.name || "",
      student.class || "",
      student.rollNo || "",
      student.section || "",
      formatDate(student.enrolledAt),
      Number(student.registrationAmount || 0),
    ])

    const csv = [headers, ...rows]
      .map((line) => line.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n")

    downloadCsv(`enrollments-${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  const exportPdf = () => {
    const popup = window.open("", "_blank")
    if (!popup) return

    const rowHtml = filteredStudents
      .map(
        (student) =>
          `<tr>
            <td>${String(student.name || "-")}</td>
            <td>${String(student.class || "-")}</td>
            <td>${String(student.rollNo || "-")}</td>
            <td>${String(student.section || "-")}</td>
            <td>${formatDate(student.enrolledAt)}</td>
            <td>Rs ${Number(student.registrationAmount || 0)}</td>
          </tr>`
      )
      .join("")

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student Enrollments Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 8px; }
            p { margin: 0 0 16px; color: #475569; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>Student Enrollments Report</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Total Students: ${filteredSummary.totalStudents} | Total Registration Amount: Rs ${filteredSummary.totalRegistrationAmount}</p>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Roll No</th>
                <th>Section</th>
                <th>Date</th>
                <th>Registration Cost</th>
              </tr>
            </thead>
            <tbody>
              ${rowHtml || '<tr><td colspan="6">No records found</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `

    popup.document.write(html)
    popup.document.close()
    popup.focus()
    popup.print()
  }

  return (
    <div className="flex min-h-screen bg-gray-100 text-slate-900">
      <div className="hidden md:block w-64 bg-white text-black p-6">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src={logo}
            alt="Examination Portal Logo"
            className="object-cover rounded-xl w-100 h-25 -mt-5"
            priority
          />
        </div>

        <ul className="space-y-3">
          {menu.map((item) => (
            <li
              key={item.value}
              onClick={() => setTab(item.value)}
              className={`cursor-pointer px-3 py-2 rounded transition ${
                tab === item.value
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-200"
              }`}
            >
              {item.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="relative flex justify-between items-center bg-white shadow px-4 md:px-10 py-4 mx-4 md:mx-10 my-4 md:my-5 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded border border-gray-300 flex items-center justify-center text-xl"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? "X" : "☰"}
            </button>

            <h1 className="text-xl font-bold capitalize">{title}</h1>
          </div>

          {mobileMenuOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/20 z-30 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="absolute top-full left-4 right-4 mt-2 bg-white border rounded-lg shadow-lg p-3 z-40 md:hidden">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">Menu</p>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    X
                  </button>
                </div>

                <ul className="space-y-2">
                  {menu.map((item) => (
                    <li
                      key={item.value}
                      onClick={() => {
                        setTab(item.value)
                        setMobileMenuOpen(false)
                      }}
                      className={`cursor-pointer px-3 py-2 rounded transition ${
                        tab === item.value
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-200"
                      }`}
                    >
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          <div className="relative">
            <div
              onClick={() => setOpenProfile((prev) => !prev)}
              className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-full cursor-pointer font-bold"
            >
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>

            {openProfile && (
              <div className="absolute right-0 mt-3 w-56 bg-white border rounded shadow-lg p-4 z-50">
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium mb-2 capitalize">{user?.role || "-"}</p>

                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium mb-3 break-all">{user?.email || "-"}</p>

                {user?.uniqueCode && (
                  <>
                    <p className="text-sm text-gray-500">Unique Code</p>
                    <p className="font-medium mb-3">{user.uniqueCode}</p>
                  </>
                )}

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

        <main className="p-4 md:p-8 flex-1">
          {tab === "enrollments" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <p className="text-xs text-slate-500">Current Commission</p>
                  <p className="text-2xl font-semibold text-slate-900">Rs {Number(user?.currentCommission || 0)}</p>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <p className="text-xs text-slate-500">Total Commission</p>
                  <p className="text-2xl font-semibold text-slate-900">Rs {Number(user?.totalCommission || 0)}</p>
                </div>

                <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                  <p className="text-xs text-slate-500">Total Referral Count</p>
                  <p className="text-2xl font-semibold text-slate-900">{Number(user?.totalReferralCount || 0)}</p>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Enrolled Students</h2>
                  <p className="text-sm text-slate-500">Total enrolled: {filteredSummary.totalStudents}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={exportExcel}
                    className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Export Excel
                  </button>
                  <button
                    onClick={exportPdf}
                    className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={addStudent}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                  >
                    Add Student
                  </button>
                </div>
              </div>

              <section className="rounded-xl bg-white p-4 shadow-sm md:p-5 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search by student/class/roll no/section"
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                  <input
                    type="number"
                    min="0"
                    value={minCost}
                    onChange={(e) => setMinCost(e.target.value)}
                    placeholder="Min cost"
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                  <input
                    type="number"
                    min="0"
                    value={maxCost}
                    onChange={(e) => setMaxCost(e.target.value)}
                    placeholder="Max cost"
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 w-full"
                    />
                    <button
                      onClick={resetFilters}
                      className="border border-gray-300 rounded px-3 py-2 hover:bg-gray-100"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Filtered registration amount total: Rs {filteredSummary.totalRegistrationAmount}
                </p>
              </section>

              <section className="rounded-xl bg-white p-4 shadow-sm md:p-5">
                {loading ? (
                  <p className="text-sm text-slate-500">Loading enrollment details...</p>
                ) : error ? (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-sm text-slate-500">No students enrolled yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="px-3 py-2">Student Name</th>
                          <th className="px-3 py-2">Roll No</th>
                          <th className="px-3 py-2">Section</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Registration Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student._id} className="rounded-lg bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-800">
                              <div>{student.name}</div>
                              {student.class && (
                                <div className="text-xs text-slate-500">{student.class}</div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-700">{student.rollNo || "-"}</td>
                            <td className="px-3 py-2 text-slate-700">{student.section || "-"}</td>
                            <td className="px-3 py-2 text-slate-700">{formatDate(student.enrolledAt)}</td>
                            <td className="px-3 py-2 text-slate-700">Rs {student.registrationAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {tab === "bank-details" && (
            <section className="rounded-xl bg-white p-4 shadow-sm md:p-5 max-w-3xl">
              <h2 className="text-lg font-semibold mb-2">Bank Details</h2>
              <p className="text-sm text-slate-500 mb-4">
                Add or update your bank account details.
              </p>

              <textarea
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                rows={10}
                placeholder="Enter Your Bank Details here..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />

              <div className="mt-3 flex justify-end">
                <button
                  onClick={saveBankDetails}
                  disabled={savingBankDetails}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingBankDetails ? "Saving..." : "Save Bank Details"}
                </button>
              </div>
            </section>
          )}

          {tab === "member-activity" && (user?.role === "member" || user?.role === "staff") && (
            <>
              <section className="rounded-xl bg-white p-4 shadow-sm md:p-5 mb-4 max-w-4xl">
                <h2 className="text-lg font-semibold mb-2">Attendance</h2>
                <p className="text-sm text-slate-500 mb-4">First Check In, then Check Out.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Date</label>
                    <div className="w-full border border-gray-300 rounded px-3 py-2 bg-slate-50 text-slate-800">
                      {currentActivityForDate?.date || todayDateKey()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Check In</label>
                    <div className="w-full border border-gray-300 rounded px-3 py-2 bg-slate-50 text-slate-800">
                      {formatTime12Hour(currentActivityForDate?.checkIn)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Check Out</label>
                    <div className="w-full border border-gray-300 rounded px-3 py-2 bg-slate-50 text-slate-800">
                      {formatTime12Hour(currentActivityForDate?.checkOut)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => markAttendance("check-in")}
                    disabled={savingMemberActivity}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingMemberActivity ? "Saving..." : "Check In Now"}
                  </button>
                  <button
                    onClick={() => markAttendance("check-out")}
                    disabled={savingMemberActivity}
                    className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingMemberActivity ? "Saving..." : "Check Out Now"}
                  </button>
                </div>
              </section>

              <section className="rounded-xl bg-white p-4 shadow-sm md:p-5 mb-4 max-w-4xl">
                <h2 className="text-lg font-semibold mb-2">Daily Report</h2>
                <p className="text-sm text-slate-500 mb-4">Add report for the selected date.</p>

                <div className="mb-3 max-w-xs">
                  <label className="block text-xs text-slate-500 mb-1">Report Date</label>
                  <input
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">Report of the day</label>
                  <textarea
                    rows={5}
                    value={dailyReport}
                    onChange={(e) => setDailyReport(e.target.value)}
                    placeholder="Write what work you completed today..."
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={saveDailyReport}
                    disabled={savingMemberActivity}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingMemberActivity ? "Saving..." : "Save Daily Report"}
                  </button>
                </div>
              </section>

              <section className="rounded-xl bg-white p-4 shadow-sm md:p-5 max-w-5xl">
                <h3 className="text-base font-semibold mb-3">My Submitted Activity</h3>

                {loadingMemberActivity ? (
                  <p className="text-sm text-slate-500">Loading activity...</p>
                ) : MemberActivities.length === 0 ? (
                  <p className="text-sm text-slate-500">No attendance/report added yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Check In</th>
                          <th className="px-3 py-2">Check Out</th>
                          <th className="px-3 py-2">Report</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MemberActivities.map((row) => (
                          <tr key={row._id} className="rounded-lg bg-slate-50 align-top">
                            <td className="px-3 py-2 text-slate-700">{row.date || "-"}</td>
                            <td className="px-3 py-2 text-slate-700">{formatTime12Hour(row.checkIn)}</td>
                            <td className="px-3 py-2 text-slate-700">{formatTime12Hour(row.checkOut)}</td>
                            <td className="px-3 py-2 text-slate-700 whitespace-pre-wrap">{row.report || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
