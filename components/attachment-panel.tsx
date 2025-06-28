"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { FileText, ImageIcon, BarChart, Video, Music, X, Download, Eye } from "lucide-react"

interface Attachment {
  id: string
  name: string
  type: "document" | "image" | "video" | "audio" | "data"
  size: string
  uploadedAt: Date
  url: string
}

interface AttachmentPanelProps {
  attachments: Attachment[]
  internetSearchEnabled: boolean
  onAttachmentUpload: (files: FileList) => void
  onInternetSearchToggle: (enabled: boolean) => void
  onAttachmentRemove: (id: string) => void
}

export function AttachmentPanel({
  attachments,
  internetSearchEnabled,
  onAttachmentUpload,
  onInternetSearchToggle,
  onAttachmentRemove,
}: AttachmentPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />
      case "image":
        return <ImageIcon className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "audio":
        return <Music className="h-4 w-4" />
      case "data":
        return <BarChart className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case "document":
        return "bg-blue-100 text-blue-700"
      case "image":
        return "bg-green-100 text-green-700"
      case "video":
        return "bg-purple-100 text-purple-700"
      case "audio":
        return "bg-orange-100 text-orange-700"
      case "data":
        return "bg-red-100 text-red-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAttachmentUpload(e.target.files)
    }
  }

  return (
    <>
      {attachments.length > 0 && (
        <Card className="h-full">
          <CardContent className="space-y-2">
            {/* Attachments List */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Uploaded Files ({attachments.length})</Label>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-slate-50"
                    >
                      <div className={`p-1 rounded ${getFileTypeColor(attachment.type)}`}>
                        {getFileIcon(attachment.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                        <p className="text-xs text-slate-500">{attachment.size}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={() => onAttachmentRemove(attachment.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
