with open(r"c:\Users\sansm\Downloads\BaoCao_FLOF_Full.md", "r", encoding="utf-8") as f:
    for idx, line in enumerate(f, 1):
        if "## 4.6." in line or "## 4.7." in line:
            print(f"{idx}: {line.strip()}")
