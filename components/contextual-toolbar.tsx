"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Palette,
  Crop,
  Replace,
  Trash2,
} from "lucide-react"

interface ContextualToolbarProps {
  elementType: "text" | "image" | null
  position: { x: number; y: number }
  onFormatText?: (format: string, value?: string) => void
  onImageAction?: (action: string) => void
  onDelete?: () => void
}

export function ContextualToolbar({
  elementType,
  position,
  onFormatText,
  onImageAction,
  onDelete,
}: ContextualToolbarProps) {
  const [fontSize, setFontSize] = useState("16")
  const [fontFamily, setFontFamily] = useState("Inter")

  if (!elementType) return null

  const handleFontSizeChange = (value: string) => {
    setFontSize(value)
    onFormatText?.("fontSize", value)
  }

  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value)
    onFormatText?.("fontFamily", value)
  }

  return (
    <div
      className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex items-center space-x-1"
      style={{
        left: position.x,
        top: position.y - 60,
        transform: "translateX(-50%)",
      }}
    >
      {elementType === "text" && (
        <>
          {/* Font Family */}
          <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Times New Roman">Times</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
            </SelectContent>
          </Select>

          {/* Font Size */}
          <Select value={fontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="w-16 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="14">14</SelectItem>
              <SelectItem value="16">16</SelectItem>
              <SelectItem value="18">18</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="32">32</SelectItem>
              <SelectItem value="48">48</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Formatting */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onFormatText?.("bold")}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onFormatText?.("italic")}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onFormatText?.("underline")}>
            <Underline className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Alignment */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onFormatText?.("align", "left")}>
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onFormatText?.("align", "center")}>
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onFormatText?.("align", "right")}>
            <AlignRight className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onFormatText?.("bulletList")}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onFormatText?.("numberedList")}>
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* Text Color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="grid grid-cols-6 gap-2">
                {[
                  "#000000",
                  "#374151",
                  "#6B7280",
                  "#EF4444",
                  "#F59E0B",
                  "#10B981",
                  "#3B82F6",
                  "#8B5CF6",
                  "#EC4899",
                  "#FFFFFF",
                  "#F3F4F6",
                  "#E5E7EB",
                ].map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-slate-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => onFormatText?.("color", color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      {elementType === "image" && (
        <>
          <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => onImageAction?.("replace")}>
            <Replace className="h-4 w-4 mr-1" />
            Replace
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-3" onClick={() => onImageAction?.("crop")}>
            <Crop className="h-4 w-4 mr-1" />
            Crop
          </Button>
        </>
      )}

      <Separator orientation="vertical" className="h-6" />

      {/* Delete */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
