import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

timeframes = ['1m', '5m', '15m', '30m', '60m']

@app.get("/")
def root():
    return {"message": "Candlestick Pattern API is running. Use /{pattern}/{timeframe} e.g. /hammer/5m"}

def read_pattern_from_csv(pattern: str, tf: str):
    if tf not in timeframes:
        return {"error": f"Invalid timeframe: {tf}. Use one of {timeframes}"}
    
    try:
        df = pd.read_csv(f"output_patterns_{tf}.csv")
        if pattern not in df.columns:
            return {"error": f"Pattern '{pattern}' not found in CSV columns"}
        return df[df[pattern] == True].to_dict(orient='records')
    except FileNotFoundError:
        return {"error": f"CSV for {tf} not found"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/{pattern}/{tf}")
def get_pattern(pattern: str, tf: str):
    return read_pattern_from_csv(pattern, tf)


# import pandas as pd
# df = pd.read_csv('output_patterns_1m.csv')

# print(df)