import os
import re
import json

errors = []
warnings = []

# Check required JSON templates
required_templates = ['index.json', 'product.json', 'collection.json', 'cart.json', '404.json']
for req in required_templates:
    if not os.path.exists(f'templates/{req}'):
        errors.append(f'Missing required template: templates/{req}')

# Validate Section Schemas
for file in os.listdir('sections'):
    if file.endswith('.liquid'):
        with open(f'sections/{file}', 'r', encoding='utf-8') as f:
            content = f.read()
            match = re.search(r'{%\s*schema\s*%}(.*?){%\s*endschema\s*%}', content, re.DOTALL)
            if match:
                try:
                    json.loads(match.group(1))
                except Exception as e:
                    errors.append(f'Invalid JSON schema in {file}: {e}')
            else:
                warnings.append(f'No schema found in sections/{file}')

# Check asset references
all_assets = set(os.listdir('assets'))
for root_dir, dirs, files in os.walk('.'):
    if 'node_modules' in root_dir or '.git' in root_dir:
        continue
    for file in files:
        if file.endswith('.liquid'):
            path = os.path.join(root_dir, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                asset_matches = re.findall(r'[\'"]([^\'"]+?\.(?:css|js|jpg|png|avif|svg))[\'"]\s*\|\s*asset_url', content)
                for asset in asset_matches:
                    if asset not in all_assets:
                        errors.append(f'Missing asset {asset} referenced in {path}')

print('ERRORS:')
for e in set(errors): print('-', e)
print('WARNINGS:')
for w in set(warnings): print('-', w)
