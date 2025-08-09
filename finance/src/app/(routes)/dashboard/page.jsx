"use client"

import { useEffect, useState } from "react"
import { UserButton, useUser } from "@clerk/nextjs"
import CardInfo from "./_components/CardInfo"
import { db } from "./utils/dbConfig.jsx"
import { desc, eq, getTableColumns, sql } from "drizzle-orm"
import { Budgets, Expenses, Incomes } from "./utils/schema"
import BarChartDashboard from "./_components/BarChartDashboard"
import BudgetItem from "./budgets/_components/BudgetItem"
import ExpenseListTable from "./expenses/_components/ExpenseListTable"

function Dashboard() {
  const { user } = useUser()

  const [budgetList, setBudgetList] = useState([])
  const [incomeList, setIncomeList] = useState([])
  const [expensesList, setExpensesList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      getBudgetList()
    }
  }, [user])

 
  const getBudgetList = async () => {
    setIsLoading(true)
    try {
      const result = await db
        .select({
          ...getTableColumns(Budgets),
          totalSpend: sql`sum(${Expenses.amount})`.mapWith(Number),
          totalItem: sql`count(${Expenses.id})`.mapWith(Number),
        })
        .from(Budgets)
        .leftJoin(Expenses, eq(Budgets.id, Expenses.budgetId))
        .where(eq(Budgets.createdBy, user?.primaryEmailAddress?.emailAddress))
        .groupBy(Budgets.id)
        .orderBy(desc(Budgets.id))

      setBudgetList(result)
      await Promise.all([getAllExpenses(), getIncomeList()])
    } catch (error) {
      console.error("Error fetching budget list:", error)
    } finally {
      setIsLoading(false)
    }
  }

  
  const getIncomeList = async () => {
    try {
      const result = await db
        .select({
          ...getTableColumns(Incomes),
          totalAmount: sql`SUM(CAST(${Incomes.amount} AS NUMERIC))`.mapWith(Number),
        })
        .from(Incomes)
        .groupBy(Incomes.id)

      setIncomeList(result)
    } catch (error) {
      console.error("Error fetching income list:", error)
    }
  }

 
  const getAllExpenses = async () => {
    try {
      const result = await db
        .select({
          id: Expenses.id,
          name: Expenses.name,
          amount: Expenses.amount,
          createdAt: Expenses.createdAt,
        })
        .from(Budgets)
        .rightJoin(Expenses, eq(Budgets.id, Expenses.budgetId))
        .where(eq(Budgets.createdBy, user?.primaryEmailAddress.emailAddress))
        .orderBy(desc(Expenses.id))

      setExpensesList(result)
    } catch (error) {
      console.error("Error fetching expenses:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="mb-4 md:mb-0">
            <h2 className="font-bold text-3xl md:text-4xl text-gray-800 mb-2 flex items-center gap-2">
              Hi, {user?.fullName || "User"}
              <span className="animate-wave inline-block">👋</span>
            </h2>
            <p className="text-gray-500 text-sm md:text-base">
              Here's what's happening with your money. Let's manage your expenses wisely!
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => getBudgetList()}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
            <div className="relative">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>

        
        <CardInfo budgetList={budgetList} incomeList={incomeList} />

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
              <h3 className="font-semibold text-lg text-gray-800 mb-4">Budget Overview</h3>
              <BarChartDashboard budgetList={budgetList} />
            </div>

          
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-800">Recent Expenses</h3>
                <span className="text-xs font-medium px-2.5 py-1 bg-green-50 text-green-600 rounded-full">
                  {expensesList.length} transactions
                </span>
              </div>
              <ExpenseListTable expensesList={expensesList} refreshData={() => getBudgetList()} />
            </div>
          </div>

         
          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-gray-800">Latest Budgets</h3>
              <a href="/budgets" className="text-indigo-600 text-sm hover:underline flex items-center gap-1">
                View all
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                
                Array(4)
                  .fill()
                  .map((_, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[120px] animate-pulse"
                    >
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="flex justify-between items-end">
                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))
              ) : budgetList?.length > 0 ? (
                budgetList.slice(0, 4).map((budget, index) => <BudgetItem budget={budget} key={index} />)
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                  <p className="text-gray-500">No budgets found</p>
                  <a href="/budgets/new" className="mt-2 inline-block text-indigo-600 hover:underline">
                    Create your first budget
                  </a>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-indigo-50 rounded-xl p-5 mt-6">
              <h3 className="font-semibold text-lg text-indigo-800 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="dashboard/budgets"
                  className="bg-white rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mx-auto mb-1 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">New Budget</span>
                </a>
                <a
                  href="dashboard/expenses"
                  className="bg-white rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mx-auto mb-1 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Add Expense</span>
                </a>
                <a
                  href="dashboard/incomes"
                  className="bg-white rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mx-auto mb-1 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Add Income</span>
                </a>
                <a
                  href="/reports"
                  className="bg-white rounded-lg p-3 text-center shadow-sm hover:shadow-md transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mx-auto mb-1 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Reports</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


const style = document.createElement("style")
style.textContent = `
  @keyframes wave {
    0% { transform: rotate(0deg); }
    20% { transform: rotate(14deg); }
    40% { transform: rotate(-8deg); }
    60% { transform: rotate(14deg); }
    80% { transform: rotate(-4deg); }
    100% { transform: rotate(0deg); }
  }
  .animate-wave {
    animation: wave 1.5s ease-in-out infinite;
    transform-origin: 70% 70%;
  }
`
document.head.appendChild(style)

export default Dashboard
