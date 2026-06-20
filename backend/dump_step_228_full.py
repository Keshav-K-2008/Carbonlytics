import json

log_path = '/home/keshav/.gemini/antigravity-ide/brain/8479d57a-c2cd-4dba-9412-f8f98a154aa3/.system_generated/logs/transcript.jsonl'

with open(log_path, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('step_index') == 228:
                # Let's inspect the entire JSON of the step
                # Print all keys
                print("Keys:", data.keys())
                # Let's write the JSON to a separate file so we can view it
                with open('/home/keshav/.gemini/antigravity-ide/brain/8479d57a-c2cd-4dba-9412-f8f98a154aa3/scratch/step_228_full.json', 'w') as out:
                    out.write(json.dumps(data, indent=2))
                print("Dumped full step 228 to step_228_full.json")
        except Exception as e:
            pass
