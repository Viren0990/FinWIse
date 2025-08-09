import { NextResponse } from 'next/server'

export async function POST(req) {
  const { company, predictions } = await req.json()

  const prompt = `
You are a financial AI coach. Based on the following predicted prices for the company ${company}, provide a  investment suggestion going in detail including ideal duration (short-term/long-term) and risk level.

Predictions:
${predictions.map(p => `${p.date}: $${p.predicted_close}`).join("\n")}

Your answer should be clear and short, under 200 words.
`

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", 
        messages: [
          { role: "system", content: "You are a helpful and advanced investment advisor." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    })

    const json = await res.json()
    const advice = json.choices?.[0]?.message?.content || "Unable to generate advice."
    return NextResponse.json({ advice })
  } catch (err) {
    return NextResponse.json({ advice: "Error contacting AI coach." }, { status: 500 })
  }
}
