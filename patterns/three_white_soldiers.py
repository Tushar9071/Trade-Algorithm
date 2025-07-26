def is_three_white_soldiers(c1, c2, c3, min_body_ratio=0.5, max_shadow_ratio=0.3):
    def is_bullish(candle):
        return candle['close'] > candle['open']

    def get_body_size(candle):
        return abs(candle['close'] - candle['open'])

    def get_range(candle):
        return candle['high'] - candle['low']

    def has_valid_shadows(candle):
        body = get_body_size(candle)
        upper_shadow = candle['high'] - max(candle['open'], candle['close'])
        lower_shadow = min(candle['open'], candle['close']) - candle['low']
        return (
            upper_shadow <= max_shadow_ratio * body and
            lower_shadow <= max_shadow_ratio * body
        )

    if not all(is_bullish(c) for c in (c1, c2, c3)):
        return False

    if not (c2['open'] >= c1['open'] and c2['open'] <= c1['close'] and c2['close'] > c1['close']):
        return False
    if not (c3['open'] >= c2['open'] and c3['open'] <= c2['close'] and c3['close'] > c2['close']):
        return False

    for candle in (c1, c2, c3):
        candle_range = get_range(candle)
        if candle_range == 0:
            return False
        if (get_body_size(candle) / candle_range) < min_body_ratio:
            return False
        if not has_valid_shadows(candle):
            return False

    return True
