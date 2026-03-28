"use client"

import React, { useEffect, useState } from "react"

export default function StaffWiseReportPage() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("staff")

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch("/api/admin/report/staff-wise")
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

  const downloadExcel = (type) => {
    if (!report) return

    let csvContent = ""
    let filename = ""

    if (type === "staff") {
      csvContent = "Staff Name,Email,Phone,Students Referred,Total Commission Earned (₹)\n"
      filename = `staff-report-${new Date().toISOString().split('T')[0]}.csv`
      
      report.staffReport?.forEach(staff => {
        csvContent += `"${staff.name}","${staff.email}","${staff.phone}",${staff.totalStudentsReferred},${staff.totalCommissionEarned}\n`
      })
    } else {
      csvContent = "School Name,Email,Phone,Students Registered,Total Commission Earned (₹)\n"
      filename = `school-report-${new Date().toISOString().split('T')[0]}.csv`
      
      report.schoolReport?.forEach(school => {
        csvContent += `"${school.name}","${school.email}","${school.phone}",${school.totalStudentsRegistered},${school.totalCommissionEarned}\n`
      })
    }

    const element = document.createElement("a")
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent))
    element.setAttribute("download", filename)
    element.click()
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Staff & School-wise Registration Report</h1>
          <button
            onClick={() => downloadExcel(activeTab)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            📥 Download CSV
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-6 py-2 rounded font-semibold transition ${
              activeTab === "staff"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-900 border border-gray-300"
            }`}
          >
            Staff Members
          </button>
          <button
            onClick={() => setActiveTab("school")}
            className={`px-6 py-2 rounded font-semibold transition ${
              activeTab === "school"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-900 border border-gray-300"
            }`}
          >
            Schools
          </button>
        </div>

        {/* Staff Report Table */}
        {activeTab === "staff" && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-4 text-left">Staff Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Phone</th>
                  <th className="p-4 text-center">Students Referred</th>
                  <th className="p-4 text-right">Total Commission (₹)</th>
                </tr>
              </thead>
              <tbody>
                {report?.staffReport?.length > 0 ? (
                  report.staffReport.map((staff, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="p-4 border-b text-slate-900 font-semibold">{staff.name}</td>
                      <td className="p-4 border-b text-slate-900">{staff.email}</td>
                      <td className="p-4 border-b text-slate-900">{staff.phone}</td>
                      <td className="p-4 border-b text-center text-slate-900 font-semibold">{staff.totalStudentsReferred || 0}</td>
                      <td className="p-4 border-b text-right text-slate-900 font-semibold">₹{staff.totalCommissionEarned?.toLocaleString() || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-slate-500">No staff data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* School Report Table */}
        {activeTab === "school" && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-purple-600 text-white">
                <tr>
                  <th className="p-4 text-left">School Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Phone</th>
                  <th className="p-4 text-center">Students Registered</th>
                  <th className="p-4 text-right">Total Commission (₹)</th>
                </tr>
              </thead>
              <tbody>
                {report?.schoolReport?.length > 0 ? (
                  report.schoolReport.map((school, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="p-4 border-b text-slate-900 font-semibold">{school.name}</td>
                      <td className="p-4 border-b text-slate-900">{school.email}</td>
                      <td className="p-4 border-b text-slate-900">{school.phone}</td>
                      <td className="p-4 border-b text-center text-slate-900 font-semibold">{school.totalStudentsRegistered || 0}</td>
                      <td className="p-4 border-b text-right text-slate-900 font-semibold">₹{school.totalCommissionEarned?.toLocaleString() || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-slate-500">No school data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          {activeTab === "staff" && (
            <>
              <div className="bg-blue-100 p-6 rounded-lg">
                <p className="text-slate-700 text-sm">Total Staff Members</p>
                <p className="text-3xl font-bold text-blue-600">{report?.staffReport?.length || 0}</p>
              </div>
              <div className="bg-green-100 p-6 rounded-lg">
                <p className="text-slate-700 text-sm">Total Commission Earned</p>
                <p className="text-3xl font-bold text-green-600">
                  ₹{report?.staffReport?.reduce((sum, s) => sum + (s.totalCommissionEarned || 0), 0)?.toLocaleString() || 0}
                </p>
              </div>
            </>
          )}
          {activeTab === "school" && (
            <>
              <div className="bg-purple-100 p-6 rounded-lg">
                <p className="text-slate-700 text-sm">Total Schools</p>
                <p className="text-3xl font-bold text-purple-600">{report?.schoolReport?.length || 0}</p>
              </div>
              <div className="bg-green-100 p-6 rounded-lg">
                <p className="text-slate-700 text-sm">Total Commission Earned</p>
                <p className="text-3xl font-bold text-green-600">
                  ₹{report?.schoolReport?.reduce((sum, s) => sum + (s.totalCommissionEarned || 0), 0)?.toLocaleString() || 0}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
