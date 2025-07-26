def is_dragonfly_doji(open_price, high_price, low_price, close_price, body_ratio=0.05):
    if high_price <= low_price:
        return False  
    full_candle = high_price - low_price
    
    candle_body = abs(open_price - close_price)
    body_percentage = (candle_body * 100) / full_candle

    # print(f"Full Candle: {full_candle}, Candle Body: {candle_body}, Body Percentage: {body_percentage}%")
    return (body_percentage / 100) <= body_ratio
