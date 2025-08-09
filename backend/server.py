from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Literal, Optional
from dotenv import load_dotenv
import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from keras.models import load_model
from datetime import datetime, timedelta
import httpx
from bs4 import BeautifulSoup
import os
import traceback

# Load env
load_dotenv()

app = FastAPI()

#CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Loading model
MODEL_PATH = "stock_predictionn_model.h5"
try:
    model = load_model(MODEL_PATH)
    print("✅ Model loaded successfully")
except Exception as e:
    print(traceback.format_exc())
    raise RuntimeError(f"❌ Error loading model: {str(e)}")

# mapping
company_dict = {
    "apple": "AAPL", "google": "GOOG", "alphabet": "GOOG", "microsoft": "MSFT", "amazon": "AMZN",
    "meta": "META", "facebook": "META", "tesla": "TSLA", "netflix": "NFLX", "nvidia": "NVDA",
    "intel": "INTC", "amd": "AMD", "tata motors": "TATAMOTORS.NS", "reliance": "RELIANCE.NS",
    "infosys": "INFY.NS", "hdfc bank": "HDFCBANK.NS", "icici bank": "ICICIBANK.NS",
    "state bank of india": "SBIN.NS", "l&t": "LT.NS", "bharti airtel": "BHARTIARTL.NS",
    "asian paints": "ASIANPAINT.NS", "tcs": "TCS.NS", "wipro": "WIPRO.NS", "axis bank": "AXISBANK.NS",
    "hindustan unilever": "HINDUNILVR.NS", "itc": "ITC.NS", "maruti": "MARUTI.NS", "hcl": "HCLTECH.NS"
}


@app.get("/")
async def root():
    return {"message": "Stock Prediction API is running 🚀"}

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/predict")
async def predict(company: str):
    company = company.lower()
    ticker = company_dict.get(company)

    print(f"🔍 Company input: {company}, resolved ticker: {ticker}")

    if not ticker:
        raise HTTPException(status_code=404, detail="Company not found.")

    try:
       
        df = yf.download(ticker, start='2010-01-01', end=datetime.today().strftime('%Y-%m-%d'))
        if df.empty:
            df = yf.download(ticker, period="1y")
            if df.empty:
                raise HTTPException(status_code=404, detail="Stock data not found.")

        df = df[['Close']]
        

        if len(df) < 100:
            raise HTTPException(status_code=400, detail="Not enough data to predict (need 100+ records).")

        # Scale data
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(df)
       

        # Prepare input
        test_data = scaled_data[-100:]
        x_input = np.array(test_data).reshape(1, 100, 1)
       

        # Predict future
        lst_output = []
        n_steps = 30
        for _ in range(n_steps):
            yhat = model.predict(x_input, verbose=0)
            lst_output.append(yhat[0][0])
            x_input = np.append(x_input[:, 1:, :], [[[yhat[0][0]]]], axis=1)
       

        # Inverse transform
        predicted_prices = scaler.inverse_transform(np.array(lst_output).reshape(-1, 1))
        

        # Build date-wise predictions
        future_dates = pd.date_range(start=df.index[-1] + timedelta(days=1), periods=n_steps)
        predictions = [
            {"date": str(date.date()), "predicted_close": round(float(price), 2)}
            for date, price in zip(future_dates, predicted_prices.flatten())
        ]

        return {"company": ticker, "predictions": predictions}

    except HTTPException:
        raise
    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
# AI Advice Endpoint

class Prediction(BaseModel):
    date: str
    predicted_close: float

class AIAdviceRequest(BaseModel):
    company: str
    predictions: List[Prediction]

@app.post("/ai-advice")
async def get_ai_advice(request: AIAdviceRequest):
    prompt = f"Based on the following 30-day predicted stock prices for {request.company}, suggest how long someone should invest in it to make a reasonable profit. Be concise and realistic.\n\n"
    for p in request.predictions:
        prompt += f"{p.date}: ${p.predicted_close}\n"

    headers = {
        "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "StockAdvisor"
    }

    payload = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}]
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)

        if response.status_code != 200:
            return {"error": f"API call failed with status {response.status_code}"}

        result = response.json()
        advice = result.get("choices", [{}])[0].get("message", {}).get("content", "No advice available.")

        return {"advice": advice}

    except Exception as e:
        print(traceback.format_exc())
        return {"error": f"OpenRouter request failed: {str(e)}"}


# GPay Transactions Parser 

@app.post("/gpay-transactions")
async def parse_gpay_transactions(
    file: UploadFile = File(...),
    filter: Literal["all", "sent", "received"] = Form("all"),
    limit: Optional[int] = Form(120)
):
    try:
        contents = await file.read()
        soup = BeautifulSoup(contents, "html.parser")

        transactions = []
        entries = soup.find_all("div", class_="outer-cell mdl-cell mdl-cell--12-col mdl-shadow--2dp")
        print(f"🔍 Found {len(entries)} total entries")

        for entry in entries:
            title = entry.find("p", class_="mdl-typography--title")
            if not title or "Google Pay" not in title.text:
                continue

            body = entry.find("div", class_="content-cell mdl-cell mdl-cell--6-col mdl-typography--body-1")
            if not body:
                continue

            line = body.get_text(separator="\n").strip().split("\n")
            if len(line) < 2:
                continue

            description, datetime_str = line[0], line[1]
            if "2025" not in datetime_str:
                continue

            txn_type = "sent" if "Paid" in description or "Sent" in description else (
                "received" if "received" in description.lower() or "got" in description.lower() else "other"
            )

            transactions.append({
                "description": description,
                "datetime": datetime_str,
                "type": txn_type
            })

        print(f"Returning {len(transactions)} transactions")
        return JSONResponse(content={"transactions": transactions})

    except Exception as e:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Transaction parsing failed: {str(e)}")
