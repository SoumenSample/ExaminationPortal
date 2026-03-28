"use client"

import React, { useEffect, useMemo, useState } from "react"

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

function buildPdfTableHtml(title, headers, rows) {
  const headerHtml = headers.map((h) => `<th>${h}</th>`).join("")
  const rowHtml = rows
    .map(
      (r) =>
        `<tr>${r
          .map((cell) => `<td>${String(cell ?? "-")}</td>`)
          .join("")}</tr>`
    )
    .join("")

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #111827; }
          h1 { font-size: 20px; margin-bottom: 8px; }
          p { color: #4b5563; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f3f4f6; }
          .meta { margin-top: 8px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        <table>
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${rowHtml || "<tr><td colspan='10'>No data</td></tr>"}</tbody>
        </table>
      </body>
    </html>
  `
}

export default function ReportsDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [schoolReport, setSchoolReport] = useState([])
  const [staffReport, setStaffReport] = useState([])

  const [activeTab, setActiveTab] = useState("school")
  const [search, setSearch] = useState("")
  const [minCount, setMinCount] = useState("")
  const [maxCount, setMaxCount] = useState("")

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        setError("")

        const [schoolRes, staffRes] = await Promise.all([
          fetch("/api/admin/report/school-wise"),
          fetch("/api/admin/report/staff-wise"),
        ])

        if (!schoolRes.ok || !staffRes.ok) {
          throw new Error("Failed to fetch report data")
        }

        const schoolData = await schoolRes.json()
        const staffData = await staffRes.json()

        setSchoolReport(schoolData?.schoolReport || [])
        setStaffReport(staffData?.staffReport || [])
      } catch (err) {
        setError(err.message || "Error loading reports")
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const filteredSchool = useMemo(() => {
    const min = minCount === "" ? null : Number(minCount)
    const max = maxCount === "" ? null : Number(maxCount)
    const q = search.trim().toLowerCase()

    return schoolReport.filter((s) => {
      const count = Number(s.studentCount || 0)
      const matchText =
        !q ||
        String(s.schoolName || "").toLowerCase().includes(q)
      const matchMin = min === null || count >= min
      const matchMax = max === null || count <= max
      return matchText && matchMin && matchMax
    })
  }, [schoolReport, search, minCount, maxCount])

  const filteredStaff = useMemo(() => {
    const min = minCount === "" ? null : Number(minCount)
    const max = maxCount === "" ? null : Number(maxCount)
    const q = search.trim().toLowerCase()

    return staffReport.filter((s) => {
      const count = Number(s.totalStudentsReferred || 0)
      const matchText =
        !q ||
        String(s.name || "").toLowerCase().includes(q) ||
        String(s.email || "").toLowerCase().includes(q)
      const matchMin = min === null || count >= min
      const matchMax = max === null || count <= max
      return matchText && matchMin && matchMax
    })
  }, [staffReport, search, minCount, maxCount])

  const totalSchoolStudents = filteredSchool.reduce(
    (sum, row) => sum + Number(row.studentCount || 0),
    0
  )

  const totalStaffStudents = filteredStaff.reduce(
    (sum, row) => sum + Number(row.totalStudentsReferred || 0),
    0
  )

  const handleExportExcel = () => {
    if (activeTab === "school") {
      const headers = ["School Name", "Total Students"]
      const lines = filteredSchool.map((row) => [
        row.schoolName,
        row.studentCount,
      ])
      const csv = [headers, ...lines]
        .map((line) => line.map((v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`).join(","))
        .join("\n")

      downloadCsv(
        `school-wise-students-${new Date().toISOString().slice(0, 10)}.csv`,
        csv
      )
      return
    }

    const headers = ["Staff Name", "Email", "Phone", "Total Students Referred"]
    const lines = filteredStaff.map((row) => [
      row.name,
      row.email,
      row.phone,
      row.totalStudentsReferred,
    ])
    const csv = [headers, ...lines]
      .map((line) => line.map((v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n")

    downloadCsv(
      `staff-wise-students-${new Date().toISOString().slice(0, 10)}.csv`,
      csv
    )
  }

  const handleExportPdf = () => {
    const w = window.open("", "_blank")
    if (!w) return

    if (activeTab === "school") {
      const html = buildPdfTableHtml(
        "School-wise Student Registrations",
        ["School Name", "Total Students"],
        filteredSchool.map((row) => [row.schoolName, row.studentCount])
      )
      w.document.write(html)
      w.document.close()
      w.focus()
      w.print()
      return
    }

    const html = buildPdfTableHtml(
      "Staff-wise Student Registrations",
      ["Staff Name", "Email", "Phone", "Total Students Referred"],
      filteredStaff.map((row) => [
        row.name,
        row.email,
        row.phone,
        row.totalStudentsReferred,
      ])
    )
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }

  const resetFilters = () => {
    setSearch("")
    setMinCount("")
    setMaxCount("")
  }

  if (loading) {
    return <div className="p-6">Loading reports...</div>
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
  }

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white p-4 md:p-6 rounded shadow">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="text-xl font-semibold">Reports Dashboard</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Export Excel
            </button>
            <button
              onClick={handleExportPdf}
              className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveTab("school")}
            className={`px-4 py-2 rounded ${
              activeTab === "school"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            School-wise
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-4 py-2 rounded ${
              activeTab === "staff"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Staff-wise
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === "school"
                ? "Search school"
                : "Search staff/email"
            }
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="number"
            min="0"
            value={minCount}
            onChange={(e) => setMinCount(e.target.value)}
            placeholder="Min count"
            className="border border-gray-300 rounded px-3 py-2"
          />
          <input
            type="number"
            min="0"
            value={maxCount}
            onChange={(e) => setMaxCount(e.target.value)}
            placeholder="Max count"
            className="border border-gray-300 rounded px-3 py-2"
          />
          <button
            onClick={resetFilters}
            className="border border-gray-300 rounded px-3 py-2 hover:bg-gray-100"
          >
            Reset Filters
          </button>
        </div>

        {activeTab === "school" ? (
          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="min-w-full border-collapse whitespace-nowrap">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">School Name</th>
                  <th className="border p-2 text-center">Student Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchool.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="p-4 text-center text-gray-500">
                      No data found for selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredSchool.map((row, idx) => (
                    <tr key={row.schoolId || idx} className="odd:bg-white even:bg-gray-50">
                      <td className="border p-2">{row.schoolName}</td>
                      <td className="border p-2 text-center font-semibold">{row.studentCount || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded">
            <table className="min-w-full border-collapse whitespace-nowrap">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Staff Name</th>
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2 text-left">Phone</th>
                  <th className="border p-2 text-center">Students Referred</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">
                      No data found for selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((row, idx) => (
                    <tr key={row._id || idx} className="odd:bg-white even:bg-gray-50">
                      <td className="border p-2">{row.name}</td>
                      <td className="border p-2">{row.email}</td>
                      <td className="border p-2">{row.phone || "-"}</td>
                      <td className="border p-2 text-center font-semibold">
                        {row.totalStudentsReferred || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
