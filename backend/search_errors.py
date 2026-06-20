import json

log_path = '/home/keshav/.gemini/antigravity-ide/brain/8479d57a-c2cd-4dba-9412-f8f98a154aa3/.system_generated/logs/transcript.jsonl'

with open(log_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = str(data)
            if '[error]' in content:
                print(f"Step {data.get('step_index')}:")
                lines = content.split('\\n')
                for i, l in enumerate(lines):
                    if '[error]' in l:
                        # Print matching line and next 3 lines
                        for j in range(max(0, i-1), min(len(lines), i+10)):
                            print(f"  {j}: {lines[j][:250]}")
        except Exception as e:
            pass
