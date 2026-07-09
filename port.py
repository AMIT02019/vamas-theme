import re

with open('product.html', 'r', encoding='utf-8') as f:
    html = f.read()

match = re.search(r'(<!-- ── Breadcrumb ── -->.*?<script>.*?</script>)', html, re.DOTALL)
if match:
    content = match.group(1)
    content = content.replace('Silk Zari Mirror Blouse', '{{ product.title }}')
    content = content.replace('Bridal, Heavy Work', '{{ product.type }}')
    content = content.replace('Rs.2,499', '{{ current_variant.price | money }}')
    content = content.replace('Rs.4,999', '{{ current_variant.compare_at_price | money }}')
    content = content.replace('50% off', '{% if current_variant.compare_at_price > current_variant.price %}{{ current_variant.compare_at_price | minus: current_variant.price | times: 100 | divided_by: current_variant.compare_at_price | round }}% off{% endif %}')
    content = re.sub(r'src=\"assets/[^\"]+\"', 'src=\"{{ product.featured_media | img_url: \'master\' }}\"', content)
    content = content.replace('<div class=\"color-section\">', '{% form \'product\', product, id: \'vamas-product-form\' %}<input type=\"hidden\" name=\"id\" value=\"{{ current_variant.id }}\"><div class=\"color-section\">')
    content = content.replace('<button class=\"btn-buy\">', '<button type=\"submit\" name=\"add\" class=\"btn-atc\" style=\"margin-bottom:10px;\">Add to cart</button>\n<button class=\"btn-buy\">')
    content = content.replace('<!-- ── Payment strip ── -->', '{% endform %}\n<!-- ── Payment strip ── -->')
    
    liquid_header = '''{{ 'vamas-theme.css' | asset_url | stylesheet_tag }}
{% assign current_variant = product.selected_or_first_available_variant %}
'''
    content = liquid_header + content
    
    schema = '''
{% schema %}
{
  "name": "Product Details",
  "presets": [ { "name": "Product Details" } ]
}
{% endschema %}
'''
    content = content + schema
    
    with open('vamas theme/sections/vamas-product.liquid', 'w', encoding='utf-8') as f:
        f.write(content)
