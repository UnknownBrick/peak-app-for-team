const items = window.GPO_ITEMS || [];
const state = { category: 'Tümü', query: '', sort: 'value-desc', give: [], receive: [] };
const fmt = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const $ = (id) => document.getElementById(id);
const categories = ['Tümü', ...new Set(items.map((item) => item.category))];
const mepsFields = ['cooldowns', 'damage', 'range', 'solo', 'boss', 'seaBeast', 'eou'];
const mepsLabels = { cooldowns: 'Cooldowns', damage: 'Damage', range: 'Range', solo: 'Solo', boss: 'Boss', seaBeast: 'Sea Beast', eou: 'EOU' };
const gradeOptions = ['S++', 'S+', 'S', 'S-', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
const mepsDefaults = [
  { id: 'magu', name: 'Magu', cooldowns: 'S', damage: 'S', range: 'A', solo: 'A-', boss: 'B+', seaBeast: 'S+', eou: 'S' },
  { id: 'buddha', name: 'Buddha', cooldowns: 'A+', damage: 'A+', range: 'B', solo: 'A', boss: 'A+', seaBeast: 'C-', eou: 'S' },
  { id: 'dragon', name: 'Dragon', cooldowns: 'A', damage: 'S/S+', damageNote: 'potential: S++', range: 'A+', solo: 'S', boss: 'S', seaBeast: 'S', eou: 'A' },
  { id: 'leopard', name: 'Leopard', cooldowns: 'S', damage: 'B+', range: 'B+', solo: 'C+', boss: 'B-', seaBeast: 'B-', eou: 'B-' },
  { id: 'venom', name: 'Venom', cooldowns: 'A', damage: 'S', range: 'B', solo: 'S', boss: 'S+', seaBeast: 'C', eou: 'S+' },
  { id: 'pika-v2', name: 'Pika V2', cooldowns: 'B+', damage: 'S', range: 'A', solo: 'S+', boss: 'S+', seaBeast: 'A+', eou: 'A+' }
];
let mepsEditing = false;
let mepsItems = loadMeps();

function loadMeps() { try { const saved = JSON.parse(localStorage.getItem('gpo-meps-v1')); return Array.isArray(saved) && saved.length ? saved : structuredClone(mepsDefaults); } catch { return structuredClone(mepsDefaults); } }
function saveMeps() { localStorage.setItem('gpo-meps-v1', JSON.stringify(mepsItems)); }
function gradeColor(grade) { const g = grade.charAt(0); return g === 'S' ? '#55c7ff' : g === 'A' ? '#71a9ff' : g === 'B' ? '#d7dcff' : g === 'C' ? '#ffd166' : '#ff8585'; }
function gradeSelect(item, field) { const current = item[field]; const options = [...new Set([current, ...gradeOptions])]; return `<select data-meps-id="${item.id}" data-meps-field="${field}" aria-label="${item.name} ${mepsLabels[field]}">${options.map((grade) => `<option ${grade === current ? 'selected' : ''}>${grade}</option>`).join('')}</select>`; }
function renderMeps() {
  $('mepsList').classList.toggle('editing', mepsEditing);
  $('toggleMepsEdit').textContent = mepsEditing ? 'Düzenlemeyi bitir' : 'Puanları düzenle';
  $('mepsList').innerHTML = mepsItems.map((item) => `<div class="meps-row">
    <div class="meps-fruit"><strong>${item.name}</strong><small>${item.custom ? 'Özel fruit' : 'MEPS profili'}</small></div>
    ${mepsFields.map((field) => `<div class="grade-cell" data-label="${mepsLabels[field]}" style="--grade-color:${gradeColor(item[field])}">${mepsEditing ? gradeSelect(item, field) : `<span>${item[field]}</span>${field === 'damage' && item.damageNote ? `<small>${item.damageNote}</small>` : ''}`}</div>`).join('')}
    <button class="meps-delete" data-delete-fruit="${item.id}" aria-label="${item.name} fruitini sil">×</button>
  </div>`).join('');
}
function setupFruitDialog() {
  $('newFruitGrades').innerHTML = mepsFields.map((field) => `<label class="new-grade"><span>${mepsLabels[field]}</span><select name="${field}">${gradeOptions.map((grade) => `<option ${grade === 'B' ? 'selected' : ''}>${grade}</option>`).join('')}</select></label>`).join('');
}

function formatValue(item) { return item.rawValue || fmt.format(item.value); }
function shortCategory(value) {
  const map = {
    'Gamepass / paid items / ASE skins / utility / boats': 'Gamepass & utility',
    'Weapons and general drops': 'Silahlar & drops',
    'Boss / Kraken / Sea Beast / fishing': 'Boss & fishing',
    'Easter / gift items': 'Easter & gifts',
    'Christmas / anniversary / recent items': 'Christmas & recent',
    'Videoda adı yazılmayan üç görsel': 'İsimsiz görseller'
  };
  return map[value] || value;
}

function renderCategories() {
  $('categoryFilters').innerHTML = categories.map((cat) => `<button class="category-btn ${cat === state.category ? 'active' : ''}" data-category="${cat.replaceAll('"', '&quot;')}">${shortCategory(cat)}${cat === 'Tümü' ? ` · ${items.length}` : ''}</button>`).join('');
}

function demandHTML(demand) {
  if (demand == null) return '<span class="demand-empty">—</span>';
  return `<div class="demand" aria-label="Talep ${demand}/10">${Array.from({ length: 5 }, (_, i) => `<i class="${i < Math.ceil(demand / 2) ? 'on' : ''}"></i>`).join('')}</div>`;
}

function filteredItems() {
  const query = state.query.toLocaleLowerCase('tr');
  return items.filter((item) => (state.category === 'Tümü' || item.category === state.category) && (!query || `${item.name} ${item.note}`.toLocaleLowerCase('tr').includes(query))).sort((a, b) => {
    if (state.sort === 'value-asc') return a.value - b.value;
    if (state.sort === 'name-asc') return a.name.localeCompare(b.name, 'tr');
    if (state.sort === 'demand-desc') return (b.demand ?? -1) - (a.demand ?? -1) || b.value - a.value;
    return b.value - a.value;
  });
}

function renderList() {
  const visible = filteredItems();
  $('itemList').innerHTML = visible.map((item) => `<div class="item-row">
    <div class="item-name"><strong>${item.name}</strong>${item.note !== '—' ? `<small>${item.note}</small>` : ''}</div>
    <span class="category-tag">${shortCategory(item.category)}</span>
    ${demandHTML(item.demand)}
    <span class="value">${formatValue(item)}</span>
    <button class="add-btn" data-add="${item.id}" aria-label="${item.name} eşyanı trade'e ekle" title="Trade'e ekle">+</button>
  </div>`).join('');
  $('emptyState').hidden = visible.length > 0;
  $('itemCount').textContent = visible.length;
}

function switchView(name) {
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === name));
  document.querySelectorAll('.view-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function addItem(side, id) {
  const selected = items.find((item) => item.id === Number(id));
  const existing = state[side].find((entry) => entry.id === selected.id);
  if (existing) existing.qty += 1; else state[side].push({ id: selected.id, qty: 1 });
  renderTrade();
}

