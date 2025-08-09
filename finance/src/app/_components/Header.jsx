"use client"
import Link from "next/link"
import { useUser, UserButton } from "@clerk/nextjs"
import { Button } from "./components/ui/button"
import { DollarSign } from "lucide-react"

function Header() {
  const { isSignedIn } = useUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">FinanAdvisor</span>
        </Link>

        <nav className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-sm font-medium">
              Dashboard
            </Button>
          </Link>
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <Link href="/sign-in">
              <Button size="sm">Get Started</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header

