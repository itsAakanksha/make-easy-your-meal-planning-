import { Outlet } from 'react-router-dom'
import { Navbar } from '../navigation/Navbar'
import { Footer } from '../navigation/Footer'
import { useMobile } from '@/hooks/use-mobile'

const AppLayout = () => {
  const isMobile = useMobile()
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-10">
        <div className={isMobile ? "pb-16" : "pb-8"}>
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default AppLayout