import re

with open('includes.js', 'r', encoding='utf-8') as f:
    js = f.read()

nav_match = re.search(r'var navCSS = \[(.*?)\]\.join', js, re.DOTALL)
foot_match = re.search(r'var footerCSS = \[(.*?)\]\.join', js, re.DOTALL)

if nav_match and foot_match:
    nav_strs = re.findall(r"'([^']*)'", nav_match.group(1))
    foot_strs = re.findall(r"'([^']*)'", foot_match.group(1))
    
    nav_css = ''.join(nav_strs)
    foot_css = ''.join(foot_strs)
    
    with open('assets/vamas-theme.css', 'a', encoding='utf-8') as f:
        f.write('\n\n/* ── NAV CSS ── */\n')
        f.write(nav_css)
        f.write('\n\n/* ── FOOTER CSS ── */\n')
        f.write(foot_css)
        
    print('Added nav and footer CSS.')
