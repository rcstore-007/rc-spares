/* RC store front-end. Used by the home/shop page (body data-page="home") and by each part page (data-page="part"). */
(function(){
  function data(id,fallback){var el=document.getElementById(id);if(!el)return fallback;try{return JSON.parse(el.textContent);}catch(e){return fallback;}}
  var S=data('store-settings',{});
  var P=data('products',[]);
  var PAGE=document.body.getAttribute('data-page')||'home';
  var ROOT=document.body.getAttribute('data-root')||'';
  var CUR=S.currency||'₹';
  var DAYS=S.delivery||'15–21';
  var CIMG=S.categoryImages||{};

  var CATS=['Motors & ESCs','Tyres & Wheels','Shocks','Batteries & Chargers','Gears & Drivetrain','Servos','Lights','Winch','Radios & Receivers','Tools & Accessories'];
  var SCALES=['1:5','1:7','1:8','1:10','1:12','1:18','1:24','1:30'];
  var CC={'Motors & ESCs':['#f2d8cf','#b8442f'],'Tyres & Wheels':['#d6e2ec','#3d6a8c'],'Shocks':['#d5e4da','#2e5e4e'],'Batteries & Chargers':['#f6e6bf','#9a6a08'],'Gears & Drivetrain':['#e6dbec','#6b4a7a'],'Servos':['#d2e8ea','#1f6f78'],'Lights':['#f8dcc8','#c4561b'],'Winch':['#e9e0c6','#6b5a2e'],'Axles & Chassis':['#dfe3e8','#4a5563'],'Radios & Receivers':['#f3dde6','#a23b62'],'Tools & Accessories':['#e4e8d5','#55692c'],'RC Cars':['#dce7ee','#24485e']};
  var SC=['#b8442f','#c4561b','#9a6a08','#2e5e4e','#1f6f78','#3d6a8c','#6b4a7a','#2a2420'];
  P.forEach(function(p){
    if(CATS.indexOf(p.category)<0)CATS.push(p.category);
    (p.scale||[]).forEach(function(s){if(SCALES.indexOf(s)<0)SCALES.push(s);});
  });
  SCALES.sort(function(a,b){return +a.split(':')[1]-+b.split(':')[1];});

  function cv(cat){var c=CC[cat]||['#e7dcc5','#2a2420'];return '--tbg:'+c[0]+';--tfg:'+c[1];}
  function money(n){return CUR+Number(n||0).toLocaleString('en-IN');}
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function $(id){return document.getElementById(id);}
  function art(cat){
    var g={
      'Motors & ESCs':'<rect x="45" y="45" width="90" height="60" rx="12"/><line x1="135" y1="75" x2="165" y2="75"/><line x1="65" y1="45" x2="65" y2="105"/><line x1="85" y1="45" x2="85" y2="105"/>',
      'Tyres & Wheels':'<circle cx="100" cy="75" r="52"/><circle cx="100" cy="75" r="40" stroke-dasharray="5 7"/><circle cx="100" cy="75" r="20"/><circle cx="100" cy="75" r="4"/>',
      'Shocks':'<rect x="86" y="14" width="28" height="48" rx="6"/><path d="M100 62 l16 8 -32 9 32 9 -32 9 32 9 -16 8"/><line x1="100" y1="114" x2="100" y2="136"/>',
      'Batteries & Chargers':'<rect x="38" y="42" width="120" height="66" rx="10"/><path d="M106 54 l-16 22 h20 l-16 22"/><line x1="158" y1="62" x2="170" y2="62"/><line x1="158" y1="88" x2="170" y2="88"/>',
      'Gears & Drivetrain':'<circle cx="82" cy="80" r="40"/><circle cx="82" cy="80" r="46" stroke-dasharray="6 6" stroke-width="8"/><circle cx="82" cy="80" r="9"/><circle cx="146" cy="52" r="18"/><circle cx="146" cy="52" r="22" stroke-dasharray="5 5" stroke-width="6"/>',
      'Servos':'<rect x="48" y="52" width="104" height="58" rx="8"/><circle cx="78" cy="52" r="12"/><line x1="78" y1="52" x2="128" y2="26"/><line x1="36" y1="72" x2="48" y2="72"/><line x1="152" y1="72" x2="164" y2="72"/>',
      'Lights':'<rect x="30" y="62" width="140" height="32" rx="10"/><circle cx="58" cy="78" r="8"/><circle cx="86" cy="78" r="8"/><circle cx="114" cy="78" r="8"/><circle cx="142" cy="78" r="8"/><path d="M58 52 v-14 M86 52 v-14 M114 52 v-14 M142 52 v-14"/>',
      'Winch':'<rect x="40" y="50" width="80" height="50" rx="10"/><line x1="55" y1="50" x2="55" y2="100"/><line x1="105" y1="50" x2="105" y2="100"/><path d="M120 75 h30 a10 10 0 0 1 10 10 v12 a10 10 0 0 1 -20 0"/>',
      'Axles & Chassis':'<line x1="30" y1="75" x2="170" y2="75"/><circle cx="100" cy="75" r="20"/><rect x="16" y="45" width="16" height="60" rx="5"/><rect x="168" y="45" width="16" height="60" rx="5"/><line x1="100" y1="95" x2="100" y2="130"/>',
      'Radios & Receivers':'<path d="M72 125 L86 62 H128 L140 125 Z"/><circle cx="64" cy="72" r="22"/><line x1="124" y1="62" x2="150" y2="18"/><circle cx="108" cy="84" r="6"/>',
      'Tools & Accessories':'<rect x="28" y="60" width="72" height="30" rx="10"/><line x1="100" y1="75" x2="172" y2="75"/><path d="M42 60 v30 M57 60 v30 M72 60 v30"/>',
      'RC Cars':'<path d="M35 95 h130 l-8 -22 -30 -6 -12 -20 h-40 l-14 20 -20 6 z"/><circle cx="65" cy="102" r="15"/><circle cx="138" cy="102" r="15"/>'
    };
    return '<svg viewBox="0 0 200 150" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(g[cat]||g['Gears & Drivetrain'])+'</svg>';
  }
  function picHTML(p){ return (p.images&&p.images.length)?'<img src="'+ROOT+esc(p.images[0])+'" alt="'+esc(p.name)+'" loading="lazy">':art(p.category); }
  function partURL(p){ return ROOT+'parts/'+p.slug+'.html'; }
  function scaleLabel(p){var s=p.scale||[];return s.length>2?'All scales':s.join(', ');}
  function byId(id){for(var i=0;i<P.length;i++)if(P[i].id===id)return P[i];return null;}

  /* ---------- Cart (shared by all pages, kept in this browser) ---------- */
  var cart={};
  try{cart=JSON.parse(localStorage.getItem('rc-cart2')||'{}')||{};}catch(e){cart={};}
  function save(){try{localStorage.setItem('rc-cart2',JSON.stringify(cart));}catch(e){}}
  // On the home page we know every product: refresh prices, drop removed parts
  if(PAGE==='home'){Object.keys(cart).forEach(function(k){var p=byId(k);if(!p)delete cart[k];else{cart[k].price=p.price;cart[k].name=p.name;}});save();}
  function snap(p){return{q:0,name:p.name,price:p.price,category:p.category,img:(p.images&&p.images[0])||'',slug:p.slug};}
  function add(p,btn){
    if(!p)return;
    if(!cart[p.id])cart[p.id]=snap(p);
    cart[p.id].q=Math.min(cart[p.id].q+1,99);save();renderCart();
    if(btn&&!btn.classList.contains('ok')){var old=btn.textContent;btn.classList.add('ok');btn.textContent='Added';setTimeout(function(){btn.classList.remove('ok');btn.textContent=old;},900);}
  }
  function lines(){return Object.keys(cart).map(function(id){return{id:id,c:cart[id]};}).filter(function(l){return l.c&&l.c.q>0;});}
  function waNum(){return (S.whatsapp||'').replace(/\D/g,'');}
  function msg(){
    var t=0,o=['Hi '+S.name+', I would like to order:',''];
    lines().forEach(function(l,i){var s=l.c.price*l.c.q;t+=s;o.push((i+1)+'. '+l.c.name+' ['+l.id+'] x '+l.c.q+' = '+money(s));});
    o.push('','Total: '+money(t));
    var n=$('cName').value.trim(),c=$('cCity').value.trim(),nt=$('cNote').value.trim();
    if(n)o.push('Name: '+n);if(c)o.push('City / PIN: '+c);if(nt)o.push('Note: '+nt);
    o.push('','Please confirm availability and shipping.');
    return o.join('\n');
  }
  function setWa(btn,hint,text,okMsg,emptyMsg,isEmpty){
    var num=waNum();hint.className='note';
    if(isEmpty){btn.setAttribute('aria-disabled','true');btn.href='#';hint.textContent=emptyMsg;}
    else if(!num){btn.setAttribute('aria-disabled','true');btn.href='#';hint.className='note warn';hint.textContent='The store WhatsApp number is not set yet, so ordering is switched off for now.';}
    else{btn.removeAttribute('aria-disabled');btn.href='https://wa.me/'+num+'?text='+encodeURIComponent(text);btn.target='_blank';btn.rel='noopener';hint.textContent=okMsg;}
  }
  function renderCart(){
    var L=lines(),t=0,c=0;L.forEach(function(l){t+=l.c.price*l.c.q;c+=l.c.q;});
    $('count').textContent=c;$('nItems').textContent=c;$('total').textContent=money(t);
    $('mbar').classList.toggle('show',c>0);
    $('mbarL').textContent=c+(c===1?' item · ':' items · ')+money(t);
    $('items').innerHTML=L.length?L.map(function(l){
      var th=l.c.img?'<img src="'+ROOT+esc(l.c.img)+'" alt="">':art(l.c.category);
      return '<div class="it"><div class="th" style="'+cv(l.c.category)+'">'+th+'</div><div><div class="t">'+esc(l.c.name)+'</div><div class="s">'+money(l.c.price)+' each</div>'+
        '<div class="qty"><button data-dec="'+l.id+'" aria-label="One less">−</button><span>'+l.c.q+'</span><button data-inc="'+l.id+'" aria-label="One more">+</button></div></div>'+
        '<div class="r"><span class="lt">'+money(l.c.price*l.c.q)+'</span><button class="rm" data-rm="'+l.id+'">Remove</button></div></div>';
    }).join(''):'<div class="empty" style="margin-top:14px">Your cart is empty.<br><a class="more" href="'+ROOT+'index.html#shop" data-close>Browse parts →</a></div>';
    $('preview').textContent=L.length?msg():'(Add parts to see the message)';
    setWa($('waBtn'),$('waHint'),msg(),'Opens WhatsApp with your order typed in. Just press send.','Add at least one part to send an order.',!L.length);
  }

  /* ---------- Request a part (form on home page) ---------- */
  function renderReq(){
    if(!$('rqPart'))return;
    var part=$('rqPart').value.trim(),car=$('rqCar').value.trim(),nm=$('rqName').value.trim();
    var o=['Hi '+S.name+', can you source a part for me?','','Part: '+(part||'-'),'Car and scale: '+(car||'-')];
    if(nm)o.push('Name: '+nm);
    setWa($('rqBtn'),$('rqHint'),o.join('\n'),'Opens WhatsApp with your request typed in.','Type the part you need to continue.',!part);
  }

  /* ---------- Overlays ---------- */
  var drawer=$('drawer'),scrim=$('scrim'),dlg=$('dlg'),cur=null;
  function openCart(){if(dlg)dlg.classList.remove('open');drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');scrim.classList.add('open');$('closeCart').focus();}
  function closeAll(){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');if(dlg)dlg.classList.remove('open');scrim.classList.remove('open');}

  /* ---------- Home + shop ---------- */
  var state={cat:'All',scale:'All',brand:'All',q:'',sort:'pop'},wantReq=false;
  function card(p){
    return '<article class="card"><button class="pic'+(p.images&&p.images.length?' photo':'')+'" style="'+cv(p.category)+'" data-open="'+p.id+'" aria-label="Quick view '+esc(p.name)+'">'+picHTML(p)+'<span class="scale">'+esc(scaleLabel(p))+'</span></button>'+
      '<div class="cbody"><div class="cbrand">'+esc(p.brand)+'</div><a class="cname" href="'+partURL(p)+'">'+esc(p.name)+'</a>'+
      '<div class="cfits">'+(p.fits?'Fits: '+esc(p.fits):'')+'</div>'+
      '<div class="cfoot"><span class="price">'+money(p.price)+'</span><button class="add" data-add="'+p.id+'">Add</button></div></div></article>';
  }
  function renderHome(){
    $('partCount').textContent=P.length+(P.length===1?' part':' parts');
    $('tiles').innerHTML=CATS.map(function(c){
      var n=P.filter(function(p){return p.category===c;}).length;
      return '<button class="tile" style="'+cv(c)+'" data-go-cat="'+esc(c)+'"><div class="ic'+(CIMG[c]?' photo':'')+'">'+(CIMG[c]?'<img src="'+ROOT+esc(CIMG[c])+'" alt="'+esc(c)+'" loading="lazy">':art(c))+'</div><div><h3>'+esc(c)+'</h3><span>'+(n?n+(n===1?' part':' parts'):'')+'</span></div></button>';
    }).join('');
    if($('scaleCards'))$('scaleCards').innerHTML=SCALES.map(function(s,i){
      var n=P.filter(function(p){return (p.scale||[]).indexOf(s)>=0;}).length;
      return '<button class="scale-card" style="--sc:'+SC[i%SC.length]+'" data-go-scale="'+s+'"><b>'+s+'</b><span>'+(n?n+(n===1?' part':' parts'):'Scale')+'</span></button>';
    }).join('');
    var top=P.slice().sort(function(a,b){return (b.pop||0)-(a.pop||0)||String(b.added||'').localeCompare(String(a.added||''));}).slice(0,4);
    if($('popularBlock')){$('popularBlock').hidden=!top.length;$('featured').innerHTML=top.map(card).join('');}
  }
  function match(p,ignore){
    if(ignore!=='cat'&&state.cat!=='All'&&p.category!==state.cat)return false;
    if(ignore!=='scale'&&state.scale!=='All'&&(p.scale||[]).indexOf(state.scale)<0)return false;
    if(state.brand!=='All'&&p.brand!==state.brand)return false;
    var q=state.q.trim().toLowerCase();
    if(q){var h=(p.name+' '+p.brand+' '+p.fits+' '+p.category+' '+(p.scale||[]).join(' ')+' '+p.id).toLowerCase();if(!q.split(/\s+/).every(function(w){return h.indexOf(w)>=0;}))return false;}
    return true;
  }
  function renderFilters(){
    $('catChips').innerHTML=['All'].concat(CATS).map(function(c){
      var n=P.filter(function(p){return match(p,'cat')&&(c==='All'||p.category===c);}).length;
      return '<button class="chip" data-cat="'+esc(c)+'" aria-pressed="'+(state.cat===c)+'">'+(c==='All'?'All':esc(c))+'<small>'+n+'</small></button>';
    }).join('');
    $('scaleChips').innerHTML=['All'].concat(SCALES).map(function(s){
      var n=P.filter(function(p){return match(p,'scale')&&(s==='All'||(p.scale||[]).indexOf(s)>=0);}).length;
      return '<button class="chip" data-scale="'+s+'" aria-pressed="'+(state.scale===s)+'">'+(s==='All'?'All scales':s)+'<small>'+n+'</small></button>';
    }).join('');
    var b=['All'];P.forEach(function(p){if(p.brand&&b.indexOf(p.brand)<0)b.push(p.brand);});
    b=[b[0]].concat(b.slice(1).sort());
    $('brandSel').innerHTML=b.map(function(x){return '<option value="'+esc(x)+'"'+(x===state.brand?' selected':'')+'>'+(x==='All'?'All brands':esc(x))+'</option>';}).join('');
  }
  function renderGrid(){
    var f={pop:function(a,b){return(b.pop||0)-(a.pop||0);},lo:function(a,b){return a.price-b.price;},hi:function(a,b){return b.price-a.price;},az:function(a,b){return a.name.localeCompare(b.name);},new:function(a,b){return String(b.added||'').localeCompare(String(a.added||''));}}[state.sort];
    var l=P.filter(function(p){return match(p);}).sort(f);
    var bits=[];if(state.cat!=='All')bits.push(state.cat);if(state.scale!=='All')bits.push(state.scale+' scale');
    $('countLine').textContent=l.length+(l.length===1?' part':' parts')+(bits.length?' · '+bits.join(' · '):'');
    $('clearF').hidden=!(state.cat!=='All'||state.scale!=='All'||state.brand!=='All'||state.q);
    var rc='<div class="reqcard"><h3>Need a part that isn\'t here?</h3><p>We source parts on request for any brand and scale. Tell us what you need and we\'ll quote before you pay.</p><a href="'+ROOT+'index.html#request">Request a part</a></div>';
    $('grid').innerHTML=l.length?l.map(card).join('')+rc:'<div class="empty">'+(P.length?'No parts match these filters right now.':'New parts are being added.')+' We can source parts on request, so tell us what you need.</div>'+rc;
  }
  function refresh(){renderFilters();renderGrid();}
  function openP(id){
    var p=byId(id);if(!p)return;cur=p;
    var dp=$('dPic');dp.setAttribute('style',cv(p.category));dp.className='dpic'+(p.images&&p.images.length?' photo':'');dp.innerHTML=picHTML(p);
    $('dBrand').textContent=(p.brand?p.brand+' · ':'')+p.category;
    $('dTitle').textContent=p.name;
    $('dPrice').textContent=money(p.price);
    $('dDesc').textContent=p.desc||'';
    var r='<tr><td>Scale</td><td>'+esc((p.scale||[]).join(', '))+'</td></tr>'+(p.fits?'<tr><td>Fits</td><td>'+esc(p.fits)+'</td></tr>':'');
    Object.keys(p.specs||{}).forEach(function(k){r+='<tr><td>'+esc(k)+'</td><td>'+esc(p.specs[k])+'</td></tr>';});
    r+='<tr><td>Delivery</td><td>'+DAYS+' days</td></tr>';
    $('dSpecs').innerHTML=r;
    $('dMore').href=partURL(p);
    dlg.classList.add('open');scrim.classList.add('open');$('closeDlg').focus();
  }
  function route(){
    var h=(location.hash||'#home').slice(1);
    if(h==='request')wantReq=true;
    var shop=(h==='shop'||h==='cart');
    $('view-home').hidden=shop;$('view-shop').hidden=!shop;
    document.querySelectorAll('[data-nav]').forEach(function(a){
      var on=a.getAttribute('data-nav')===h||(h==='cart'&&a.getAttribute('data-nav')==='shop')||(!shop&&h!=='faq'&&a.getAttribute('data-nav')==='home');
      if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
    closeAll();
    if(wantReq&&!shop){wantReq=false;$('rqForm').scrollIntoView({block:'center'});setTimeout(function(){$('rqPart').focus();},50);}
    else if(h==='faq'){var f=$('faq');if(f)f.scrollIntoView();}
    else window.scrollTo(0,0);
    if(h==='cart')openCart();
  }
  function goShop(){refresh();if(location.hash==='#shop')route();else location.hash='shop';}

  /* ---------- Part page ---------- */
  function initPart(){
    var p=P[0];if(!p)return;
    var main=$('gMain');
    document.querySelectorAll('[data-thumb]').forEach(function(t){
      t.addEventListener('click',function(){
        main.src=t.getAttribute('data-thumb');
        document.querySelectorAll('[data-thumb]').forEach(function(x){x.setAttribute('aria-pressed',String(x===t));});
      });
    });
    var b=$('pAdd');if(b)b.addEventListener('click',function(){add(p,b);});
    var now=$('pNow');
    if(now){
      var text='Hi '+S.name+', I would like to order:\n\n1. '+p.name+' ['+p.id+'] x 1 = '+money(p.price)+'\n\nPlease confirm availability and shipping.';
      setWa(now,$('pHint'),text,'Opens WhatsApp with this part typed in.','',false);
    }
  }

  /* ---------- Events ---------- */
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-cat],[data-scale],[data-add],[data-open],[data-inc],[data-dec],[data-rm],[data-go-cat],[data-go-scale],[data-close],[data-go-request]');
    if(!t||t.disabled)return;
    var d=t.dataset;
    if(d.goCat){state.cat=d.goCat;state.scale='All';goShop();}
    else if(d.goScale){state.scale=d.goScale;state.cat='All';goShop();}
    else if(d.cat){state.cat=d.cat;refresh();}
    else if(d.scale){state.scale=d.scale;refresh();}
    else if(d.add){add(byId(d.add),t);}
    else if(d.open){openP(d.open);}
    else if(d.inc){var c=cart[d.inc];if(c){c.q=Math.min(c.q+1,99);save();renderCart();}}
    else if(d.dec){var c2=cart[d.dec];if(c2){c2.q--;if(c2.q<=0)delete cart[d.dec];save();renderCart();}}
    else if(d.rm){delete cart[d.rm];save();renderCart();}
    else if(t.hasAttribute('data-go-request')){if(PAGE!=='home')return;if(location.hash==='#request'){e.preventDefault();route();}}
    else if(t.hasAttribute('data-close')){closeAll();}
  });
  ['cName','cCity','cNote'].forEach(function(id){$(id).addEventListener('input',renderCart);});
  $('openCart').addEventListener('click',openCart);
  $('mbar').addEventListener('click',openCart);
  $('closeCart').addEventListener('click',closeAll);
  scrim.addEventListener('click',closeAll);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll();});
  document.querySelectorAll('.wa').forEach(function(a){a.addEventListener('click',function(e){if(a.getAttribute('aria-disabled')==='true')e.preventDefault();});});

  if(PAGE==='home'){
    $('q').addEventListener('input',function(e){state.q=e.target.value;refresh();});
    $('brandSel').addEventListener('change',function(e){state.brand=e.target.value;refresh();});
    $('sortSel').addEventListener('change',function(e){state.sort=e.target.value;renderGrid();});
    $('clearF').addEventListener('click',function(){state={cat:'All',scale:'All',brand:'All',q:'',sort:state.sort};$('q').value='';refresh();});
    ['rqPart','rqCar','rqName'].forEach(function(id){$(id).addEventListener('input',renderReq);});
    $('rqForm').addEventListener('submit',function(e){e.preventDefault();});
    $('closeDlg').addEventListener('click',closeAll);
    $('dAdd').addEventListener('click',function(e){if(cur)add(cur,e.currentTarget);});
    dlg.addEventListener('click',function(e){if(e.target===dlg)closeAll();});
    window.addEventListener('hashchange',route);
    renderHome();refresh();renderReq();renderCart();route();
  } else {
    initPart();renderCart();
    if(location.hash==='#cart')openCart();
  }
})();
