"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crown, Palette, Zap, Shield } from "lucide-react"

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  user: any
}

export function SettingsDialog({ isOpen, onClose, user }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    // General
    autoSave: true,
    notifications: true,
    theme: "light",
    language: "en",

    // AI Preferences
    creativityLevel: "balanced",
    defaultTone: "professional",
    autoGenerateImages: true,
    internetSearch: false,

    // Brand Kit
    primaryColor: "#7c3aed",
    secondaryColor: "#2563eb",
    fontFamily: "Inter",
    logoUrl: "",

    // Privacy
    dataRetention: "30",
    shareAnalytics: false,
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your deckster.xyz experience</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ai">AI Preferences</TabsTrigger>
            <TabsTrigger value="brand">Brand Kit</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">General Settings</CardTitle>
                <CardDescription>Configure your workspace preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-save presentations</Label>
                    <p className="text-sm text-slate-500">Automatically save changes as you work</p>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoSave: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable notifications</Label>
                    <p className="text-sm text-slate-500">Get notified about agent progress and updates</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={settings.theme} onValueChange={(value) => setSettings({ ...settings, theme: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => setSettings({ ...settings, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  AI Agent Preferences
                </CardTitle>
                <CardDescription>Customize how AI agents work for you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Creativity Level</Label>
                  <Select
                    value={settings.creativityLevel}
                    onValueChange={(value) => setSettings({ ...settings, creativityLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="experimental">Experimental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Tone</Label>
                  <Select
                    value={settings.defaultTone}
                    onValueChange={(value) => setSettings({ ...settings, defaultTone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-generate images</Label>
                    <p className="text-sm text-slate-500">Let the Graphic Artist create visuals automatically</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user?.tier === "free" && <Badge variant="outline">Pro Feature</Badge>}
                    <Switch
                      checked={settings.autoGenerateImages}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoGenerateImages: checked })}
                      disabled={user?.tier === "free"}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Internet search</Label>
                    <p className="text-sm text-slate-500">Allow agents to search for current information</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user?.tier === "free" && <Badge variant="outline">Pro Feature</Badge>}
                    <Switch
                      checked={settings.internetSearch}
                      onCheckedChange={(checked) => setSettings({ ...settings, internetSearch: checked })}
                      disabled={user?.tier === "free"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brand" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  Brand Kit
                  {user?.tier === "free" && (
                    <Badge className="ml-2" variant="outline">
                      Pro Feature
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Customize your brand identity across all presentations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded border" style={{ backgroundColor: settings.primaryColor }} />
                      <Input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        disabled={user?.tier === "free"}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded border" style={{ backgroundColor: settings.secondaryColor }} />
                      <Input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        disabled={user?.tier === "free"}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select
                    value={settings.fontFamily}
                    onValueChange={(value) => setSettings({ ...settings, fontFamily: value })}
                    disabled={user?.tier === "free"}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    placeholder="https://example.com/logo.png"
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    disabled={user?.tier === "free"}
                  />
                </div>

                {user?.tier === "free" && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-purple-600" />
                      <span className="text-sm text-purple-700">Upgrade to Pro to customize your brand kit</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
                <CardDescription>Manage your account details and subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={user?.name || ""} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} readOnly />
                </div>

                <div className="space-y-2">
                  <Label>Current Plan</Label>
                  <div className="flex items-center space-x-2">
                    <Badge variant={user?.tier === "pro" ? "default" : "outline"}>
                      {user?.tier === "free" ? "Free Plan" : user?.tier === "pro" ? "Pro Plan" : "Enterprise"}
                    </Badge>
                    {user?.tier === "free" && <Button size="sm">Upgrade</Button>}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button variant="outline">Change Password</Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>Control your data and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Data Retention (days)</Label>
                  <Select
                    value={settings.dataRetention}
                    onValueChange={(value) => setSettings({ ...settings, dataRetention: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Share usage analytics</Label>
                    <p className="text-sm text-slate-500">Help us improve by sharing anonymous usage data</p>
                  </div>
                  <Switch
                    checked={settings.shareAnalytics}
                    onCheckedChange={(checked) => setSettings({ ...settings, shareAnalytics: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button variant="outline">Download My Data</Button>
                  <Button variant="outline" className="text-red-600 hover:text-red-700">
                    Delete All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
