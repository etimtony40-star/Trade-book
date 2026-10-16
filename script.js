const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const KEY='tradebook.v1';
let S={settings:{name:'',phone:'',email:'',addr:'',bank:'',vat:0,link:'',color:'#0b6b4f',terms:'0',logo:'',sig:''},docs:[],clients:[],loans:[],n:{INV:0,RCT:0}};
try{const r=localStorage.getItem(KEY);if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('Could not save in this browser')}};
const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const today=()=>iso(new Date());
const money=n=>'₦'+(Number(n)||0).toLocaleString('en-NG',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fd=s=>s?new Date(s+'T00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
const short=n=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?Math.round(n/1e3)+'k':Math.round(n);
const num=(t,n)=>(t==='RCT'?'RCT-':'INV-')+String(n).padStart(4,'0');
let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2200)}

const addDays=(s,n)=>{const d=new Date(s+'T00:00');d.setDate(d.getDate()+n);return iso(d)};
const FIELDS=['cust','phone','email','addr','date','due','terms','disc','vat','notes','status'];
const blank=()=>({id:null,type:'INV',no:'',date:today(),due:addDays(today(),+(S.settings.terms||0)),terms:String(S.settings.terms||'0'),cust:'',phone:'',email:'',addr:'',items:[{d:'',q:1,p:''}],disc:0,vat:S.settings.vat||0,notes:'',status:'draft',pays:[],ref:'',bal:0});
let cur=blank();
const totals=d=>{const sub=d.items.reduce((a,i)=>a+(+i.q||0)*(+i.p||0),0),dc=sub*(+d.disc||0)/100,tax=(sub-dc)*(+d.vat||0)/100;return{sub,dc,tax,total:sub-dc+tax}};
const paidAmt=d=>d.ref?0:(d.type==='RCT'||d.status==='paid')?totals(d).total:(d.pays||[]).reduce((a,p)=>a+p.amt,0);
const balOf=d=>d.ref?0:Math.max(0,totals(d).total-paidAmt(d));
const isPaid=d=>d.ref?true:balOf(d)<.005;
const isOver=d=>!isPaid(d)&&d.due&&d.due<today();

/* views */
const UIKEY='tradebook.ui';let curView='dash';
function saveUI(){try{localStorage.setItem(UIKEY,JSON.stringify({v:curView,cur}))}catch(e){}}
function go(v){curView=v;saveUI();$$('.view').forEach(x=>x.classList.toggle('on',x.id==='v-'+v));$$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===v));window.scrollTo(0,0);if(v==='dash')renderDash();if(v==='new')fillForm();if(v==='set')fillSettings();if(v==='cli')renderCli();if(v==='loan')renderLoans()}
$$('nav button').forEach(b=>b.onclick=()=>{if(b.dataset.v==='dash')$('#q').value='';go(b.dataset.v)});
$$('[data-go]').forEach(b=>b.onclick=()=>{cur=blank();go(b.dataset.go)});

