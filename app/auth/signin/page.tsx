"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to home page immediately
    router.replace('/')
  }, [router])
  
  return null
}