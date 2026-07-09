import re

with open('cart.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'(<div class=\"breadcrumb\">.*?)<script src=\"includes.js\">', html, re.DOTALL)
if match:
    content = match.group(1)
    
    # Simple replace
    liquid_header = '''{{ 'vamas-theme.css' | asset_url | stylesheet_tag }}\n'''
    content = liquid_header + content
    
    schema = '''
{% schema %}
{
  "name": "Cart Page",
  "settings": []
}
{% endschema %}
'''
    content = content + schema
    
    with open('vamas theme/sections/vamas-cart.liquid', 'w', encoding='utf-8') as f:
        f.write(content)
