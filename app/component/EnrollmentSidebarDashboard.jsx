"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import logo from "../dashboard/WhatsApp Image 2026-03-18 at 9.04.15 PM.jpeg"

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

        const enrollmentResponse = await fetch(`/api/dashboard/enrollments?userId=${userId}`)
        const enrollmentData = await enrollmentResponse.json()

        if (!enrollmentResponse.ok) {
          throw new Error(enrollmentData?.message || "Could not load enrollments")
        }

        if (!isMounted) return
        setStudents(Array.isArray(enrollmentData.students) ? enrollmentData.students : [])
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

  const menu = [
    { name: "Student Enrollments", value: "enrollments" },
  ]

  const filteredStudents = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    const min = minCost === "" ? null : Number(minCost)
    const max = maxCost === "" ? null : Number(maxCost)

    return students.filter((student) => {
      const studentName = String(student.name || "").toLowerCase()
      const studentClass = String(student.class || "").toLowerCase()
      const registrationAmount = Number(student.registrationAmount || 0)
      const enrolled = formatDateInput(student.enrolledAt)

      const textOk = !q || studentName.includes(q) || studentClass.includes(q)
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
    const headers = ["Student Name", "Class", "Date", "Registration Cost"]
    const rows = filteredStudents.map((student) => [
      student.name || "",
      student.class || "",
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
                <th>Date</th>
                <th>Registration Cost</th>
              </tr>
            </thead>
            <tbody>
              ${rowHtml || '<tr><td colspan="4">No records found</td></tr>'}
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
                placeholder="Search by student/class"
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
                        <td className="px-3 py-2 text-slate-700">{formatDate(student.enrolledAt)}</td>
                        <td className="px-3 py-2 text-slate-700">Rs {student.registrationAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
