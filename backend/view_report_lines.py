import json

log_path = '/home/keshav/.gemini/antigravity-ide/brain/8479d57a-c2cd-4dba-9412-f8f98a154aa3/.system_generated/logs/transcript.jsonl'

with open(log_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('step_index') == 176:
                content = data.get('content', '')
                lines = content.split('\n')
                print(f"Total lines in content: {len(lines)}")
                for i in range(min(50, len(lines))):
                    print(f"{i}: {lines[i]}")
        except Exception as e:
            pass