/* editor */
function fillForm(){
  $('#ed-title').textContent=cur.id?'Edit '+cur.no:'New document';
  document.querySelector(`input[name=type][value=${cur.type}]`).checked=true;
  if(cur.status==='unpaid')cur.status='sent';cur.terms=cur.terms??'-1';
  FIELDS.forEach(k=>$('#'+k).value=cur[k]??'');
  $('#cl').innerHTML=(S.clients||[]).map(c=>`<option value="${esc(c.name)}">`).join('');
  renderItems();syncType();preview();
}
function syncType(){const r=cur.type==='RCT';$('#due-w').hidden=r;$('#st-l').hidden=r}
function renderItems(){
  $('#items').innerHTML=cur.items.map((it,i)=>`<div class="it"><input data-i="${i}" data-k="d" value="${esc(it.d)}" placeholder="Item, e.g. Bag of rice" aria-label="Item ${i+1}"><input data-i="${i}" data-k="q" type="number" min="0" step="any" value="${esc(it.q)}" aria-label="Quantity"><input data-i="${i}" data-k="p" type="number" min="0" step="any" value="${esc(it.p)}" placeholder="Price" aria-label="Unit price"><button type="button" data-rm="${i}" aria-label="Remove item">×</button></div>`).join('');
}
$('#items').addEventListener('input',e=>{const t=e.target;if(t.dataset.i!=null){cur.items[t.dataset.i][t.dataset.k]=t.value;preview()}});
$('#items').addEventListener('click',e=>{const i=e.target.dataset.rm;if(i!=null){cur.items.splice(i,1);if(!cur.items.length)cur.items.push({d:'',q:1,p:''});renderItems();preview()}});
$('#add').onclick=()=>{cur.items.push({d:'',q:1,p:''});renderItems();preview();$$('#items .it:last-child input')[0].focus()};
$('#form').addEventListener('input',e=>{
  const t=e.target;if(t.dataset.i!=null)return;
  if(t.name==='type'){cur.type=t.value;syncType()}
  else if(FIELDS.includes(t.id)){
    cur[t.id]=t.value;
    if(t.id==='cust'){const c=(S.clients||[]).find(c=>c.name.toLowerCase()===t.value.trim().toLowerCase());if(c)['phone','email','addr'].forEach(k=>{cur[k]=c[k]||'';$('#'+k).value=cur[k]})}
    if(t.id==='due'){cur.terms='-1';$('#terms').value='-1'}
    if((t.id==='terms'||t.id==='date')&&cur.terms!=='-1'&&cur.date){cur.due=addDays(cur.date,+cur.terms);$('#due').value=cur.due}
  }
  preview();
});
function preview(){saveUI();
  const d=cur,s=S.settings,t=totals(d),r=d.type==='RCT',no=d.no||num(d.type,(S.n[d.type]||0)+1),paid=isPaid(d),pa=paidAmt(d);
  const rows=d.items.filter(i=>i.d||+i.p).map(i=>`<tr><td>${esc(i.d)||'Item'}</td><td class="r">${+i.q||0}</td><td class="r">${money(i.p)}</td><td class="r">${money((+i.q||0)*(+i.p||0))}</td></tr>`).join('')||`<tr><td colspan="4" style="color:var(--mut)">Items you add will appear here.</td></tr>`;
  const terms={'0':'Due on receipt','7':'Net 7','15':'Net 15','30':'Net 30'}[d.terms]||'Custom';
  const pay=!r&&!paid&&(s.bank||s.link)?`<div class="pn"><b>How to pay</b>\n${esc(s.bank)}${s.link?'\nOnline: '+esc(s.link):''}</div>`:'';
  $('#paper').innerHTML=`${paid?`<div class="stamp">${d.ref&&d.bal>.005?'RECEIVED':'PAID'}</div>`:''}
  <div class="ph"><div>${s.logo?`<img class="logo" src="${s.logo}" alt="">`:''}<h3>${esc(s.name)||'Your business name'}</h3><p>${esc(s.addr)}${s.addr?'<br>':''}${esc(s.phone)}${s.email?' | '+esc(s.email):''}</p></div><div class="pt"><h1>${r?'Receipt':'Invoice'}</h1><p>${no}</p></div></div>
  <div class="pm"><div><small>Billed to</small><b>${esc(d.cust)||'Customer name'}</b><br>${esc(d.phone)}${d.email?'<br>'+esc(d.email):''}${d.addr?'<br>'+esc(d.addr):''}</div><div><small>Date</small><b>${fd(d.date)}</b></div>${r?(d.ref?`<div><small>For invoice</small><b>${esc(d.ref)}</b></div>`:''):`<div><small>Due</small><b>${d.due?fd(d.due):'On receipt'}</b></div><div><small>Terms</small><b>${terms}</b></div>`}</div>
  <table><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="tot"><div><span>Subtotal</span><span>${money(t.sub)}</span></div>${+d.disc?`<div><span>Discount (${+d.disc}%)</span><span>-${money(t.dc)}</span></div>`:''}${+d.vat?`<div><span>VAT (${+d.vat}%)</span><span>${money(t.tax)}</span></div>`:''}${!r&&pa>0&&!paid?`<div><span>Paid so far</span><span>-${money(pa)}</span></div>`:''}<div class="g"><span>${r?'Amount received':paid?'Total paid':pa>0?'Balance due':'Total due'}</span><span>${money(r||paid?t.total:t.total-pa)}</span></div>${d.ref?`<div><span>Balance remaining</span><span>${money(d.bal)}</span></div>`:''}</div>
  ${pay}${d.notes?`<div class="pn">${esc(d.notes)}</div>`:''}${s.sig?`<div class="sig"><img src="${s.sig}" alt="Signature"><small>Authorised signature</small></div>`:''}`;
}


