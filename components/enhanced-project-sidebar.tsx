"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FolderPlus,
  Folder,
  FileText,
  Plus,
  MoreVertical,
  Search,
  X,
  Sparkles,
  PresentationIcon as PresentationChart,
  Home,
  User,
  Crown,
} from "lucide-react"
import Link from "next/link"

interface Project {
  id: string
  name: string
  description: string
  createdAt: Date
  presentations: string[]
  isFolder?: boolean
  parentId?: string
}

interface Presentation {
  id: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  slideCount: number
  status: "draft" | "completed" | "in-progress"
  thumbnail: string
}

interface EnhancedProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  presentations: Presentation[]
  currentProject: Project | null
  onProjectSelect: (project: Project) => void
  onProjectCreate: (project: Omit<Project, "id" | "createdAt">) => void
  onPresentationSelect: (presentation: Presentation) => void
  onNewPresentation: () => void
  user: any
}

export function EnhancedProjectSidebar({
  isOpen,
  onClose,
  projects,
  presentations,
  currentProject,
  onProjectSelect,
  onProjectCreate,
  onPresentationSelect,
  onNewPresentation,
  user,
}: EnhancedProjectSidebarProps) {
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

  const filteredPresentations = presentations.filter(
    (presentation) =>
      presentation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      presentation.description.toLowerCase().includes(searchQuery.toLowerCase()),
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700"
      case "in-progress":
        return "bg-blue-100 text-blue-700"
      case "draft":
        return "bg-slate-100 text-slate-700"
      default:
        return "bg-slate-100 text-slate-700"
    }
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
              <h2 className="font-semibold">Workspace</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {user?.tier === "free" ? "Free" : user?.tier === "pro" ? "Pro" : "Enterprise"}
                </Badge>
                {user?.tier === "pro" && <Crown className="h-3 w-3 text-yellow-500" />}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button onClick={onNewPresentation} className="w-full justify-start" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Presentation
            </Button>
            <Button asChild variant="outline" className="w-full justify-start" size="sm">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="presentations" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
              <TabsTrigger value="presentations">Presentations</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>

            <TabsContent value="presentations" className="flex-1 overflow-hidden mt-4">
              <div className="px-4 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Recent Presentations</Label>
                  <Badge variant="outline" className="text-xs">
                    {filteredPresentations.length}
                  </Badge>
                </div>
              </div>

              <ScrollArea className="flex-1 px-4">
                <div className="space-y-2">
                  {filteredPresentations.map((presentation) => (
                    <div
                      key={presentation.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => onPresentationSelect(presentation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="mt-1">
                            <PresentationChart className="h-4 w-4 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{presentation.title}</h4>
                            <p className="text-xs text-slate-600 line-clamp-2 mt-1">{presentation.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline" className={`text-xs ${getStatusColor(presentation.status)}`}>
                                {presentation.status}
                              </Badge>
                              <span className="text-xs text-slate-500">{presentation.slideCount} slides</span>
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
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem>Share</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}

                  {filteredPresentations.length === 0 && (
                    <div className="text-center py-8">
                      <PresentationChart className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">No presentations found</p>
                      <Button onClick={onNewPresentation} size="sm" className="mt-2">
                        Create your first presentation
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="projects" className="flex-1 overflow-hidden mt-4">
              <div className="px-4 mb-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Projects & Folders</Label>
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <FolderPlus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                          Create a new project or folder to organize your presentations.
                        </DialogDescription>
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
                </div>
              </div>

              <ScrollArea className="flex-1 px-4">
                <div className="space-y-2">
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

                  {filteredProjects.length === 0 && (
                    <div className="text-center py-8">
                      <Folder className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">No projects found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Overlay */}
      <div className="flex-1 bg-black bg-opacity-50" onClick={onClose} />
    </div>
  )
}
