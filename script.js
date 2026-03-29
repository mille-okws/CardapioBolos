/**
 * ATELIE DE BOLOS — pedidos.js
 * Versão: 2.2 - O Retorno da Cobertura ✨
 */

// ─── ESTADO ───────────────────────────────────────────────────────
var state = {
    cake:    { tamanho: null, massa: null, recheio: null, cobertura: null },
    doce:    { tamanho: null, tipo: null },
    salgado: { tamanho: null, tipo: null }
};

var cart          = JSON.parse(localStorage.getItem('atelie_cart') || '[]');
var autoAddTimer  = null;
var mode          = 'preview';

// ─── LEITURA DO DOM ───────────────────────────────────────────────
function getItemName(el) {
    return (el.querySelector('.item-info span') || {}).innerText || 'Item';
}

function getItemPrice(el) {
    var txt   = ((el.querySelector('.preco') || {}).innerText || '0');
    var match = txt.match(/[\d]+([.,]\d+)?/);
    return match ? parseFloat(match[0].replace(',', '.')) : 0;
}

function getItemType(el) {
    if (el.closest('.tamanhos') || el.closest('.caixas')) return 'tamanho';
    if (el.closest('.massas'))                            return 'massa';
    if (el.closest('.recheios'))                          return 'recheio';
    if (el.closest('.coberturas'))                        return 'cobertura';
    return 'tipo';
}

function getItemCategory(el) {
    if (el.closest('.bolos'))    return 'cake';
    if (el.closest('.doces'))    return 'doce';
    if (el.closest('.salgados')) return 'salgado';
    return null;
}

// ─── SELECAO ──────────────────────────────────────────────────────
function onItemClick(el) {
    var category = getItemCategory(el);
    var type     = getItemType(el);
    if (!category || !type) return;

    if (mode === 'cart') switchToPreview();

    if (autoAddTimer) { clearTimeout(autoAddTimer); autoAddTimer = null; }

    state[category][type] = { name: getItemName(el), price: getItemPrice(el) };

    var group = el.parentElement;
    if (group) {
        group.querySelectorAll('.item').forEach(function(i) {
            i.classList.remove('selected-item');
        });
    }
    el.classList.add('selected-item');

    renderPreview();
}

// ─── VERIFICADORES ────────────────────────────────────────────────
function isComplete() {
    if (state.cake.tamanho || state.cake.massa || state.cake.recheio || state.cake.cobertura) {
        // Agora exigimos a cobertura também para considerar o bolo pronto!
        return !!(state.cake.tamanho && state.cake.massa && state.cake.recheio && state.cake.cobertura);
    }
    if (state.doce.tamanho || state.doce.tipo) {
        return !!(state.doce.tamanho && state.doce.tipo);
    }
    if (state.salgado.tamanho || state.salgado.tipo) {
        return !!(state.salgado.tamanho && state.salgado.tipo);
    }
    return false;
}

function isBuildingAnything() {
    return !!(
        state.cake.tamanho    || state.cake.massa   || state.cake.recheio || state.cake.cobertura ||
        state.doce.tamanho    || state.doce.tipo     ||
        state.salgado.tamanho || state.salgado.tipo
    );
}

function getMissing() {
    if (state.cake.tamanho || state.cake.massa || state.cake.recheio || state.cake.cobertura) {
        var m = [];
        if (!state.cake.tamanho)   m.push('tamanho');
        if (!state.cake.massa)     m.push('massa');
        if (!state.cake.recheio)   m.push('recheio');
        if (!state.cake.cobertura) m.push('cobertura'); // Cobertura adicionada à lista de faltas
        return m;
    }
    if (state.doce.tamanho || state.doce.tipo) {
        var m = [];
        if (!state.doce.tamanho) m.push('caixa');
        if (!state.doce.tipo)    m.push('tipo do doce');
        return m;
    }
    if (state.salgado.tamanho || state.salgado.tipo) {
        var m = [];
        if (!state.salgado.tamanho) m.push('quantidade');
        if (!state.salgado.tipo)    m.push('tipo');
        return m;
    }
    return [];
}

