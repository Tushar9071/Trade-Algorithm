def is_hammer(open_price, high_price, low_price, close_price, lower_wick_ratio=2.0):
    """
    Checks if a single candle has the shape of a Hammer pattern.

    A Hammer has a small body, a long lower wick, and a very short upper wick.
    """
    # Calculate the size of the candle's body
    body_size = abs(open_price - close_price)

    # A Hammer must have a body
    if body_size == 0:
        return False

    # Calculate the size of the upper and lower wicks
    upper_wick = high_price - max(open_price, close_price)
    lower_wick = min(open_price, close_price) - low_price
    
    # Check if the lower wick is at least twice the body size
    is_long_lower_wick = lower_wick >= lower_wick_ratio * body_size
    # Check if the upper wick is smaller than the body
    is_short_upper_wick = upper_wick < body_size
    
    return is_long_lower_wick and is_short_upper_wick