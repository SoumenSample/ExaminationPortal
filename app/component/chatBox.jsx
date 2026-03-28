"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { io } from "socket.io-client"

export default function ChatBox({ user, isAdmin = false, fixed = true }) {
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("")
  const [searchText, setSearchText] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState("")
  const [busyKey, setBusyKey] = useState("")
  const [loading, setLoading] = useState(false)

  const socketRef = useRef(null)

  useEffect(() => {
    if (!isAdmin && !user?.email) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      setLoading(true)
      try {
        const query = new URLSearchParams({
          isAdmin: String(isAdmin),
          userEmail: user?.email || "",
        })
        const res = await fetch(`/api/chat?${query.toString()}`)
        const data = await res.json()
        setMessages(Array.isArray(data) ? data : [])
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [isAdmin, user?.email])

  useEffect(() => {
    const socketClient = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    })

    socketRef.current = socketClient

    socketClient.on("connect", () => {
      socketClient.emit("joinSupport", {
        isAdmin,
        userEmail: user?.email || "",
      })
    })

    socketClient.on("receiveMessage", (data) => {
      console.log("💬 Received message:", data, "isAdmin:", isAdmin, "userEmail:", user?.email)

      if (!isAdmin) {
        const threadEmail = data?.studentEmail || data?.email
        if (!user?.email || threadEmail !== user.email) {
          console.log(`❌ Ignoring message - not in thread. Expected: ${user?.email}, Got: ${threadEmail}`)
          return
        }
      }

      setMessages((prev) => {
        if (data?._id && prev.some((m) => m._id === data._id)) {
          console.log("⏭️ Skipping duplicate message:", data._id)
          return prev
        }
        console.log("✅ Adding message to state")
        return [...prev, data]
      })
    })

    return () => {
      socketClient.off("receiveMessage")
      socketClient.disconnect()
      socketRef.current = null
    }
  }, [isAdmin, user?.email])

  const sortedMessages = useMemo(() => {
    return [...messages].sort(
      (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    )
  }, [messages])

  const conversations = useMemo(() => {
    const keyword = searchText.trim().toLowerCase()
    const map = new Map()

    sortedMessages.forEach((m) => {
      const threadStudent = m.studentEmail || m.email
      if (!threadStudent) return
      if (threadStudent === user?.email) return

      map.set(threadStudent, {
        studentEmail: threadStudent,
        lastMessage: m.deletedAt ? "[Message deleted]" : m.message,
        lastAt: m.createdAt || m.updatedAt || new Date().toISOString(),
      })
    })

    let list = Array.from(map.values()).sort(
      (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    )

    if (keyword) {
      list = list.filter((r) => r.studentEmail.toLowerCase().includes(keyword))
    }

    return list
  }, [sortedMessages, searchText, user?.email])

  useEffect(() => {
    if (!isAdmin || selectedStudent) return
    if (conversations.length > 0) {
      setSelectedStudent(conversations[0].studentEmail)
    }
  }, [isAdmin, conversations, selectedStudent])

  const activeThread = isAdmin ? selectedStudent : user?.email

  const visibleMessages = useMemo(() => {
    if (!activeThread) return []
    return sortedMessages.filter((m) => (m.studentEmail || m.email) === activeThread)
  }, [sortedMessages, activeThread])

  const resetEdit = () => {
    setEditingId(null)
    setEditingText("")
  }

  const sendMessage = async () => {
    const text = message.trim()
    if (!text || !user?.email) return

    const studentEmail = isAdmin ? selectedStudent : user.email
    if (!studentEmail) {
      alert("Select a student conversation first")
      return
    }

    const payload = {
      email: user.email,
      message: text,
      studentEmail,
    }

    console.log("📨 Sending message:", payload)

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const saved = await res.json()

    console.log("✅ API Response:", { status: res.status, data: saved })

    if (!res.ok) {
      alert(saved?.error || "Failed to send message")
      return
    }

    console.log("📝 Adding to local state:", saved)
    setMessages((prev) => [...prev, saved])

    if (socketRef.current) {
      console.log("🔌 Emitting to socket")
      socketRef.current.emit("sendMessage", saved)
    }

    setMessage("")
  }

  const handleEditSave = async (messageId) => {
    const text = editingText.trim()
    if (!text) return

    setBusyKey(`edit-${messageId}`)

    const res = await fetch("/api/chat", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, newMessage: text }),
    })

    const data = await res.json()

    if (res.ok && data?.data) {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? data.data : m)))
      resetEdit()
    } else {
      alert(data?.error || "Failed to edit message")
    }

    setBusyKey("")
  }

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return

    setBusyKey(`delete-${messageId}`)

    const res = await fetch("/api/chat", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, deletedBy: user?.email || "admin" }),
    })

    const data = await res.json()

    if (res.ok && data?.data) {
      setMessages((prev) => prev.map((m) => (m._id === messageId ? data.data : m)))
    } else {
      alert(data?.error || "Failed to delete message")
    }

    setBusyKey("")
  }

  const handleBlockUser = async (targetEmail) => {
    if (!targetEmail) return
    if (!window.confirm(`Block user ${targetEmail}?`)) return

    setBusyKey(`block-${targetEmail}`)

    const res = await fetch("/api/chat/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmailToBlock: targetEmail,
        blockedBy: user?.email || "admin",
        blockReason: "Blocked from admin chat support",
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      alert(data?.error || "Failed to block user")
    }

    setBusyKey("")
  }

  return (
    <div
      className={`${fixed ? "fixed bottom-20 right-6 z-50" : "relative"} bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden ${
        isAdmin ? "w-full max-w-5xl" : "w-80 md:w-96"
      }`}
    >
      <div className="bg-blue-600 text-white px-4 py-3 font-semibold">
        {isAdmin ? "Chat Support" : "Support Chat"}
      </div>

      <div className={`${isAdmin ? "h-[70vh] flex" : "h-96 flex flex-col"}`}>
        {isAdmin && (
          <aside className="w-72 border-r bg-gray-50 flex flex-col">
            <div className="p-3 border-b">
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search student email"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">No student conversations yet</p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.studentEmail}
                    onClick={() => setSelectedStudent(conv.studentEmail)}
                    className={`w-full text-left px-3 py-3 border-b transition ${
                      selectedStudent === conv.studentEmail ? "bg-blue-100" : "hover:bg-gray-100"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 truncate">{conv.studentEmail}</p>
                    <p className="text-xs text-gray-600 truncate mt-1">{conv.lastMessage}</p>
                  </button>
                ))
              )}
            </div>
          </aside>
        )}

        <section className="flex-1 flex flex-col">
          {isAdmin && (
            <div className="px-4 py-2 border-b bg-gray-50 text-sm">
              {selectedStudent ? (
                <span>
                  Active: <span className="font-semibold">{selectedStudent}</span>
                </span>
              ) : (
                <span className="text-gray-500">Select a student conversation</span>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 bg-white">
            {loading ? (
              <p className="text-sm text-gray-500">Loading chat...</p>
            ) : visibleMessages.length === 0 ? (
              <p className="text-sm text-gray-500">
                {isAdmin ? "No messages in this conversation" : "No messages yet"}
              </p>
            ) : (
              visibleMessages.map((m, i) => {
                const own = user?.email === m.email
                return (
                  <div
                    key={m._id || `${m.email}-${m.createdAt || i}`}
                    className={`mb-2 flex ${own ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[78%] rounded-lg px-3 py-2 ${own ? "bg-green-100" : "bg-gray-100"}`}>
                      <p className="text-[11px] text-gray-500 mb-1">{m.email}</p>

                      {editingId === m._id ? (
                        <div>
                          <input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleEditSave(m._id)}
                              disabled={busyKey === `edit-${m._id}`}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded disabled:opacity-60"
                            >
                              Save
                            </button>
                            <button
                              onClick={resetEdit}
                              className="text-xs bg-gray-500 text-white px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm">{m.deletedAt ? "[Message deleted]" : m.message}</p>
                          {m.isEdited && !m.deletedAt && (
                            <p className="text-[10px] text-gray-500 mt-1">edited</p>
                          )}
                        </>
                      )}

                      {isAdmin && !m.deletedAt && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => {
                              setEditingId(m._id)
                              setEditingText(m.message || "")
                            }}
                            className="text-[11px] text-blue-700 underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(m._id)}
                            disabled={busyKey === `delete-${m._id}`}
                            className="text-[11px] text-red-700 underline disabled:opacity-60"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleBlockUser(m.studentEmail || selectedStudent || m.email)}
                            disabled={busyKey === `block-${m.studentEmail || selectedStudent || m.email}`}
                            className="text-[11px] text-orange-700 underline disabled:opacity-60"
                          >
                            Block user
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="border-t p-2 flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage()
              }}
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none"
              placeholder={isAdmin ? "Type reply..." : "Type message..."}
              disabled={isAdmin && !selectedStudent}
            />
            <button
              onClick={sendMessage}
              disabled={isAdmin && !selectedStudent}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
