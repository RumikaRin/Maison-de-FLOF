import json

log_path = r"C:\Users\sansm\.gemini\antigravity-ide\brain\3f739210-299d-484f-8f1d-b3b9c5f817d5\.system_generated\logs\transcript.jsonl"

with open(log_path, "r", encoding="utf-8") as f:
    for idx, line in enumerate(f):
        if idx < 180:
            if "BaoCao_FLOF_Full" in line:
                try:
                    data = json.loads(line)
                    print(f"Step {idx}: type={data.get('type')}, keys={list(data.keys())}")
                    tool_calls = data.get("tool_calls")
                    if tool_calls:
                        for tc in tool_calls:
                            args = tc.get("args", {})
                            if isinstance(args, str):
                                try:
                                    args = json.loads(args)
                                except:
                                    pass
                            if isinstance(args, dict):
                                tfile = args.get("TargetFile") or args.get("AbsolutePath")
                                print(f"  Tool {tc.get('name')}: TargetFile={tfile}, code_len={len(args.get('CodeContent') or args.get('ReplacementContent') or '')}")
                except Exception as e:
                    print(f"Error {idx}: {e}")
