import json

log_path = '/home/keshav/.gemini/antigravity-ide/brain/8479d57a-c2cd-4dba-9412-f8f98a154aa3/.system_generated/logs/transcript.jsonl'

with open(log_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('step_index') == 228:
                with open('/home/keshav/.gemini/antigravity-ide/brain/8479d57a-c2cd-4dba-9412-f8f98a154aa3/scratch/sqlite_testing_report.txt', 'w') as out:
                    out.write(json.dumps(data, indent=2))
                print("Dumped step 228 successfully.")
        except Exception as e:
            pass
