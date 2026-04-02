"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

const AppDialogContext = createContext(null)

export function AppDialogProvider({ children }) {
  const resolverRef = useRef(null)
  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
    type: "alert",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
  })

  const closeDialog = useCallback((result) => {
    const resolve = resolverRef.current
    resolverRef.current = null
    setDialog((prev) => ({ ...prev, open: false }))
    if (resolve) resolve(result)
  }, [])

  const showAlert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setDialog({
        open: true,
        title: options.title || "Notice",
        message,
        type: "alert",
        confirmLabel: options.confirmLabel || "OK",
        cancelLabel: "",
      })
    })
  }, [])

  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setDialog({
        open: true,
        title: options.title || "Please Confirm",
        message,
        type: "confirm",
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
      })
    })
  }, [])

  const value = useMemo(
    () => ({ showAlert, showConfirm }),
    [showAlert, showConfirm]
  )

  return (
    <AppDialogContext.Provider value={value}>
      {children}

      {dialog.open && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">{dialog.title}</h3>
            <p className="mb-6 whitespace-pre-line text-sm text-slate-700">{dialog.message}</p>

            <div className="flex justify-end gap-2">
              {dialog.type === "confirm" && (
                <button
                  type="button"
                  onClick={() => closeDialog(false)}
                  className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  {dialog.cancelLabel}
                </button>
              )}

              <button
                type="button"
                onClick={() => closeDialog(true)}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppDialogContext.Provider>
  )
}

export function useAppDialog() {
  const context = useContext(AppDialogContext)
  if (!context) {
    throw new Error("useAppDialog must be used within AppDialogProvider")
  }
  return context
}
