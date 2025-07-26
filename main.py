import pandas as pd
from patterns.dragonfly_doji import is_dragonfly_doji
from patterns.evening_star import is_evening_star

print("\n=== Test Case 2: Actual Dragonfly Doji ===")
open_price2 = 95
high_price2 = 100
low_price2 = 90.0
close_price2 = 97

result = is_dragonfly_doji(open_price2, high_price2, low_price2, close_price2)

# print(result)



df = pd.read_csv("./assets/merged_dataset/TCS_merged.csv")

# print(df.info())

# Convert candles into dicts and apply rolling window
patterns = []
for i in range(2, len(df)):
    c1 = df.iloc[i-2]
    c2 = df.iloc[i-1]
    c3 = df.iloc[i]
    
    candle1 = {'open': c1.open, 'high': c1.high, 'low': c1.low, 'close': c1.close}
    candle2 = {'open': c2.open, 'high': c2.high, 'low': c2.low, 'close': c2.close}
    candle3 = {'open': c3.open, 'high': c3.high, 'low': c3.low, 'close': c3.close}
    
    if is_evening_star(candle1, candle2, candle3):
        patterns.append(True)
    else:
        patterns.append(False)

# Add to DataFrame (shift by 2 to align with 3rd candle)
df['evening_star'] = [False, False] + patterns

# Find all rows where the pattern is detected
evening_star_rows = df[df['evening_star'] == True]

# Display the rows
print(evening_star_rows)