function getSummary() {
    var s = [];
    if (state.cake.tamanho)    s.push('🎂 ' + state.cake.tamanho.name);
    if (state.cake.massa)      s.push('🍞 ' + state.cake.massa.name);
    if (state.cake.recheio)    s.push('🍯 ' + state.cake.recheio.name);
    if (state.cake.cobertura)  s.push('✨ ' + state.cake.cobertura.name);
    if (state.doce.tamanho)    s.push('🍬 ' + state.doce.tamanho.name);
    if (state.doce.tipo)       s.push('✨ ' + state.doce.tipo.name);
    if (state.salgado.tamanho) s.push('🥟 ' + state.salgado.tamanho.name);
    if (state.salgado.tipo)    s.push('🔥 ' + state.salgado.tipo.name);
    return s;
}

function getSubtotal() {
    var t = 0;
    Object.values(state.cake).forEach(function(v)    { if (v) t += v.price || 0; });
    Object.values(state.doce).forEach(function(v)    { if (v) t += v.price || 0; });
    Object.values(state.salgado).forEach(function(v) { if (v) t += v.price || 0; });
    return t;
}

// ─── RENDER PREVIEW ───────────────────────────────────────────────
function switchToPreview() {
    mode = 'preview';
    var el = document.querySelector('.carrinho');
    if (!el) return;
    el.innerHTML =
        '<h2>Seu Pedido </h2>' +
        '<p id="preview-text">Escolha os itens acima!</p>' +
        '<div class="preco" id="preview-subtotal">Subtotal: R$ 0,00</div>';
    adjustPadding();
}

function renderPreview() {
    if (mode !== 'preview') return;

    var textEl     = document.getElementById('preview-text');
    var subtotalEl = document.getElementById('preview-subtotal');
    if (!textEl || !subtotalEl) return;

    if (!isBuildingAnything()) {
        textEl.innerText     = 'Escolha os itens acima! ✨';
        subtotalEl.innerText = 'Subtotal: R$ 0,00';
        return;
    }

    var summary  = getSummary();
    var missing  = getMissing();
    var subtotal = getSubtotal();

    subtotalEl.innerText = 'Subtotal: R$ ' + subtotal.toFixed(2).replace('.', ',');

    if (missing.length > 0) {
        textEl.innerHTML = summary.join(' | ') +
            '<br><small style="color:#ffb3b3">⚠️ Falta: ' + missing.join(', ') + '</small>';
    } else {
        textEl.innerHTML = summary.join(' | ') +
            '<br><small style="color:#b3ffcc">✅ Adicionando ao pedido...</small>';
        autoAddTimer = setTimeout(addItem, 900);
    }
}

// ─── ADICIONAR ITEM ───────────────────────────────────────────────
function addItem() {
    autoAddTimer = null;
    var item = null;

    // Verificação completa incluindo cobertura
    if (state.cake.tamanho && state.cake.massa && state.cake.recheio && state.cake.cobertura) {
        item = {
            id:    crypto.randomUUID(),
            emoji: '🎂',
            name:  'Bolo ' + state.cake.tamanho.name + ' · ' + state.cake.massa.name + ' · ' + state.cake.recheio.name + ' · ' + state.cake.cobertura.name,
            price: Object.values(state.cake).reduce(function(a, v) { return a + (v ? v.price || 0 : 0); }, 0)
        };
        state.cake = { tamanho: null, massa: null, recheio: null, cobertura: null };
    }
    else if (state.doce.tamanho && state.doce.tipo) {
        item = {
            id:    crypto.randomUUID(),
            emoji: '🍬',
            name:  state.doce.tamanho.name + ' de ' + state.doce.tipo.name,
            price: (state.doce.tamanho.price || 0) + (state.doce.tipo.price || 0)
        };
        state.doce = { tamanho: null, tipo: null };
    }
    else if (state.salgado.tamanho && state.salgado.tipo) {
        item = {
            id:    crypto.randomUUID(),
            emoji: '🥟',
            name:  state.salgado.tamanho.name + ' de ' + state.salgado.tipo.name,
            price: (state.salgado.tamanho.price || 0) + (state.salgado.tipo.price || 0)
        };
        state.salgado = { tamanho: null, tipo: null };
    }
    else {
        return;
    }

    cart.push(item);
    localStorage.setItem('atelie_cart', JSON.stringify(cart));

    document.querySelectorAll('.selected-item').forEach(function(el) {
        el.style.transition  = 'background 0.3s, border-color 0.3s';
        el.style.background  = 'rgba(76,175,80,0.2)';
        el.style.borderColor = '#4caf50';
    });
    setTimeout(function() {
        document.querySelectorAll('.item').forEach(function(el) {
            el.classList.remove('selected-item');
            el.style.background  = '';
            el.style.borderColor = '';
        });
        renderCart();
    }, 600);
}

