"use client"

import { useState } from "react"
import { Upload, FileText, Filter, TrendingUp, TrendingDown, Clock, CheckCircle } from "lucide-react"

export default function Home() {
  const [file, setFile] = useState(null)
  const [filter, setFilter] = useState("all")
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return alert("Please upload a file.")

    setLoading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("filter", filter)
    formData.append("limit", "120")

    try {
      const res = await fetch("http://127.0.0.1:8000/gpay-transactions", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (err) {
      console.error("Error uploading file:", err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = filter === "all" ? transactions : transactions.filter((txn) => txn.type === filter)

  const getTransactionIcon = (type) => {
    switch (type) {
      case "sent":
        return <TrendingUp className="w-5 h-5 text-red-500" />
      case "received":
        return <TrendingDown className="w-5 h-5 text-green-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case "sent":
        return "bg-red-50 border-red-200 text-red-800"
      case "received":
        return "bg-green-50 border-green-200 text-green-800"
      default:
        return "bg-gray-50 border-gray-200 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        <div className="text-center mb-12">
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            GPay Tracker
          </h1>
          <p className="text-gray-600 text-lg">Upload your GOOGLE TAKEOUT file to analyze your transaction history</p>
        </div>

        
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
           
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Upload HTML File</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".html"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{file ? file.name : "Click to upload or drag and drop"}</p>
                    <p className="text-xs text-gray-400 mt-1">HTML files only</p>
                  </div>
                </label>
              </div>
            </div>

           
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Transaction Filter</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 bg-white"
                >
                  <option value="all">All Transactions</option>
                  <option value="sent">Sent Only</option>
                  <option value="received">Received Only</option>
                </select>
              </div>
            </div>

           
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Upload and Parse</span>
                </>
              )}
            </button>
          </form>
        </div>

       
        {transactions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 rounded-full">
                <span className="text-sm font-semibold text-gray-700">{filteredTransactions.length} transactions</span>
              </div>
            </div>

           
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center space-x-3">
                  <TrendingDown className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Received</p>
                    <p className="text-xl font-bold text-green-800">
                      {transactions.filter((t) => t.type === "received").length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="text-sm text-red-600 font-medium">Sent</p>
                    <p className="text-xl font-bold text-red-800">
                      {transactions.filter((t) => t.type === "sent").length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total</p>
                    <p className="text-xl font-bold text-blue-800">{transactions.length}</p>
                  </div>
                </div>
              </div>
            </div>

           
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredTransactions.map((txn, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${getTransactionColor(txn.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="mt-1">{getTransactionIcon(txn.type)}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-2 leading-relaxed">{txn.description}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{txn.datetime}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          txn.type === "sent"
                            ? "bg-red-200 text-red-800"
                            : txn.type === "received"
                              ? "bg-green-200 text-green-800"
                              : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {txn.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

       
        {transactions.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Upload an HTML file to see your transactions here</p>
          </div>
        )}
      </div>
    </div>
  )
}
