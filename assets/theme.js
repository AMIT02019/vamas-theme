/* ============================================================
   VAMAS THEME JS
   Covers: mobile hamburger nav, WhatsApp floating widget,
   cart badge sync, wishlist UI toggle.
   ============================================================ */
(function () {
  'use strict';

  /* ---- MOBILE HAMBURGER MENU ---- */
  function initHamburger() {
    var btn = document.getElementById('vamas-nav-hamburger');
    var menu = document.getElementById('vamas-mobile-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    /* close the menu when a link inside it is clicked */
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- WISHLIST UI TOGGLE (visual only, no backend) ---- */
  function initWishlist() {
    var STORAGE_KEY = 'vamas_wishlist_active_v1';
    var toggles = document.querySelectorAll('[data-wishlist-toggle]');
    if (!toggles.length) return;

    var stored;
    try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { stored = null; }
    if (stored) {
      toggles.forEach(function (el) {
        if (stored[el.dataset.productId || 'global']) el.classList.add('is-active');
      });
    }

    toggles.forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        el.classList.toggle('is-active');
        try {
          var state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
          var key = el.dataset.productId || 'global';
          state[key] = el.classList.contains('is-active');
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (err) { /* localStorage unavailable, ignore */ }
      });
    });
  }

  /* ---- CART BADGE ---- */
  function updateVamasCartBadge(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.setAttribute('data-cart-count', count);
    });
  }
  window.updateVamasCartBadge = updateVamasCartBadge;

  /* ---- MONEY FORMATTING (mirrors Shopify's standard money.js helper) ---- */
  function vamasFormatMoney(cents) {
    var format = window.vamasMoneyFormat || '₹{{amount}}';
    cents = parseInt(cents, 10);
    if (isNaN(cents)) cents = 0;

    function withDelimiters(number, precision, thousands, decimalSep) {
      number = (number / 100).toFixed(precision);
      var parts = number.split('.');
      var whole = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + thousands);
      return parts[1] != null ? whole + decimalSep + parts[1] : whole;
    }

    var match = format.match(/\{\{\s*(\w+)\s*\}\}/);
    var key = match ? match[1] : 'amount';
    var value;
    switch (key) {
      case 'amount_no_decimals':
        value = withDelimiters(cents, 0, ',', '.');
        break;
      case 'amount_with_comma_separator':
        value = withDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = withDelimiters(cents, 0, '.', ',');
        break;
      default:
        value = withDelimiters(cents, 2, ',', '.');
    }
    return format.replace(/\{\{\s*\w+\s*\}\}/, value);
  }

  function syncCartBadge() {
    fetch('/cart.js', { credentials: 'same-origin' })
      .then(function (res) { return res.json(); })
      .then(function (cart) { updateVamasCartBadge(cart.item_count); })
      .catch(function () { /* ignore network errors, keep server-rendered count */ });
  }

  /* ---- WHATSAPP FLOATING WIDGET ---- */
  function initWhatsappWidget() {
    var number = window.vamasWhatsappNumber || '919876543210';
    var message = window.vamasWhatsappMessage || "Hi! I'm interested in your blouses.";
    var encodedMsg = encodeURIComponent(message);

    var WA_ICON = '<svg viewBox="0 0 32 32" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M16 3C8.832 3 3 8.832 3 16c0 2.625.77 5.074 2.086 7.129L3.05 28.855 9 26.875C10.973 28.023 13.41 29 16 29c7.168 0 13-5.832 13-13S23.168 3 16 3zm0 2c6.086 0 11 4.914 11 11s-4.914 11-11 11c-2.324 0-4.48-.766-6.25-2.063l-.399-.297-3.586.945.992-2.843-.334-.426A10.945 10.945 0 0 1 5 16C5 9.914 9.914 5 16 5zm-4.695 4.852c-.196 0-.504.07-.766.36-.261.292-1 .977-1 2.437s1.063 2.824 1.211 3.028c.148.203 2.121 3.351 5.199 4.585 2.547 1.032 3.082.844 3.656.793.574-.055 1.856-.719 2.106-1.41.25-.695.25-1.285.176-1.41-.074-.125-.277-.199-.578-.348-.3-.148-1.758-.863-2.035-.961-.277-.101-.477-.152-.676.149-.2.297-.773.961-.949 1.16-.176.2-.351.223-.652.075-.3-.149-1.282-.466-2.437-1.496-.9-.813-1.508-1.813-1.684-2.114-.176-.305-.02-.469.133-.617.136-.133.3-.348.45-.52.148-.175.197-.3.296-.5.098-.199.05-.372-.026-.52-.074-.149-.625-1.617-.875-2.207-.25-.574-.5-.492-.676-.5a12.71 12.71 0 0 0-.574-.008 1.1 1.1 0 0 0-.25 0z"/></svg>';

    var waHTML = ''
      + '<button id="vamas-wa-fab" title="Chat on WhatsApp">' + WA_ICON + '</button>'
      + '<div id="vamas-wa-popup">'
      + '<div id="vamas-wa-popup-head">'
      + '<div id="vamas-wa-popup-avatar">' + WA_ICON + '</div>'
      + '<div><div id="vamas-wa-popup-name">VAMAS</div><div id="vamas-wa-popup-status">&#9679; Typically replies in minutes</div></div>'
      + '<button id="vamas-wa-popup-close" title="Close">&times;</button>'
      + '</div>'
      + '<div id="vamas-wa-chat-area">'
      + '<div id="vamas-wa-bubble">Namaste! &#128075; Welcome to <strong>VAMAS</strong>.<br>How can we help you today?<div id="vamas-wa-bubble-time">Now</div></div>'
      + '</div>'
      + '<div id="vamas-wa-quick-replies">'
      + '<button class="vamas-wa-qr" data-msg="Hi! I want to place an order for a blouse.">&#128722; Place an Order</button>'
      + '<button class="vamas-wa-qr" data-msg="Hi! I need help with custom size stitching.">&#9986; Custom Size / Stitching</button>'
      + '<button class="vamas-wa-qr" data-msg="Hi! I want to track my order.">&#128666; Track My Order</button>'
      + '</div>'
      + '<a id="vamas-wa-cta" href="https://wa.me/' + number + '?text=' + encodedMsg + '" target="_blank" rel="noopener">'
      + WA_ICON + ' Open WhatsApp Chat'
      + '</a>'
      + '</div>';

    var wrap = document.createElement('div');
    wrap.innerHTML = waHTML;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    var fab = document.getElementById('vamas-wa-fab');
    var popup = document.getElementById('vamas-wa-popup');
    var closeBtn = document.getElementById('vamas-wa-popup-close');

    fab.addEventListener('click', function () {
      popup.classList.toggle('open');
    });
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      popup.classList.remove('open');
    });

    document.querySelectorAll('.vamas-wa-qr').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var msg = encodeURIComponent(this.dataset.msg);
        window.open('https://wa.me/' + number + '?text=' + msg, '_blank');
      });
    });
  }

  /* ---- PRODUCT PAGE: gallery, variant picker, qty, sticky bar, misc ---- */
  function initProductPage() {
    var form = document.getElementById('vamas-product-form');
    if (!form) return;

    var variants = window.vamasProductVariants || [];

    /* Gallery */
    var mainImg = document.getElementById('vamas-main-img');
    var thumbs = document.querySelectorAll('#vamas-thumb-strip .vamas-product-thumb-item');
    var curIdx = 0;
    function setGalleryImg(idx) {
      if (!thumbs.length) return;
      curIdx = (idx + thumbs.length) % thumbs.length;
      var t = thumbs[curIdx];
      if (mainImg && t) mainImg.src = t.dataset.full;
      thumbs.forEach(function (el, i) { el.classList.toggle('active', i === curIdx); });
    }
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () { setGalleryImg(parseInt(this.dataset.idx, 10)); });
    });
    var galPrev = document.getElementById('vamas-gal-prev');
    var galNext = document.getElementById('vamas-gal-next');
    if (galPrev) galPrev.addEventListener('click', function () { setGalleryImg(curIdx - 1); });
    if (galNext) galNext.addEventListener('click', function () { setGalleryImg(curIdx + 1); });

    /* Quantity */
    var qtyNum = document.getElementById('vamas-qty-num');
    function setQty(n) {
      var v = Math.max(1, Math.min(10, n));
      if (qtyNum) qtyNum.value = v;
      return v;
    }
    var qtyMinus = document.getElementById('vamas-qty-minus');
    var qtyPlus = document.getElementById('vamas-qty-plus');
    if (qtyMinus) qtyMinus.addEventListener('click', function () { setQty((parseInt(qtyNum.value, 10) || 1) - 1); });
    if (qtyPlus) qtyPlus.addEventListener('click', function () { setQty((parseInt(qtyNum.value, 10) || 1) + 1); });

    /* Variant option selection -> find matching variant, update price/ATC/hidden id */
    var selectedOptions = [];
    (function seedSelected() {
      var active = form.querySelectorAll('.vamas-product-swatch.active, .vamas-product-pill.active');
      active.forEach(function (el) { selectedOptions[parseInt(el.dataset.optionIndex, 10)] = el.dataset.value; });
    })();

    function findVariant() {
      for (var i = 0; i < variants.length; i++) {
        var v = variants[i];
        var opts = [v.option1, v.option2, v.option3];
        var match = true;
        for (var j = 0; j < selectedOptions.length; j++) {
          if (selectedOptions[j] != null && selectedOptions[j] !== opts[j]) { match = false; break; }
        }
        if (match) return v;
      }
      return null;
    }

    function updateVariantUI() {
      var v = findVariant();
      if (!v) return;

      var priceWrap = form.querySelector('.vamas-product-price');
      var priceNow = form.querySelector('.vamas-product-price__now');
      var atc = document.getElementById('vamas-product-atc-btn');
      var stickyBtn = document.getElementById('vamas-sticky-atc-btn');
      var stickyPrice = document.querySelector('.vamas-product-sticky-price');
      var variantIdInput = form.querySelector('input[name="id"]');

      if (variantIdInput) variantIdInput.value = v.id;
      if (priceNow) priceNow.textContent = vamasFormatMoney(v.price);

      if (priceWrap) {
        var oldEl = priceWrap.querySelector('.vamas-product-price__old');
        var offEl = priceWrap.querySelector('.vamas-product-price__off');
        if (v.compare_at_price && v.compare_at_price > v.price) {
          var pct = Math.round((v.compare_at_price - v.price) * 100 / v.compare_at_price);
          if (!oldEl) {
            oldEl = document.createElement('span');
            oldEl.className = 'vamas-product-price__old';
            priceWrap.appendChild(oldEl);
          }
          if (!offEl) {
            offEl = document.createElement('span');
            offEl.className = 'vamas-product-price__off';
            priceWrap.appendChild(offEl);
          }
          oldEl.textContent = vamasFormatMoney(v.compare_at_price);
          offEl.textContent = pct + '% ' + (priceWrap.dataset.offLabel || 'off');
        } else {
          if (oldEl) oldEl.remove();
          if (offEl) offEl.remove();
        }
      }

      if (atc) {
        atc.disabled = !v.available;
        atc.textContent = v.available
          ? (atc.dataset.atcText || 'ADD TO CART')
          : (atc.dataset.soldOutText || 'SOLD OUT');
      }
      if (stickyBtn) stickyBtn.dataset.variantId = v.id;
      if (stickyPrice) {
        var stickyOldHtml = v.compare_at_price && v.compare_at_price > v.price
          ? ' <span class="vamas-product-sticky-old">' + vamasFormatMoney(v.compare_at_price) + '</span>'
          : '';
        stickyPrice.innerHTML = vamasFormatMoney(v.price) + stickyOldHtml;
      }
      if (v.featured_image && mainImg) mainImg.src = v.featured_image.src;
    }

    form.querySelectorAll('.vamas-product-swatch, .vamas-product-pill').forEach(function (btn) {
      if (!btn.dataset.atcText && btn.classList.contains('vamas-product-swatch')) { /* no-op */ }
      btn.addEventListener('click', function () {
        var idx = parseInt(this.dataset.optionIndex, 10);
        selectedOptions[idx] = this.dataset.value;
        var group = this.parentElement;
        group.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        var nameLabel = form.querySelector('.vamas-product-color-name strong');
        if (nameLabel && this.classList.contains('vamas-product-swatch')) nameLabel.textContent = this.dataset.value;
        updateVariantUI();
      });
    });

    var atcBtn = document.getElementById('vamas-product-atc-btn');

    /* Buy Now: add to cart then redirect straight to checkout */
    var buyBtn = document.getElementById('vamas-product-buy-btn');
    if (buyBtn) {
      buyBtn.addEventListener('click', function () {
        var variantIdInput = form.querySelector('input[name="id"]');
        var qty = qtyNum ? qtyNum.value : 1;
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantIdInput.value, quantity: qty })
        }).then(function () { window.location.href = '/checkout'; });
      });
    }

    /* Pincode check (client-side illustrative check, no backend/courier API) */
    var pincodeBtn = document.getElementById('vamas-pincode-btn');
    if (pincodeBtn) {
      pincodeBtn.addEventListener('click', function () {
        var input = document.getElementById('vamas-pincode-input');
        var result = document.getElementById('vamas-pincode-result');
        var val = input.value.trim();
        if (!/^\d{6}$/.test(val)) {
          result.className = 'vamas-product-pincode-result err';
          result.textContent = 'Please enter a valid 6-digit pincode.';
          return;
        }
        result.className = 'vamas-product-pincode-result ok';
        result.textContent = '✓ Delivery available at ' + val;
      });
    }

    /* Copy coupon code */
    var couponCode = document.getElementById('vamas-coupon-code');
    if (couponCode) {
      couponCode.addEventListener('click', function () {
        var text = this.textContent.trim();
        var copiedLabel = document.getElementById('vamas-offer-copied');
        if (navigator.clipboard) navigator.clipboard.writeText(text);
        if (copiedLabel) {
          copiedLabel.style.display = 'inline';
          setTimeout(function () { copiedLabel.style.display = 'none'; }, 1600);
        }
      });
    }

    /* Share: WhatsApp + copy link */
    var shareWa = document.getElementById('vamas-share-wa');
    if (shareWa) {
      shareWa.addEventListener('click', function () {
        var url = this.dataset.url, title = this.dataset.title;
        window.open('https://wa.me/?text=' + encodeURIComponent(title + ' - ' + url), '_blank');
      });
    }
    var shareCopy = document.getElementById('vamas-share-copy');
    if (shareCopy) {
      shareCopy.addEventListener('click', function () {
        if (navigator.clipboard) navigator.clipboard.writeText(window.location.href);
      });
    }

    /* Sticky ATC bar: shown once the main ATC button scrolls out of view */
    var stickyBar = document.getElementById('vamas-sticky-atc');
    if (stickyBar && atcBtn && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          stickyBar.classList.toggle('visible', !entry.isIntersecting);
        });
      }, { threshold: 0 });
      io.observe(atcBtn);
    }
    var stickyBtn = document.getElementById('vamas-sticky-atc-btn');
    if (stickyBtn) {
      stickyBtn.addEventListener('click', function () {
        var variantId = this.dataset.variantId || form.querySelector('input[name="id"]').value;
        addToCartAjax(variantId, 1, atcBtn);
      });
    }

    updateVariantUI();
  }

  /* ---- SITE-WIDE ADD TO CART (product cards on home/collection/related + PDP) ---- */
  function addToCartAjax(variantId, quantity, triggerEl) {
    function setLabel(text) {
      if (!triggerEl) return;
      triggerEl.textContent = text;
    }
    var originalText = triggerEl ? triggerEl.textContent : null;

    return fetch('/cart/add.js', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: quantity || 1 })
    })
      .then(function (res) {
        return res.json().then(function (data) { return { ok: res.ok, data: data }; });
      })
      .then(function (result) {
        if (!result.ok) throw new Error((result.data && result.data.description) || 'Could not add to cart');
        syncCartBadge();
        setLabel('✓ ADDED');
        if (triggerEl) setTimeout(function () { setLabel(originalText); }, 1600);
      })
      .catch(function (err) {
        console.error('Vamas: add to cart failed', err);
        setLabel('Sold Out');
        if (triggerEl) setTimeout(function () { setLabel(originalText); }, 1800);
      });
  }

  function initProductCardForms() {
    document.querySelectorAll('form[action="/cart/add"]').forEach(function (form) {
      if (form.dataset.vamasAtcBound) return;
      form.dataset.vamasAtcBound = '1';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var idInput = form.querySelector('input[name="id"]');
        var qtyInput = form.querySelector('input[name="quantity"]');
        var btn = form.querySelector('.vamas-atc');
        if (btn && btn.disabled) return;
        addToCartAjax(idInput.value, qtyInput ? qtyInput.value : 1, btn);
      });
    });
  }

  /* ---- CART PAGE: quantity change / remove via AJAX (no full page reload) ---- */
  function initCartPage() {
    var body = document.getElementById('vamas-cart-items-body');
    if (!body) return;

    var countBadgeEl = document.getElementById('vamas-cart-count-badge');
    var itemCountTextEl = document.getElementById('vamas-cart-item-count-text');
    var subtotalEl = document.getElementById('vamas-cart-subtotal-value');
    var discountRowEl = document.getElementById('vamas-cart-discount-row');
    var discountValueEl = document.getElementById('vamas-cart-discount-value');
    var totalValueEl = document.getElementById('vamas-cart-total-value');
    var fdelBox = document.getElementById('vamas-cart-fdel-box');
    var fdelAmount = document.getElementById('vamas-cart-fdel-amount');
    var fdelFill = document.getElementById('vamas-cart-fdel-fill');
    var fdelSuccess = document.getElementById('vamas-cart-fdel-success');
    var fdelThreshold = fdelBox ? parseInt(fdelBox.dataset.threshold, 10) || 0 : 0;
    var itemsLabel = countBadgeEl ? (countBadgeEl.dataset.itemsLabel || 'items') : 'items';

    /* Applies a fresh /cart/change.js (or /cart.js) response to the DOM in place.
       Lines are matched by the row's stable data-key (item.key), not its numeric
       line index, because removing any line shifts every later line's index. */
    function applyCart(cart) {
      if (cart.item_count === 0) {
        /* Rendering the full empty-cart state requires the section's server-side
           markup; reloading here is an intentional, narrow exception to the
           "no reload" rule for the last-item-removed edge case only. */
        window.location.reload();
        return;
      }

      body.querySelectorAll('.vamas-cart-item').forEach(function (row) {
        var key = row.dataset.key;
        var match = null;
        var newLine = 0;
        for (var i = 0; i < cart.items.length; i++) {
          if (cart.items[i].key === key) { match = cart.items[i]; newLine = i + 1; break; }
        }
        if (!match) { row.remove(); return; }

        row.dataset.line = newLine;
        row.querySelectorAll('[data-line]').forEach(function (el) { el.dataset.line = newLine; });

        var qtyInput = row.querySelector('.vamas-cart-qty-num');
        if (qtyInput) qtyInput.value = match.quantity;
        var rowSubtotalEl = row.querySelector('.vamas-cart-ci-subtotal');
        if (rowSubtotalEl) rowSubtotalEl.textContent = vamasFormatMoney(match.final_line_price);
      });

      if (countBadgeEl) countBadgeEl.textContent = cart.item_count + ' ' + itemsLabel;
      if (itemCountTextEl) itemCountTextEl.textContent = cart.item_count + ' ' + itemsLabel;
      if (subtotalEl) subtotalEl.textContent = vamasFormatMoney(cart.original_total_price);
      if (totalValueEl) totalValueEl.textContent = vamasFormatMoney(cart.total_price);

      if (discountRowEl && discountValueEl) {
        if (cart.total_discount > 0) {
          discountRowEl.style.display = '';
          discountValueEl.textContent = '− ' + vamasFormatMoney(cart.total_discount);
        } else {
          discountRowEl.style.display = 'none';
        }
      }

      if (fdelBox && fdelThreshold > 0) {
        var remaining = fdelThreshold - cart.total_price;
        if (remaining <= 0) {
          fdelBox.style.display = 'none';
          if (fdelSuccess) fdelSuccess.style.display = 'block';
        } else {
          fdelBox.style.display = '';
          if (fdelSuccess) fdelSuccess.style.display = 'none';
          if (fdelAmount) fdelAmount.textContent = vamasFormatMoney(remaining);
          if (fdelFill) fdelFill.style.width = Math.min(100, (cart.total_price * 100) / fdelThreshold) + '%';
        }
      }

      updateVamasCartBadge(cart.item_count);
    }

    function changeLine(line, quantity) {
      fetch('/cart/change.js', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ line: line, quantity: quantity })
      })
        .then(function (res) { return res.json(); })
        .then(applyCart)
        .catch(function (err) { console.error('Vamas: cart update failed', err); });
    }

    /* Delegated listeners survive row updates/removals (no rebinding needed) */
    body.addEventListener('click', function (e) {
      var minus = e.target.closest('.vamas-cart-qty-minus');
      var plus = e.target.closest('.vamas-cart-qty-plus');
      var remove = e.target.closest('.vamas-cart-ci-remove-btn, .vamas-cart-remove-btn');

      if (minus) {
        var inputMinus = body.querySelector('.vamas-cart-qty-num[data-line="' + minus.dataset.line + '"]');
        changeLine(minus.dataset.line, Math.max(0, (parseInt(inputMinus.value, 10) || 1) - 1));
      } else if (plus) {
        var inputPlus = body.querySelector('.vamas-cart-qty-num[data-line="' + plus.dataset.line + '"]');
        changeLine(plus.dataset.line, Math.min(10, (parseInt(inputPlus.value, 10) || 1) + 1));
      } else if (remove) {
        changeLine(remove.dataset.line, 0);
      }
    });

    body.addEventListener('change', function (e) {
      if (e.target.classList.contains('vamas-cart-qty-num')) {
        changeLine(e.target.dataset.line, Math.max(0, parseInt(e.target.value, 10) || 0));
      }
    });

    /* Discount code: Shopify applies real discount codes via its /discount/<code> redirect endpoint.
       This substitutes the mockup's localStorage-based VamasCoupon logic, which has no
       real-Shopify equivalent (see final report). */
    var couponBtn = document.getElementById('vamas-coupon-apply-btn');
    if (couponBtn) {
      couponBtn.addEventListener('click', function () {
        var input = document.getElementById('vamas-coupon-input');
        var code = (input.value || '').trim();
        if (!code) return;
        var cartUrl = this.dataset.cartUrl || '/cart';
        window.location.href = '/discount/' + encodeURIComponent(code) + '?redirect=' + encodeURIComponent(cartUrl);
      });
    }
  }

  /* ---- RELATED / RECOMMENDED PRODUCTS (fetched client-side) ---- */
  function initRelatedProducts() {
    document.querySelectorAll('#vamas-related-products, #vamas-cart-related').forEach(function (mount) {
      var baseUrl = mount.dataset.url;
      var productId = mount.dataset.productId;
      if (!baseUrl) return;
      var url = baseUrl + '?section_id=vamas-related-products' + (productId ? '&product_id=' + productId : '') + '&limit=4';
      fetch(url, { credentials: 'same-origin' })
        .then(function (res) { return res.text(); })
        .then(function (html) {
          var wrap = document.createElement('div');
          wrap.innerHTML = html;
          var section = wrap.querySelector('.vamas-related-section');
          if (section) {
            mount.replaceWith(section);
            /* Newly injected product cards have their own .vamas-atc forms —
               wire them up now that they exist in the DOM (idempotent: forms
               already bound are skipped via the vamasAtcBound guard). */
            initProductCardForms();
          }
        })
        .catch(function (err) { console.error('Vamas: related products fetch failed', err); });
    });
  }

  /* ---- COLLECTION PAGE: mobile filter sidebar toggle ---- */
  function initCollectionMobileFilter() {
    var btn = document.getElementById('vamas-mob-filter-btn');
    var sidebar = document.getElementById('vamas-collection-sidebar');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', function () {
      sidebar.classList.toggle('mob-open');
    });
  }

  function init() {
    initHamburger();
    initWishlist();
    syncCartBadge();
    initWhatsappWidget();
    initProductPage();
    initProductCardForms();
    initCartPage();
    initRelatedProducts();
    initCollectionMobileFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
