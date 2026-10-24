import json

with open(r'C:\Users\Admin\sekaipop\src-tauri\gen\schemas\windows-schema.json') as f:
    data = json.load(f)

def search_dict(d, target):
    for k, v in d.items():
        if k == target:
            print(f'Found {target}: {v}')
        elif isinstance(v, dict):
            search_dict(v, target)

search_dict(data, 'url')
