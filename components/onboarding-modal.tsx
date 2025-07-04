"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sparkles, MessageSquare, Layout, Users, ArrowRight, Play, X } from "lucide-react"
import { useSession } from "next-auth/react"

interface OnboardingModalProps {
  open?: boolean
  onClose?: () => void
}

export function OnboardingModal({ open: controlledOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [open, setOpen] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
    const isNewUser = localStorage.getItem('isNewUser')
    
    if (!hasSeenOnboarding && session && (isNewUser === 'true' || controlledOpen)) {
      setOpen(true)
      localStorage.removeItem('isNewUser')
    }
  }, [session, controlledOpen])

  const steps = [
    {
      title: "Welcome to deckster.xyz",
      description: "Let's take a quick tour of how AI agents collaborate to create your presentations",
      icon: <Sparkles className="h-8 w-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600">
            You're about to experience a new way of creating presentations. Instead of working alone, you'll collaborate
            with a team of specialized AI agents.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <h4 className="font-semibold">The Director</h4>
              <p className="text-sm text-slate-600">Orchestrates the entire process</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <h4 className="font-semibold">The Scripter</h4>
              <p className="text-sm text-slate-600">Writes compelling content</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Layout className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <h4 className="font-semibold">The Graphic Artist</h4>
              <p className="text-sm text-slate-600">Creates visual elements</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "The Dual-Pane Interface",
      description: "Your workspace is split into Mission Control and the Living Canvas",
      icon: <Layout className="h-8 w-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600">
            The interface is designed for seamless collaboration between you and the AI agents.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Mission Control (Left)</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Chat with The Director</li>
                <li>• Give high-level instructions</li>
                <li>• Monitor agent progress</li>
                <li>• Provide feedback</li>
              </ul>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Living Canvas (Right)</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Interactive slide preview</li>
                <li>• Click to select elements</li>
                <li>• Real-time updates</li>
                <li>• Navigate between slides</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Let's Create Your First Presentation",
      description: "Try the system with a simple example to see how it works",
      icon: <Play className="h-8 w-8" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-600">
            We'll create a sample presentation about "The Future of Remote Work" to demonstrate the collaborative
            process.
          </p>
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2">What you'll see:</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• The Director analyzing your request</li>
              <li>• The Scripter writing slide content</li>
              <li>• The Graphic Artist suggesting visuals</li>
              <li>• Real-time slide generation</li>
            </ul>
          </div>
          <Badge className="bg-green-100 text-green-700">
            This is your Free tier experience - upgrade for advanced features!
          </Badge>
        </div>
      ),
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handleClose = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    setOpen(false)
    onClose?.()
  }

  const handleSkip = () => {
    handleClose()
  }

  const isOpen = controlledOpen !== undefined ? controlledOpen : open

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            {steps[currentStep].icon}
          </div>
          <DialogTitle className="text-2xl">{steps[currentStep].title}</DialogTitle>
          <DialogDescription className="text-lg">{steps[currentStep].description}</DialogDescription>
          <div className="mt-4">
            <Progress value={((currentStep + 1) / steps.length) * 100} className="w-full" />
            <p className="text-sm text-slate-500 mt-2">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </DialogHeader>
        
        <div className="mt-6 space-y-6">
          {steps[currentStep].content}

          <div className="flex items-center justify-between pt-6">
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tutorial
            </Button>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Start Building" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}