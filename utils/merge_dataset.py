import os
import pandas as pd
import numpy as np

folder_path = './assets/data set/TCS'

csv_files = [f for f in os.listdir(folder_path) if f.endswith('.csv')]


merged_df = pd.concat([pd.read_csv(os.path.join(folder_path, f)) for f in csv_files], ignore_index=True)

merged_df.to_csv('./assets/merged_dataset/TCS_merged.csv', index=False)

print(f"Merged {len(csv_files)} CSV files into 'merged_output.csv'")