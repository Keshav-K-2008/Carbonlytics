import json

log_path = '/home/keshav/.gemini/antigravity-ide/brain/8479d57a-c2cd-4dba-9412-f8f98a154aa3/.system_generated/logs/transcript.jsonl'

with open(log_path, 'r') as f:
    lines = f.readlines()
    print(f"Total lines: {len(lines)}")
    # Find all steps of type BROWSER_SUBAGENT
    for line in lines:
        try:
            data = json.loads(line)
            if data.get('type') == 'BROWSER_SUBAGENT':
                print(f"Step {data.get('step_index')}: BROWSER_SUBAGENT (status: {data.get('status')})")
                print("Content:")
                content = data.get('content', '')
                for l in content.split('\n')[:25]:
                    print("  ", l)
        except Exception as e:
            pass