function total(side) { return state[side].reduce((sum, entry) => sum + items.find((item) => item.id === entry.id).value * entry.qty, 0); }

function renderSide(side) {
  const target = side === 'give' ? $('giveItems') : $('receiveItems');
  target.innerHTML = state[side].map((entry) => {
    const item = items.find((candidate) => candidate.id === entry.id);
    return `<div class="trade-item">
      <div class="trade-item-name"><strong>${item.name}</strong><small>${fmt.format(item.value * entry.qty)}</small></div>
      <div class="qty"><button data-side="${side}" data-id="${entry.id}" data-delta="-1" aria-label="Azalt">−</button><span>${entry.qty}</span><button data-side="${side}" data-id="${entry.id}" data-delta="1" aria-label="Artır">+</button></div>
      <button class="remove-btn" data-remove-side="${side}" data-remove-id="${entry.id}" aria-label="Kaldır">×</button>
    </div>`;
  }).join('');
  $(side === 'give' ? 'giveEmpty' : 'receiveEmpty').hidden = state[side].length > 0;
}

function renderTrade() {
  renderSide('give'); renderSide('receive');
  const give = total('give'), receive = total('receive'), diff = receive - give;
  $('giveTotal').textContent = fmt.format(give);
  $('receiveTotal').textContent = fmt.format(receive);
  $('tradeCount').textContent = state.give.reduce((s, e) => s + e.qty, 0) + state.receive.reduce((s, e) => s + e.qty, 0);
  const hasBoth = give > 0 && receive > 0;
  const pct = hasBoth ? Math.abs(diff) / Math.max(give, receive) * 100 : 100;
  let label = 'Henüz trade yok', icon = '=', hint = 'İki tarafa da eşya ekleyerek başla.', color = 'var(--accent)';
  if (hasBoth && pct <= 5) { label = 'Dengeli trade'; icon = '≈'; hint = `%${pct.toFixed(1)} değer farkı`; }
  else if (hasBoth && diff > 0) { label = 'Senin lehine'; icon = '↗'; hint = `%${pct.toFixed(1)} daha fazla alıyorsun`; color = 'var(--blue)'; }
  else if (hasBoth) { label = 'Karşı tarafın lehine'; icon = '↘'; hint = `%${pct.toFixed(1)} daha fazla veriyorsun`; color = 'var(--red)'; }
  else if (give || receive) { label = give ? 'Alacağın taraf boş' : 'Vereceğin taraf boş'; icon = '!'; hint = 'Karşı tarafa da eşya ekle.'; }
  $('balanceLabel').textContent = label; $('balanceIcon').textContent = icon; $('balanceValue').textContent = `${fmt.format(Math.abs(diff))} fark`; $('balanceHint').textContent = hint;
  $('balanceIcon').style.color = color; $('balanceBar').style.background = color; $('balanceBar').style.width = hasBoth ? `${Math.max(5, Math.min(95, 50 + (diff / Math.max(give, receive)) * 45))}%` : '50%';
}

