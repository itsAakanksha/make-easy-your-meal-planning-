import { Link } from 'react-router-dom'
import { Github, Heart } from 'lucide-react'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t bg-background py-4">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <span>© {currentYear} AI Meal Planner</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
            <span>All rights reserved.</span>
          </p>
        </div>
        
        <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <a 
            href="https://github.com/yourusername/ai-meal-planner" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
        </nav>
      </div>
    </footer>
  )
}