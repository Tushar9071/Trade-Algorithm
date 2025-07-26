def is_dragonfly_doji(open_price, high_price, low_price, close_price, tolerance=0.05):
    # Candle total range
    candle_range = high_price - low_price
    if candle_range == 0:
        return False  # Prevent divide by zero

    # Check if open ≈ close ≈ high (within tolerance)
    oc_diff = abs(open_price - close_price)
    oh_diff = abs(open_price - high_price)
    ch_diff = abs(close_price - high_price)

    # For dragonfly doji, open and close should be near the high
    max_oc = max(open_price, close_price)
    min_oc = min(open_price, close_price)
    
    # Body should be small relative to total range
    body_size = abs(open_price - close_price)
    body_condition = body_size <= tolerance * candle_range
    
    # Open and close should be near the high (upper shadow should be small)
    upper_shadow = high_price - max_oc
    upper_shadow_condition = upper_shadow <= tolerance * candle_range
    
    # Long lower shadow condition
    lower_shadow = min_oc - low_price
    lower_shadow_condition = lower_shadow >= 0.6 * candle_range  # At least 60% of total range

    return body_condition and upper_shadow_condition and lower_shadow_condition