function setupPicker(side) {
  const input = $(side === 'give' ? 'giveSearch' : 'receiveSearch');
  const box = $(side === 'give' ? 'giveResults' : 'receiveResults');
  const show = () => {
    const q = input.value.toLocaleLowerCase('tr');
    const found = items.filter((item) => !q || item.name.toLocaleLowerCase('tr').includes(q)).sort((a, b) => b.value - a.value).slice(0, 8);
    box.innerHTML = found.map((item) => `<button class="picker-option" data-pick-side="${side}" data-pick-id="${item.id}"><span>${item.name}</span><small>${formatValue(item)}</small></button>`).join('');
    box.hidden = false;
  };
  input.addEventListener('focus', show); input.addEventListener('input', show);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') box.hidden = true;
    if (event.key === 'Enter' && !box.hidden) {
      const first = box.querySelector('[data-pick-id]');
      if (first) { event.preventDefault(); addItem(side, first.dataset.pickId); input.value = ''; box.hidden = true; }
    }
  });
}

function registerWebMCP() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const report = (error) => console.warn('WebMCP tool registration failed', error);
  try {
    void Promise.resolve(context.registerTool({
      name: 'search_values',
      title: 'GPO değerlerinde ara',
      description: 'İsimle GPO eşyalarını arar ve değer, kategori, talep bilgisini döndürür.',
      inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 20 } }, required: ['query'], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input.query !== 'string' || !input.query.trim()) throw new Error('query boş olamaz');
        const limit = Number.isInteger(input.limit) ? Math.min(20, Math.max(1, input.limit)) : 10;
        const query = input.query.toLocaleLowerCase('tr');
        return { results: items.filter((item) => item.name.toLocaleLowerCase('tr').includes(query)).slice(0, limit).map(({ name, value, rawValue, category, demand, note }) => ({ name, value, shownValue: rawValue, category, demand, note })) };
      }
    })).catch(report);
    void Promise.resolve(context.registerTool({
      name: 'set_trade_items',
      title: 'Trade listesini ayarla',
      description: 'Vereceğin ve alacağın eşya listelerini ayarlar, görünür hesaplayıcıyı günceller ve sonucu döndürür.',
      inputSchema: {
        type: 'object', additionalProperties: false,
        properties: {
          give: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, quantity: { type: 'integer', minimum: 1, maximum: 99 } }, required: ['name'], additionalProperties: false } },
          receive: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, quantity: { type: 'integer', minimum: 1, maximum: 99 } }, required: ['name'], additionalProperties: false } }
        }, required: ['give', 'receive']
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || !Array.isArray(input.give) || !Array.isArray(input.receive)) throw new Error('give ve receive listeleri gerekli');
        const resolve = (entries) => entries.map((entry) => {
          const match = items.find((item) => item.name.toLocaleLowerCase('tr') === String(entry.name).toLocaleLowerCase('tr'));
          if (!match) throw new Error(`Eşya bulunamadı: ${entry.name}`);
          const qty = entry.quantity ?? 1;
          if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new Error(`Geçersiz adet: ${entry.name}`);
          return { id: match.id, qty };
        });
        const give = resolve(input.give), receive = resolve(input.receive);
        state.give = give; state.receive = receive; renderTrade(); switchView('calculator');
        const giveTotal = total('give'), receiveTotal = total('receive');
        return { giveTotal, receiveTotal, difference: receiveTotal - giveTotal, result: Math.abs(receiveTotal - giveTotal) <= Math.max(giveTotal, receiveTotal) * .05 ? 'balanced' : receiveTotal > giveTotal ? 'your_favor' : 'their_favor' };
      }
    })).catch(report);
    void Promise.resolve(context.registerTool({
      name: 'upsert_meps_fruit',
      title: 'MEPS fruitini ekle veya güncelle',
      description: 'Fruit adını ve yedi MEPS puanını kaydeder; varsa fruiti günceller, yoksa yeni fruit ekler.',
      inputSchema: {
        type: 'object', additionalProperties: false,
        properties: {
          name: { type: 'string' }, cooldowns: { type: 'string' }, damage: { type: 'string' }, range: { type: 'string' }, solo: { type: 'string' }, boss: { type: 'string' }, seaBeast: { type: 'string' }, eou: { type: 'string' }
        }, required: ['name', 'cooldowns', 'damage', 'range', 'solo', 'boss', 'seaBeast', 'eou']
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input.name !== 'string' || !input.name.trim()) throw new Error('Fruit adı gerekli');
        for (const field of mepsFields) if (typeof input[field] !== 'string' || !input[field].trim()) throw new Error(`${mepsLabels[field]} puanı gerekli`);
        const existing = mepsItems.find((item) => item.name.toLocaleLowerCase('tr') === input.name.trim().toLocaleLowerCase('tr'));
        const fruit = existing || { id: `custom-${Date.now()}`, name: input.name.trim(), custom: true };
        mepsFields.forEach((field) => fruit[field] = input[field].trim());
        delete fruit.damageNote;
        if (!existing) mepsItems.push(fruit);
        saveMeps(); renderMeps(); switchView('meps');
        return { action: existing ? 'updated' : 'created', fruit: Object.fromEntries(['name', ...mepsFields].map((key) => [key, fruit[key]])) };
      }
    })).catch(report);
  } catch (error) { report(error); }
}

