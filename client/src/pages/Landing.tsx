import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import {CheckCircle, ArrowRight } from 'lucide-react'

// Smooth scroll function
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }
}

const features = [
  {
    title: 'AI-Powered Meal Planning',
    description: 'Our AI analyzes your preferences, dietary needs, and goals to create the perfect meal plan just for you.',
  },
  {
    title: 'Personalized Recipes',
    description: 'Discover new recipes tailored to your tastes and nutritional requirements.',
  },
  {
    title: 'Automatic Shopping Lists',
    description: 'Generate shopping lists based on your meal plan with one click.',
  },
  {
    title: 'Nutrition Tracking',
    description: 'Stay on top of your nutritional goals with detailed nutrient information for each meal.',
  },
  {
    title: 'Flexible Scheduling',
    description: 'Plan your meals by day, week, or month with easy scheduling tools.',
  },
  {
    title: 'Smart Substitutions',
    description: 'Don\'t like an ingredient? Our AI will suggest alternatives that maintain nutritional balance.',
  },
]

// const testimonials = [
//   {
//     quote: "This app has completely transformed how I approach cooking. It's like having a personal nutritionist and chef in my pocket.",
//     author: "Sofia Davis",
//     role: "Fitness Enthusiast"
//   },
//   {
//     quote: "As a busy parent, meal planning was always a struggle. This app saves me hours every week and my family loves the variety of meals.",
//     author: "Marcus Chen",
//     role: "Parent of 3"
//   },
//   {
//     quote: "I've had specific dietary needs after my surgery, and this app makes it so easy to find recipes that are both healthy and delicious.",
//     author: "Eleanor Kim",
//     role: "Recovery Warrior"
//   }
// ]

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-16 flex items-center justify-center border-b">
        <div className="container mx-auto flex justify-between items-center max-w-7xl">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold">AI Meal Planner</span>
          </Link>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <button 
              onClick={() => scrollToSection('features')} 
              className="text-sm font-medium hover:underline underline-offset-4 transition-colors duration-200 bg-transparent border-none cursor-pointer p-0 text-foreground hover:text-primary"
            >
              Features
            </button>
            {/* <button 
              onClick={() => scrollToSection('testimonials')} 
              className="text-sm font-medium hover:underline underline-offset-4 transition-colors duration-200 bg-transparent border-none cursor-pointer p-0 text-foreground hover:text-primary"
            >
              Testimonials
            </button> */}
            <button 
              onClick={() => scrollToSection('pricing')} 
              className="text-sm font-medium hover:underline underline-offset-4 transition-colors duration-200 bg-transparent border-none cursor-pointer p-0 text-foreground hover:text-primary"
            >
              Pricing
            </button>
          </nav>
          <div className="flex items-center gap-2 ml-4 md:ml-6">
            <Button asChild variant="ghost" size="sm">
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Hero */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto px-4 md:px-6 space-y-10 xl:space-y-16 max-w-7xl">
          <div className="grid max-w-[1300px] mx-auto gap-4 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Effortless Meal Planning with AI
                </h1>
                <p className="text-muted-foreground max-w-[600px] md:text-xl">
                  Create delicious, personalized meal plans in seconds. Save time, eat better, and reach your health goals.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link to="/signup" className="px-8">Get Started</Link>
                </Button>
                <Button 
                  onClick={() => scrollToSection('features')} 
                  variant="outline" 
                  size="lg"
                  className="px-8"
                >
                  Learn More
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative w-full h-[400px] overflow-hidden rounded-lg shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1543353071-087092ec393a?w=800&auto=format&fit=crop&q=80" 
                  alt="Meal planning app interface" 
                  className="object-cover w-full h-full transform transition-transform hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background scroll-mt-16">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Features</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our AI-powered platform makes meal planning simple, personal, and enjoyable.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div key={i} className="relative overflow-hidden rounded-lg border bg-background p-6">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      {/* <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-muted scroll-mt-16">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">Testimonials</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">What Our Users Say</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Don't just take our word for it. Here's what people are saying about AI Meal Planner.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="flex flex-col justify-between rounded-lg border bg-background p-6 shadow-sm">
                <div>
                  <div className="flex gap-0.5 text-primary">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-5 w-5"
                      >
                        <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="mt-4 border-l-4 border-muted-foreground/20 pl-4 italic">
                    "{testimonial.quote}"
                  </blockquote>
                </div>
                <div className="mt-6 flex items-center">
                  <div className="ml-4">
                    <p className="text-sm font-medium">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}
      
      {/* Pricing */}
      <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-background scroll-mt-16">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Pricing</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Start for free, upgrade when you need more features.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 lg:grid-cols-3">
            {/* Free Plan */}
            <div className="flex flex-col rounded-lg border bg-background p-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Free</h3>
                <p className="text-muted-foreground">Perfect for getting started</p>
              </div>
              <div className="mt-4 flex items-baseline text-foreground">
                <span className="text-5xl font-extrabold tracking-tight">$0</span>
                <span className="ml-1 text-sm font-medium text-muted-foreground">/month</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>5 meal plans per month</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Basic recipe search</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Shopping list generation</span>
                </li>
              </ul>
              <Button asChild className="mt-8" variant="outline">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
            
            {/* Pro Plan */}
            <div className="flex flex-col rounded-lg border bg-background p-6 ring-2 ring-primary relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                Most Popular
              </div>
              <div className="space-y-2 mt-4">
                <h3 className="text-2xl font-bold">Pro</h3>
                <p className="text-muted-foreground">Perfect for food enthusiasts</p>
              </div>
              <div className="mt-4 flex items-baseline text-foreground">
                <span className="text-5xl font-extrabold tracking-tight">$9.99</span>
                <span className="ml-1 text-sm font-medium text-muted-foreground">/month</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Unlimited meal plans</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Advanced AI recipe search</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Customizable meal schedule</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Nutrition tracking</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Favorite recipes collection</span>
                </li>
              </ul>
              <Button asChild className="mt-8">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
            
            {/* Family Plan */}
            <div className="flex flex-col rounded-lg border bg-background p-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Family</h3>
                <p className="text-muted-foreground">Perfect for households</p>
              </div>
              <div className="mt-4 flex items-baseline text-foreground">
                <span className="text-5xl font-extrabold tracking-tight">$19.99</span>
                <span className="ml-1 text-sm font-medium text-muted-foreground">/month</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Everything in Pro plan</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Up to 5 family profiles</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Smart pantry management</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Meal cost estimation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Priority customer support</span>
                </li>
              </ul>
              <Button asChild className="mt-8" variant="outline">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Transform Your Meal Planning?</h2>
              <p className="mx-auto max-w-[700px] text-primary-foreground/80 md:text-xl">
                Join thousands of users who are saving time and eating better with AI Meal Planner.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link to="/signup" className="px-8">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full py-6 md:py-0 bg-background">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row max-w-7xl">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} AI Meal Planner. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Terms
            </Link>
            <Link to="#" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}