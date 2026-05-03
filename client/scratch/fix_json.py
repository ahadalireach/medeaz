import json
import os

def fix_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Try to find the last occurrence of the notification block mess
    # and replace it with a clean closure.
    # The mess is usually } \n }
    # A safer way: just fix the content manually if it's small enough
    # or use json.loads to find where it breaks.
    
    # Simple fix based on what we saw:
    content = content.replace('}\n}\n  }', '    }\n  }\n}')
    content = content.replace('}\r\n}\r\n  }', '    }\r\n  }\r\n}')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

en_path = r'd:\medeaz\medeaz\client\messages\en.json'
ur_path = r'd:\medeaz\medeaz\client\messages\ur.json'

if os.path.exists(en_path):
    fix_json(en_path)
    print(f"Fixed {en_path}")
if os.path.exists(ur_path):
    fix_json(ur_path)
    print(f"Fixed {ur_path}")