document.addEventListener('click', (event) => {
  const view = event.target.closest('[data-view]'); if (view) switchView(view.dataset.view);
  const cat = event.target.closest('[data-category]'); if (cat) { state.category = cat.dataset.category; renderCategories(); renderList(); }
  const add = event.target.closest('[data-add]'); if (add) { addItem('give', add.dataset.add); switchView('calculator'); }
  const pick = event.target.closest('[data-pick-id]'); if (pick) { addItem(pick.dataset.pickSide, pick.dataset.pickId); const input = $(pick.dataset.pickSide === 'give' ? 'giveSearch' : 'receiveSearch'); input.value = ''; pick.parentElement.hidden = true; input.focus(); }
  const qty = event.target.closest('[data-delta]'); if (qty) { const entry = state[qty.dataset.side].find((e) => e.id === Number(qty.dataset.id)); entry.qty += Number(qty.dataset.delta); if (entry.qty <= 0) state[qty.dataset.side] = state[qty.dataset.side].filter((e) => e !== entry); renderTrade(); }
  const remove = event.target.closest('[data-remove-id]'); if (remove) { state[remove.dataset.removeSide] = state[remove.dataset.removeSide].filter((e) => e.id !== Number(remove.dataset.removeId)); renderTrade(); }
  const delFruit = event.target.closest('[data-delete-fruit]'); if (delFruit && confirm(`${mepsItems.find((item) => item.id === delFruit.dataset.deleteFruit)?.name} silinsin mi?`)) { mepsItems = mepsItems.filter((item) => item.id !== delFruit.dataset.deleteFruit); saveMeps(); renderMeps(); }
  if (event.target.closest('[data-close-dialog]')) $('fruitDialog').close();
  if (!event.target.closest('.picker-wrap')) document.querySelectorAll('.picker-results').forEach((box) => box.hidden = true);
});
$('searchInput').addEventListener('input', (event) => { state.query = event.target.value; renderList(); });
$('sortSelect').addEventListener('change', (event) => { state.sort = event.target.value; renderList(); });
$('clearTrade').addEventListener('click', () => { state.give = []; state.receive = []; renderTrade(); });
$('toggleMepsEdit').addEventListener('click', () => { mepsEditing = !mepsEditing; renderMeps(); });
$('addFruitButton').addEventListener('click', () => { $('fruitForm').reset(); $('fruitDialog').showModal(); $('newFruitName').focus(); });
$('resetMeps').addEventListener('click', () => { mepsItems = structuredClone(mepsDefaults); saveMeps(); renderMeps(); });
$('mepsList').addEventListener('change', (event) => { const select = event.target.closest('[data-meps-field]'); if (!select) return; const item = mepsItems.find((entry) => entry.id === select.dataset.mepsId); item[select.dataset.mepsField] = select.value; if (select.dataset.mepsField === 'damage') delete item.damageNote; saveMeps(); renderMeps(); });
$('fruitForm').addEventListener('submit', (event) => { event.preventDefault(); const name = $('newFruitName').value.trim(); if (!name) return; const data = new FormData(event.currentTarget); const fruit = { id: `custom-${Date.now()}`, name, custom: true }; mepsFields.forEach((field) => fruit[field] = data.get(field)); mepsItems.push(fruit); saveMeps(); renderMeps(); $('fruitDialog').close(); });
document.addEventListener('keydown', (event) => { if (event.key === '/' && document.activeElement.tagName !== 'INPUT') { event.preventDefault(); switchView('values'); $('searchInput').focus(); } });
setupPicker('give'); setupPicker('receive'); setupFruitDialog(); renderCategories(); renderList(); renderTrade(); renderMeps(); registerWebMCP();

