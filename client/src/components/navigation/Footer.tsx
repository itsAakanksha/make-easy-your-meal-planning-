import { Link } from 'react-router-dom'
import {  Github } from 'lucide-react'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t bg-background py-6">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            © {currentYear} AI Meal Planner. All rights reserved.
          </p>
        </div>
        
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link to="/about" className="hover:text-foreground">
            About
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <a 
            href="https://github.com/yourusername/ai-meal-planner" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground flex items-center gap-1"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
        </nav>
      </div>
    </footer>
  )
}