"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, Filter, MoreVertical, Sparkles, Calendar, Users, Crown } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth()
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Mock presentations data
    setPresentations([
      {
        id: "1",
        title: "Q4 Marketing Strategy",
        description: "Comprehensive marketing plan for the fourth quarter",
        createdAt: "2024-01-15",
        updatedAt: "2024-01-16",
        slideCount: 12,
        status: "completed",
        thumbnail: "/placeholder.svg?height=200&width=300",
      },
      {
        id: "2",
        title: "Product Launch Presentation",
        description: "Introducing our new product line to stakeholders",
        createdAt: "2024-01-14",
        updatedAt: "2024-01-14",
        slideCount: 8,
        status: "in-progress",
        thumbnail: "/placeholder.svg?height=200&width=300",
      },
      {
        id: "3",
        title: "Team Performance Review",
        description: "Monthly team performance and goals assessment",
        createdAt: "2024-01-13",
        updatedAt: "2024-01-13",
        slideCount: 6,
        status: "draft",
        thumbnail: "/placeholder.svg?height=200&width=300",
      },
    ])
  }, [router])

  const handleSignOut = async () => {
    await logout()
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

  const filteredPresentations = presentations.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // User authentication is handled by middleware
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Agentic Deck Builder</span>
            </Link>
            <Badge variant="outline" className="ml-4">
              {user?.tier === "free" ? "Free Plan" : user?.tier === "pro" ? "Pro Plan" : "Enterprise"}
              {user?.tier === "pro" && <Crown className="ml-1 h-3 w-3" />}
            </Badge>
          </div>

          <div className="flex items-center space-x-4">
            <Button asChild>
              <Link href="/builder">
                <Plus className="mr-2 h-4 w-4" />
                New Presentation
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem>
                  <Users className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'there'}!</h1>
          <p className="text-slate-600">Ready to create amazing presentations with your AI agent team?</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Presentations</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentations.length}</div>
              <p className="text-xs text-muted-foreground">
                {user?.tier === "free" ? `${3 - presentations.length} remaining in free plan` : "Unlimited"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">+1 from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Collaborations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">47</div>
              <p className="text-xs text-muted-foreground">Agent interactions this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search presentations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Presentations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPresentations.map((presentation) => (
            <Card key={presentation.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <div className="aspect-video bg-slate-100 rounded-t-lg overflow-hidden">
                <img
                  src={presentation.thumbnail || "/placeholder.svg"}
                  alt={presentation.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{presentation.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">{presentation.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/builder/${presentation.id}`}>Edit</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <span>{presentation.slideCount} slides</span>
                    <span>Updated {new Date(presentation.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <Badge className={getStatusColor(presentation.status)}>{presentation.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredPresentations.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No presentations found</h3>
            <p className="text-slate-600 mb-4">
              {searchQuery ? "Try adjusting your search terms" : "Create your first presentation to get started"}
            </p>
            <Button asChild>
              <Link href="/builder">
                <Plus className="mr-2 h-4 w-4" />
                Create Presentation
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
