"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to sign in page since we use Google OAuth for both sign in and sign up
    router.replace("/auth/signin")
  }, [router])

  return null
}