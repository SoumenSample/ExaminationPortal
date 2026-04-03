"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useAppDialog } from "../component/AppDialog"

function toNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

export default function ResultSection() {
  const { showAlert } = useAppDialog()

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [publishingAll, setPublishingAll] = useState(false)

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [savingEvaluation, setSavingEvaluation] = useState(false)

  const fetchResults = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/result")
      const data = await res.json()
      setResults(Array.isArray(data?.results) ? data.results : [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return results

    return results.filter((item) => {
      const email = String(item?.email || "").toLowerCase()
      return email.includes(q)
    })
  }, [results, search])

  const openCandidate = (result) => {
    const cloned = JSON.parse(JSON.stringify(result))

    if (!Array.isArray(cloned.answers)) {
      cloned.answers = []
    }

    cloned.answers = cloned.answers.map((item) => {
      const maxMarks = Math.max(0, toNumber(item?.maxMarks, 0))
      const type = item?.type === "descriptive" ? "descriptive" : "mcq"

      if (type === "descriptive") {
        return {
          ...item,
          awardedMarks: toNumber(item?.awardedMarks, 0),
          maxMarks,
          type,
        }
      }

      const autoAwardedMarks = toNumber(item?.autoAwardedMarks, toNumber(item?.awardedMarks, 0))
      return {
        ...item,
        awardedMarks: autoAwardedMarks,
        autoAwardedMarks,
        maxMarks,
        type,
      }
    })

    setSelected(cloned)
    setOpen(true)
  }

  const updateDescriptiveMarks = (index, value) => {
    setSelected((prev) => {
      if (!prev) return prev

      const nextAnswers = [...prev.answers]
      const row = nextAnswers[index]
      if (!row) return prev

      const max = Math.max(0, toNumber(row.maxMarks, 0))
      const parsed = value === "" ? "" : toNumber(value, 0)
      const awarded = parsed === "" ? "" : Math.max(0, Math.min(parsed, max))

      nextAnswers[index] = {
        ...row,
        awardedMarks: awarded,
      }

      return {
        ...prev,
        answers: nextAnswers,
      }
    })
  }

  const previewScore = useMemo(() => {
    if (!selected?.answers) return 0

    return selected.answers.reduce((sum, item) => {
      const marks = item?.type === "descriptive"
        ? toNumber(item?.awardedMarks, 0)
        : toNumber(item?.autoAwardedMarks, toNumber(item?.awardedMarks, 0))

      return sum + Math.max(0, marks)
    }, 0)
  }, [selected])

  const saveEvaluation = async (publish = false) => {
    if (!selected?._id) return

    setSavingEvaluation(true)

    try {
      const answers = (selected.answers || []).map((item, index) => ({
        index,
        awardedMarks: item?.type === "descriptive" ? toNumber(item?.awardedMarks, 0) : undefined,
      }))

      const res = await fetch("/api/admin/result", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "evaluate",
          resultId: selected._id,
          answers,
          publish,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        await showAlert(data.message || "Could not save evaluation", { title: "Result" })
        return
      }

      const updated = data?.result

      if (updated) {
        setResults((prev) => prev.map((item) => (item._id === updated._id ? updated : item)))
        setSelected(updated)
      }

      await showAlert(publish ? "Evaluation saved and result published" : "Evaluation saved", {
        title: "Result",
      })
    } catch {
      await showAlert("Could not save evaluation", { title: "Result" })
    } finally {
      setSavingEvaluation(false)
    }
  }

  const publishAllResults = async () => {
    setPublishingAll(true)

    try {
      const res = await fetch("/api/admin/result", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "publishAll" }),
      })

      const data = await res.json()

      if (!res.ok) {
        await showAlert(data.message || "Failed to publish results", { title: "Result" })
        return
      }

      setResults((prev) => prev.map((item) => ({ ...item, isPublished: true })))
      await showAlert("All results published", { title: "Result" })
    } catch {
      await showAlert("Failed to publish results", { title: "Result" })
    } finally {
      setPublishingAll(false)
    }
  }

  const publishOneResult = async (resultId) => {
    try {
      const res = await fetch("/api/admin/result", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "publishOne", resultId }),
      })

      const data = await res.json()

      if (!res.ok) {
        await showAlert(data.message || "Could not publish result", { title: "Result" })
        return
      }

      if (data?.result) {
        setResults((prev) => prev.map((item) => (item._id === data.result._id ? data.result : item)))
      }

      await showAlert("Result published", { title: "Result" })
    } catch {
      await showAlert("Could not publish result", { title: "Result" })
    }
  }

  return (
    <div className="p-4 md:p-6 w-full min-w-0">
      <div className="bg-white p-4 md:p-6 rounded shadow w-full max-w-full min-w-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <h2 className="text-xl font-semibold">Result</h2>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={publishAllResults}
              disabled={publishingAll}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
            >
              {publishingAll ? "Publishing..." : "Publish All Results"}
            </button>

            <button
              type="button"
              onClick={fetchResults}
              className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate email"
            className="w-full md:w-80 border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {loading ? (
          <p>Loading results...</p>
        ) : (
          <div className="w-full overflow-x-auto border border-gray-300 rounded">
            <table className="w-max min-w-full border-collapse whitespace-nowrap">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Candidate Email</th>
                  <th className="border p-2 text-center">Score</th>
                  <th className="border p-2 text-center">Total Marks</th>
                  <th className="border p-2 text-center">Status</th>
                  <th className="border p-2 text-center">Submitted At</th>
                  <th className="border p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      No results found
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((item) => (
                    <tr key={item._id} className="text-center odd:bg-white even:bg-gray-50">
                      <td className="border p-2 text-left">{item.email || "-"}</td>
                      <td className="border p-2 font-semibold">{toNumber(item.score, 0)}</td>
                      <td className="border p-2">{toNumber(item.totalMarks, 0)}</td>
                      <td className="border p-2">
                        {item.isPublished ? (
                          <span className="text-green-700 font-medium">Published</span>
                        ) : (
                          <span className="text-orange-600 font-medium">Draft</span>
                        )}
                      </td>
                      <td className="border p-2">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                      </td>
                      <td className="border p-2">
                        <div className="flex flex-wrap justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openCandidate(item)}
                            className="bg-slate-600 text-white px-3 py-1 rounded hover:bg-slate-700"
                          >
                            View Answers
                          </button>

                          {!item.isPublished && (
                            <button
                              type="button"
                              onClick={() => publishOneResult(item._id)}
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-semibold">Candidate Attempt</h3>
                <p className="text-sm text-gray-600">{selected.email}</p>
                <p className="text-sm text-gray-600">
                  Current Score: {toNumber(selected.score, 0)} / {toNumber(selected.totalMarks, 0)}
                </p>
                <p className="text-sm text-blue-700 font-medium">
                  Preview Score After Save: {previewScore} / {toNumber(selected.totalMarks, 0)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setSelected(null)
                }}
                className="border border-gray-300 px-3 py-1 rounded"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              {(selected.answers || []).length === 0 ? (
                <p className="text-gray-500">No answer records found for this candidate.</p>
              ) : (
                selected.answers.map((item, index) => {
                  const type = item?.type === "descriptive" ? "descriptive" : "mcq"
                  const maxMarks = Math.max(0, toNumber(item?.maxMarks, 0))

                  return (
                    <div key={`${selected._id}-${index}`} className="border rounded p-4">
                      <p className="font-semibold mb-1">Q{index + 1}. {item?.question || "-"}</p>
                      <p className="text-sm text-gray-600">Type: {type}</p>
                      <p className="text-sm text-gray-700 mt-1">Candidate Answer: {item?.answer || "No answer"}</p>
                      <p className="text-sm text-gray-600">Max Marks: {maxMarks}</p>

                      {type === "mcq" ? (
                        <>
                          <p className="text-sm text-gray-600">
                            Auto Checked: {item?.isCorrect ? "Correct" : "Wrong"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Marks Awarded: {toNumber(item?.autoAwardedMarks, toNumber(item?.awardedMarks, 0))}
                          </p>
                        </>
                      ) : (
                        <div className="mt-2 w-full md:w-56">
                          <label className="block text-sm text-gray-700 mb-1">Award Marks</label>
                          <input
                            type="number"
                            min="0"
                            max={maxMarks}
                            value={item?.awardedMarks ?? ""}
                            onChange={(e) => updateDescriptiveMarks(index, e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => saveEvaluation(false)}
                disabled={savingEvaluation}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
              >
                {savingEvaluation ? "Saving..." : "Save Evaluation"}
              </button>

              <button
                type="button"
                onClick={() => saveEvaluation(true)}
                disabled={savingEvaluation}
                className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
              >
                {savingEvaluation ? "Saving..." : "Save and Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
