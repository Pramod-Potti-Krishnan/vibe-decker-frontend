"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FolderPlus, Folder, FileText, Plus, MoreVertical, Search, X, Sparkles } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  createdAt: Date
  presentations: string[]
  isFolder?: boolean
  parentId?: string
}

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  currentProject: Project | null
  onProjectSelect: (project: Project) => void
  onProjectCreate: (project: Omit<Project, "id" | "createdAt">) => void
}

export function ProjectSidebar({
  isOpen,
  onClose,
  projects,
  currentProject,
  onProjectSelect,
  onProjectCreate,
}: ProjectSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    isFolder: false,
    parentId: undefined as string | undefined,
  })

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return

    onProjectCreate({
      ...newProject,
      presentations: [],
    })

    setNewProject({
      name: "",
      description: "",
      isFolder: false,
      parentId: undefined,
    })
    setShowCreateDialog(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-80 bg-white border-r shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="font-semibold">Projects</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-b">
          <div className="flex space-x-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>Create a new project or folder to organize your presentations.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter project name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter project description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isFolder"
                      checked={newProject.isFolder}
                      onChange={(e) => setNewProject({ ...newProject, isFolder: e.target.checked })}
                    />
                    <Label htmlFor="isFolder">Create as folder</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProject}>Create</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Projects List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className={`p-3 rounded-lg border cursor-pointer hover:bg-slate-50 ${
                  currentProject?.id === project.id ? "border-purple-200 bg-purple-50" : "border-slate-200"
                }`}
                onClick={() => onProjectSelect(project)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {project.isFolder ? (
                        <Folder className="h-4 w-4 text-slate-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{project.name}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1">{project.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {project.presentations.length} presentations
                        </Badge>
                        <span className="text-xs text-slate-500">{project.createdAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Rename</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Overlay */}
      <div className="flex-1 bg-black bg-opacity-50" onClick={onClose} />
    </div>
  )
}
