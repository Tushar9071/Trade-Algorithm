from patterns.dragonfly_doji import is_dragonfly_doji
open_price = 100.0
high_price = 105
low_price = 95.0
close_price = 99

result = is_dragonfly_doji(open_price, high_price, low_price, close_price)
print(f"Is the candle a Dragonfly Doji? {result}")