import json

log_path = '/home/keshav/.gemini/antigravity-ide/brain/8479d57a-c2cd-4dba-9412-f8f98a154aa3/.system_generated/logs/transcript.jsonl'

with open(log_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('step_index') in [113, 114, 115, 116]:
                print(f"=== Step {data.get('step_index')} ===")
                print(json.dumps(data, indent=2))
        except Exception as e:
            pass
