"use client"

import ChatBox from "@/app/component/chatBox.jsx"

export default function ChatSupport({ user }) {
  return (
    <div className="p-4 md:p-6">
      <div className="bg-white p-4 md:p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Chat / Support</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select a student from the left sidebar and continue the conversation.
        </p>
        <ChatBox user={user} isAdmin={true} fixed={false} />
      </div>
    </div>
  )
}
