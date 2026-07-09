import re
import os

def port(filename, liquid_name):
    if not os.path.exists(filename): return
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    match = re.search(r'(<!-- ── Hero Banner ── -->.*?|<div class=\"breadcrumb\">.*?)<script src=\"includes.js\">', html, re.DOTALL)
    if match:
        content = match.group(1)
        liquid_header = '''{{ 'vamas-theme.css' | asset_url | stylesheet_tag }}\n'''
        content = liquid_header + content
        
        schema = '''
{% schema %}
{
  "name": "''' + filename.replace('.html', '').capitalize() + ''' Page",
  "settings": []
}
{% endschema %}
'''
        content = content + schema
        
        with open('vamas theme/sections/' + liquid_name, 'w', encoding='utf-8') as f:
            f.write(content)

port('about.html', 'vamas-about.liquid')
port('contact.html', 'vamas-contact.liquid')
port('checkout.html', 'vamas-checkout.liquid')
port('dashboard.html', 'vamas-dashboard.liquid')
