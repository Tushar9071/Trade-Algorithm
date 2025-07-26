import pandas as pd

def detect_hammer(df):
    """
    Detects the Hammer candlestick pattern in a pandas DataFrame.

    The function looks for a candle with a small body, a long lower wick that is
    at least twice the size of the body, and a short upper wick. It also
    checks for a preceding downtrend.

    Args:
        df (pd.DataFrame): A DataFrame with 'open', 'high', 'low', 'close' columns.

    Returns:
        pd.Series: A boolean Series where True indicates a Hammer pattern.
    """
    # Ensure the required columns exist
    required_columns = ['open', 'high', 'low', 'close']
    if not all(col in df.columns for col in required_columns):
        raise ValueError("DataFrame must contain 'open', 'high', 'low', 'close' columns.")

    # 1. Simple check for a preceding downtrend
    # We check if the average of the last 3 closing prices was downwards.
    downtrend = df['close'].shift(1).rolling(window=3).mean() > df['close'].shift(1)

    # 2. Calculate body size
    body_size = abs(df['close'] - df['open'])

    # 3. Calculate lower wick size
    lower_wick = df[['open', 'close']].min(axis=1) - df['low']

    # 4. Calculate upper wick size
    upper_wick = df['high'] - df[['open', 'close']].max(axis=1)

    # 5. Apply the Hammer pattern rules
    # - Body must not be zero (to avoid Dojis)
    # - Lower wick must be at least 2x the body size
    # - Upper wick must be smaller than the body size
    is_hammer = (
        (body_size > 0.0001) &
        (lower_wick >= 2 * body_size) &
        (upper_wick < body_size) &
        downtrend
    )

    return is_hammer

# --- Example Usage ---
if __name__ == '__main__':
    # Create a sample DataFrame with a Hammer pattern
    # The Hammer is at index 3
    data = {
        'open':  [105, 103, 102, 100, 101.5],
        'high':  [106, 104, 103, 101, 103],
        'low':   [102, 102, 101, 96,  101],
        'close': [103, 102, 101, 100.5, 102.5]
    }
    sample_df = pd.DataFrame(data)

    # Detect the Hammer pattern
    hammer_signals = detect_hammer(sample_df)

    print("Sample Data:")
    print(sample_df)
    print("\nHammer Detected:")
    print(hammer_signals)

    # You can get the actual rows where the pattern was detected
    print("\nDetected Hammer Candle(s):")
    print(sample_df[hammer_signals])