$('#save').onclick=()=>{
  const valid=cur.items.filter(i=>(+i.p||0)>0&&(+i.q||0)>0);
  if(!cur.cust.trim())return toast('Enter the customer name first');
  if(!valid.length)return toast('Add at least one item with a price');
  cur.items=valid;if(cur.type==='RCT')cur.status='paid';cur.pays=cur.pays||[];
  const nm=cur.cust.trim();S.clients=S.clients||[];let c=S.clients.find(x=>x.name.toLowerCase()===nm.toLowerCase());if(!c)S.clients.push(c={name:nm});Object.assign(c,{name:nm,phone:cur.phone,email:cur.email,addr:cur.addr});
  if(!cur.id){cur.id=Date.now();cur.no=num(cur.type,++S.n[cur.type]);S.docs.unshift(cur)}
  else S.docs=S.docs.map(x=>x.id===cur.id?cur:x);
  save();toast(cur.no+' saved to ledger');renderItems();preview();$('#ed-title').textContent='Edit '+cur.no;
};
$('#reset').onclick=()=>{cur=blank();fillForm()};
$('#print').onclick=()=>window.print();
$('#dl').onclick=async()=>{
  if(!window.html2pdf)return toast('PDF tool could not load. Connect to the internet or use Print');
  if(!cur.id){$('#save').onclick();if(!cur.id)return}
  const b=$('#dl'),label=b.textContent,name=cur.no+'-'+(cur.cust||'customer').trim().replace(/[^\w]+/g,'-')+'.pdf';
  let handle=null;
  if(window.showSaveFilePicker){try{handle=await showSaveFilePicker({suggestedName:name,types:[{description:'PDF document',accept:{'application/pdf':['.pdf']}}]})}catch(e){if(e.name==='AbortError')return}}
  b.disabled=true;b.textContent='Preparing PDF...';
  try{
    const blob=await html2pdf().set({margin:8,image:{type:'jpeg',quality:.98},html2canvas:{scale:2,backgroundColor:'#ffffff'},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from($('#paper')).outputPdf('blob');
    if(handle){const w=await handle.createWritable();await w.write(blob);await w.close();toast('Saved '+handle.name)}
    else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast('Downloaded '+name+' to your Downloads folder')}
  }catch(e){toast('Could not create the PDF. Try Print instead')}
  finally{b.disabled=false;b.textContent=label}
};
function msgFor(d,rem){
  const t=totals(d),s=S.settings.name||'our shop',b=d.ref?d.bal:balOf(d),r=d.type==='RCT';
  const head=rem?`Hello ${d.cust}, a friendly reminder from ${s}: ${d.no} has a balance of ${money(b)}${d.due?', due '+fd(d.due):''}.`:`Hello ${d.cust||'there'}, this is ${s}.\n${r?'Receipt':'Invoice'} ${d.no||'(draft)'}`;
  const body=rem?'':'\n'+d.items.filter(i=>+i.p).map(i=>`${i.d||'Item'} x${i.q}: ${money(i.q*i.p)}`).join('\n')+`\n${r?'Amount received':'Total'}: ${money(t.total)}`+(!r&&b>0&&b<t.total?`\nBalance due: ${money(b)}`:'');
  const pay=!r&&!isPaid(d)&&(S.settings.bank||S.settings.link)?`\nPay to: ${S.settings.bank||''} ${S.settings.link||''}`:'';
  return head+body+pay+'\nThank you!';
}
function wa(ph,msg){let n=(ph||'').replace(/\D/g,'');if(!n){navigator.clipboard&&navigator.clipboard.writeText(msg);return toast('No phone number saved. Message copied instead')}if(n[0]==='0')n='234'+n.slice(1);window.open('https://wa.me/'+n+'?text='+encodeURIComponent(msg),'_blank')}
const sentMark=()=>{if(cur.id&&cur.type==='INV'&&cur.status==='draft'){cur.status='sent';$('#status').value='sent';S.docs=S.docs.map(x=>x.id===cur.id?cur:x);save()}};
$('#wa').onclick=()=>{if(!cur.id)return toast('Save to ledger first so it gets a number');wa(cur.phone,msgFor(cur));sentMark()};
$('#mail').onclick=()=>{if(!cur.id)return toast('Save to ledger first so it gets a number');location.href='mailto:'+(cur.email||'')+'?subject='+encodeURIComponent((cur.type==='RCT'?'Receipt ':'Invoice ')+cur.no+' from '+(S.settings.name||'us'))+'&body='+encodeURIComponent(msgFor(cur));sentMark()};
$('#share').onclick=async()=>{try{await navigator.clipboard.writeText(msgFor(cur));toast('Message copied. Paste it anywhere')}catch(e){toast('Copy is not available here')}};

/* ledger */
const stat=d=>{if(isPaid(d))return['paid','Paid'];if(isOver(d))return['over','Overdue'];if(paidAmt(d)>0)return['part','Part paid'];const k=d.status==='unpaid'?'sent':d.status;return[k,{draft:'Draft',sent:'Sent',viewed:'Viewed'}[k]||'Sent']};
function renderDash(){
  const docs=S.docs,all=docs.filter(d=>!d.ref),tot=all.reduce((a,d)=>a+totals(d).total,0),paid=all.reduce((a,d)=>a+paidAmt(d),0);
  renderStats();
  const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return d}),keys=days.map(iso);
  const v=keys.map(k=>all.filter(x=>x.date===k).reduce((a,x)=>a+totals(x).total,0)),m=Math.max(...v,1);
  $('#chart').innerHTML=days.map((d,i)=>`<div class="bar"><span class="bv">${v[i]?short(v[i]):''}</span><i style="height:${v[i]/m*100}%"></i><em>${d.toLocaleDateString('en-GB',{weekday:'short'})}</em></div>`).join('');
  const ov=all.filter(isOver);
  $('#banner').innerHTML=ov.length?`<div class="banner"><b>${ov.length} overdue</b><span>${money(ov.reduce((a,d)=>a+balOf(d),0))} is waiting to be collected. Use Remind on each row.</span><button class="btn s" data-show="over">Show overdue</button></div>`:'';
  const q=$('#q').value.toLowerCase(),f=$('#flt').value;
  const list=docs.filter(d=>(!q||d.cust.toLowerCase().includes(q)||d.no.toLowerCase().includes(q))&&(f==='all'||(f==='paid'&&isPaid(d))||(f==='unpaid'&&!isPaid(d))||(f==='over'&&isOver(d))||d.type===f));
  $('#none').hidden=docs.length>0;
  $('#rows').innerHTML=list.map(d=>{const st=stat(d),b=balOf(d);
    return`<tr><td><b>${d.no}</b>${d.ref?`<br><small style="color:var(--mut)">for ${d.ref}</small>`:''}</td><td>${esc(d.cust)}</td><td>${fd(d.date)}</td><td><span class="tag ${st[0]}">${st[1]}</span></td><td class="r"><b>${money(totals(d).total)}</b>${!isPaid(d)&&paidAmt(d)>0?`<br><small style="color:var(--mut)">Balance ${money(b)}</small>`:''}</td><td><div class="acts"><button class="btn s" data-a="open" data-id="${d.id}">Open</button>${isPaid(d)?'':`<button class="btn s" data-a="pay" data-id="${d.id}">Record payment</button><button class="btn s" data-a="rem" data-id="${d.id}">Remind</button>`}<button class="btn s d" data-a="del" data-id="${d.id}">Delete</button></div></td></tr>`}).join('');
}
$('#q').oninput=$('#flt').onchange=renderDash;
$('#banner').onclick=e=>{if(e.target.dataset.show){$('#flt').value='over';renderDash()}};
function pay(d){
  const b=balOf(d),v=prompt('Amount received for '+d.no+' (balance '+money(b)+')',b.toFixed(2));if(v===null)return;
  const a=Math.min(+v,b);if(!(a>0))return toast('Enter an amount above zero');
  d.pays=d.pays||[];d.pays.push({date:today(),amt:a});const left=b-a;if(left<.005)d.status='paid';
  const r={id:Date.now(),type:'RCT',no:num('RCT',++S.n.RCT),ref:d.no,bal:left,date:today(),due:'',terms:'0',cust:d.cust,phone:d.phone,email:d.email||'',addr:d.addr||'',items:[{d:'Payment for '+d.no,q:1,p:a}],disc:0,vat:0,notes:left>.005?'Thank you. Balance outstanding: '+money(left):'Thank you. Paid in full.',status:'paid',pays:[]};
  S.docs.unshift(r);save();renderDash();toast('Receipt '+r.no+' issued');
}
$('#rows').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;const id=+b.dataset.id,d=S.docs.find(x=>x.id===id),a=b.dataset.a;
  if(a==='open'){cur=JSON.parse(JSON.stringify(d));go('new')}
  if(a==='pay')pay(d);
  if(a==='rem')wa(d.phone,msgFor(d,true));
  if(a==='del'&&confirm('Delete '+d.no+'? This cannot be undone.')){S.docs=S.docs.filter(x=>x.id!==id);save();renderDash()}
};
function renderCli(){
  const cs=S.clients||[];$('#cl-none').hidden=cs.length>0;
  $('#cl-rows').innerHTML=cs.map((c,i)=>{const ds=S.docs.filter(d=>!d.ref&&d.cust===c.name);return`<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.phone)}<br><small style="color:var(--mut)">${esc(c.email)}</small></td><td class="r">${ds.length}</td><td class="r">${money(ds.reduce((a,d)=>a+totals(d).total,0))}</td><td class="r">${money(ds.reduce((a,d)=>a+balOf(d),0)+LOANS().filter(l=>l.client===c.name).reduce((a,l)=>a+lBal(l),0)+Math.max(0,-(c.acct||0)))}</td><td class="r"><b style="color:${(c.acct||0)<0?'var(--bad)':'inherit'}">${money(c.acct||0)}</b></td><td><div class="acts"><button class="btn s" data-fund="${i}">Add funds</button><button class="btn s" data-bill="${i}">New invoice</button><button class="btn s" data-hist="${i}">History</button></div></td></tr>`}).join('');
}
$('#cl-rows').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.bill!=null){const c=S.clients[b.dataset.bill];cur=blank();Object.assign(cur,{cust:c.name,phone:c.phone||'',email:c.email||'',addr:c.addr||''});go('new')}
  if(b.dataset.hist!=null){$('#q').value=S.clients[b.dataset.hist].name;go('dash')}
  if(b.dataset.fund!=null){const c=S.clients[b.dataset.fund],v=prompt('Amount received into '+c.name+"'s account (account now "+money(c.acct||0)+')');if(v===null)return;const a=+v;if(!(a>0))return toast('Enter an amount above zero');c.acct=(c.acct||0)+a;save();renderCli();toast(money(a)+' added. Account now '+money(c.acct))}
};
$('#csv').onclick=()=>{
  if(!S.docs.length)return toast('Nothing to export yet');
  const rows=[['Number','Type','Customer','Phone','Date','Due','Status','Total','Balance']].concat(S.docs.map(d=>[d.no,d.type==='RCT'?'Receipt':'Invoice',d.cust,d.phone,d.date,d.due,stat(d)[1],totals(d).total.toFixed(2),balOf(d).toFixed(2)]));
  const csv=rows.map(r=>r.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='tradebook-ledger.csv';a.click();
};
$('#demo').onclick=()=>{
  const people=['Mrs Ngozi Okafor','Chinedu Stores','Mr Emeka Udoh','Blessing Ventures','Pastor Ifeanyi','Aisha Fabrics'];
  const goods=[['Bag of rice (50kg)',1,78000],['Vegetable oil (25L)',2,41000],['Indomie carton',3,9500],['Ankara fabric (6 yards)',4,12500],['Sachet water bale',10,1200],['Phone charger',5,3500]];
  people.forEach((c,i)=>{const dt=new Date();dt.setDate(dt.getDate()-i);const type=i%3===2?'RCT':'INV',g=goods[i];
    const d={id:Date.now()+i,type,no:num(type,++S.n[type]),date:iso(dt),due:iso(new Date(dt.getTime()+6048e5*(i%2?-0.5:1))),cust:c,phone:'0803 555 01'+i+i,items:[{d:g[0],q:g[1],p:g[2]},{d:goods[(i+2)%6][0],q:1,p:goods[(i+2)%6][2]}],disc:i%2?5:0,vat:S.settings.vat||0,notes:'Thank you for your patronage',status:i%2?'paid':'unpaid'};S.docs.push(d);S.clients=S.clients||[];if(!S.clients.some(x=>x.name===c))S.clients.push({name:c,phone:d.phone,email:'',addr:''})});
  S.docs.sort((a,b)=>b.date.localeCompare(a.date));save();renderDash();toast('Sample sales loaded');
};

/* settings */
const sf={name:'#s-name',phone:'#s-phone',email:'#s-email',addr:'#s-addr',bank:'#s-bank',vat:'#s-vat',link:'#s-link',color:'#s-color',terms:'#s-terms'};
function fillSettings(){for(const k in sf)$(sf[k]).value=S.settings[k]||(k==='color'?'#0b6b4f':k==='terms'?'0':'')}
const LOGO=(c)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="${c}"/><path d="M12.5 8h15A1.5 1.5 0 0 1 29 9.5V31.5l-3-2.1-3 2.1-3-2.1-3 2.1-3-2.1-3 2.1V9.5A1.5 1.5 0 0 1 12.5 8z" fill="#fff"/><path d="M15 14h10M15 18.5h10" stroke="${c}" stroke-width="2" stroke-linecap="round"/><path d="M15 23.5h6" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/></svg>`;
function applyColor(){const dk=document.documentElement.dataset.theme==='dark';const c=S.settings.color||'#0b6b4f',r=document.documentElement.style;r.setProperty('--pri',c);$('#logo').innerHTML=LOGO(c);document.querySelector('link[rel=icon]').href='data:image/svg+xml,'+encodeURIComponent(LOGO(c));r.setProperty('--pri-d',dk?'color-mix(in srgb,'+c+' 55%,#fff)':'color-mix(in srgb,'+c+' 80%,#000)');r.setProperty('--pri-l',dk?'color-mix(in srgb,'+c+' 22%,var(--card))':'color-mix(in srgb,'+c+' 12%,#fff)')}
function img(file,max,cb){const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);cb(c.toDataURL('image/png'))};i.src=r.result};r.readAsDataURL(file)}
[['#s-logo','logo',320],['#s-sig','sig',360]].forEach(([id,k,m])=>$(id).onchange=e=>{const f=e.target.files[0];if(f)img(f,m,u=>{S.settings[k]=u;save();toast('Image saved. It will show on new documents')})});
$('#rm-img').onclick=()=>{S.settings.logo=S.settings.sig='';save();toast('Logo and signature removed')};
$('#s-save').onclick=()=>{for(const k in sf)S.settings[k]=k==='vat'?(+$(sf[k]).value||0):$(sf[k]).value.trim();save();applyColor();toast('Business details saved');cur=blank();go('dash')};

/* loans and money summary */
const LOANS=()=>S.loans||(S.loans=[]);
const lInt=l=>l.principal*(l.rate/100)*Math.floor(((l.closed||Date.now())-l.start)/1000/(l.per||1));
const lPaid=l=>l.reps.reduce((a,r)=>a+r.amt,0);
const lBal=l=>Math.max(0,l.principal+lInt(l)-lPaid(l));
const NEG=()=>(S.clients||[]).reduce((a,c)=>a+Math.max(0,-(c.acct||0)),0);
function renderStats(){
  const docs=S.docs,all=docs.filter(d=>!d.ref),tot=all.reduce((a,d)=>a+totals(d).total,0),paid=all.reduce((a,d)=>a+paidAmt(d),0),ls=LOANS();
  $('#s-all').textContent=money(tot);
  $('#s-paid').textContent=money(paid+ls.reduce((a,l)=>a+lPaid(l),0)-NEG());
  $('#s-due').textContent=money(tot-paid+ls.reduce((a,l)=>a+lBal(l),0)+NEG());
  $('#s-n').textContent=docs.length;
  renderMoney();
}
function renderMoney(){
  const rec=[],owe={},none=t=>`<p style="color:var(--mut);margin:0">${t}</p>`;
  S.docs.forEach(d=>{if(d.ref)return;const ps=(d.pays||[]).reduce((a,x)=>a+x.amt,0),pa=paidAmt(d);
    (d.pays||[]).forEach(x=>rec.push({t:x.date,who:d.cust,ref:d.no,amt:x.amt}));
    if(pa>ps+.005)rec.push({t:d.date,who:d.cust,ref:d.no,amt:pa-ps});
    const b=balOf(d);if(b>0)owe[d.cust]=(owe[d.cust]||0)+b});
  LOANS().forEach(l=>{l.reps.forEach(r=>rec.push({t:r.date,who:l.client,ref:'Loan repayment',amt:r.amt}));const b=lBal(l);if(b>0)owe[l.client]=(owe[l.client]||0)+b});
  (S.clients||[]).forEach(c=>{const n=-(c.acct||0);if(n>0){owe[c.name]=(owe[c.name]||0)+n;rec.push({t:today(),who:c.name,ref:'Not yet funded in account',amt:-n})}});
  rec.sort((a,b)=>b.t.localeCompare(a.t));
  const row=(a,b,c)=>`<div class="ln"><span>${esc(a)}<small>${esc(b)}</small></span><b>${money(c)}</b></div>`;
  $('#recv-t').textContent=money(rec.reduce((a,x)=>a+x.amt,0));
  $('#recv').innerHTML=rec.length?rec.slice(0,8).map(x=>row(x.who,fd(x.t)+' | '+x.ref,x.amt)).join(''):none('No payments received yet.');
  const ol=Object.entries(owe).sort((a,b)=>b[1]-a[1]);
  $('#owed-t').textContent=money(ol.reduce((a,x)=>a+x[1],0));
  $('#owed').innerHTML=ol.length?ol.slice(0,8).map(([c,a])=>row(c,'',a)).join(''):none('Nobody owes you anything right now.');
}
function hint(){const r=+$('#l-rate').value||0,f=n=>n.toLocaleString('en-NG',{maximumFractionDigits:3});$('#l-hint').textContent=`That adds ${f(r)}% of the amount every minute, which is ${f(r*60)}% an hour and ${f(r*1440)}% a day, as simple interest. If it is not repaid within ${+$('#l-days').value||0} days, the balance is taken from the client's TradeBook account, which can go negative until they add funds. Check local money-lending rules before lending to real customers.`}
function renderLoans(){
  $('#cl').innerHTML=(S.clients||[]).map(c=>`<option value="${esc(c.name)}">`).join('');hint();renderFeed();$('#rem').checked=S.rem!==false;
  const ls=LOANS();$('#l-none').hidden=ls.length>0;
  $('#l-rows').innerHTML=ls.map(l=>`<tr><td><b>${esc(l.client)}</b><br><small style="color:var(--mut)">${esc(l.phone)}</small></td><td>${money(l.principal)}<br><small style="color:var(--mut)">${l.rate}% per ${(l.per||1)===60?'minute':'second'}</small></td><td>${new Date(l.start).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</td><td class="lv" data-id="${l.id}" data-k="due">${dueCell(l)}</td><td class="r lv" data-id="${l.id}" data-k="int">${intCell(l)}</td><td class="r">${money(lPaid(l))}</td><td class="r lv" data-id="${l.id}" data-k="bal"><b>${money(lBal(l))}</b></td><td><span class="tag ${l.forced?'over':l.closed?'paid':'part'}">${l.forced?'Auto-debited':l.closed?'Settled':'Open'}</span></td><td><div class="acts">${l.closed?'':`<button class="btn s" data-la="rmd" data-id="${l.id}">Remind client</button><button class="btn s" data-la="rep" data-id="${l.id}">Record repayment</button><button class="btn s" data-la="settle" data-id="${l.id}">Settle in full</button>`}<button class="btn s d" data-la="del" data-id="${l.id}">Delete</button></div></td></tr>`).join('');
}
$('#l-rate').oninput=$('#l-days').oninput=hint;
$('#l-cl').oninput=e=>{const c=(S.clients||[]).find(c=>c.name.toLowerCase()===e.target.value.trim().toLowerCase());if(c&&c.phone)$('#l-ph').value=c.phone};
$('#l-go').onclick=()=>{
  const nm=$('#l-cl').value.trim(),amt=+$('#l-amt').value,rate=+$('#l-rate').value,days=+$('#l-days').value;
  if(!nm)return toast('Enter the client name first');
  if(!(amt>0))return toast('Enter the amount to lend');
  if(!(rate>=0))return toast('Enter a valid interest rate');
  if(!(days>0))return toast('Enter the number of days to repay');
  S.clients=S.clients||[];let c=S.clients.find(x=>x.name.toLowerCase()===nm.toLowerCase());if(!c)S.clients.push(c={name:nm,phone:'',email:'',addr:''});if($('#l-ph').value.trim())c.phone=$('#l-ph').value.trim();
  LOANS().unshift({id:Date.now(),client:c.name,phone:c.phone||'',principal:amt,rate,per:60,nt:0,start:Date.now(),days,due:Date.now()+days*864e5,reps:[],closed:0,forced:0});
  save();['#l-cl','#l-ph','#l-amt'].forEach(i=>$(i).value='');renderLoans();toast('Loan of '+money(amt)+' recorded for '+c.name);
};
function settle(l){l.closed=Date.now();l.reps.push({date:today(),amt:lBal(l)})}
$('#l-rows').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;const id=+b.dataset.id,l=LOANS().find(x=>x.id===id),a=b.dataset.la;
  if(a==='rmd'){wa(l.phone,loanMsg(l));return}
  if(a==='del'){if(!confirm('Delete this loan record? This cannot be undone.'+(l.forced?' The amount taken from the client account will be returned.':'')))return;if(l.forced){const c=(S.clients||[]).find(x=>x.name===l.client);if(c)c.acct=(c.acct||0)+(l.taken||0)}S.loans=S.loans.filter(x=>x.id!==id)}
  if(a==='rep'){const v=prompt('Repayment from '+l.client+' (balance now '+money(lBal(l))+')');if(v===null)return;const amt=+v;if(!(amt>0))return toast('Enter an amount above zero');if(amt>=lBal(l)-.005)settle(l);else l.reps.push({date:today(),amt})}
  if(a==='settle'){if(!confirm('Settle '+l.client+"'s loan in full? Balance now "+money(lBal(l))))return;settle(l)}
  save();renderLoans();toast('Loan updated');
};
const fmtp=n=>String(+(+n).toFixed(4));
const setCell=(el,h)=>{(el.querySelector('span[data-w]')||el).innerHTML=h};
const intCell=l=>{const pm=(l.per||1)*1000,n=Math.ceil((pm-(Date.now()-l.start)%pm)/1000);return money(lInt(l))+(l.closed?'':`<br><small style="color:var(--mut)">next in ${n}s</small>`)};
const dueCell=l=>{
  if(l.closed)return l.forced?'Auto-debited<br><small style="color:var(--mut)">'+fd(iso(new Date(l.forced)))+'</small>':'-';
  if(!l.due)return 'No deadline';
  const ms=l.due-Date.now();if(ms<=0)return 'Due now';
  const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4),s=Math.floor(ms%6e4/1000);
  const t=d>0?d+(d===1?' day ':' days ')+h+'h left':h>0?h+'h '+m+'m left':m+'m '+s+'s left';
  return '<b>'+t+'</b><br><small style="color:var(--mut)">due '+fd(iso(new Date(l.due)))+'</small>';
};
const loanMsg=(l,add)=>{const rpm=l.rate*60/(l.per||1);return `Hello ${l.client}, a reminder from ${S.settings.name||'us'}: interest of ${fmtp(rpm)}% of the amount borrowed (${money(l.principal*rpm/100)}) is added every minute.${add?' '+money(add)+' was just added.':''} Your balance is now ${money(lBal(l))}. Please arrange repayment.`};
function remind(){
  if(S.rem===false)return;
  const now=Date.now();let ch=false;
  LOANS().forEach(l=>{if(l.closed)return;const m=Math.floor((now-l.start)/60000);
    if(l.nt==null){l.nt=m;ch=true;return}
    if(m>l.nt){const cnt=m-l.nt,rpm=l.rate*60/(l.per||1),add=l.principal*rpm/100*cnt;l.nt=m;ch=true;
      S.feed=[{id:now+'-'+l.id,t:now,lid:l.id,client:l.client,rpm,cnt,add,bal:lBal(l)}].concat(S.feed||[]).slice(0,25);
      toast(fmtp(rpm)+'% interest added to '+l.client+"'s loan: +"+money(add));
      try{if(window.Notification&&Notification.permission==='granted')new Notification('TradeBook: interest added',{body:l.client+' +'+money(add)+'. Balance '+money(lBal(l))})}catch(e){}}});
  if(ch){save();if($('#v-loan').classList.contains('on'))renderFeed()}
}
function enforce(){
  const now=Date.now();let ch=false;S.clients=S.clients||[];
  LOANS().forEach(l=>{
    if(l.closed||!l.due||now<l.due)return;
    l.closed=now;const amt=lBal(l);
    let c=S.clients.find(x=>x.name===l.client);if(!c)S.clients.push(c={name:l.client,phone:l.phone||'',email:'',addr:'',acct:0});
    c.acct=(c.acct||0)-amt;
    l.reps.push({date:today(),amt,forced:1});l.forced=now;l.taken=amt;ch=true;
    const msg=`Hello ${l.client}, your loan from ${S.settings.name||'us'} passed its due date. ${money(amt)} has been taken from your account. Your account balance is now ${money(c.acct)}. Any money added will first clear this amount.`;
    S.feed=[{id:now+'-d-'+l.id,t:now,lid:l.id,client:l.client,kind:'debit',add:amt,bal:c.acct,msg}].concat(S.feed||[]).slice(0,25);
    toast(l.client+"'s loan is due: "+money(amt)+' taken. Account '+money(c.acct));
    try{if(window.Notification&&Notification.permission==='granted')new Notification('TradeBook: loan collected',{body:l.client+': '+money(amt)+' taken. Account '+money(c.acct)})}catch(e){}
  });
  if(ch){save();if(curView==='loan')renderLoans();if(curView==='cli')renderCli();if(curView==='dash')renderDash()}
}
function renderFeed(){
  const f=S.feed||[];
  $('#feed').innerHTML=f.length?f.slice(0,10).map(x=>`<div class="ln"><span>${esc(x.client)}<small>${new Date(x.t).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} | ${x.kind==='debit'?'Due date passed: taken from account':fmtp(x.rpm)+'% interest added'+(x.cnt>1?' ('+x.cnt+' minutes)':'')}</small></span><span><b>${x.kind==='debit'?'-':'+'}${money(x.add)}</b> <button class="btn s" data-f="${x.id}">Send to client</button></span></div>`).join(''):'<p style="color:var(--mut);margin:0">Reminders appear here every minute while a loan is open.</p>';
}
$('#feed').onclick=e=>{const b=e.target.closest('button');if(!b)return;const x=(S.feed||[]).find(f=>String(f.id)===b.dataset.f),l=x&&LOANS().find(l=>l.id===x.lid);if(l)wa(l.phone,x.msg||loanMsg(l,x.add));else toast('That loan no longer exists')};
$('#rem').onchange=e=>{S.rem=e.target.checked;save()};
$('#ntf').onclick=()=>{if(!window.Notification)return toast('Alerts are not supported in this browser');Notification.requestPermission().then(p=>toast(p==='granted'?'Alerts turned on':'Alerts were not allowed'))};
function mobi(t){
  const h=[...t.querySelectorAll('thead th')].map(x=>x.textContent);
  t.querySelectorAll('tbody tr').forEach(tr=>[...tr.children].forEach((td,i)=>{td.dataset.label=h[i]||'';
    if(!(td.children.length===1&&td.firstElementChild.dataset.w)){const sp=document.createElement('span');sp.dataset.w='1';while(td.firstChild)sp.appendChild(td.firstChild);td.appendChild(sp)}}));
}
['#rows','#cl-rows','#l-rows'].forEach(id=>{const tb=$(id),t=tb.closest('table');new MutationObserver(()=>mobi(t)).observe(tb,{childList:true})});
$('#bk').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'}));a.download='tradebook-backup-'+today()+'.json';a.click()};
$('#rsb').onclick=()=>$('#rs').click();
$('#rs').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);if(!d||!Array.isArray(d.docs))throw 0;if(!confirm('Replace everything in TradeBook with this backup?'))return;S=Object.assign({settings:{},docs:[],clients:[],loans:[],n:{INV:0,RCT:0}},d);save();location.reload()}catch(x){toast('That file is not a TradeBook backup')}})};
function tick(){
  const ls=LOANS();if(!ls.length)return;
  enforce();remind();
  if($('#v-dash').classList.contains('on'))renderStats();
  if($('#v-loan').classList.contains('on'))ls.forEach(l=>{if(l.closed)return;const i=document.querySelector(`.lv[data-id="${l.id}"][data-k="int"]`),b=document.querySelector(`.lv[data-id="${l.id}"][data-k="bal"]`);if(i)setCell(i,intCell(l));const dd=document.querySelector(`.lv[data-id="${l.id}"][data-k="due"]`);if(dd)setCell(dd,dueCell(l));if(b)setCell(b,'<b>'+money(lBal(l))+'</b>')});
}
setInterval(tick,1000);

const THEME_KEY='tradebook.theme',SVG='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const ICON={light:SVG+'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',dark:SVG+'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'};
function theme(t){document.documentElement.dataset.theme=t;$('#theme').innerHTML=ICON[t];$('#theme').setAttribute('aria-label',t==='dark'?'Switch to light mode':'Switch to dark mode');applyColor()}
let th=null;try{th=localStorage.getItem(THEME_KEY)}catch(e){}
$('#theme').onclick=()=>{const n=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem(THEME_KEY,n)}catch(e){}theme(n)};
theme(th||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));
try{const u=JSON.parse(localStorage.getItem(UIKEY)||'null');if(u&&u.cur)cur=u.cur;go(u&&u.v&&document.getElementById('v-'+u.v)?u.v:'dash')}catch(e){go('dash')}
enforce();