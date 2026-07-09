(function () {

  /* ============================================================
     VAMAS CART UTILITY — localStorage-backed, shared across pages
     ============================================================ */
  window.VamasCart = (function(){
    var KEY = 'vamas_cart_v1';
    function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||[]; }catch(e){ return []; } }
    function save(items){
      try{ localStorage.setItem(KEY, JSON.stringify(items)); }catch(e){}
      document.dispatchEvent(new CustomEvent('vamas:cartUpdated', {detail:{items:items}}));
    }
    function iKey(i){ return (i.id||'item')+'||'+(i.color||'')+'||'+(i.size||''); }
    return {
      get: load,
      count: function(){ return load().reduce(function(s,i){ return s+i.qty; },0); },
      add: function(item){
        var items=load(), k=iKey(item), ex=null;
        for(var j=0;j<items.length;j++){ if(items[j].key===k){ ex=items[j]; break; } }
        if(ex){ ex.qty=Math.min(ex.qty+(item.qty||1),10); }
        else{ item.key=k; item.qty=item.qty||1; items.push(item); }
        save(items);
        if(window.VamasCart.showToast) window.VamasCart.showToast(item);
      },
      update: function(key,qty){
        var items=load();
        for(var j=0;j<items.length;j++){ if(items[j].key===key){ items[j].qty=Math.max(1,Math.min(qty,10)); break; } }
        save(items);
      },
      remove: function(key){ save(load().filter(function(x){ return x.key!==key; })); },
      clear: function(){ save([]); }
    };
  })();

  /* ============================================================
     VAMAS COUPON — single source of truth, admin-manageable
     ============================================================ */
  window.VamasCoupon = (function(){
    var APPLIED_KEY = 'vamas_coupon_applied';
    var DB_KEY      = 'vamas_coupons_db';
    var DEFAULT = {
      'FIRST10': {pct:10, desc:'10% off first order',     minOrder:0,   maxUses:500, uses:0, active:true},
      'SAVE20':  {pct:20, desc:'20% off (min Rs.999)',    minOrder:999, maxUses:100, uses:0, active:true},
      'VAMAS15': {pct:15, desc:'15% off for members',     minOrder:500, maxUses:200, uses:0, active:true},
      'BRIDAL10':{pct:10, desc:'10% off bridal orders',   minOrder:0,   maxUses:50,  uses:0, active:false}
    };
    function getDB(){ try{ var d=JSON.parse(localStorage.getItem(DB_KEY)); if(!d){ d=DEFAULT; localStorage.setItem(DB_KEY,JSON.stringify(d)); } return d; }catch(e){ return DEFAULT; } }
    function saveDB(db){ try{ localStorage.setItem(DB_KEY,JSON.stringify(db)); }catch(e){} }
    return {
      getAll:   getDB,
      validate: function(code, subtotal){
        var db=getDB(), c=db[code.toUpperCase()];
        if(!c||!c.active)            return {ok:false, msg:'Invalid coupon code.'};
        if(c.minOrder&&(subtotal||0)<c.minOrder) return {ok:false, msg:'Min order Rs.'+c.minOrder+' required.'};
        if(c.maxUses&&c.uses>=c.maxUses)         return {ok:false, msg:'Coupon usage limit reached.'};
        return {ok:true, pct:c.pct, desc:c.desc, code:code.toUpperCase()};
      },
      apply: function(code, subtotal){
        var r=this.validate(code, subtotal);
        if(r.ok){ try{ localStorage.setItem(APPLIED_KEY,JSON.stringify({code:r.code,pct:r.pct,desc:r.desc})); }catch(e){} document.dispatchEvent(new CustomEvent('vamas:couponApplied',{detail:r})); }
        return r;
      },
      remove: function(){ try{ localStorage.removeItem(APPLIED_KEY); }catch(e){} document.dispatchEvent(new CustomEvent('vamas:couponRemoved')); },
      get:    function(){ try{ return JSON.parse(localStorage.getItem(APPLIED_KEY)); }catch(e){ return null; } },
      use:    function(code){ var db=getDB(); if(db[code]){ db[code].uses=(db[code].uses||0)+1; saveDB(db); } },
      add:    function(code,data){ var db=getDB(); db[code.toUpperCase()]=data; saveDB(db); },
      del:    function(code){ var db=getDB(); delete db[code.toUpperCase()]; saveDB(db); },
      toggle: function(code){ var db=getDB(); if(db[code]){ db[code].active=!db[code].active; saveDB(db); } }
    };
  })();

  /* ============================================================
     VAMAS ORDERS — save/read orders, used by admin dashboard
     ============================================================ */
  window.VamasOrders = (function(){
    var KEY = 'vamas_orders_db';
    function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||[]; }catch(e){ return []; } }
    return {
      get: load,
      save: function(order){ var o=load(); o.unshift(order); try{ localStorage.setItem(KEY,JSON.stringify(o.slice(0,500))); }catch(e){} },
      updateStatus: function(id,status){ var o=load(); for(var i=0;i<o.length;i++){ if(o[i].id===id){ o[i].status=status; break; } } try{ localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){} }
    };
  })();

  /* ============================================================
     SHARED NAV + FOOTER — edit here, reflects on all pages
     ============================================================ */

  /* ---------- NAV CSS ---------- */
  var navCSS = [
    '.ann{background:#420001;color:#e7d1a6;text-align:center;padding:9px 16px;font-size:11px;font-weight:500;letter-spacing:.08em;}',
    '.nav-wrapper{position:sticky;top:0;z-index:1000;}',
    '.nav-outer{padding:10px 48px;background:transparent;pointer-events:none;}',
    '.nav{background:#fff;border-radius:100px;display:flex;align-items:center;justify-content:space-between;padding:8px 8px 8px 22px;box-shadow:0 4px 28px rgba(0,0,0,.10),0 1px 6px rgba(0,0,0,.06);pointer-events:all;max-width:1200px;margin:0 auto;}',
    '.nav-logo{display:flex;align-items:center;gap:10px;}',
    '.nav-logo-img{height:42px;width:auto;object-fit:contain;display:block;border:none;outline:none;box-shadow:none;}',
    '.nav-logo a{border:none;outline:none;text-decoration:none;}',
    '.nav-links{display:flex;gap:24px;}',
    '.nav-links a{color:rgba(66,0,1,.65);font-size:10px;font-weight:600;letter-spacing:1.2px;padding:4px 0;transition:color .2s;text-decoration:none;}',
    '.nav-links a:hover{color:#420001;}',
    '.nav-icons{display:flex;align-items:center;gap:14px;}',
    '.nav-icons>a{color:rgba(66,0,1,.6);position:relative;transition:color .2s;display:flex;align-items:center;}',
    '.nav-icons>a:hover{color:#420001;}',
    '.nav-contact{background:#420001;color:#e7d1a6 !important;padding:9px 20px;border-radius:100px;font-size:10px;font-weight:700;letter-spacing:1.5px;white-space:nowrap;transition:background .2s;margin-left:4px;text-decoration:none;}',
    '.nav-contact:hover{background:#6a0002 !important;}',
    '.cart-badge{position:absolute;top:-7px;right:-7px;background:#420001;color:#e7d1a6;width:16px;height:16px;border-radius:50%;font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center;}',
    '.nav-hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:6px;background:none;border:none;margin-left:8px;}',
    '.nav-hamburger span{display:block;width:22px;height:2px;background:#420001;border-radius:2px;transition:all .3s;}',
    '.nav-mobile-menu{display:none;flex-direction:column;background:#fff;border-top:1px solid rgba(66,0,1,.08);padding:10px 20px 14px;gap:0;box-shadow:0 8px 24px rgba(0,0,0,.08);}',
    '.nav-mobile-menu a{padding:13px 0;border-bottom:1px solid rgba(66,0,1,.06);font-size:13px;font-weight:600;letter-spacing:1.5px;color:#420001;text-decoration:none;display:block;}',
    '.nav-mobile-menu a:last-child{border-bottom:none;}',
    '.nav-mobile-open .nav-mobile-menu{display:flex;}',
    '@media(max-width:768px){',
    '.nav-outer{padding:6px 12px;}',
    '.nav{padding:6px 14px;border-radius:50px;}',
    '.nav-logo-img{height:34px;}',
    '.nav-links{display:none!important;}',
    '.nav-contact{display:none!important;}',
    '.nav-hamburger{display:flex;}',
    '}',
    '@media(min-width:769px)and(max-width:1024px){',
    '.nav-outer{padding:10px 24px;}',
    '.nav-links a{font-size:9px;}',
    '.nav-links{gap:16px;}',
    '}'
  ].join('');

  /* ---------- FOOTER CSS ---------- */
  var footerCSS = [
    '.dark-bottom{background:#2a0001;position:relative;overflow:hidden;}',
    '.dark-nl{padding:80px 80px 64px;position:relative;z-index:2;text-align:center;border-bottom:1px solid rgba(231,209,166,.08);}',
    '.dark-nl-eye{font-size:10px;font-weight:700;letter-spacing:3.5px;color:rgba(231,209,166,.4);margin-bottom:18px;}',
    '.dark-nl-h3{font-family:"Playfair Display",Georgia,serif;font-size:44px;font-weight:700;color:#e7d1a6;line-height:1.2;margin-bottom:10px;}',
    '.dark-nl-h3 em{font-style:italic;}',
    '.dark-nl-sub{font-size:13px;color:rgba(231,209,166,.45);margin-bottom:34px;}',
    '.dark-nl-form{display:flex;max-width:460px;margin:0 auto;background:rgba(255,255,255,.05);border:1px solid rgba(231,209,166,.18);border-radius:100px;padding:6px 6px 6px 22px;gap:8px;}',
    '.dark-nl-input{flex:1;background:none;border:none;outline:none;font-size:13px;color:#e7d1a6;font-family:"Poppins",sans-serif;}',
    '.dark-nl-btn{background:#e7d1a6;color:#420001;border:none;padding:10px 22px;border-radius:100px;font-size:10px;font-weight:800;letter-spacing:2px;cursor:pointer;font-family:"Poppins",sans-serif;white-space:nowrap;}',
    '.dark-footer{padding:52px 80px 32px;position:relative;z-index:2;}',
    '.dark-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px;}',
    '.dark-footer-logo{display:flex;align-items:center;gap:11px;margin-bottom:14px;}',
    '.dark-footer-logo-img{height:44px;width:auto;object-fit:contain;display:block;filter:brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(5deg) brightness(.9);opacity:.9;}',
    '.dark-footer-desc{font-size:11px;color:rgba(231,209,166,.42);line-height:1.85;margin-bottom:20px;}',
    '.dark-footer-socials{display:flex;gap:8px;}',
    '.dark-soc{width:32px;height:32px;border-radius:50%;border:1px solid rgba(231,209,166,.18);display:flex;align-items:center;justify-content:center;color:rgba(231,209,166,.5);cursor:pointer;}',
    '.dark-foot-head{font-size:10px;font-weight:800;color:#e7d1a6;letter-spacing:2.5px;margin-bottom:16px;}',
    '.dark-foot-links{display:flex;flex-direction:column;gap:10px;}',
    '.dark-foot-links a{font-size:11px;color:rgba(231,209,166,.45);text-decoration:none;transition:color .2s;}',
    '.dark-foot-links a:hover{color:#e7d1a6;}',
    '.dark-footer-bot{border-top:1px solid rgba(231,209,166,.06);padding-top:22px;display:flex;justify-content:space-between;align-items:center;}',
    '.dark-foot-copy,.dark-foot-pay{font-size:10px;color:rgba(231,209,166,.26);}',
    '@media(max-width:768px){',
    '.dark-nl{padding:40px 20px 32px;}',
    '.dark-nl-h3{font-size:28px;}',
    '.dark-nl-form{flex-direction:column;border-radius:12px;padding:12px;gap:10px;}',
    '.dark-nl-btn{border-radius:8px;padding:13px;}',
    '.dark-footer{padding:28px 16px 20px;}',
    '.dark-footer-grid{grid-template-columns:1fr 1fr;gap:20px;}',
    '.dark-footer-bot{flex-direction:column;gap:8px;text-align:center;}',
    '}',
    '@media(min-width:769px)and(max-width:1024px){',
    '.dark-footer-grid{grid-template-columns:2fr 1fr 1fr;}',
    '.dark-footer{padding:40px 40px 28px;}',
    '.dark-nl{padding:56px 40px 48px;}',
    '}'
  ].join('');

  /* ---------- NAV HTML ---------- */
  var NAV_HTML = ''
    + '<div class="ann">* FREE SHIPPING ABOVE Rs.999 &nbsp;&nbsp;|&nbsp;&nbsp; USE CODE FIRST10 FOR 10% OFF &nbsp;&nbsp;|&nbsp;&nbsp; NEW BRIDAL COLLECTION NOW LIVE *</div>'
    + '<div class="nav-wrapper" id="nav-wrapper">'
    + '<nav class="nav-outer"><div class="nav">'
    + '<div class="nav-logo"><a href="index.html"><img src="assets/vamas-logo.avif" alt="Vamas" class="nav-logo-img" onerror="this.style.display=\'none\'"></a></div>'
    + '<div class="nav-links">'
    + '<a href="index.html">HOME</a>'
    + '<a href="collection.html">COLLECTIONS</a>'
    + '<a href="about.html">ABOUT</a>'
    + '<a href="contact.html">CONTACT</a>'
    + '</div>'
    + '<div class="nav-icons">'
    + '<a href="#" title="Search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></a>'
    + '<a href="#" title="Wishlist"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></a>'
    + '<a href="cart.html" id="nav-cart-link" title="Cart" style="position:relative;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><span class="cart-badge" id="nav-cart-badge" style="display:none;">0</span></a>'
    + '<a href="contact.html" class="nav-contact">Contact Us</a>'
    + '<button class="nav-hamburger" id="nav-hamburger" aria-label="Menu"><span></span><span></span><span></span></button>'
    + '</div></div></nav>'
    + '<div class="nav-mobile-menu" id="nav-mobile-menu">'
    + '<a href="index.html">HOME</a>'
    + '<a href="collection.html">COLLECTIONS</a>'
    + '<a href="about.html">ABOUT</a>'
    + '<a href="contact.html">CONTACT</a>'
    + '</div></div>';

  /* ---------- FOOTER HTML ---------- */
  var FOOTER_HTML = ''
    + '<div class="dark-bottom">'
    + '<div class="dark-nl"><div class="dark-nl-eye">EXCLUSIVE UPDATES</div>'
    + '<div class="dark-nl-h3">Stay in <em>style.</em></div>'
    + '<div class="dark-nl-sub">Subscribe for new arrivals, exclusive offers &amp; style inspiration</div>'
    + '<div class="dark-nl-form"><input class="dark-nl-input" type="email" placeholder="Enter your email address"><button class="dark-nl-btn">SUBSCRIBE</button></div>'
    + '</div>'
    + '<footer class="dark-footer"><div class="dark-footer-grid">'
    + '<div><div class="dark-footer-logo"><img src="assets/vamas-logo.avif" alt="Vamas" class="dark-footer-logo-img" onerror="this.style.display=\'none\'"></div>'
    + '<p class="dark-footer-desc">Premium handcrafted blouses celebrating Indian artistry. Every piece tells a story woven with love and skill.</p>'
    + '<div class="dark-footer-socials">'
    + '<div class="dark-soc"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></div>'
    + '<div class="dark-soc"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></div>'
    + '<div class="dark-soc"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>'
    + '<div class="dark-soc"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg></div>'
    + '</div></div>'
    + '<div><div class="dark-foot-head">QUICK LINKS</div><div class="dark-foot-links">'
    + '<a href="collection.html">New Arrivals</a><a href="collection.html">Collections</a>'
    + '<a href="about.html">About Us</a><a href="contact.html">Contact</a>'
    + '</div></div>'
    + '<div><div class="dark-foot-head">CUSTOMER CARE</div><div class="dark-foot-links">'
    + '<a href="#">Size Guide</a><a href="#">Track Order</a>'
    + '<a href="#">Returns &amp; Exchange</a><a href="#">FAQ</a><a href="#">Shipping Policy</a>'
    + '</div></div>'
    + '<div><div class="dark-foot-head">CONTACT US</div><div class="dark-foot-links">'
    + '<a href="mailto:support@vamas.in">support@vamas.in</a>'
    + '<a href="tel:+919876543210">+91 98765 43210</a>'
    + '<span style="color:rgba(231,209,166,.3);font-size:10px;">Mon-Sat: 10am - 6pm</span>'
    + '</div></div>'
    + '</div>'
    + '<div class="dark-footer-bot">'
    + '<div class="dark-foot-copy">&copy; 2026 Vamas. All rights reserved.</div>'
    + '<div class="dark-foot-pay">UPI &nbsp;&middot;&nbsp; Visa &nbsp;&middot;&nbsp; Mastercard &nbsp;&middot;&nbsp; Net Banking &nbsp;&middot;&nbsp; COD</div>'
    + '</div></footer></div>';

  /* ---------- INJECT CSS ---------- */
  var style = document.createElement('style');
  style.textContent = navCSS + footerCSS;
  document.head.appendChild(style);

  /* ---------- INJECT NAV ---------- */
  var navPlaceholder = document.getElementById('site-nav');
  if (navPlaceholder) {
    var navWrap = document.createElement('div');
    navWrap.innerHTML = NAV_HTML;
    var frag = document.createDocumentFragment();
    while (navWrap.firstChild) frag.appendChild(navWrap.firstChild);
    navPlaceholder.parentNode.replaceChild(frag, navPlaceholder);
  }

  /* ---------- INJECT FOOTER ---------- */
  var footerPlaceholder = document.getElementById('site-footer');
  if (footerPlaceholder) {
    var footWrap = document.createElement('div');
    footWrap.innerHTML = FOOTER_HTML;
    footerPlaceholder.parentNode.replaceChild(footWrap.firstElementChild, footerPlaceholder);
  }

  /* ---------- HAMBURGER ---------- */
  function initHamburger() {
    var btn = document.getElementById('nav-hamburger');
    var wrapper = document.getElementById('nav-wrapper');
    if (btn && wrapper) {
      btn.addEventListener('click', function () {
        wrapper.classList.toggle('nav-mobile-open');
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHamburger);
  } else {
    initHamburger();
  }

  /* ---------- WHATSAPP WIDGET CSS ---------- */
  var waCSS = [
    '.wp-float{display:none!important;}',
    '#wa-fab{position:fixed;bottom:24px;right:24px;width:56px;height:56px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:9999;box-shadow:0 4px 20px rgba(37,211,102,.45);border:none;transition:transform .2s,box-shadow .2s;}',
    '#wa-fab:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(37,211,102,.55);}',
    '#wa-fab svg{width:30px;height:30px;}',
    '#wa-popup{position:fixed;bottom:92px;right:24px;width:300px;background:#fff;border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.18);z-index:9998;overflow:hidden;transform:scale(.85) translateY(12px);opacity:0;pointer-events:none;transition:all .22s cubic-bezier(.4,0,.2,1);}',
    '#wa-popup.open{transform:scale(1) translateY(0);opacity:1;pointer-events:all;}',
    '#wa-popup-head{background:#075E54;padding:14px 16px;display:flex;align-items:center;gap:12px;}',
    '#wa-popup-avatar{width:42px;height:42px;background:#25D366;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
    '#wa-popup-avatar svg{width:22px;height:22px;}',
    '#wa-popup-name{color:#fff;font-size:13px;font-weight:700;letter-spacing:.5px;}',
    '#wa-popup-status{color:rgba(255,255,255,.65);font-size:11px;margin-top:2px;}',
    '#wa-popup-close{margin-left:auto;background:none;border:none;color:rgba(255,255,255,.7);font-size:20px;cursor:pointer;line-height:1;padding:0 2px;}',
    '#wa-popup-close:hover{color:#fff;}',
    '#wa-chat-area{background:#e5ddd5;padding:14px 14px 8px;min-height:80px;}',
    '#wa-bubble{background:#fff;border-radius:4px 12px 12px 12px;padding:10px 13px;font-size:12.5px;color:#333;line-height:1.55;box-shadow:0 1px 2px rgba(0,0,0,.12);position:relative;}',
    '#wa-bubble::before{content:"";position:absolute;left:-7px;top:0;border:6px solid transparent;border-right-color:#fff;border-top-color:#fff;}',
    '#wa-bubble-time{font-size:10px;color:#aaa;text-align:right;margin-top:4px;}',
    '#wa-quick-replies{padding:10px 14px 12px;display:flex;flex-direction:column;gap:6px;}',
    '.wa-qr{background:#fff;border:1.5px solid #25D366;color:#075E54;border-radius:20px;padding:7px 14px;font-size:11.5px;font-weight:600;cursor:pointer;text-align:center;transition:background .15s;}',
    '.wa-qr:hover{background:#e9fdf0;}',
    '#wa-cta{display:block;background:#25D366;color:#fff;text-align:center;padding:13px;font-size:12px;font-weight:700;letter-spacing:1px;text-decoration:none;transition:background .2s;font-family:"Poppins",sans-serif;}',
    '#wa-cta:hover{background:#1ebe5c;}',
    '#wa-cta svg{width:16px;height:16px;vertical-align:middle;margin-right:6px;}',
    /* ── Cart Added Toast ── */
    '#vc-toast{position:fixed;bottom:90px;right:24px;width:284px;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.18);z-index:8500;padding:14px 14px 14px 14px;display:flex;gap:12px;align-items:center;transform:translateX(320px);opacity:0;pointer-events:none;transition:all .3s cubic-bezier(.4,0,.2,1);}',
    '#vc-toast.show{transform:translateX(0);opacity:1;pointer-events:all;}',
    '#vc-toast-img{width:52px;height:62px;border-radius:6px;object-fit:cover;object-position:top;flex-shrink:0;border:1px solid rgba(66,0,1,.08);}',
    '#vc-toast-label{font-size:9px;color:#2e7d32;font-weight:800;letter-spacing:1.5px;margin-bottom:3px;}',
    '#vc-toast-name{font-size:12px;font-weight:700;color:#420001;margin-bottom:8px;line-height:1.3;}',
    '#vc-toast-btn{background:#420001;color:#e7d1a6;border:none;border-radius:6px;padding:8px 0;font-size:11px;font-weight:700;cursor:pointer;width:100%;font-family:"Poppins",sans-serif;letter-spacing:.5px;transition:background .2s;}',
    '#vc-toast-btn:hover{background:#6a0002;}',
    '#vc-toast-close{position:absolute;top:8px;right:10px;background:none;border:none;font-size:18px;color:#ccc;cursor:pointer;line-height:1;padding:0;}'
  ].join('');

  var waStyle = document.createElement('style');
  waStyle.textContent = waCSS;
  document.head.appendChild(waStyle);

  /* ---------- WHATSAPP WIDGET HTML ---------- */
  var WA_NUM = '919876543210';
  var WA_MSG = encodeURIComponent('Hi VAMAS! I am interested in your blouses.');

  var WA_ICON = '<svg viewBox="0 0 32 32" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M16 3C8.832 3 3 8.832 3 16c0 2.625.77 5.074 2.086 7.129L3.05 28.855 9 26.875C10.973 28.023 13.41 29 16 29c7.168 0 13-5.832 13-13S23.168 3 16 3zm0 2c6.086 0 11 4.914 11 11s-4.914 11-11 11c-2.324 0-4.48-.766-6.25-2.063l-.399-.297-3.586.945.992-2.843-.334-.426A10.945 10.945 0 0 1 5 16C5 9.914 9.914 5 16 5zm-4.695 4.852c-.196 0-.504.07-.766.36-.261.292-1 .977-1 2.437s1.063 2.824 1.211 3.028c.148.203 2.121 3.351 5.199 4.585 2.547 1.032 3.082.844 3.656.793.574-.055 1.856-.719 2.106-1.41.25-.695.25-1.285.176-1.41-.074-.125-.277-.199-.578-.348-.3-.148-1.758-.863-2.035-.961-.277-.101-.477-.152-.676.149-.2.297-.773.961-.949 1.16-.176.2-.351.223-.652.075-.3-.149-1.282-.466-2.437-1.496-.9-.813-1.508-1.813-1.684-2.114-.176-.305-.02-.469.133-.617.136-.133.3-.348.45-.52.148-.175.197-.3.296-.5.098-.199.05-.372-.026-.52-.074-.149-.625-1.617-.875-2.207-.25-.574-.5-.492-.676-.5a12.71 12.71 0 0 0-.574-.008 1.1 1.1 0 0 0-.25 0z"/></svg>';

  var waHTML = ''
    + '<button id="wa-fab" title="Chat on WhatsApp">' + WA_ICON + '</button>'
    + '<div id="wa-popup">'
    + '<div id="wa-popup-head">'
    + '<div id="wa-popup-avatar">' + WA_ICON + '</div>'
    + '<div><div id="wa-popup-name">VAMAS</div><div id="wa-popup-status">&#9679; Typically replies in minutes</div></div>'
    + '<button id="wa-popup-close" title="Close">&times;</button>'
    + '</div>'
    + '<div id="wa-chat-area">'
    + '<div id="wa-bubble">Namaste! &#128075; Welcome to <strong>VAMAS</strong>.<br>How can we help you today?<div id="wa-bubble-time">Now</div></div>'
    + '</div>'
    + '<div id="wa-quick-replies">'
    + '<button class="wa-qr" data-msg="Hi! I want to place an order for a blouse.">&#128722; Place an Order</button>'
    + '<button class="wa-qr" data-msg="Hi! I need help with custom size stitching.">&#9986; Custom Size / Stitching</button>'
    + '<button class="wa-qr" data-msg="Hi! I want to track my order.">&#128666; Track My Order</button>'
    + '</div>'
    + '<a id="wa-cta" href="https://wa.me/' + WA_NUM + '?text=' + WA_MSG + '" target="_blank" rel="noopener">'
    + WA_ICON + ' Open WhatsApp Chat'
    + '</a>'
    + '</div>';

  /* ---------- INJECT WHATSAPP WIDGET ---------- */
  function initWA() {
    var waWrap = document.createElement('div');
    waWrap.innerHTML = waHTML;
    while (waWrap.firstChild) document.body.appendChild(waWrap.firstChild);

    var fab = document.getElementById('wa-fab');
    var popup = document.getElementById('wa-popup');
    var closeBtn = document.getElementById('wa-popup-close');

    fab.addEventListener('click', function () {
      popup.classList.toggle('open');
    });
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      popup.classList.remove('open');
    });

    document.querySelectorAll('.wa-qr').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var msg = encodeURIComponent(this.dataset.msg);
        window.open('https://wa.me/' + WA_NUM + '?text=' + msg, '_blank');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWA);
  } else {
    initWA();
  }

  /* ---------- CART BADGE + TOAST ---------- */
  function updateCartBadge() {
    var badge = document.getElementById('nav-cart-badge');
    if (!badge) return;
    var count = window.VamasCart ? window.VamasCart.count() : 0;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  function initCartUI() {
    updateCartBadge();
    document.addEventListener('vamas:cartUpdated', updateCartBadge);

    /* inject toast */
    var toastDiv = document.createElement('div');
    toastDiv.innerHTML = '<div id="vc-toast">'
      + '<img id="vc-toast-img" src="" alt="">'
      + '<div style="flex:1;min-width:0;">'
      + '<div id="vc-toast-label">&#10003; ADDED TO CART</div>'
      + '<div id="vc-toast-name"></div>'
      + '<button id="vc-toast-btn" onclick="window.location.href=\'cart.html\'">VIEW CART &rarr;</button>'
      + '</div>'
      + '<button id="vc-toast-close">&times;</button>'
      + '</div>';
    document.body.appendChild(toastDiv.firstChild);

    document.getElementById('vc-toast-close').addEventListener('click', function() {
      document.getElementById('vc-toast').classList.remove('show');
    });

    var _toastTimer;
    window.VamasCart.showToast = function(item) {
      var toast = document.getElementById('vc-toast');
      if (!toast) return;
      document.getElementById('vc-toast-img').src = item.img || 'assets/slide-pink.jpg';
      document.getElementById('vc-toast-name').textContent = item.name || 'Item';
      toast.classList.add('show');
      clearTimeout(_toastTimer);
      _toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 3200);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCartUI);
  } else {
    initCartUI();
  }

})();
