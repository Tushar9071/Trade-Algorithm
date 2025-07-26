import pandas as pd
import numpy as np

df = pd.read_csv('TCS_merged.csv')

# Convert date and time to datetime
df['datetime'] = pd.to_datetime(df['date'] + ' ' + df['time'])
df = df.sort_values('datetime').reset_index(drop=True)

print(df.info())
print("\nFirst few rows:")
print(df.head())

# Candlestick Pattern Recognition Functions

def is_dragonfly_doji(row, tolerance=0.1):
    """
    Dragonfly Doji: Open and close are nearly equal at the high of the day,
    with a long lower shadow and little to no upper shadow.
    """
    body_size = abs(row['close'] - row['open'])
    total_range = row['high'] - row['low']
    upper_shadow = row['high'] - max(row['open'], row['close'])
    lower_shadow = min(row['open'], row['close']) - row['low']
    
    if total_range == 0:
        return False
    
    # Body should be small (less than tolerance% of total range)
    # Upper shadow should be very small
    # Lower shadow should be significant
    return (body_size / total_range < tolerance and 
            upper_shadow / total_range < tolerance and 
            lower_shadow / total_range > 0.6)

def is_hammer(row, tolerance=0.3):
    """
    Hammer: Small body at the upper end, long lower shadow, little to no upper shadow.
    """
    body_size = abs(row['close'] - row['open'])
    total_range = row['high'] - row['low']
    upper_shadow = row['high'] - max(row['open'], row['close'])
    lower_shadow = min(row['open'], row['close']) - row['low']
    
    if total_range == 0:
        return False
    
    # Body should be small
    # Lower shadow should be at least 2x the body size
    # Upper shadow should be small
    return (body_size / total_range < tolerance and 
            lower_shadow >= 2 * body_size and 
            upper_shadow / total_range < 0.1)

def is_rising_window(df, i):
    """
    Rising Window (Gap Up): Current candle's low is higher than previous candle's high.
    """
    if i == 0:
        return False
    
    current = df.iloc[i]
    previous = df.iloc[i-1]
    
    return current['low'] > previous['high']

def is_evening_star(df, i):
    """
    Evening Star: 3-candle pattern
    1. First candle: Large bullish candle
    2. Second candle: Small body (star) that gaps up
    3. Third candle: Large bearish candle that closes below first candle's midpoint
    """
    if i < 2:
        return False
    
    first = df.iloc[i-2]
    second = df.iloc[i-1]
    third = df.iloc[i]
    
    # First candle: bullish with good body size
    first_bullish = first['close'] > first['open']
    first_body = abs(first['close'] - first['open'])
    
    # Second candle: small body (star)
    second_body = abs(second['close'] - second['open'])
    second_gaps_up = second['low'] > first['high']
    
    # Third candle: bearish and closes below first candle's midpoint
    third_bearish = third['close'] < third['open']
    third_body = abs(third['close'] - third['open'])
    first_midpoint = (first['open'] + first['close']) / 2
    third_closes_low = third['close'] < first_midpoint
    
    return (first_bullish and first_body > 0 and
            second_body < first_body * 0.3 and second_gaps_up and
            third_bearish and third_body > 0 and third_closes_low)

def is_three_white_soldiers(df, i):
    """
    Three White Soldiers: 3 consecutive bullish candles with progressively higher closes.
    Each candle opens within the previous candle's body and closes higher.
    """
    if i < 2:
        return False
    
    first = df.iloc[i-2]
    second = df.iloc[i-1]
    third = df.iloc[i]
    
    # All three candles should be bullish
    all_bullish = (first['close'] > first['open'] and 
                   second['close'] > second['open'] and 
                   third['close'] > third['open'])
    
    # Progressive higher closes
    higher_closes = (second['close'] > first['close'] and 
                     third['close'] > second['close'])
    
    # Each candle opens within previous candle's body
    opens_in_body = (first['open'] < second['open'] < first['close'] and
                     second['open'] < third['open'] < second['close'])
    
    return all_bullish and higher_closes and opens_in_body

# Apply pattern recognition
print("\n" + "="*50)
print("CANDLESTICK PATTERN RECOGNITION")
print("="*50)

# Initialize pattern columns
df['dragonfly_doji'] = False
df['hammer'] = False
df['rising_window'] = False
df['evening_star'] = False
df['three_white_soldiers'] = False

# Detect patterns
for i in range(len(df)):
    df.loc[i, 'dragonfly_doji'] = is_dragonfly_doji(df.iloc[i])
    df.loc[i, 'hammer'] = is_hammer(df.iloc[i])
    df.loc[i, 'rising_window'] = is_rising_window(df, i)
    df.loc[i, 'evening_star'] = is_evening_star(df, i)
    df.loc[i, 'three_white_soldiers'] = is_three_white_soldiers(df, i)

# Count occurrences of each pattern
pattern_counts = {
    'Dragonfly Doji': df['dragonfly_doji'].sum(),
    'Hammer': df['hammer'].sum(),
    'Rising Window': df['rising_window'].sum(),
    'Evening Star': df['evening_star'].sum(),
    'Three White Soldiers': df['three_white_soldiers'].sum()
}

print("\nPattern Occurrences:")
for pattern, count in pattern_counts.items():
    print(f"{pattern}: {count}")

# Show examples of detected patterns
print("\n" + "="*30)
print("PATTERN EXAMPLES")
print("="*30)

for pattern_name, column_name in [
    ('Dragonfly Doji', 'dragonfly_doji'),
    ('Hammer', 'hammer'),
    ('Rising Window', 'rising_window'),
    ('Evening Star', 'evening_star'),
    ('Three White Soldiers', 'three_white_soldiers')
]:
    pattern_examples = df[df[column_name] == True]
    if len(pattern_examples) > 0:
        print(f"\n{pattern_name} - First 3 examples:")
        print(pattern_examples[['datetime', 'open', 'high', 'low', 'close', 'volume']].head(3))
    else:
        print(f"\n{pattern_name}: No patterns detected")

# Save results with patterns
output_file = 'TCS_with_patterns.csv'
df.to_csv(output_file, index=False)
print(f"\nResults saved to {output_file}")

# Show percentage of data with patterns
total_rows = len(df)
print(f"\nPattern Statistics (out of {total_rows} candles):")
for pattern, count in pattern_counts.items():
    percentage = (count / total_rows) * 100 if total_rows > 0 else 0
    print(f"{pattern}: {count} ({percentage:.2f}%)")
