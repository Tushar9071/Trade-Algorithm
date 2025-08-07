def is_evening_star(candle1, candle2, candle3, body_ratio=0.3):
   
    def body_info(c):
        body = abs(c['close'] - c['open'])
        direction = 'bullish' if c['close'] > c['open'] else 'bearish'
        return body, direction

    body1, dir1 = body_info(candle1)
    body2, dir2 = body_info(candle2)
    body3, dir3 = body_info(candle3)


    # print(body1)
    # print(body2)
    # print(body3)

    if dir1 != 'bullish':
        return False

    if body2 >= body1 * body_ratio:
        return False

    if dir3 != 'bearish':
        return False
    if candle3['close'] > (candle1['open'] + candle1['close']) / 2:
        return False

    return True
