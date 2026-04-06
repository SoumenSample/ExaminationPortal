"use client"

import React, { useEffect, useState } from "react"

export default function SchoolWiseReportPage() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch("/api/admin/report/school-wise")
        if (res.ok) {
          const data = await res.json()
          setReport(data)
        } else {
          setError("Failed to fetch report")
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [])

  const downloadExcel = () => {
    if (!report) return

    let csvContent = "School Name,Registration ID/License No,City,Student Count,Total Fee Collected\n"
    
    report.schoolReport.forEach(school => {
      csvContent += `"${school.schoolName}","${school.schoolRegistrationId || "-"}","${school.schoolCity}",${school.studentCount},${school.totalFeeCollected}\n`
    })
    
    csvContent += `\n"Individual Registrations","",${report.individualRegistrations},0\n`

    const element = document.createElement("a")
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent))
    element.setAttribute("download", `school-report-${new Date().toISOString().split('T')[0]}.csv`)
    element.click()
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">School-wise Registration Report</h1>
          <button
            onClick={downloadExcel}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            📥 Download CSV
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="p-4 text-left">School Name</th>
                <th className="p-4 text-left">Reg/License No</th>
                <th className="p-4 text-left">City</th>
                <th className="p-4 text-center">Total Students</th>
                <th className="p-4 text-right">Total Fee Collected (₹)</th>
              </tr>
            </thead>
            <tbody>
              {report?.schoolReport?.map((school, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"} >
                  <td className="p-4 border-b text-slate-900">{school.schoolName}</td>
                  <td className="p-4 border-b text-slate-900">{school.schoolRegistrationId || "-"}</td>
                  <td className="p-4 border-b text-slate-900">{school.schoolCity}</td>
                  <td className="p-4 border-b text-center text-slate-900 font-semibold">{school.studentCount}</td>
                  <td className="p-4 border-b text-right text-slate-900">₹{school.totalFeeCollected.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-yellow-50 font-bold">
                <td colSpan="3" className="p-4 border-t-2">Individual Registrations</td>
                <td className="p-4 border-t-2 text-center">{report?.individualRegistrations || 0}</td>
                <td className="p-4 border-t-2 text-right">₹0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-blue-100 p-6 rounded-lg">
            <p className="text-slate-700 text-sm">Total Schools</p>
            <p className="text-3xl font-bold text-blue-600">{report?.schoolReport?.length || 0}</p>
          </div>
          <div className="bg-green-100 p-6 rounded-lg">
            <p className="text-slate-700 text-sm">Total Students (School)</p>
            <p className="text-3xl font-bold text-green-600">
              {report?.schoolReport?.reduce((sum, s) => sum + s.studentCount, 0) || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
