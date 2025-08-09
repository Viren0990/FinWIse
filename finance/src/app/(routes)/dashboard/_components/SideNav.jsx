"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { DollarSign, LayoutGrid, CircleDollarSign, PiggyBank, ReceiptText, ShieldCheck } from "lucide-react"

const menuList = [
  {
    name: "Dashboard",
    icon: LayoutGrid,
    path: "/dashboard",
  },
  {
    name: "Incomes",
    icon: CircleDollarSign,
    path: "/dashboard/incomes",
  },
  {
    name: "Budgets",
    icon: PiggyBank,
    path: "/dashboard/budgets",
  },
  {
    name: "Expenses",
    icon: ReceiptText,
    path: "/dashboard/expenses",
  },
  {
    name: "Financial Market Prediction",
    icon: ShieldCheck,
    path: "/dashboard/ml",
  },
  {
    name: "Google Pay Tracker",
    icon: CircleDollarSign,
    path: "/dashboard/gpay",
  },
]

function SideNav() {
  const path = usePathname()

  return (
    <nav className="flex flex-col h-screen w-64 bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <Link href="/" className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">FinanAdvisor</span>
        </Link>
      </div>
      <div className="flex-grow overflow-y-auto">
        <ul className="py-4">
          {menuList.map((menu) => (
            <li key={menu.path} className="px-4 py-2">
              <Link
                href={menu.path}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-colors duration-150 ease-in-out
                  ${path === menu.path ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}
              >
                <menu.icon className="h-5 w-5" />
                <span className="font-medium">{menu.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <UserButton afterSignOutUrl="/" />
          <span className="text-sm font-medium text-gray-700">Profile</span>
        </div>
      </div>
    </nav>
  )
}

export default SideNav

