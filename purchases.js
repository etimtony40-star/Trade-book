/* TradeBook purchases, stock and profit & loss add-on. Load AFTER script.js (and financing.js) */
(function(){
const key=n=>String(n||'').trim().toLowerCase(),pct=n=>(Math.round(n*10)/10).toLocaleString('en-NG')+'%';
const buys=()=>S.buys||(S.buys=[]),prods=()=>S.prods||(S.prods={}),exps=()=>S.exps||(S.exps=[]);
const bought=k=>buys().filter(b=>key(b.name)===k),avg=k=>{const a=bought(k),q=a.reduce((x,b)=>x+b.qty,0);return q?a.reduce((x,b)=>x+b.qty*b.cost,0)/q:0};
const soldQ=k=>S.docs.filter(d=>!d.ref).reduce((a,d)=>a+d.items.filter(i=>key(i.d)===k).reduce((x,i)=>x+(+i.q||0),0),0);
const info=k=>{const p=prods()[k];if(!p)return null;const c=avg(k),q=bought(k).reduce((x,b)=>x+b.qty,0)-soldQ(k);return{name:p.name,mk:+p.mk||0,cost:c,price:c*(1+(+p.mk||0)/100),stock:q}};
const sale=d=>{const m=1-(+d.disc||0)/100;return d.items.map(i=>{const q=+i.q||0,k=key(i.d),c=prods()[k]?avg(k)*q:null;return{k,name:i.d||'Item',q,rev:q*(+i.p||0)*m,cost:c}})};

document.head.insertAdjacentHTML('beforeend','<style>.pf{color:var(--pri-d);font-weight:700}.ls{color:var(--bad);font-weight:700}.big b{font-size:26px}</style>');
document.querySelector('nav button[data-v=loan]').insertAdjacentHTML('afterend','<button data-v="buy">Purchases</button><button data-v="pl">Profit &amp; loss</button>');
$$('nav button[data-v=buy],nav button[data-v=pl]').forEach(b=>b.onclick=()=>go(b.dataset.v));
const th=a=>a.map(x=>`<th${/^(Qty|In|Avg|Profit|Sell|Stock|Cost|Total|Bought|Sold|Rev|Margin)/.test(x)?' class="r"':''}>${x}</th>`).join('');
$('#v-loan').insertAdjacentHTML('afterend',`<section id="v-buy" class="view"><h2>Purchases &amp; stock</h2><p class="sub">Record goods you buy to resell. Enter your profit percentage and TradeBook works out the selling price. Items sold on invoices come out of stock automatically.</p>
<div class="card f" style="margin-bottom:14px"><div class="row"><label>Product<input id="b-n" list="stk" placeholder="e.g. Bag of rice (50kg)"></label><label>Supplier<input id="b-s"></label></div>
<div class="row"><label>Quantity bought<input id="b-q" type="number" min="0" step="any"></label><label>Cost per unit (₦)<input id="b-c" type="number" min="0" step="any"></label></div>
<div class="row"><label>My profit percentage (%)<input id="b-m" type="number" min="0" step="any"></label><label>Date<input id="b-d" type="date"></label></div>
<p id="b-h" class="sub" style="margin:0"></p><div><button class="btn p" id="b-go">Record purchase</button></div></div>
<div class="card" style="margin-bottom:14px"><div class="hd"><b>Stock on hand</b><b id="b-val"></b></div><div class="tw"><table class="rt"><thead><tr>${th(['Product','In stock','Avg cost','Profit %','Selling price','Stock value',''])}</tr></thead><tbody id="b-rows"></tbody></table></div><div id="b-none" class="empty" hidden><h3>No stock yet</h3><p>Record your first purchase above.</p></div></div>
<div class="card"><div class="hd"><b>Purchase history</b></div><div class="tw"><table class="rt"><thead><tr>${th(['Date','Supplier','Product','Qty','Cost each','Total',''])}</tr></thead><tbody id="h-rows"></tbody></table></div></div></section>
<section id="v-pl" class="view"><h2>Profit &amp; loss</h2><p class="sub">Sales minus the cost of the goods you sold and your expenses. A loss shows in red.</p>
<div class="tools"><select id="pl-per" aria-label="Period"><option value="month">This month</option><option value="30">Last 30 days</option><option value="year">This year</option><option value="all">All time</option></select></div>
<div class="stats" id="pl-st"></div><div id="pl-res" class="card" style="margin-bottom:14px"></div>
<div class="card" style="margin-bottom:14px"><div class="hd"><b>Profit by product</b></div><div class="tw"><table class="rt"><thead><tr>${th(['Product','Sold','Revenue','Cost','Profit / loss','Profit % on cost'])}</tr></thead><tbody id="p-rows"></tbody></table></div><p id="p-note" class="sub" style="margin:10px 0 0"></p></div>
<div class="card f"><div class="hd"><b>Business expenses</b></div><div class="row"><label>What was it for?<input id="e-d" placeholder="e.g. Shop rent, transport"></label><label>Amount (₦)<input id="e-a" type="number" min="0" step="any"></label></div><div class="row"><label>Date<input id="e-t" type="date"></label><div style="align-self:end"><button class="btn p" id="e-go">Add expense</button></div></div>
<div class="tw"><table class="rt"><thead><tr>${th(['Date','Description','Amount',''])}</tr></thead><tbody id="e-rows"></tbody></table></div></div></section><datalist id="stk"></datalist>`);
['#b-rows','#h-rows','#p-rows','#e-rows'].forEach(id=>{const tb=$(id),t=tb.closest('table');new MutationObserver(()=>mobi(t)).observe(tb,{childList:true})});

const _go=go;go=function(v){_go(v);if(v==='buy')renderBuy();if(v==='pl')renderPL()};
const dl=()=>$('#stk').innerHTML=Object.values(prods()).map(p=>`<option value="${esc(p.name)}">`).join('');

/* purchases */
function hint(){const q=+$('#b-q').value||0,c=+$('#b-c').value||0,m=+$('#b-m').value||0,p=c*(1+m/100);$('#b-h').textContent=c>0?`Selling price: ${money(p)} per unit. Profit: ${money(p-c)} per unit (${pct(m)}). Total cost of this purchase: ${money(q*c)}.`:'Enter the cost and your profit percentage to see the selling price.'}
['#b-q','#b-c','#b-m'].forEach(i=>$(i).oninput=hint);
$('#b-n').oninput=e=>{const p=prods()[key(e.target.value)];if(p)$('#b-m').value=p.mk;hint()};
$('#b-go').onclick=()=>{const n=$('#b-n').value.trim(),q=+$('#b-q').value,c=+$('#b-c').value,m=+$('#b-m').value;
 if(!n)return toast('Enter the product name');if(!(q>0))return toast('Enter the quantity bought');if(!(c>=0)||$('#b-c').value==='')return toast('Enter the cost per unit');if(!(m>=0))return toast('Enter your profit percentage');
 buys().unshift({id:Date.now(),date:$('#b-d').value||today(),supplier:$('#b-s').value.trim(),name:n,qty:q,cost:c});
 const k=key(n);prods()[k]={name:(prods()[k]||{}).name||n,mk:m};save();['#b-n','#b-q','#b-c'].forEach(i=>$(i).value='');hint();renderBuy();toast('Purchase recorded. Selling price '+money(c*(1+m/100)))};
function renderBuy(){dl();if(!$('#b-d').value)$('#b-d').value=today();hint();
 const ks=Object.keys(prods());let val=0;$('#b-none').hidden=ks.length>0;
 $('#b-rows').innerHTML=ks.map(k=>{const i=info(k);val+=Math.max(0,i.stock)*i.cost;return`<tr><td><b>${esc(i.name)}</b></td><td class="r">${+i.stock.toFixed(2)}${i.stock<=0?' <span class="tag over">Out</span>':''}</td><td class="r">${money(i.cost)}</td><td class="r">${pct(i.mk)}</td><td class="r"><b>${money(i.price)}</b></td><td class="r">${money(Math.max(0,i.stock)*i.cost)}</td><td><div class="acts"><button class="btn s" data-mk="${esc(k)}">Change profit %</button></div></td></tr>`}).join('');
 $('#b-val').textContent=money(val);
 $('#h-rows').innerHTML=buys().map(b=>`<tr><td>${fd(b.date)}</td><td>${esc(b.supplier)||'-'}</td><td>${esc(b.name)}</td><td class="r">${b.qty}</td><td class="r">${money(b.cost)}</td><td class="r">${money(b.qty*b.cost)}</td><td><div class="acts"><button class="btn s d" data-del="${b.id}">Delete</button></div></td></tr>`).join('')}
$('#b-rows').onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.mk,p=prods()[k],v=prompt('Profit percentage for '+p.name+' (now '+p.mk+'%)',p.mk);if(v===null||!(+v>=0))return;p.mk=+v;save();renderBuy();toast('Selling price now '+money(info(k).price))};
$('#h-rows').onclick=e=>{const b=e.target.closest('button');if(!b||!confirm('Delete this purchase? Stock and costs will change.'))return;S.buys=buys().filter(x=>x.id!==+b.dataset.del);save();renderBuy()};

/* invoice editor: suggest products, fill price, show profit */
const _ri=renderItems;renderItems=function(){_ri();dl();$$('#items input[data-k=d]').forEach(i=>i.setAttribute('list','stk'))};
$('#items').addEventListener('input',e=>{const t=e.target;if(t.dataset.k!=='d')return;const p=info(key(t.value));if(!p||!prods()[key(t.value)])return;const it=cur.items[t.dataset.i];if(!(+it.p>0)){it.p=+p.price.toFixed(2);t.parentElement.querySelector('[data-k=p]').value=it.p;preview()}});
$('#save').parentElement.insertAdjacentHTML('beforebegin','<p class="sub" id="pf-hint" style="margin:0"></p>');
const _pv=preview;preview=function(){_pv();const el=$('#pf-hint');if(!el)return;const r=sale(cur).filter(x=>x.cost!=null),rev=r.reduce((a,x)=>a+x.rev,0),c=r.reduce((a,x)=>a+x.cost,0);
 if(!r.length||cur.type==='RCT'&&cur.ref){el.textContent='';return}const p=rev-c;el.innerHTML=`${p>=0?'Profit':'Loss'} on stocked items in this sale: <span class="${p>=0?'pf':'ls'}">${money(Math.abs(p))} (${pct(c?Math.abs(p)/c*100:0)} on cost)</span>`};

/* profit and loss */
function renderPL(){
 const v=$('#pl-per').value,t=today(),f=v==='month'?t.slice(0,8)+'01':v==='30'?addDays(t,-30):v==='year'?t.slice(0,4)+'-01-01':'';
 const docs=S.docs.filter(d=>!d.ref&&(!f||d.date>=f)),pm={};let rev=0,cost=0,nc=0;
 docs.forEach(d=>sale(d).forEach(x=>{rev+=x.rev;const k=x.cost==null?'~':x.k,r=pm[k]||(pm[k]={name:x.cost==null?'Items with no cost recorded':(prods()[k].name),q:0,rev:0,cost:0});r.q+=x.q;r.rev+=x.rev;r.cost+=x.cost||0;cost+=x.cost||0;if(x.cost==null)nc++}));
 const ex=exps().filter(e=>!f||e.date>=f),exT=ex.reduce((a,e)=>a+e.amt,0),gp=rev-cost,net=gp-exT;
 const st=(a,b)=>`<div class="card stat"><span>${a}</span><b>${b}</b></div>`;
 $('#pl-st').innerHTML=st('Sales (before VAT)',money(rev))+st('Cost of goods sold',money(cost))+st('Gross profit',money(gp))+st('Expenses',money(exT));
 $('#pl-res').className='card big';$('#pl-res').innerHTML=`<span class="sub" style="margin:0">${net>=0?'Net profit':'Net loss'}</span><br><b class="${net>=0?'pf':'ls'}">${money(Math.abs(net))}</b> <span class="tag ${net>=0?'paid':'over'}">${net>=0?'Profit':'Loss'}</span>
 <p class="sub" style="margin:8px 0 0">${rev?`Margin on sales: ${pct(net/rev*100)}.`:'No sales in this period.'} ${cost?`Gross profit on cost of goods: ${pct(gp/cost*100)}.`:''}</p>`;
 const rows=Object.values(pm).sort((a,b)=>b.rev-a.rev);
 $('#p-rows').innerHTML=rows.map(r=>{const p=r.rev-r.cost,pc=r.cost?p/r.cost*100:null;return`<tr><td><b>${esc(r.name)}</b></td><td class="r">${+r.q.toFixed(2)}</td><td class="r">${money(r.rev)}</td><td class="r">${money(r.cost)}</td><td class="r"><span class="${p>=0?'pf':'ls'}">${p<0?'-':''}${money(Math.abs(p))}</span></td><td class="r">${pc==null?'-':`<span class="${p>=0?'pf':'ls'}">${p<0?'-':''}${pct(Math.abs(pc))}</span>`}</td></tr>`}).join('');
 $('#p-note').textContent=nc?`${nc} sold item(s) have no purchase on record, so no cost was deducted. Record a purchase using the same product name to include them.`:'';
 if(!$('#e-t').value)$('#e-t').value=t;
 $('#e-rows').innerHTML=exps().map(e=>`<tr><td>${fd(e.date)}</td><td>${esc(e.desc)}</td><td class="r">${money(e.amt)}</td><td><div class="acts"><button class="btn s d" data-ed="${e.id}">Delete</button></div></td></tr>`).join('')}
$('#pl-per').onchange=renderPL;
$('#e-go').onclick=()=>{const d=$('#e-d').value.trim(),a=+$('#e-a').value;if(!d)return toast('Say what the expense was for');if(!(a>0))return toast('Enter the amount');exps().unshift({id:Date.now(),date:$('#e-t').value||today(),desc:d,amt:a});save();$('#e-d').value=$('#e-a').value='';renderPL();toast('Expense added')};
$('#e-rows').onclick=e=>{const b=e.target.closest('button');if(!b||!confirm('Delete this expense?'))return;S.exps=exps().filter(x=>x.id!==+b.dataset.ed);save();renderPL()};
dl();
})();