def is_rising_window(prev_candle, curr_candle):
    
    return curr_candle['low'] > prev_candle['high']