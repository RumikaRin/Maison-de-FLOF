import json

log_path = r"C:\Users\sansm\.gemini\antigravity-ide\brain\3f739210-299d-484f-8f1d-b3b9c5f817d5\.system_generated\logs\transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if 620 <= idx <= 645:
            try:
                data = json.loads(line)
                print(f"--- STEP {idx} ---")
                print(f"type: {data.get('type')}")
                print(f"tool_calls: {json.dumps(data.get('tool_calls'))[:300]}")
                print(f"output: {str(data.get('output'))[:300]}")
            except Exception as e:
                print(f"Error {idx}: {e}")
