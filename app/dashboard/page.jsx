"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import ChatBox from "@/app/component/chatBox.jsx"
import logo from "./logo.jpeg"

const MENU_ITEMS = [
  { value: "home", label: "Home", icon: "🏠" },
  { value: "dashboard", label: "Dashboard", icon: "📊" },
  { value: "study", label: "Study Material", icon: "📚" },
  { value: "about", label: "About", icon: "ℹ️" },
  { value: "contact", label: "Contact Us", icon: "📞" },
  { value: "share", label: "Share App", icon: "🔗" },
]

function formatCountdown(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0")
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")
  const s = String(seconds % 60).padStart(2, "0")
  return `${h}:${m}:${s}`
}

function formatClassValue(value) {
  if (!value) return "-"
  return String(value).replace(/^class\s*/i, "").trim() || "-"
}

function formatRollValue(value) {
  if (!value) return "-"
  return String(value).replace(/^roll\s*no\s*[:.-]?\s*/i, "").trim() || "-"
}

function formatSectionValue(value) {
  if (!value) return "-"
  return String(value).replace(/^section\s*[:.-]?\s*/i, "").trim() || "-"
}

export default function Dashboard() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [open, setOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("home")

  const [hasSubmittedExam, setHasSubmittedExam] = useState(false)
  const [resultPublished, setResultPublished] = useState(false)
  const [scheduledAt, setScheduledAt] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [hasExamQuestions, setHasExamQuestions] = useState(false)

  const [links, setLinks] = useState([])
  const [notifications, setNotifications] = useState([])

  const [chatOpen, setChatOpen] = useState(false)
  const [topperData, setTopperData] = useState([])
  const [shareStatus, setShareStatus] = useState("")

  const unreadCount = notifications.filter((item) => !item.isRead).length

  const fetchLinks = async (userId) => {
    if (!userId) return

    const res = await fetch(`/api/link?userId=${userId}`)
    const data = await res.json()

    const rows = Array.isArray(data) ? data : []
    setLinks(rows)
  }

  const fetchUserNotifications = async (userId) => {
    if (!userId) return

    const res = await fetch(`/api/notification/user/${userId}`, { cache: "no-store" })
    const data = await res.json()

    const rows = Array.isArray(data) ? data : []
    setNotifications(rows)
  }

  useEffect(() => {
    let isMounted = true

    const loadSessionUser = async () => {
      try {
        setLoadingUser(true)
        const res = await fetch("/api/auth/session", { cache: "no-store" })

        if (!res.ok) {
          router.push("/login")
          return
        }

        const data = await res.json()

        if (!isMounted || !data?.user) return

        setUser(data.user)
        await fetchLinks(data.user._id)
        await fetchUserNotifications(data.user._id)
      } catch {
        if (isMounted) {
          router.push("/login")
        }
      } finally {
        if (isMounted) {
          setLoadingUser(false)
        }
      }
    }

    loadSessionUser()

    return () => {
      isMounted = false
    }
  }, [router])

  useEffect(() => {
    if (!user?._id) return

    const timer = setInterval(() => {
      fetchUserNotifications(user._id)
    }, 30000)

    return () => clearInterval(timer)
  }, [user?._id])

  useEffect(() => {
    if (!user?.email) return

    fetch(`/api/result?email=${user.email}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?._id) {
          setHasSubmittedExam(true)
        }
        if (data?.isPublished) {
          setResultPublished(true)
        }
      })
  }, [user])

  useEffect(() => {
    if (!user?._id) return

    fetch("/api/question", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : []
        setHasExamQuestions(rows.length > 0)
      })
      .catch(() => {
        setHasExamQuestions(false)
      })
  }, [user?._id])

  useEffect(() => {
    fetch("/api/topper")
      .then((res) => res.json())
      .then((data) => {
        setTopperData(Array.isArray(data) ? data : [])
      })
  }, [])

  useEffect(() => {
    fetch("/api/exam-schedule")
      .then((res) => res.json())
      .then((data) => {
        if (data?.scheduleAt) {
          setScheduledAt(data.scheduleAt)
        }
      })
  }, [])

  useEffect(() => {
    if (!scheduledAt) {
      return
    }

    const updateCountdown = () => {
      const diff = new Date(scheduledAt).getTime() - Date.now()
      setTimeLeft(Math.max(0, Math.floor(diff / 1000)))
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)

    return () => clearInterval(timer)
  }, [scheduledAt])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [mobileMenuOpen])

  const markAsRead = async () => {
    const unreadNotifications = notifications.filter((item) => !item.isRead)
    if (unreadNotifications.length === 0) return

    await Promise.all(
      unreadNotifications.map((item) =>
        fetch(`/api/notification/${item._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isRead: true }),
        })
      )
    )

    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
    setNotificationOpen(false)
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
      })
    } finally {
      localStorage.removeItem("userId")
      localStorage.removeItem("userRole")
      localStorage.removeItem("userName")
      router.push("/")
    }
  }

  const shareApp = async () => {
    const appUrl = typeof window !== "undefined" ? window.location.origin : ""

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Examination Portal",
          text: "Join the Examination Portal and stay updated for your exam.",
          url: appUrl,
        })
        setShareStatus("App link shared successfully.")
        return
      }

      await navigator.clipboard.writeText(appUrl)
      setShareStatus("App link copied to clipboard.")
    } catch {
      setShareStatus("Could not share app right now. Please try again.")
    }
  }

  const quickStats = useMemo(
    () => [
      {
        title: "Unread Notifications",
        value: unreadCount,
      },
      {
        title: "Study Materials",
        value: links.length,
      },
      {
        title: "Exam Status",
        value: resultPublished
          ? "Result Published"
          : hasSubmittedExam
          ? "Submitted"
          : timeLeft > 0
          ? "Upcoming"
          : "Live",
      },
    ],
    [unreadCount, links.length, resultPublished, hasSubmittedExam, timeLeft]
  )

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-slate-700">
        Loading dashboard...
      </div>
    )
  }

  if (!user) {
    return null
  }

  const topperSlider = topperData.length > 0 && (
    <div className="w-full overflow-hidden bg-white rounded-xl p-4 shadow">
      <h3 className="font-semibold mb-3">Topper List</h3>
      <div className="flex gap-6 animate-scrollX">
        {topperData.map((topper) => (
          <div key={topper._id} className="shrink-0 flex flex-col items-center text-center w-28">
            <img
              src={topper.image}
              alt={topper.name || "Topper image"}
              className="w-24 h-24 rounded-full object-cover border-4 border-black shadow"
            />
            <p className="mt-2 text-sm font-semibold leading-tight">{topper.name || "-"}</p>
            <p className="text-xs text-gray-600">Year: {topper.year || "-"}</p>
            <p className="text-xs text-gray-600">Age Group: {topper.ageGroupCategory || "-"}</p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-100 text-slate-900">
      <aside className="hidden md:block w-72 bg-white shadow-md">
        <div className="bg-linear-to-r from-blue-700 to-sky-500 text-white p-5">
          <Image
            src={logo}
            alt="Examination Portal Logo"
            width={72}
            height={72}
            className="rounded-lg object-cover mb-3"
            priority
          />
          <p className="font-semibold text-xl">{user.name || "Student"}</p>
          <p className="text-sm text-white/90 break-all">Email ID: {user.email || "-"}</p>
          <p className="text-sm text-white/90">Roll No: {formatRollValue(user.rollNo)}</p>
          <p className="text-sm text-white/90">Class: {formatClassValue(user.class)}</p>
          <p className="text-sm text-white/90">Section: {formatSectionValue(user.section)}</p>
        </div>

        <nav className="p-3 space-y-1">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 ${
                activeTab === item.value ? "bg-blue-600 text-white" : "hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 text-red-600 hover:bg-red-50"
          >
            <span>↪</span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <div className="flex-1 p-4 md:p-6">
        <div className="relative flex justify-between items-center bg-white shadow px-4 md:px-6 py-4 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded border border-gray-300 flex items-center justify-center text-xl"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? "X" : "☰"}
            </button>

            <h1 className="text-base md:text-xl font-bold capitalize">Student {activeTab}</h1>
          </div>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
              <button
                type="button"
                className="absolute inset-0 bg-black/45"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu backdrop"
              />

              <aside className="absolute left-0 top-0 h-full w-[82%] max-w-xs bg-white shadow-2xl flex flex-col">
                <div className="bg-linear-to-r from-blue-900 to-sky-500 text-white p-5">
                  <Image
                    src={logo}
                    alt="Examination Portal Logo"
                    width={72}
                    height={72}
                    className="rounded object-cover mb-3 bg-white"
                  />
                  <p className="font-semibold text-2xl leading-tight">{user.name || "Student"}</p>
                  <p className="text-white/90 text-sm mt-2">Name: {user.name || "-"}</p>
                  <p className="text-white/90 text-sm">Class: {formatClassValue(user.class)}</p>
                  <p className="text-white/90 text-sm">Sec: {formatSectionValue(user.section)}</p>
                  <p className="text-white/90 text-sm">Roll: {formatRollValue(user.rollNo)}</p>
                  <p className="text-white/90 text-sm break-all">Email ID: {user.email || "-"}</p>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                  <div className="space-y-1">
                    {MENU_ITEMS.map((item) => (
                      <button
                        key={item.value}
                        onClick={() => {
                          setActiveTab(item.value)
                          setMobileMenuOpen(false)
                        }}
                        className={`w-full text-left px-3 py-3 rounded-lg transition flex items-center gap-3 text-lg ${
                          activeTab === item.value
                            ? "bg-blue-600 text-white"
                            : "text-slate-800 hover:bg-blue-50"
                        }`}
                      >
                        <span className="w-7 text-center">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-3 mt-4 rounded-lg text-red-700 hover:bg-red-50 flex items-center gap-3 text-lg"
                  >
                    <span className="w-7 text-center">↪</span>
                    <span>Logout</span>
                  </button>
                </div>
              </aside>
            </div>
          )}

          <div className="ml-auto flex items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationOpen((prev) => !prev)}
                className="text-xl relative cursor-pointer"
                aria-label="Toggle notifications"
              >
                🔔

                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white shadow rounded p-4 z-50">
                <h3 className="font-bold mb-2">Notifications</h3>

                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-500">No notifications</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {notifications.map((item) => (
                      <div
                        key={item._id}
                        className={`border p-2 rounded text-sm ${item.isRead ? "bg-gray-50" : "bg-white"}`}
                      >
                        <p className="font-semibold">
                          {item.title} {item.isRead ? "(Read)" : "(New)"}
                        </p>
                        <p className="text-xs text-gray-600">{item.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={markAsRead}
                  disabled={unreadCount === 0}
                  className="mt-3 w-full bg-blue-600 text-white py-1 rounded disabled:opacity-60"
                >
                  Mark as Read
                </button>
                </div>
              )}
            </div>

            <div className="relative">
              <div
                onClick={() => setOpen(!open)}
                className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-full cursor-pointer font-bold"
              >
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>

              {open && (
                <div className="absolute right-0 mt-3 w-60 bg-white border rounded shadow-lg p-4 z-50">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium mb-3 break-all">{user?.email}</p>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium mb-3 capitalize">{user?.role}</p>

                  <button onClick={logout} className="w-full bg-red-500 text-white py-2 rounded">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {activeTab === "home" && (
          <section className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow">
              <h2 className="text-xl font-bold mb-1">Welcome, {user.name || "Student"}</h2>
              <p className="text-sm text-gray-600">
                Track your exam activity, study content, and updates from one place.
              </p>
            </div>

            {topperSlider}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickStats.map((item) => (
                <div key={item.title} className="bg-white rounded-xl p-5 shadow">
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <p className="text-2xl font-bold mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-5 shadow">
              <h3 className="font-semibold mb-2">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Open Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("study")}
                  className="px-4 py-2 bg-slate-700 text-white rounded"
                >
                  Open Study Material
                </button>
                {resultPublished && (
                  <button
                    onClick={() => router.push("/result")}
                    className="px-4 py-2 bg-green-600 text-white rounded"
                  >
                    Show Result
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === "dashboard" && (
          <div className="flex flex-col items-center gap-10">
            {topperSlider}

            <div className="bg-white p-6 md:p-10 rounded shadow w-full max-w-105 text-center">
              <h2 className="text-2xl font-bold mb-4">Online Examination</h2>

              {!resultPublished && !hasSubmittedExam && timeLeft > 0 && (
                <>
                  <p className="text-sm text-gray-600 mb-2">Exam starts in</p>
                  <p className="text-2xl font-bold text-blue-700 mb-4">{formatCountdown(timeLeft)}</p>
                </>
              )}

              {!resultPublished && !hasSubmittedExam && timeLeft === 0 && (
                hasExamQuestions ? (
                  <button
                    onClick={() => window.open("/dashboard/student?exam=1", "_blank")}
                    className="bg-blue-600 text-white px-6 py-2 rounded"
                  >
                    Start Exam
                  </button>
                ) : (
                  <p className="text-gray-600 text-sm">No exam available for you right now.</p>
                )
              )}

              {hasSubmittedExam && !resultPublished && (
                <p className="text-gray-600 text-sm">
                  You already submitted the exam. Wait for result.
                </p>
              )}

              {resultPublished && (
                <button
                  onClick={() => router.push("/result")}
                  className="bg-green-600 text-white px-6 py-2 rounded"
                >
                  Show Result
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "study" && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Study Materials</h2>

            {links.length === 0 ? (
              <p className="text-gray-500">No materials available</p>
            ) : (
              <div className="space-y-3 max-h-105 overflow-y-auto">
                {links.map((item) => (
                  <div key={item._id} className="border p-3 rounded">
                    <p className="font-semibold">{item.title}</p>
                    <a href={item.url} target="_blank" className="text-blue-600 underline" rel="noreferrer">
                      Open Link
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <section className="bg-white p-6 rounded shadow space-y-3">
            <h2 className="text-2xl font-bold">About Us</h2>
            <p className="text-gray-700">
              Divyanshi Saksharta Mission Foundation is a Section 8 Company registered
              under the Companies Act 2013.
            </p>
            <p className="text-gray-700">
              CIN: U88900WR2026NPL293005
            </p>
            <p className="text-gray-700">
              Registered Office: Holding No-199, Dolui Para, Backside of Karai Factory,
              Makhla, Hooghly, Serampur Uttarpara, West Bengal - 712245, India.
            </p>
            <p className="text-gray-700">
              Founded in early 2026, we believe every child and young person deserves
              equal opportunity to learn, grow, and succeed. We focus on both academic
              scholarships and practical skill development to prepare the future generation
              for real-world success.
            </p>
          </section>
        )}

        {activeTab === "contact" && (
          <section className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-2xl font-bold">Contact Us</h2>
            <div className="space-y-2 text-gray-700">
              <p className="font-semibold">Registered Office</p>
              <p>
                Holding No-199, Dolui Para, Backside of Karai Factory, Makhla,
                Hooghly, Serampur Uttarpara, West Bengal - 712245, India.
              </p>
              <p>Email: divyanshidsmf@gmail.com</p>
              <p>WhatsApp / Mobile: 6291000845</p>
            </div>
            <button
              onClick={() => setChatOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Open Live Chat
            </button>
          </section>
        )}

        {activeTab === "share" && (
          <section className="bg-white p-6 rounded shadow space-y-4">
            <h2 className="text-2xl font-bold">Share App</h2>
            <p className="text-gray-700">
              Share this portal with your friends so they can stay connected with updates.
            </p>
            <button
              onClick={shareApp}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Share Now
            </button>
            {shareStatus && <p className="text-sm text-gray-600">{shareStatus}</p>}
          </section>
        )}
      </div>

      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full"
      >
        Chat
      </button>

      {chatOpen && <ChatBox user={user} />}
    </div>
  )
}
