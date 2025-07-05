"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { History, GitBranch, Clock, Eye, RotateCcw, Trash2 } from "lucide-react"

interface Version {
  id: string
  name: string
  createdAt: Date
  slides: any[]
  description: string
}

interface VersionHistoryProps {
  isOpen: boolean
  onClose: () => void
  versions: Version[]
  currentVersion: string
  onVersionRestore: (versionId: string) => void
  onVersionDelete: (versionId: string) => void
}

export function VersionHistory({
  isOpen,
  onClose,
  versions,
  currentVersion,
  onVersionRestore,
  onVersionDelete,
}: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>View and restore previous versions of your presentation</DialogDescription>
        </DialogHeader>

        <div className="flex h-[60vh]">
          {/* Version List */}
          <div className="w-1/3 border-r">
            <div className="p-4 border-b">
              <h3 className="font-medium">All Versions</h3>
              <p className="text-sm text-slate-500">{versions.length} versions saved</p>
            </div>
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-slate-50 ${
                      selectedVersion?.id === version.id
                        ? "bg-purple-50 border border-purple-200"
                        : "border border-transparent"
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm truncate">{version.name}</h4>
                          {version.id === currentVersion && (
                            <Badge variant="default" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1">{version.description}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span className="text-xs text-slate-500">{formatTimeAgo(version.createdAt)}</span>
                          <Badge variant="outline" className="text-xs">
                            {version.slides?.length || 0} slides
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Version Preview */}
          <div className="flex-1 flex flex-col">
            {selectedVersion ? (
              <>
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{selectedVersion.name}</h3>
                      <p className="text-sm text-slate-600">{selectedVersion.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                        <span>Created {selectedVersion.createdAt.toLocaleString()}</span>
                        <span>{selectedVersion.slides?.length || 0} slides</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      {selectedVersion.id !== currentVersion && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm">
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restore
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Restore Version</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to restore "{selectedVersion.name}"? This will create a new
                                  version with the restored content.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onVersionRestore(selectedVersion.id)}>
                                  Restore Version
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Version</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{selectedVersion.name}"? This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onVersionDelete(selectedVersion.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Version
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Slide Thumbnails */}
                <ScrollArea className="flex-1 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {(selectedVersion.slides || []).map((slide, index) => (
                      <div key={slide.id} className="border rounded-lg overflow-hidden">
                        <div className="aspect-video bg-slate-50 p-4 flex flex-col">
                          <h4 className="font-medium text-sm mb-2">{slide.title}</h4>
                          <p className="text-xs text-slate-600 line-clamp-3">{slide.content}</p>
                        </div>
                        <div className="p-2 bg-slate-50 border-t">
                          <span className="text-xs text-slate-500">Slide {index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <GitBranch className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">Select a version to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
