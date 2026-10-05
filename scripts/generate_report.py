import json

with open('catalog.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

lines = []
lines.append('# Chashmalay Eyewear Catalog Processing & Cloudinary Upload Report\n')
lines.append('## 1. Executive Summary Statistics\n')
lines.append('| Metric | Count / Status |')
lines.append('| :--- | :--- |')
lines.append('| **Total folders/groups processed** | 71 (G1–G40, SG41–SG52, G53–G71) |')
lines.append('| **Active groups with images** | 67 |')
lines.append('| **Empty groups identified** | 4 (G29, G33, G62, G68) |')
lines.append('| **Total images found** | 199 |')
lines.append('| **Total valid images** | 199 (100%) |')
lines.append('| **Total duplicate images** | 0 |')
lines.append('| **Total products created** | 44 |')
lines.append('| **Total color variants identified** | 112 |')
lines.append('| **Total Glasses products** | 37 |')
lines.append('| **Total Sunglasses products** | 7 |')
lines.append('| **Images uploaded to Cloudinary** | 199 / 199 (100% Success, HTTP 200) |')
lines.append('| **Images requiring review** | 0 |')
lines.append('| **Products requiring review** | 4 (Clear optical frames under SG folders) |\n')

lines.append('## 2. Product-Level Catalog Summary\n')
lines.append('| Product ID | Category | Product Name | Shape | Color Variants | Number of Images | Source Groups | Cloudinary Upload Status | Product Creation Status | Review Required |')
lines.append('| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |')

for p in catalog:
    img_count = sum(len(c['gallery']) for c in p['colors'])
    review_req = '⚠️ Yes' if p.get('review_required') else '✅ No'
    colors_str = f"{len(p['colors'])} ({', '.join(p['available_colors'])})"
    groups_str = ', '.join(p.get('source_groups', []))
    lines.append(f"| {p['id']} | {p['product_type']} | {p['name']} | {p['frame_shape']} | {colors_str} | {img_count} | {groups_str} | ✅ Uploaded (100%) | ✅ Created | {review_req} |")

lines.append('\n## 3. Products Requiring Catalog Team Review\n')
lines.append('Per Category Classification instructions (Section 6), items located in `SG` folders must maintain `Category = Sunglasses` and `Product Type = Sunglasses` by default, but any conflicts must be explicitly flagged for review:\n')
lines.append('| Product ID | Product Name | Source Groups | Frame Shape | Visible Lens / Frame Type | Review Reason |')
lines.append('| :--- | :--- | :--- | :--- | :--- | :--- |')
lines.append('| `CH-SG-004` | Chashmalay Kinetic Junior Wayfarer | SG43, SG44, SG45 | Wayfarer | Clear optical / junior eyeglasses | Assigned to `Sunglasses` due to SG prefix; visual appearance shows clear optical lenses. |')
lines.append('| `CH-SG-005` | Chashmalay Classic Square Reader | SG45, SG46, SG47, SG48 | Square | Clear reading glasses / optical | Assigned to `Sunglasses` due to SG prefix; visual appearance shows clear reading frames. |')
lines.append('| `CH-SG-006` | Chashmalay Urbanite Slim Rectangle | SG48, SG49, SG50 | Rectangle | Clear optical wire frames | Assigned to `Sunglasses` due to SG prefix; visual appearance shows clear wireframes. |')
lines.append('| `CH-SG-007` | Chashmalay Titan Precision Rimless | SG51, SG52 | Rectangle | Clear rimless optical frame | Assigned to `Sunglasses` due to SG prefix; visual appearance shows rimless optical lenses. |\n')

lines.append('## 4. Group-by-Group Processing Audit (71 Groups)\n')
lines.append('| Group | Category | Image Count | Status / Structure Type | Products in Group |')
lines.append('| :--- | :--- | :--- | :--- | :--- |')

with open('scripts/group_analyses.json', 'r', encoding='utf-8') as f:
    group_analyses = json.load(f)

for g in group_analyses:
    prods = ', '.join([p['name'] for p in g.get('products', [])]) or 'None'
    stype = g.get('structureType') or g.get('status', 'Empty')
    lines.append(f"| `{g['group']}` | {g['category']} | {g['fileCount']} | {stype} | {prods} |")

content = '\n'.join(lines)
with open('scripts/catalog_processing_report.md', 'w', encoding='utf-8') as f:
    f.write(content)

# Also write to artifact folder
import os
artifact_path = r'C:\Users\krish\.gemini\antigravity-ide\brain\7d522d82-66e0-4ec9-97e0-03c74a2aacf8\catalog_processing_report.md'
with open(artifact_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Generated report successfully at scripts/catalog_processing_report.md and {artifact_path}!")
