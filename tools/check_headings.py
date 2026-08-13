import re

with open(r"c:\Users\sansm\Downloads\BaoCao_FLOF_Full.md", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines, 1):
    if line.startswith("#"):
        print(f"{idx}: {line.strip()}")
