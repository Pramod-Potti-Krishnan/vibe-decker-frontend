"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  multiline?: boolean
  onSelect?: () => void
  isSelected?: boolean
}

export function EditableText({
  value,
  onChange,
  className,
  placeholder = "Click to edit...",
  multiline = false,
  onSelect,
  isSelected = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isEditing) {
      setIsEditing(true)
      onSelect?.()
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    onChange(editValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault()
      handleBlur()
    } else if (e.key === "Escape") {
      setEditValue(value)
      setIsEditing(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditValue(e.target.value)
  }

  if (isEditing) {
    const Component = multiline ? "textarea" : "input"
    return (
      <Component
        ref={inputRef as any}
        value={editValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "bg-transparent border-none outline-none resize-none w-full",
          "focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 rounded px-1",
          className,
        )}
        style={{ minHeight: multiline ? "100px" : "auto" }}
      />
    )
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "cursor-text hover:bg-purple-50 hover:bg-opacity-50 rounded px-1 py-0.5 transition-colors",
        isSelected && "ring-2 ring-purple-500 ring-opacity-50 bg-purple-50 bg-opacity-30",
        !value && "text-slate-400",
        className,
      )}
    >
      {value || placeholder}
    </div>
  )
}
