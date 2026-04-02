"use client"

import { useEffect, useMemo, useState } from "react"

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

export default function StaffActivity() {
  const [staff, setStaff] = useState([])
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError("")

        const query = selectedStaffId ? `?staffId=${selectedStaffId}` : ""
        const response = await fetch(`/api/admin/staff-activity${query}`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.message || "Could not load staff activity")
        }

        setStaff(Array.isArray(payload?.staff) ? payload.staff : [])
        setActivities(Array.isArray(payload?.activities) ? payload.activities : [])
      } catch (loadError) {
        setError(loadError.message || "Failed to load staff activity")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedStaffId])

  const attendanceRows = useMemo(() => {
    return activities.map((row) => ({
      _id: row._id,
      date: row.date,
      staffName: row.staff?.name || "-",
      staffEmail: row.staff?.email || "-",
      checkIn: row.checkIn || "-",
      checkOut: row.checkOut || "-",
    }))
  }, [activities])

  return (
    <div className="p-4 md:p-6 w-full min-w-0">
      <div className="bg-white p-4 md:p-6 rounded shadow w-full max-w-full min-w-0">
        <h2 className="text-xl font-semibold mb-4">Staff Activity</h2>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Select Staff</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
            >
              <option value="">All Staff</option>
              {staff.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name || "Unnamed"} ({member.email || "-"})
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-600 md:col-span-2">
            Showing {activities.length} activity records
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-600">Loading staff activity...</p>
        ) : error ? (
          <p className="rounded bg-red-50 text-red-700 p-3 text-sm">{error}</p>
        ) : (
          <>
            <section className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Attendance (Check In / Check Out)</h3>
              {attendanceRows.length === 0 ? (
                <p className="text-sm text-gray-600">No attendance records found.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-300 rounded">
                  <table className="w-max min-w-full border-collapse border border-gray-300 whitespace-nowrap text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2">Date</th>
                        <th className="border p-2">Staff</th>
                        <th className="border p-2">Email</th>
                        <th className="border p-2">Check In</th>
                        <th className="border p-2">Check Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRows.map((row) => (
                        <tr key={row._id} className="text-center">
                          <td className="border p-2">{row.date || "-"}</td>
                          <td className="border p-2">{row.staffName}</td>
                          <td className="border p-2">{row.staffEmail}</td>
                          <td className="border p-2">{formatTime12Hour(row.checkIn)}</td>
                          <td className="border p-2">{formatTime12Hour(row.checkOut)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">Daily Report</h3>
              {activities.length === 0 ? (
                <p className="text-sm text-gray-600">No reports found.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((row) => (
                    <article key={`report-${row._id}`} className="border border-gray-200 rounded p-3 bg-gray-50">
                      <div className="text-xs text-gray-500 mb-1">
                        {row.date || "-"} | {row.staff?.name || "-"} | {row.staff?.email || "-"}
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{row.report || "No report submitted"}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
