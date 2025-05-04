import { Outlet } from 'react-router-dom'
import { Footer } from '../navigation/Footer'
import { Sidebar } from '../navigation/Sidebar'
import { Topbar } from '../navigation/Topbar'
import { useMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const AppLayout = () => {
  const isMobile = useMobile()
  const [mounted, setMounted] = useState(false)
  
  // Prevent content flash before sidebar is rendered
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render content until after client-side hydration
  if (!mounted) {
    return null
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar navigation */}
      <Sidebar />
      
      {/* Main content area with flexbox layout */}
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300",
        isMobile ? "ml-0" : "ml-[70px] md:ml-[240px]"
      )}>
        {/* Top navigation bar */}
        <Topbar />
        
        {/* Main content */}
        <main className="flex-1 container max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:py-10">
          <Outlet />
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

export default AppLayout