// ─── RENDER CART ──────────────────────────────────────────────────
function renderCart() {
    mode = 'cart';
    var el = document.querySelector('.carrinho');
    if (!el) return;

    var total = cart.reduce(function(a, i) { return a + i.price; }, 0);
    var rows  = cart.map(function(item) {
        return '<div class="cart-row" id="crow-' + item.id + '">' +
                   '<span class="cart-name">' + (item.emoji || '🧁') + ' ' + item.name + '</span>' +
                   '<div class="cart-actions-row">' +
                       '<strong>R$ ' + item.price.toFixed(2).replace('.', ',') + '</strong>' +
                       '<button class="btn-del" onclick="askRemove(\'' + item.id + '\')">🗑️</button>' +
                   '</div>' +
               '</div>';
    }).join('');

    el.innerHTML =
        '<h2>Meu Pedido</h2>' +
        '<div class="cart-list">' + rows + '</div>' +
        '<div class="cart-footer">' +
            '<div class="preco-total">Total: R$ ' + total.toFixed(2).replace('.', ',') + '</div>' +
            '<div class="cart-btns">' +
                '<button class="btn-secondary" onclick="addMore()">+ Adicionar</button>' +
                '<button class="btn-whatsapp" onclick="askFinish()">Finalizar 📱</button>' +
            '</div>' +
        '</div>';

    adjustPadding();
}

// ─── ACOES DO CART ────────────────────────────────────────────────
function addMore() {
    switchToPreview();
}

function askRemove(id) {
    var row = document.getElementById('crow-' + id);
    if (!row) return;
    row.style.background = 'rgba(255,77,77,0.15)';
    row.innerHTML =
        '<span style="color:#ffb3b3;font-size:.9rem">Remover este item?</span>' +
        '<div style="display:flex;gap:8px">' +
            '<button class="btn-del-confirm" onclick="doRemove(\'' + id + '\')">Sim</button>' +
            '<button class="btn-cancel-confirm" onclick="renderCart()">Nao</button>' +
        '</div>';
}

function doRemove(id) {
    cart = cart.filter(function(i) { return i.id !== id; });
    localStorage.setItem('atelie_cart', JSON.stringify(cart));
    if (cart.length === 0) switchToPreview(); else renderCart();
}

function askFinish() {
    var footer = document.querySelector('.cart-footer');
    if (!footer) return;
    var total = cart.reduce(function(a, i) { return a + i.price; }, 0);
    footer.innerHTML =
        '<div class="confirm-box">' +
            '<p>📋 Enviar <strong>' + cart.length + ' item(s)</strong> pelo WhatsApp?</p>' +
            '<p class="confirm-total">Total: R$ ' + total.toFixed(2).replace('.', ',') + '</p>' +
            '<div class="cart-btns" style="margin-top:10px">' +
                '<button class="btn-secondary" style="flex:1" onclick="renderCart()">Voltar</button>' +
                '<button class="btn-whatsapp" style="flex:2" onclick="sendWhatsApp()">Confirmar ✅</button>' +
            '</div>' +
        '</div>';
    adjustPadding();
}

function sendWhatsApp() {
    if (!cart.length) return;
    var msg   = '🧁 *Novo Pedido - Atelie de Bolos*\n\n';
    var total = 0;
    cart.forEach(function(item, i) {
        msg   += '*' + (i + 1) + '. ' + item.name + '*\n   R$ ' + item.price.toFixed(2).replace('.', ',') + '\n\n';
        total += item.price;
    });
    msg += '💰 *TOTAL: R$ ' + total.toFixed(2).replace('.', ',') + '*';
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}

// ─── NAVEGACAO POR CATEGORIA ──────────────────────────────────────
function showSection(label) {
    var map   = { bolo: 'bolos', doce: 'doces', salgado: 'salgados' };
    var lower = label.toLowerCase();
    Object.keys(map).forEach(function(key) {
        var cls = map[key];
        var sec = document.querySelector('.' + cls);
        if (!sec) return;
        var show = lower.includes(key) || lower.includes(cls);
        sec.style.display = show ? '' : 'none';
        if (show) sec.scrollIntoView({ behavior: 'smooth' });
    });
}

