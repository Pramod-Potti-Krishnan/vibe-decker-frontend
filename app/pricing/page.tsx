"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft,
  Check,
  X,
  Sparkles,
  Crown,
  Shield,
  Zap,
  Users,
  BarChart3,
  Palette,
  MessageSquare,
  HelpCircle,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  const plans = [
    {
      id: "free",
      name: "Free",
      description: "Perfect for trying out Deckster",
      price: { monthly: 0, yearly: 0 },
      icon: Shield,
      color: "gray",
      features: [
        { text: "3 presentations", included: true },
        { text: "2 AI agents (Director & Scripter)", included: true },
        { text: "Basic templates", included: true },
        { text: "Export to PDF", included: true },
        { text: "Community support", included: true },
        { text: "Custom branding", included: false },
        { text: "Advanced analytics", included: false },
        { text: "Team collaboration", included: false },
        { text: "Priority support", included: false },
        { text: "API access", included: false }
      ]
    },
    {
      id: "pro",
      name: "Pro",
      description: "For professionals and small teams",
      price: { monthly: 29, yearly: 290 },
      icon: Crown,
      color: "blue",
      popular: true,
      features: [
        { text: "Unlimited presentations", included: true },
        { text: "All 4 AI agents", included: true },
        { text: "Premium templates", included: true },
        { text: "Export to multiple formats", included: true },
        { text: "Custom branding", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Version history", included: true },
        { text: "Email support", included: true },
        { text: "Team collaboration", included: false },
        { text: "API access", included: false }
      ]
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For large teams and organizations",
      price: { monthly: 99, yearly: 990 },
      icon: Sparkles,
      color: "purple",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "Unlimited team members", included: true },
        { text: "Team collaboration", included: true },
        { text: "Advanced permissions", included: true },
        { text: "SSO authentication", included: true },
        { text: "API access", included: true },
        { text: "Custom AI training", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "Priority support", included: true },
        { text: "SLA guarantee", included: true }
      ]
    }
  ]

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      router.push("/auth/signin")
      return
    }

    if (planId === "free") {
      router.push("/dashboard")
      return
    }

    // TODO: Implement Stripe checkout
    console.log(`Selecting plan: ${planId}`)
    router.push("/dashboard")
  }

  const currentPlanId = user?.tier || "free"

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-slate-600 mb-8">
            Unlock the full power of AI-driven presentations
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as "monthly" | "yearly")}>
              <TabsList>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">
                  Yearly
                  <Badge variant="secondary" className="ml-2 text-xs">Save 20%</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = currentPlanId === plan.id
            const price = billingPeriod === "yearly" ? plan.price.yearly : plan.price.monthly
            const isYearlyDiscount = billingPeriod === "yearly" && plan.id !== "free"

            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.popular ? "border-blue-500 shadow-lg scale-105" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className={`mx-auto p-3 rounded-lg mb-4 ${
                    plan.color === "purple" ? "bg-purple-100" : 
                    plan.color === "blue" ? "bg-blue-100" : 
                    "bg-gray-100"
                  }`}>
                    <Icon className={`h-8 w-8 ${
                      plan.color === "purple" ? "text-purple-700" : 
                      plan.color === "blue" ? "text-blue-700" : 
                      "text-gray-700"
                    }`} />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">${price}</span>
                      <span className="text-muted-foreground ml-2">
                        /{billingPeriod === "yearly" ? "year" : "month"}
                      </span>
                    </div>
                    {isYearlyDiscount && (
                      <p className="text-sm text-green-600 mt-1">
                        ${plan.price.monthly * 12 - plan.price.yearly} saved yearly
                      </p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full" 
                    variant={isCurrentPlan ? "outline" : plan.popular ? "default" : "outline"}
                    disabled={isCurrentPlan}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {isCurrentPlan ? "Current Plan" : `Get ${plan.name}`}
                  </Button>
                  
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? "" : "text-gray-500"}`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Meet Your AI Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">The Director</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Orchestrates your presentation creation and coordinates the AI team
                </p>
                <Badge variant="outline" className="mt-2">All Plans</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">The Scripter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Writes compelling content and ensures consistent messaging
                </p>
                <Badge variant="outline" className="mt-2">All Plans</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Palette className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">The Graphic Artist</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Designs beautiful layouts and visual elements
                </p>
                <Badge variant="outline" className="mt-2">Pro & Enterprise</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle className="text-lg">The Data Visualizer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Creates stunning charts and data visualizations
                </p>
                <Badge variant="outline" className="mt-2">Pro & Enterprise</Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                  Can I change plans anytime?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                  and we'll prorate any payments.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                  What payment methods do you accept?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards, debit cards, and corporate purchasing cards through
                  our secure payment processor, Stripe.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                  Is there a free trial for Pro or Enterprise?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  While we don't offer free trials, our Free plan lets you test the platform with
                  3 presentations. You can upgrade anytime to unlock more features.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-purple-600" />
                  Do you offer educational or non-profit discounts?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! We offer special pricing for educational institutions and registered non-profits.
                  Contact our support team for more information.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
          <h3 className="text-2xl font-bold mb-4">Ready to create amazing presentations?</h3>
          <p className="text-lg text-muted-foreground mb-6">
            Join thousands of professionals using Deckster to build better presentations faster
          </p>
          <Button size="lg" onClick={() => handleSelectPlan("pro")}>
            Get Started with Pro
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  )
}