"use client"

import React, { useEffect, useState } from "react"

const Notification = () => {
  const [notifications, setNotifications] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [filterType, setFilterType] = useState("all")

  const [form, setForm] = useState({
    recipientId: "",
    title: "",
    message: "",
    type: "info",
    relatedLink: "",
    sendToAll: false,
  })

  // FETCH NOTIFICATIONS
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notification")
        const data = await res.json()
        setNotifications(data)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
      setLoading(false)
    }

    fetchNotifications()
  }, [])

  // FETCH USERS
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users")
        const data = await res.json()
        setUsers(data)
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }

    fetchUsers()
  }, [])

  const handleFormChange = (e) => {
    const { name, value, type: inputType, checked } = e.target
    setForm({
      ...form,
      [name]: inputType === "checkbox" ? checked : value,
    })
  }

  const handleSendNotification = async (e) => {
    e.preventDefault()

    if (!form.title || !form.message) {
      alert("Please fill in title and message")
      return
    }

    if (!form.sendToAll && !form.recipientId) {
      alert("Please select a recipient or send to all")
      return
    }

    setSending(true)

    try {
      let res

      if (form.sendToAll) {
        // Send to all users
        const recipientIds = users.map((u) => u._id)
        res = await fetch("/api/notification/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientIds,
            title: form.title,
            message: form.message,
            type: form.type,
            relatedLink: form.relatedLink || null,
          }),
        })
      } else {
        // Send to single user
        res = await fetch("/api/notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId: form.recipientId,
            title: form.title,
            message: form.message,
            type: form.type,
            relatedLink: form.relatedLink || null,
          }),
        })
      }

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || "Failed to send notification")
        return
      }

      alert("Notification sent successfully!")

      // Reset form
      setForm({
        recipientId: "",
        title: "",
        message: "",
        type: "info",
        relatedLink: "",
        sendToAll: false,
      })

      setShowModal(false)

      // Refresh notifications
      const notifRes = await fetch("/api/notification")
      const notifData = await notifRes.json()
      setNotifications(notifData)
    } catch (error) {
      console.error("Error sending notification:", error)
      alert("Error sending notification")
    } finally {
      setSending(false)
    }
  }

  const handleDeleteNotification = async (id) => {
    const confirmed = window.confirm("Delete this notification?")
    if (!confirmed) return

    try {
      const res = await fetch(`/api/notification/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        alert("Failed to delete notification")
        return
      }

      // Remove from list
      setNotifications(notifications.filter((n) => n._id !== id))
      alert("Notification deleted")
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const filteredNotifications =
    filterType === "all"
      ? notifications
      : notifications.filter((n) => n.type === filterType)

  const typeColors = {
    info: "bg-blue-100 text-blue-800",
    warning: "bg-yellow-100 text-yellow-800",
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
  }

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white p-4 md:p-6 rounded shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Send Notification
          </button>
        </div>

        {/* SEND NOTIFICATION MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Send Notification</h3>

              <form onSubmit={handleSendNotification} className="space-y-4">
                {/* SEND TO ALL CHECKBOX */}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="sendToAll"
                    checked={form.sendToAll}
                    onChange={handleFormChange}
                    className="w-4 h-4"
                  />
                  <span>Send to All Users</span>
                </label>

                {/* RECIPIENT SELECT */}
                {!form.sendToAll && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Recipient
                    </label>
                    <select
                      name="recipientId"
                      value={form.recipientId}
                      onChange={handleFormChange}
                      className="w-full border border-gray-300 p-2 rounded"
                      required
                    >
                      <option value="">Select a user...</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email}) - {user.role}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* TITLE INPUT */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="Notification title"
                    className="w-full border border-gray-300 p-2 rounded"
                    required
                  />
                </div>

                {/* MESSAGE INPUT */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleFormChange}
                    placeholder="Notification message"
                    rows="4"
                    className="w-full border border-gray-300 p-2 rounded"
                    required
                  ></textarea>
                </div>

                {/* TYPE SELECT */}
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 p-2 rounded"
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                {/* RELATED LINK INPUT */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Related Link (Optional)
                  </label>
                  <input
                    type="text"
                    name="relatedLink"
                    value={form.relatedLink}
                    onChange={handleFormChange}
                    placeholder="/dashboard/results"
                    className="w-full border border-gray-300 p-2 rounded"
                  />
                </div>

                {/* BUTTONS */}
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* FILTER BUTTONS */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded ${
              filterType === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType("info")}
            className={`px-4 py-2 rounded ${
              filterType === "info" ? "bg-blue-600 text-white" : "bg-blue-100"
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setFilterType("success")}
            className={`px-4 py-2 rounded ${
              filterType === "success"
                ? "bg-green-600 text-white"
                : "bg-green-100"
            }`}
          >
            Success
          </button>
          <button
            onClick={() => setFilterType("warning")}
            className={`px-4 py-2 rounded ${
              filterType === "warning"
                ? "bg-yellow-600 text-white"
                : "bg-yellow-100"
            }`}
          >
            Warning
          </button>
          <button
            onClick={() => setFilterType("error")}
            className={`px-4 py-2 rounded ${
              filterType === "error" ? "bg-red-600 text-white" : "bg-red-100"
            }`}
          >
            Error
          </button>
        </div>

        {/* NOTIFICATIONS LIST */}
        {loading ? (
          <p>Loading notifications...</p>
        ) : filteredNotifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No notifications found
          </p>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-4 rounded border-l-4 flex justify-between items-start ${
                  notif.type === "info"
                    ? "bg-blue-50 border-blue-400"
                    : notif.type === "success"
                    ? "bg-green-50 border-green-400"
                    : notif.type === "warning"
                    ? "bg-yellow-50 border-yellow-400"
                    : "bg-red-50 border-red-400"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{notif.title}</h4>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        typeColors[notif.type]
                      }`}
                    >
                      {notif.type}
                    </span>
                  </div>
                  <p className="text-sm mt-1 text-gray-700">{notif.message}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    To:{" "}
                    <span className="font-medium">
                      {notif.recipientId?.name} ({notif.recipientId?.email})
                    </span>
                    {" • "}
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteNotification(notif._id)}
                  className="ml-4 text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notification
