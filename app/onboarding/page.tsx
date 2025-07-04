"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Sparkles, MessageSquare, Layout, Users, ArrowRight, Play } from "lucide-react"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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
      setIsLoading(true)
      setTimeout(() => {
        router.push("/builder")
      }, 1000)
    }
  }

  const handleSkip = () => {
    router.push("/builder")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            {steps[currentStep].icon}
          </div>
          <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
          <CardDescription className="text-lg">{steps[currentStep].description}</CardDescription>
          <div className="mt-4">
            <Progress value={((currentStep + 1) / steps.length) * 100} className="w-full" />
            <p className="text-sm text-slate-500 mt-2">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {steps[currentStep].content}

          <div className="flex items-center justify-between pt-6">
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tutorial
            </Button>
            <Button onClick={handleNext} disabled={isLoading}>
              {isLoading ? "Starting..." : currentStep === steps.length - 1 ? "Start Building" : "Next"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
