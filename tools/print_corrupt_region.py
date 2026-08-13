with open(r"c:\Users\sansm\Downloads\BaoCao_FLOF_Full.md", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines, 1):
    if 1490 <= idx <= 1560:
        print(f"{idx}: {repr(line)}")
