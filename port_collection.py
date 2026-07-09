import re

with open('collection.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'(<div class=\"breadcrumb\">.*?)<script src=\"includes.js\">', html, re.DOTALL)
if match:
    content = match.group(1)
    
    # We will use Shopify's standard collection logic.
    # We just need to wrap the prod-grid items in a {% for product in collection.products %}
    
    # First, let's extract everything up to <div class="prod-grid">
    grid_match = re.search(r'(.*?)<div class=\"prod-grid\">(.*?)</div>\s*<!-- ── Pagination ── -->', content, re.DOTALL)
    if grid_match:
        before_grid = grid_match.group(1)
        
        liquid_grid = '''<div class=\"prod-grid\">
          {% for product in collection.products %}
            {% render 'vamas-product-card', product: product %}
          {% else %}
            <p>No products found in this collection.</p>
          {% endfor %}
        </div>'''
        
        after_grid = '''
        <div class="pagination">
          {{ paginate | default_pagination }}
        </div>
        '''
        
        final_content = '{% paginate collection.products by 16 %}\n' + before_grid + liquid_grid + after_grid + '\n</section>\n{% endpaginate %}'
        
        # Replace static text with collection variables
        final_content = final_content.replace('Bridal Collection', '{{ collection.title }}')
        final_content = final_content.replace('124 styles', '{{ collection.products_count }} styles')
        
        liquid_header = '''{{ 'vamas-theme.css' | asset_url | stylesheet_tag }}\n'''
        final_content = liquid_header + final_content
        
        schema = '''
{% schema %}
{
  "name": "Collection Grid",
  "settings": []
}
{% endschema %}
'''
        final_content = final_content + schema
        
        with open('vamas theme/sections/vamas-collection.liquid', 'w', encoding='utf-8') as f:
            f.write(final_content)
