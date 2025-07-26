from patterns.dragonfly_doji import is_dragonfly_doji
from patterns.hammer import is_hammer

print("\n=== Test Case 2: Actual Dragonfly Doji ===")
open_price2 = 95
high_price2 = 100
low_price2 = 90.0
close_price2 = 97

result = is_dragonfly_doji(open_price2, high_price2, low_price2, close_price2)
result = is_hammer(open_price2, high_price2, low_price2, close_price2)

print(result)