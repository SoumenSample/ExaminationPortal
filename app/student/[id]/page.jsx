"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function StudentPage(){

	const router = useRouter()

	useEffect(() => {
		router.replace("/dashboard")
	}, [router])

	return (
		<div className="min-h-screen flex items-center justify-center">
			<p>Redirecting to dashboard...</p>
		</div>
	)

}
