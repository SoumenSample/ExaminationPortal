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
  const [MemberReport, setMemberReport] = useState([])
  const [selectedEntityLabel, setSelectedEntityLabel] = useState("")
  const [selectedEntityType, setSelectedEntityType] = useState("")
  const [selectedStudents, setSelectedStudents] = useState([])

  const [activeTab, setActiveTab] = useState("school")
  const [search, setSearch] = useState("")
  const [minCount, setMinCount] = useState("")
  const [maxCount, setMaxCount] = useState("")

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        setError("")

        const [schoolRes, MemberRes] = await Promise.all([
          fetch("/api/admin/report/school-wise"),
          fetch("/api/admin/report/member-wise"),
        ])

        if (!schoolRes.ok || !MemberRes.ok) {
          throw new Error("Failed to fetch report data")
        }

        const schoolData = await schoolRes.json()
        const MemberData = await MemberRes.json()

        setSchoolReport(schoolData?.schoolReport || [])
        setMemberReport(MemberData?.memberReport || MemberData?.MemberReport || [])
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

  const filteredMember = useMemo(() => {
    const min = minCount === "" ? null : Number(minCount)
    const max = maxCount === "" ? null : Number(maxCount)
    const q = search.trim().toLowerCase()

    return MemberReport.filter((s) => {
      const count = Number(s.totalStudentsReferred || 0)
      const matchText =
        !q ||
        String(s.name || "").toLowerCase().includes(q) ||
        String(s.email || "").toLowerCase().includes(q)
      const matchMin = min === null || count >= min
      const matchMax = max === null || count <= max
      return matchText && matchMin && matchMax
    })
  }, [MemberReport, search, minCount, maxCount])

  const totalSchoolStudents = filteredSchool.reduce(
    (sum, row) => sum + Number(row.studentCount || 0),
    0
  )

  const totalMemberStudents = filteredMember.reduce(
    (sum, row) => sum + Number(row.totalStudentsReferred || 0),
    0
  )

  const handleExportExcel = () => {
    if (activeTab === "school") {
      const headers = ["School Name", "Reg/License No", "Total Students"]
      const lines = filteredSchool.map((row) => [
        row.schoolName,
        row.schoolRegistrationId || "-",
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

    const headers = ["Member Name", "Email", "Phone", "Total Students Referred"]
    const lines = filteredMember.map((row) => [
      row.name,
      row.email,
      row.phone,
      row.totalStudentsReferred,
    ])
    const csv = [headers, ...lines]
      .map((line) => line.map((v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n")

    downloadCsv(
      `member-wise-students-${new Date().toISOString().slice(0, 10)}.csv`,
      csv
    )
  }

  const handleExportPdf = () => {
    const w = window.open("", "_blank")
    if (!w) return

    if (activeTab === "school") {
      const html = buildPdfTableHtml(
        "School-wise Student Registrations",
        ["School Name", "Reg/License No", "Total Students"],
        filteredSchool.map((row) => [row.schoolName, row.schoolRegistrationId || "-", row.studentCount])
      )
      w.document.write(html)
      w.document.close()
      w.focus()
      w.print()
      return
    }

    const html = buildPdfTableHtml(
      "Member-wise Student Registrations",
      ["Member Name", "Email", "Phone", "Total Students Referred"],
      filteredMember.map((row) => [
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

  const openStudentDrilldown = (type, label, students) => {
    setSelectedEntityType(type)
    setSelectedEntityLabel(label || "-")
    setSelectedStudents(Array.isArray(students) ? students : [])
  }

  const closeStudentDrilldown = () => {
    setSelectedEntityType("")
    setSelectedEntityLabel("")
    setSelectedStudents([])
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
            onClick={() => setActiveTab("member")}
            className={`px-4 py-2 rounded ${
              activeTab === "member"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Member-wise
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
                : "Search member/email"
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
                  <th className="border p-2 text-left">Reg/License No</th>
                  <th className="border p-2 text-center">Student Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchool.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-4 text-center text-gray-500">
                      No data found for selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredSchool.map((row, idx) => (
                    <tr key={row.schoolId || idx} className="odd:bg-white even:bg-gray-50">
                      <td className="border p-2">
                        <button
                          type="button"
                          onClick={() => openStudentDrilldown("school", row.schoolName, row.students)}
                          className="text-blue-700 hover:underline font-medium"
                        >
                          {row.schoolName || "-"}
                        </button>
                      </td>
                      <td className="border p-2">{row.schoolRegistrationId || "-"}</td>
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
                  <th className="border p-2 text-left">Member Name</th>
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2 text-left">Phone</th>
                  <th className="border p-2 text-center">Students Referred</th>
                </tr>
              </thead>
              <tbody>
                {filteredMember.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-gray-500">
                      No data found for selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredMember.map((row, idx) => (
                    <tr key={row._id || idx} className="odd:bg-white even:bg-gray-50">
                      <td className="border p-2">
                        <button
                          type="button"
                          onClick={() => openStudentDrilldown("member", row.name, row.referredStudents)}
                          className="text-blue-700 hover:underline font-medium"
                        >
                          {row.name || "-"}
                        </button>
                      </td>
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

        {selectedEntityType && (
          <div className="mt-6 border border-gray-200 rounded p-4 bg-gray-50">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-lg font-semibold">
                {selectedEntityType === "school" ? "Registered Students" : "Referred Students"} - {selectedEntityLabel}
              </h3>
              <button
                type="button"
                onClick={closeStudentDrilldown}
                className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            {selectedStudents.length === 0 ? (
              <p className="text-sm text-gray-600">No students found.</p>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded bg-white">
                <table className="min-w-full border-collapse whitespace-nowrap text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-2 text-left">Student Name</th>
                      <th className="border p-2 text-left">Class</th>
                      <th className="border p-2 text-left">Roll No</th>
                      <th className="border p-2 text-left">Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudents.map((student, index) => (
                      <tr key={student._id || `${student.name || "student"}-${index}`} className="odd:bg-white even:bg-gray-50">
                        <td className="border p-2">{student.name || "-"}</td>
                        <td className="border p-2">{student.class || "-"}</td>
                        <td className="border p-2">{student.rollNo || "-"}</td>
                        <td className="border p-2">{student.section || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
