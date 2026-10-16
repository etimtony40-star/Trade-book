/* TradeBook invoice-financing add-on. Load AFTER script.js */
(function(){
const DB=(a,b)=>Math.max(0,Math.round((new Date(b+'T00:00')-new Date(a+'T00:00'))/864e5));
const defFin=()=>({elig:'eligible',rate:+S.settings.frate||80,draw:'',fee:S.settings.ffee!=null&&S.settings.ffee!==''?+S.settings.ffee:2,bdp:false,fname:S.settings.fname||'',fbank:S.settings.fbank||'',assign:false,fref:'',feePaid:0,end:''});
const ens=d=>(d.fin=Object.assign(defFin(),d.fin||{}));
const FIN=d=>!d.ref&&d.type==='INV'&&d.fin&&d.fin.elig==='financed';
const adv=d=>FIN(d)?totals(d).total*(+d.fin.rate||0)/100:0;
const fee=d=>{if(!FIN(d)||!d.fin.draw)return 0;return adv(d)*(+d.fin.fee||0)/100*DB(d.fin.draw,d.fin.end||today())/30};
const dpd=d=>d.ref||d.type!=='INV'||isPaid(d)||!d.due?0:DB(d.due,today());
const bucket=n=>n<=0?'Current':n<=30?'0–30':n<=60?'31–60':n<=90?'61–90':'90+';
const lim=()=>+S.settings.conc||30, rec=()=>+S.settings.rec||90;
function share(){const o=S.docs.filter(d=>!d.ref&&d.type==='INV'&&!isPaid(d)),T=o.reduce((a,d)=>a+balOf(d),0),m={};o.forEach(d=>m[d.cust]=(m[d.cust]||0)+balOf(d));for(const k in m)m[k]=T?m[k]/T*100:0;return m}
const qr=t=>{try{const q=qrcode(0,'M');q.addData(t);q.make();return q.createSvgTag({cellSize:2,margin:0})}catch(e){return ''}};

/* styles */
document.head.insertAdjacentHTML('beforeend','<style>.fin{border:1px solid var(--line);border-radius:8px;padding:12px;display:grid;gap:12px;margin:0}.fin legend{font-weight:700;font-size:13px;color:var(--mut);padding:0 6px}.f .ck,.ck2{display:flex!important;gap:8px;align-items:center;font-weight:600}.f .ck input{width:auto}.ck2{font-size:12px}.fsp{margin:14px 0 0;border-top:1px solid var(--line);padding-top:8px}.fsp div{display:flex;justify-content:space-between;padding:3px 0}.fnote{border:1px solid var(--line);padding:8px;border-radius:6px}.fid{display:flex;gap:12px;align-items:center;margin-top:18px}.fid svg{width:84px;height:84px}.fid small{display:block;color:var(--mut);font-size:11px}#fsum .chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}#fsum .chips span{background:var(--hover);border-radius:8px;padding:6px 12px;font-size:13px}#fsum .chips b{display:block;font-size:15px}.rt select{padding:4px 6px;border:1px solid var(--line);border-radius:6px;background:var(--card)}</style>');

/* injected form, settings, terms, ledger headers */
$('#notes').closest('label').insertAdjacentHTML('afterend',`<fieldset class="fin" id="fin-box"><legend>Invoice financing (optional)</legend>
<div class="row"><label>Financing status<select data-fk="elig"><option value="eligible">Eligible</option><option value="ineligible">Ineligible</option><option value="financed">Financed</option></select></label><label>Advance rate (%)<input data-fk="rate" type="number" min="0" max="100" step="any"></label></div>
<div class="row"><label>Advance drawdown date<input data-fk="draw" type="date"></label><label>Discount fee (% per 30 days)<input data-fk="fee" type="number" min="0" step="any"></label></div>
<label>Financier name<input data-fk="fname"></label><label>Financier bank details<textarea data-fk="fbank" rows="2" placeholder="Bank, account name, account number"></textarea></label>
<label>Financier invoice ID (printed in the QR code)<input data-fk="fref"></label>
<label class="ck"><input type="checkbox" data-fk="assign"> Disclosed: add Notice of Assignment and make customer pay the financier</label>
<label class="ck"><input type="checkbox" data-fk="bdp"> Covered by bad debt protection (credit insurance)</label></fieldset>`);
[['#terms'],['#s-terms']].forEach(([s])=>{const sel=$(s),c=sel.querySelector('option[value="-1"]');['60','90'].forEach(n=>{const o=new Option('Net '+n,n);c?sel.insertBefore(o,c):sel.appendChild(o)})});
$('#s-save').parentElement.insertAdjacentHTML('beforebegin',`<b style="font-size:13px;color:var(--mut)">Invoice financing defaults</b>
<label>Financier name<input id="s-fname"></label><label>Financier bank details<textarea id="s-fbank" rows="2"></textarea></label>
<div class="row"><label>Default advance rate (%)<input id="s-frate" type="number" step="any"></label><label>Discount fee (% per 30 days)<input id="s-ffee" type="number" step="any"></label></div>
<div class="row"><label>Recourse buy-back after (days past due)<input id="s-rec" type="number" step="any"></label><label>Client concentration limit (%)<input id="s-conc" type="number" step="any"></label></div>`);
const XS={fname:'#s-fname',fbank:'#s-fbank',frate:'#s-frate',ffee:'#s-ffee',rec:'#s-rec',conc:'#s-conc'};
const _fs=fillSettings;fillSettings=function(){_fs();for(const k in XS)$(XS[k]).value=S.settings[k]??(k==='frate'?80:k==='ffee'?2:k==='rec'?90:k==='conc'?30:'')};
const _ss=$('#s-save').onclick;$('#s-save').onclick=()=>{for(const k in XS){const v=$(XS[k]).value.trim();S.settings[k]=/fname|fbank/.test(k)?v:(+v||0)}_ss()};
{const tr=$('#rows').closest('table').querySelector('thead tr'),last=tr.lastElementChild;['Financing','Drawn','Advance','Accrued fee','Aging (days late)','Flags'].forEach(t=>{const th=document.createElement('th');th.textContent=t;tr.insertBefore(th,last)})}
$('.stats').insertAdjacentHTML('afterend','<div class="card" id="fsum" style="margin-bottom:14px"></div>');

/* form wiring */
const _ff=fillForm;fillForm=function(){ens(cur);_ff();$$('[data-fk]').forEach(e=>{const v=cur.fin[e.dataset.fk];e.type==='checkbox'?e.checked=!!v:e.value=v??''});$('#fin-box').hidden=cur.type==='RCT'};
const _sy=syncType;syncType=function(){_sy();$('#fin-box').hidden=cur.type==='RCT'};
$('#form').addEventListener('input',e=>{const t=e.target,k=t.dataset.fk;if(!k)return;ens(cur);cur.fin[k]=t.type==='checkbox'?t.checked:t.value;
 if(k==='elig'&&t.value==='financed'&&!cur.fin.draw){cur.fin.draw=today();$('[data-fk=draw]').value=cur.fin.draw}
 preview()});

/* preview additions */
const _pv=preview;preview=function(){_pv();const d=cur,s=S.settings,P=$('#paper');if(!P)return;
 if(d.type==='INV'&&d.due&&d.date){const n=DB(d.date,d.due),lab=n===0?'Due on receipt':'Net '+n;P.querySelectorAll('.pm small').forEach(x=>{if(x.textContent==='Terms'&&x.nextElementSibling)x.nextElementSibling.textContent=lab})}
 if(FIN(d)){const f=d.fin,nm=f.fname||'the financier',no=d.no||num('INV',(S.n.INV||0)+1);let h='';
  if(f.assign){P.querySelectorAll('.pn').forEach(x=>{if(x.textContent.startsWith('How to pay'))x.remove()});
   h+=`<div class="pn fnote"><b>Notice of Assignment</b>\nThe right to receive payment of this invoice has been assigned to ${esc(nm)}. Payment must be made only to the account below. Payment to any other account will not discharge your obligation.</div>`;
   if(!isPaid(d))h+=`<div class="pn"><b>Pay to financier</b>\n${esc(nm)}\n${esc(f.fbank||s.fbank)}\nReference: ${esc(f.fref||no)}</div>`}
  h+=`<div class="fid">${qr(['TB',no,f.fref||no,totals(d).total.toFixed(2),d.due||''].join('|'))}<div><small>Invoice ID</small><b>${esc(no)}</b><small>Financier ref</small><b>${esc(f.fref||'Not set')}</b></div></div>`;
  P.insertAdjacentHTML('beforeend',h)}
 if(d.type==='RCT'&&(d.payer||d.split)){let h='';const sp=d.split;
  if(sp)h+=`<div class="fsp"><div><span>Advance repaid to lender (${+sp.rate||0}%)</span><span>${money(sp.adv)}</span></div><div><span>Financing fee deducted</span><span>${money(sp.fee)}</span></div><div><span>Reserve released to you</span><b>${money(sp.reserve)}</b></div></div>`;
  h+=`<div class="pn">Payer source: ${esc(d.payer||'Direct customer pay')}${d.fref?'\nFinancier reference: '+esc(d.fref):''}</div>`;
  const t=P.querySelector('.tot');t?t.insertAdjacentHTML('afterend',h):P.insertAdjacentHTML('beforeend',h)}
};

/* messages: financier bank replaces own bank when disclosed */
const _mf=msgFor;msgFor=function(d,r){let m=_mf(d,r);if(FIN(d)&&d.fin.assign&&!isPaid(d)&&d.type==='INV'){m=m.replace(/\nPay to:[^\n]*/,'');m=m.replace(/\nThank you!$/,`\nNotice: payment of this invoice is assigned to ${d.fin.fname||'our financier'}. Pay only to: ${d.fin.fbank||S.settings.fbank||''} (ref ${d.fin.fref||d.no}).\nThank you!`)}return m};

/* payments with funding split */
pay=function(d){
 const b=balOf(d),v=prompt('Amount received for '+d.no+' (balance '+money(b)+')',b.toFixed(2));if(v===null)return;
 const a=Math.min(+v,b);if(!(a>0))return toast('Enter an amount above zero');
 let split=null,payer='Direct customer pay',fref='';
 if(FIN(d)){const f=d.fin;fref=prompt('Financier reference ID for this settlement (optional)','')||'';
  payer=confirm('Who collected this payment?\nOK = Factoring agency collection\nCancel = Customer paid directly')?'Factoring agency collection':'Direct customer pay';
  const T=totals(d).total,fe=Math.max(0,fee(d)-(f.feePaid||0))*a/b,ad=adv(d)*a/T;f.feePaid=(f.feePaid||0)+fe;
  split={rate:+f.rate||0,adv:ad,fee:fe,reserve:Math.max(0,a-ad-fe),fname:f.fname}}
 d.pays=d.pays||[];d.pays.push({date:today(),amt:a});const left=b-a;if(left<.005){d.status='paid';if(d.fin)d.fin.end=today()}
 const r={id:Date.now(),type:'RCT',no:num('RCT',++S.n.RCT),ref:d.no,bal:left,date:today(),due:'',terms:'0',cust:d.cust,phone:d.phone,email:d.email||'',addr:d.addr||'',items:[{d:'Payment for '+d.no,q:1,p:a}],disc:0,vat:0,notes:left>.005?'Thank you. Balance outstanding: '+money(left):'Thank you. Paid in full.',status:'paid',pays:[],payer,fref,split};
 S.docs.unshift(r);save();renderDash();toast('Receipt '+r.no+' issued');
};

/* ledger columns */
const cells=(d,sh)=>{
 if(d.ref||d.type==='RCT')return[`<small>${esc(d.payer||'-')}</small>`,'-','-','-','-',d.split?`<small>Reserve ${money(d.split.reserve)}</small>`:'-'];
 const f=d.fin||{},el=FIN(d)?'financed':f.elig||'eligible',n=dpd(d),pd=isPaid(d),s=sh[d.cust]||0,fl=[];
 if(!pd&&s>lim())fl.push(`<span class="tag over">Over ${lim()}% limit (${s.toFixed(0)}%)</span>`);
 if(FIN(d)&&!pd&&n>=rec())fl.push('<span class="tag over">Buy-back due</span>');
 fl.push(`<label class="ck2"><input type="checkbox" data-bdp="${d.id}" ${f.bdp?'checked':''}>Bad debt protection</label>`);
 return[`<select data-elig="${d.id}" aria-label="Financing status">${['eligible','ineligible','financed'].map(o=>`<option value="${o}" ${o===el?'selected':''}>${o[0].toUpperCase()+o.slice(1)}</option>`).join('')}</select>`,
  FIN(d)&&f.draw?fd(f.draw):'-',FIN(d)?`${+f.rate||0}%<br><small style="color:var(--mut)">${money(adv(d))}</small>`:'-',FIN(d)?money(fee(d)):'-',
  pd?'Paid':`${bucket(n)}<br><small style="color:var(--mut)">${n} days late</small>`,fl.join(' ')]};
const _rd=renderDash;renderDash=function(){_rd();const sh=share();
 $$('#rows tr').forEach(tr=>{const bt=tr.querySelector('button[data-id]'),d=bt&&S.docs.find(x=>x.id===+bt.dataset.id);if(!d)return;const last=tr.lastElementChild;cells(d,sh).forEach(h=>{const td=document.createElement('td');td.innerHTML=h;tr.insertBefore(td,last)})});
 const open=S.docs.filter(d=>!d.ref&&d.type==='INV'&&!isPaid(d)),ag={};open.forEach(d=>{const k=bucket(dpd(d));ag[k]=(ag[k]||0)+balOf(d)});
 const fd2=S.docs.filter(d=>FIN(d)&&!isPaid(d)),out=fd2.reduce((a,d)=>a+adv(d)*balOf(d)/totals(d).total,0),fees=S.docs.filter(FIN).reduce((a,d)=>a+fee(d),0);
 $('#fsum').innerHTML=`<b>Receivables aging and financing</b><div class="chips">${['Current','0–30','31–60','61–90','90+'].map(k=>`<span>${k}<b>${money(ag[k]||0)}</b></span>`).join('')}<span>Advances outstanding<b>${money(out)}</b></span><span>Accrued financing fees<b>${money(fees)}</b></span></div>`};
$('#flt').onchange=$('#q').oninput=renderDash;
$('#rows').addEventListener('change',e=>{const t=e.target,id=+(t.dataset.elig||t.dataset.bdp),d=S.docs.find(x=>x.id===id);if(!d)return;ens(d);
 if(t.dataset.bdp){d.fin.bdp=t.checked;save();return}
 if(t.value==='financed'){const r=prompt('Advance rate (%) for '+d.no,d.fin.rate);if(r===null||!(+r>0)){renderDash();return}d.fin.rate=+r;d.fin.draw=d.fin.draw||today();d.fin.fee=d.fin.fee;if(!d.fin.fname)d.fin.fname=S.settings.fname||''}
 d.fin.elig=t.value;save();renderDash()});
$('#csv').onclick=()=>{if(!S.docs.length)return toast('Nothing to export yet');const sh=share();
 const rows=[['Number','Type','Customer','Phone','Date','Due','Status','Total','Balance','Financing','Drawdown date','Advance rate %','Advance amount','Accrued fee','Days past due','Aging','Concentration %','BDP','Payer source','Financier ref']].concat(S.docs.map(d=>{const f=d.fin||{};return[d.no,d.type==='RCT'?'Receipt':'Invoice',d.cust,d.phone,d.date,d.due,stat(d)[1],totals(d).total.toFixed(2),balOf(d).toFixed(2),d.ref||d.type==='RCT'?'':(FIN(d)?'Financed':f.elig||'eligible'),FIN(d)?f.draw:'',FIN(d)?f.rate:'',FIN(d)?adv(d).toFixed(2):'',FIN(d)?fee(d).toFixed(2):'',dpd(d),bucket(dpd(d)),d.ref||d.type==='RCT'?'':(sh[d.cust]||0).toFixed(1),f.bdp?'Yes':'No',d.payer||'',d.fref||f.fref||'']}));
 const csv=rows.map(r=>r.map(c=>'"'+String(c??'').replace(/"/g,'""')+'"').join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='tradebook-ledger.csv';a.click()};
renderDash();fillForm();
})();