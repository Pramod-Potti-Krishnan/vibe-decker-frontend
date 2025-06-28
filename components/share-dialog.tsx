"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Share, Mail, Copy, Eye, Edit, Globe, Users, Check } from "lucide-react"

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  presentationTitle: string
}

export function ShareDialog({ isOpen, onClose, presentationTitle }: ShareDialogProps) {
  const [shareSettings, setShareSettings] = useState({
    access: "view",
    expiration: "never",
    password: "",
    allowDownload: true,
    allowComments: false,
    trackViews: true,
  })
  const [shareLink] = useState("https://agentic-deck-builder.com/share/abc123xyz")
  const [copied, setCopied] = useState(false)
  const [collaborators, setCollaborators] = useState([
    { email: "john@example.com", access: "edit", status: "pending" },
    { email: "sarah@example.com", access: "view", status: "accepted" },
  ])
  const [newCollaborator, setNewCollaborator] = useState({ email: "", access: "view" })

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const addCollaborator = () => {
    if (newCollaborator.email) {
      setCollaborators([...collaborators, { ...newCollaborator, status: "pending" }])
      setNewCollaborator({ email: "", access: "view" })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share className="mr-2 h-5 w-5" />
            Share "{presentationTitle}"
          </DialogTitle>
          <DialogDescription>Share your presentation with others or make it publicly accessible</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Share Link</TabsTrigger>
            <TabsTrigger value="collaborate">Collaborate</TabsTrigger>
            <TabsTrigger value="publish">Publish</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share via Link</CardTitle>
                <CardDescription>Create a shareable link with custom permissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select
                    value={shareSettings.access}
                    onValueChange={(value) => setShareSettings({ ...shareSettings, access: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">
                        <div className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" />
                          View only
                        </div>
                      </SelectItem>
                      <SelectItem value="comment">
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          Can comment
                        </div>
                      </SelectItem>
                      <SelectItem value="edit">
                        <div className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" />
                          Can edit
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Link Expiration</Label>
                  <Select
                    value={shareSettings.expiration}
                    onValueChange={(value) => setShareSettings({ ...shareSettings, expiration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never expires</SelectItem>
                      <SelectItem value="1day">1 day</SelectItem>
                      <SelectItem value="1week">1 week</SelectItem>
                      <SelectItem value="1month">1 month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Password Protection (Optional)</Label>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={shareSettings.password}
                    onChange={(e) => setShareSettings({ ...shareSettings, password: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow downloads</Label>
                      <p className="text-sm text-slate-500">Let viewers download the presentation</p>
                    </div>
                    <Switch
                      checked={shareSettings.allowDownload}
                      onCheckedChange={(checked) => setShareSettings({ ...shareSettings, allowDownload: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow comments</Label>
                      <p className="text-sm text-slate-500">Enable commenting on slides</p>
                    </div>
                    <Switch
                      checked={shareSettings.allowComments}
                      onCheckedChange={(checked) => setShareSettings({ ...shareSettings, allowComments: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Track views</Label>
                      <p className="text-sm text-slate-500">See who viewed your presentation</p>
                    </div>
                    <Switch
                      checked={shareSettings.trackViews}
                      onCheckedChange={(checked) => setShareSettings({ ...shareSettings, trackViews: checked })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Share Link</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={shareLink} readOnly />
                    <Button onClick={copyToClipboard} variant="outline">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collaborate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invite Collaborators</CardTitle>
                <CardDescription>Add team members to work together on this presentation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter email address"
                    value={newCollaborator.email}
                    onChange={(e) => setNewCollaborator({ ...newCollaborator, email: e.target.value })}
                  />
                  <Select
                    value={newCollaborator.access}
                    onValueChange={(value) => setNewCollaborator({ ...newCollaborator, access: value })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View</SelectItem>
                      <SelectItem value="edit">Edit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addCollaborator}>
                    <Mail className="mr-2 h-4 w-4" />
                    Invite
                  </Button>
                </div>

                {collaborators.length > 0 && (
                  <div className="space-y-2">
                    <Label>Current Collaborators</Label>
                    <div className="space-y-2">
                      {collaborators.map((collaborator, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{collaborator.email}</p>
                            <div className="flex items-center space-x-2">
                              <Badge variant={collaborator.access === "edit" ? "default" : "outline"}>
                                {collaborator.access}
                              </Badge>
                              <Badge variant={collaborator.status === "accepted" ? "default" : "outline"}>
                                {collaborator.status}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="publish" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publish Presentation</CardTitle>
                <CardDescription>Make your presentation publicly discoverable</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Publishing makes your presentation searchable and accessible to everyone
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Public Title</Label>
                  <Input defaultValue={presentationTitle} />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Describe your presentation for public discovery..." />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <Input placeholder="business, strategy, marketing (comma separated)" />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">
                  <Globe className="mr-2 h-4 w-4" />
                  Publish Presentation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
