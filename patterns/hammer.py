def is_hammer(open_price, high_price, low_price, close_price, lower_wick_ratio=2.0):
    
    body_size = abs(open_price - close_price)

    if body_size == 0:
        return False

    upper_wick = high_price - max(open_price, close_price)
    lower_wick = min(open_price, close_price) - low_price
    
    is_long_lower_wick = lower_wick >= lower_wick_ratio * body_size
    is_short_upper_wick = upper_wick < body_size
    
    return is_long_lower_wick and is_short_upper_wick