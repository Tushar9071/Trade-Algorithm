import pandas as pd
from patterns.dragonfly_doji import is_dragonfly_doji
from patterns.evening_star import is_evening_star
from patterns.hammer import is_hammer
from patterns.rising_window import is_rising_window
from patterns.three_white_soldiers import is_three_white_soldiers

def detect_patterns(df):
    df['dragonfly_doji'] = df.apply(
        lambda row: is_dragonfly_doji(row['open'], row['high'], row['low'], row['close']), axis=1
    )

    df['hammer'] = df.apply(
        lambda row: is_hammer(row['open'], row['high'], row['low'], row['close']), axis=1
    )

    rising_window_signals = [False]
    for i in range(1, len(df)):
        prev = df.iloc[i - 1]
        curr = df.iloc[i]
        prev_candle = {'open': prev.open, 'high': prev.high, 'low': prev.low, 'close': prev.close}
        curr_candle = {'open': curr.open, 'high': curr.high, 'low': curr.low, 'close': curr.close}
        rising_window_signals.append(is_rising_window(prev_candle, curr_candle))
    df['rising_window'] = rising_window_signals

    evening_star_signals = [False, False]
    three_white_soldiers_signals = [False, False]
    for i in range(2, len(df)):
        c1 = df.iloc[i - 2]
        c2 = df.iloc[i - 1]
        c3 = df.iloc[i]
        candle1 = {'open': c1.open, 'high': c1.high, 'low': c1.low, 'close': c1.close}
        candle2 = {'open': c2.open, 'high': c2.high, 'low': c2.low, 'close': c2.close}
        candle3 = {'open': c3.open, 'high': c3.high, 'low': c3.low, 'close': c3.close}
        evening_star_signals.append(is_evening_star(candle1, candle2, candle3))
        three_white_soldiers_signals.append(is_three_white_soldiers(candle1, candle2, candle3))

    df['evening_star'] = evening_star_signals
    df['three_white_soldiers'] = three_white_soldiers_signals

    return df
