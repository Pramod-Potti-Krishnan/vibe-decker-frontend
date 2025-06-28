"use client"

import type React from "react"

import { useState } from "react"
import { EditableText } from "./editable-text"
import { ContextualToolbar } from "./contextual-toolbar"
import { Eye } from "lucide-react"

interface SlideElementProps {
  element: {
    id: string
    type: "title" | "content" | "image" | "placeholder"
    content: string
    style?: {
      fontSize?: string
      fontFamily?: string
      fontWeight?: string
      fontStyle?: string
      textDecoration?: string
      textAlign?: string
      color?: string
    }
    position?: { x: number; y: number }
  }
  onUpdate: (elementId: string, updates: any) => void
  onDelete: (elementId: string) => void
  isSelected: boolean
  onSelect: () => void
}

export function SlideElement({ element, onUpdate, onDelete, isSelected, onSelect }: SlideElementProps) {
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 })

  const handleTextChange = (newContent: string) => {
    onUpdate(element.id, { content: newContent })
  }

  const handleFormatText = (format: string, value?: string) => {
    const currentStyle = element.style || {}
    const newStyle = { ...currentStyle }

    switch (format) {
      case "bold":
        newStyle.fontWeight = currentStyle.fontWeight === "bold" ? "normal" : "bold"
        break
      case "italic":
        newStyle.fontStyle = currentStyle.fontStyle === "italic" ? "normal" : "italic"
        break
      case "underline":
        newStyle.textDecoration = currentStyle.textDecoration === "underline" ? "none" : "underline"
        break
      case "align":
        newStyle.textAlign = value
        break
      case "fontSize":
        newStyle.fontSize = `${value}px`
        break
      case "fontFamily":
        newStyle.fontFamily = value
        break
      case "color":
        newStyle.color = value
        break
      case "bulletList":
        // Handle bullet list formatting
        const bulletContent = element.content
          .split("\n")
          .map((line) => (line.trim() ? `• ${line.replace(/^[•\-*]\s*/, "")}` : line))
          .join("\n")
        onUpdate(element.id, { content: bulletContent })
        return
      case "numberedList":
        // Handle numbered list formatting
        const numberedContent = element.content
          .split("\n")
          .map((line, index) => (line.trim() ? `${index + 1}. ${line.replace(/^\d+\.\s*/, "")}` : line))
          .join("\n")
        onUpdate(element.id, { content: numberedContent })
        return
    }

    onUpdate(element.id, { style: newStyle })
  }

  const handleImageAction = (action: string) => {
    switch (action) {
      case "replace":
        // Trigger file upload
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (file) {
            const url = URL.createObjectURL(file)
            onUpdate(element.id, { content: url })
          }
        }
        input.click()
        break
      case "crop":
        // Implement crop functionality
        console.log("Crop image")
        break
    }
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()

    // Calculate toolbar position
    const rect = e.currentTarget.getBoundingClientRect()
    setToolbarPosition({
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }

  const getElementClassName = () => {
    const baseClass = "relative group"
    const typeClasses = {
      title: "text-3xl font-bold mb-6 text-slate-900",
      content: "text-lg text-slate-700 leading-relaxed",
      image: "w-full h-48 object-cover rounded-lg",
      placeholder: "p-4 border-2 border-dashed border-slate-300 rounded-lg text-center",
    }
    return `${baseClass} ${typeClasses[element.type] || ""}`
  }

  const getTextStyle = () => {
    if (!element.style) return {}
    return {
      fontSize: element.style.fontSize,
      fontFamily: element.style.fontFamily,
      fontWeight: element.style.fontWeight,
      fontStyle: element.style.fontStyle,
      textDecoration: element.style.textDecoration,
      textAlign: element.style.textAlign as any,
      color: element.style.color,
    }
  }

  if (element.type === "image") {
    return (
      <div className={getElementClassName()} onClick={handleSelect}>
        <img
          src={element.content || "/placeholder.svg?height=200&width=400"}
          alt="Slide image"
          className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        />
        {isSelected && (
          <ContextualToolbar
            elementType="image"
            position={toolbarPosition}
            onImageAction={handleImageAction}
            onDelete={() => onDelete(element.id)}
          />
        )}
      </div>
    )
  }

  if (element.type === "placeholder") {
    return (
      <div className={getElementClassName()} onClick={handleSelect}>
        <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-slate-400 transition-colors">
          <Eye className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Visual placeholder (upgrade to Pro to generate images)</p>
        </div>
        {isSelected && (
          <ContextualToolbar
            elementType="image"
            position={toolbarPosition}
            onImageAction={handleImageAction}
            onDelete={() => onDelete(element.id)}
          />
        )}
      </div>
    )
  }

  return (
    <div className={getElementClassName()} onClick={handleSelect}>
      <EditableText
        value={element.content}
        onChange={handleTextChange}
        className={
          element.type === "title" ? "text-3xl font-bold text-slate-900" : "text-lg text-slate-700 leading-relaxed"
        }
        style={getTextStyle()}
        multiline={element.type === "content"}
        onSelect={onSelect}
        isSelected={isSelected}
      />
      {isSelected && (
        <ContextualToolbar
          elementType="text"
          position={toolbarPosition}
          onFormatText={handleFormatText}
          onDelete={() => onDelete(element.id)}
        />
      )}
    </div>
  )
}
