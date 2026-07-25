import json

log_path = r"C:\Users\sansm\.gemini\antigravity-ide\brain\3f739210-299d-484f-8f1d-b3b9c5f817d5\.system_generated\logs\transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if "TC-PROD-01" in line:
            print(f"Line {idx} matches!")
            data = json.loads(line)
            # print keys
            print(data.keys())
            # print part of the matching data
            # let's see where it matches
            s = json.dumps(data)
            pos = s.find("TC-PROD-01")
            print(s[pos-200:pos+500])
