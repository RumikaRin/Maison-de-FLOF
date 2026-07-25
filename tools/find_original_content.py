import json

log_path = r"C:\Users\sansm\.gemini\antigravity-ide\brain\3f739210-299d-484f-8f1d-b3b9c5f817d5\.system_generated\logs\transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            # check if it references the file
            content_str = str(data.get("content", ""))
            tool_calls = str(data.get("tool_calls", ""))
            output = str(data.get("output", ""))
            
            # Print steps that contain "replace_file_content" or "write_to_file" or "BaoCao_FLOF_Full"
            if "BaoCao_FLOF_Full" in content_str or "BaoCao_FLOF_Full" in tool_calls or "BaoCao_FLOF_Full" in output:
                print(f"Line {idx}: type={data.get('type')}, status={data.get('status')}")
        except Exception as e:
            print(f"Error at line {idx}: {e}")
