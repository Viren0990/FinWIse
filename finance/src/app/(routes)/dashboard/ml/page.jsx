"use client"

import { useState, useRef } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const USD_TO_INR = 82 

export default function StockPrediction() {
  const [company, setCompany] = useState("")
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [aiSuggestion, setAiSuggestion] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const pdfRef = useRef(null)

  const handleExport = async () => {
    if (!pdfRef.current) return

    const html2pdf = (await import("html2pdf.js")).default

    const opt = {
      margin: 0.5,
      filename: `${company.toUpperCase()}_Stock_Report.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    }

    html2pdf().set(opt).from(pdfRef.current).save()
  }

  const fetchPredictions = async () => {
    const trimmedCompany = company.trim()
    if (!trimmedCompany) {
      setError("Please enter a valid company name.")
      return
    }

    setLoading(true)
    setError("")
    setPredictions([])

    try {
      const res = await fetch(`http://localhost:8000/predict?company=${trimmedCompany}`)
      if (!res.ok) throw new Error("Company not found or server error.")

      const data = await res.json()
      if (!Array.isArray(data.predictions)) throw new Error("Invalid data format from API.")

      setPredictions(data.predictions)
    } catch (err) {
      setError(err.message || "Something went wrong!")
      setPredictions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAISuggestion = async () => {
    setAiLoading(true)
    setAiSuggestion("")

    try {
      const res = await fetch("/api/ai-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.toUpperCase(),
          predictions,
        }),
      })

      if (!res.ok) throw new Error("Failed to fetch suggestion")

      const data = await res.json()
      setAiSuggestion(data.advice)
    } catch (err) {
      setAiSuggestion("Unable to retrieve AI insights at this time.")
    } finally {
      setAiLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const rupeeValue = payload[0].value * USD_TO_INR
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-emerald-600">₹{rupeeValue.toFixed(2)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-2">Financial Market Prediction</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Enter a company ticker symbol to see future price forecasts
        </p>
      </div>

      <div className="max-w-md mx-auto mb-12 bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter ticker (e.g., AAPL, MSFT)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchPredictions()}
            />
          </div>
          <button
            onClick={fetchPredictions}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-all ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Analyzing..." : "Predict"}
          </button>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-8 max-w-5xl mx-auto animate-pulse">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center" />
          </div>
        </div>
      ) : predictions.length > 0 ? (
        <div className="space-y-8 max-w-5xl mx-auto">
          <div ref={pdfRef} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Price Forecast for {company.toUpperCase()}</h2>
              <p className="text-gray-600 mb-6">
                Predicted stock price movement over the next {predictions.length} days
              </p>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={predictions.map((pred) => ({
                      date: pred.date,
                      predicted_close:
                        typeof pred.predicted_close === "number"
                          ? pred.predicted_close * USD_TO_INR
                          : 0,
                    }))}
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#E5E7EB" }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="predicted_close"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "#059669" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Detailed Predictions</h2>
              <p className="text-gray-600 mb-6">Day-by-day price forecast data</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Predicted Price (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {predictions.map((pred, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pred.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                          {typeof pred.predicted_close === "number"
                            ? `₹${(pred.predicted_close * USD_TO_INR).toFixed(2)}`
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* AI Recommendation Section */}
      {predictions.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">AI Coach Recommendation</h2>
          <p className="text-gray-600 mb-4">Get a personalized investment insight based on prediction data</p>
          <button
            onClick={fetchAISuggestion}
            disabled={aiLoading}
            className={`mb-4 px-5 py-2 rounded-md text-white font-medium ${
              aiLoading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {aiLoading ? "Analyzing..." : "Get AI Recommendation"}
          </button>

          {aiSuggestion && (
            <>
              <div className="mt-2 p-4 border border-indigo-100 bg-indigo-50 rounded-md text-indigo-800 whitespace-pre-line">
                {aiSuggestion}
              </div>
              <button
                onClick={handleExport}
                className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
              >
                Download Report
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
