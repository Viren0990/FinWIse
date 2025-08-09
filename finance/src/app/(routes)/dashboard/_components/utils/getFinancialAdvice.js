import axios from "axios"

const getFinancialAdvice = async (totalBudget, totalIncome, totalSpend) => {
  console.log("Budget:", totalBudget, "Income:", totalIncome, "Spend:", totalSpend)

  try {
    const userPrompt = `Financial Data:
- Total Budget: ₹${totalBudget}
- Expenses: ₹${totalSpend}
- Income: ₹${totalIncome}

Provide a short financial advice in a 4-sentence paragraph to help the user manage their finances better in India. Make it personalized and easy to understand.`

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo", // or any available model like 'mistralai/mixtral-8x7b'
        messages: [{ role: "user", content: userPrompt }],
      },
      {
        headers: {
          Authorization: `Bearer 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`, // store in env instead of hardcoding
          "Content-Type": "application/json",
          "HTTP-Referer": "https://your-domain.com", // replace with actual domain or localhost
          "X-Title": "Stock Prediction Financial Advice",
        },
      }
    )

    const advice = response.data.choices[0].message.content
    console.log("Advice:", advice)
    return advice
  } catch (error) {
    console.error("Error fetching financial advice from OpenRouter:", error.response?.data || error.message)
    return "Sorry, couldn't fetch financial advice. Try again later."
  }
}

export default getFinancialAdvice
