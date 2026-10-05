import json

with open('scripts/catalog_models_44.json', 'r', encoding='utf-8') as f:
    models = json.load(f)

g_idx = 1
sg_idx = 1
for m in models:
    if m['category'] == 'Glasses':
        pid = f"CH-G-{g_idx:03d}"
        g_idx += 1
    else:
        pid = f"CH-SG-{sg_idx:03d}"
        sg_idx += 1
    v_str = ', '.join([f"{v['color']} ({len(v['images'])} imgs)" for v in m['variants']])
    groups_str = ','.join(m['sourceGroups'])
    print(f"[{pid}] {m['name']} | Cat: {m['category']} | Shape: {m['shape']} | Groups: {groups_str} | Variants ({len(m['variants'])}): {v_str}")