// ─── PADDING DINAMICO ─────────────────────────────────────────────
function adjustPadding() {
    var el = document.querySelector('.carrinho');
    if (el) document.body.style.paddingBottom = (el.offsetHeight + 30) + 'px';
}

// ─── INIT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    var s = document.createElement('style');
    s.innerHTML = [
        '#preview-text { margin: 8px 0; color: white; font-size: .95rem; line-height: 1.5; }',
        '#preview-subtotal { display:inline-block; background:white; color:#5d4037; padding:4px 15px; border-radius:20px; font-weight:bold; font-size:.95rem; margin-top:4px; }',
        '.cart-list { max-height:35vh; overflow-y:auto; margin-bottom:12px; padding-right:4px; }',
        '.cart-list::-webkit-scrollbar { width:4px; }',
        '.cart-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,.3); border-radius:4px; }',
        '.cart-row { display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,.08); padding:10px 12px; border-radius:10px; margin-bottom:8px; color:white; font-size:.9rem; transition:background .2s; }',
        '.cart-row:hover { background:rgba(255,255,255,.13); }',
        '.cart-name { flex:1; margin-right:10px; line-height:1.3; }',
        '.cart-actions-row { display:flex; align-items:center; gap:6px; white-space:nowrap; }',
        '.cart-footer { border-top:1px solid rgba(255,255,255,.15); padding-top:12px; }',
        '.preco-total { background:white; color:#5d4037; padding:10px; border-radius:10px; text-align:center; font-size:1.3rem; font-weight:bold; margin-bottom:10px; }',
        '.cart-btns { display:flex; gap:10px; }',
        '.btn-whatsapp { padding:12px; border:none; border-radius:10px; background:#25d366; color:white; font-weight:bold; cursor:pointer; flex:2; }',
        '.btn-whatsapp:hover { background:#1ebe5d; }',
        '.btn-secondary { padding:12px; border:none; border-radius:10px; background:rgba(255,255,255,.15); color:white; font-weight:bold; cursor:pointer; flex:1; }',
        '.btn-secondary:hover { background:rgba(255,255,255,.25); }',
        '.btn-del { background:none; border:none; color:#ff8080; cursor:pointer; font-size:1.1rem; padding:4px 8px; border-radius:6px; }',
        '.btn-del:hover { background:rgba(255,77,77,.2); }',
        '.btn-del-confirm { padding:6px 14px; border:none; border-radius:8px; background:#ff4d4d; color:white; font-weight:bold; cursor:pointer; font-size:.85rem; }',
        '.btn-cancel-confirm { padding:6px 14px; border:none; border-radius:8px; background:rgba(255,255,255,.15); color:white; font-weight:bold; cursor:pointer; font-size:.85rem; }',
        '.confirm-box { background:rgba(255,255,255,.1); border-radius:12px; padding:15px; text-align:center; color:white; }',
        '.confirm-box p { margin-bottom:4px; }',
        '.confirm-total { font-size:1.3rem; font-weight:bold; color:#b3ffcc; }',
        '.selected-item { border:2px solid #ff85a2 !important; background:rgba(255,133,162,.12) !important; transform:translateY(-4px) !important; }',
        '.item { cursor:pointer; user-select:none; }',
        '.item:focus-visible { outline:2px solid #ff85a2; outline-offset:4px; }'
    ].join('');
    document.head.appendChild(s);

    var carrinho = document.querySelector('.carrinho');
    if (carrinho) {
        new MutationObserver(adjustPadding)
            .observe(carrinho, { childList: true, subtree: true });
    }
    adjustPadding();
    window.addEventListener('resize', adjustPadding);

    if (cart.length > 0) {
        renderCart();
    } else {
        switchToPreview();
    }

    document.querySelectorAll('.item').forEach(function(item) {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.addEventListener('click', function() { onItemClick(item); });
        item.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onItemClick(item); }
        });
    });

    document.querySelectorAll('.card').forEach(function(card) {
        card.addEventListener('click', function() {
            var h2 = card.querySelector('h2');
            if (h2) showSection(h2.innerText);
        });
    });
});