const tierSeed = () => ({ id: `list-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, title: 'Yeni Tier List', assets: [], tiers: [{id:'s',label:'S',color:'#ff6b6b',items:[]},{id:'a',label:'A',color:'#ffb84d',items:[]},{id:'b',label:'B',color:'#ffd86b',items:[]},{id:'c',label:'C',color:'#7ed6a4',items:[]},{id:'d',label:'D',color:'#74b9ff',items:[]} ]});
let tierLists = (() => { try { const s = JSON.parse(localStorage.getItem('gpo-tier-lists-v1')); return Array.isArray(s) && s.length ? s : [tierSeed()]; } catch { return [tierSeed()]; } })();
let activeListId = tierLists[0].id;
const activeList = () => tierLists.find((list) => list.id === activeListId) || tierLists[0];
const saveTierLists = () => localStorage.setItem('gpo-tier-lists-v1', JSON.stringify(tierLists));
const assetById = (list, id) => list.assets.find((asset) => asset.id === id);
function renderTierBuilder() {
  const list = activeList(); if (!list) return;
  $('listTabs').innerHTML = tierLists.map((entry) => `<button class="list-tab ${entry.id === activeListId ? 'active' : ''}" data-list-id="${entry.id}">${entry.title}<small>${entry.assets.length}</small></button>`).join('');
  $('activeListTitle').value = list.title; $('assetCount').textContent = list.assets.length; $('assetEmpty').hidden = list.assets.length > 0;
  $('assetPool').innerHTML = list.assets.map((asset) => `<div class="asset-card" draggable="true" data-asset-id="${asset.id}"><img src="${asset.src}" alt="${asset.name}"><button data-remove-asset="${asset.id}" aria-label="Görseli sil">×</button></div>`).join('');
  $('tierRows').innerHTML = list.tiers.map((tier) => `<div class="tier-row"><div class="tier-label" style="--tier-color:${tier.color}">${tier.label}</div><div class="tier-items" data-tier-id="${tier.id}">${tier.items.map((id) => { const asset = assetById(list,id); return asset ? `<div class="placed-asset" draggable="true" data-placed-asset="${asset.id}"><img src="${asset.src}" alt="${asset.name}"><button data-remove-placed="${asset.id}" aria-label="Tierdan çıkar">×</button></div>` : ''; }).join('')}</div></div>`).join('');
}
function removeAssetEverywhere(list, id) { list.assets = list.assets.filter((asset) => asset.id !== id); list.tiers.forEach((tier) => tier.items = tier.items.filter((itemId) => itemId !== id)); }
function moveAsset(list, assetId, tierId) { list.tiers.forEach((tier) => tier.items = tier.items.filter((id) => id !== assetId)); const target = list.tiers.find((tier) => tier.id === tierId); if (target) target.items.push(assetId); saveTierLists(); renderTierBuilder(); }
document.addEventListener('dragstart', (event) => { const source = event.target.closest('[data-asset-id],[data-placed-asset]'); if (source) event.dataTransfer.setData('text/plain', source.dataset.assetId || source.dataset.placedAsset); });
document.addEventListener('dragover', (event) => { const target = event.target.closest('.tier-items'); if (target) { event.preventDefault(); target.classList.add('drag-over'); } });
document.addEventListener('dragleave', (event) => { const target = event.target.closest('.tier-items'); if (target) target.classList.remove('drag-over'); });
document.addEventListener('drop', (event) => { const target = event.target.closest('.tier-items'); if (!target) return; event.preventDefault(); target.classList.remove('drag-over'); const id = event.dataTransfer.getData('text/plain'); if (id) moveAsset(activeList(), id, target.dataset.tierId); });
$('newListButton').addEventListener('click', () => { const list = tierSeed(); tierLists.push(list); activeListId = list.id; saveTierLists(); renderTierBuilder(); switchView('builder'); });
$('addTierButton').addEventListener('click', () => { const label = prompt('Tier adı?','Yeni'); if (!label?.trim()) return; const list = activeList(); list.tiers.push({id:`tier-${Date.now()}`,label:label.trim().slice(0,8),color:'#74b9ff',items:[]}); saveTierLists(); renderTierBuilder(); });
$('activeListTitle').addEventListener('change', (event) => { const title = event.target.value.trim(); if (title) { activeList().title = title; saveTierLists(); renderTierBuilder(); } });
$('deleteListButton').addEventListener('click', () => { if (tierLists.length < 2) return; if (!confirm('Bu tier list silinsin mi?')) return; tierLists = tierLists.filter((list) => list.id !== activeListId); activeListId = tierLists[0].id; saveTierLists(); renderTierBuilder(); });
$('listTabs').addEventListener('click', (event) => { const tab = event.target.closest('[data-list-id]'); if (tab) { activeListId = tab.dataset.listId; renderTierBuilder(); } });
$('assetPool').addEventListener('click', (event) => { const remove = event.target.closest('[data-remove-asset]'); if (remove) { removeAssetEverywhere(activeList(), remove.dataset.removeAsset); saveTierLists(); renderTierBuilder(); } });
$('tierRows').addEventListener('click', (event) => { const remove = event.target.closest('[data-remove-placed]'); if (remove) { const list = activeList(); list.tiers.forEach((tier) => tier.items = tier.items.filter((id) => id !== remove.dataset.removePlaced)); saveTierLists(); renderTierBuilder(); } });
$('assetUpload').addEventListener('change', async (event) => { const list = activeList(); for (const file of event.target.files) { if (!file.type.startsWith('image/')) continue; const src = await new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsDataURL(file); }); list.assets.push({id:`asset-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,name:file.name,src}); } saveTierLists(); renderTierBuilder(); event.target.value = ''; });
renderTierBuilder();
