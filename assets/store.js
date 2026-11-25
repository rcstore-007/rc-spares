/* RC store front-end. Used by the home/shop page (body data-page="home") and by each part page (data-page="part"). */
(function(){
  document.documentElement.classList.add('js');
  function data(id,fallback){var el=document.getElementById(id);if(!el)return fallback;try{return JSON.parse(el.textContent);}catch(e){return fallback;}}
  var S=data('store-settings',{});
  var P=data('products',[]);
  var PAGE=document.body.getAttribute('data-page')||'home';
  var ROOT=document.body.getAttribute('data-root')||'';
  var CUR=S.currency||'₹';
  var DAYS=S.delivery||'15–21';
  var CIMG=S.categoryImages||{};

  var CATS=['Motors & ESCs','Tyres & Wheels','Shocks','Batteries & Chargers','Gears & Drivetrain','Servos','Lights','Winch','Radios & Receivers','Tools & Accessories'];
  var CARS=data('car-models',[]);
  var SCALES=['1:30','1:24','1:18','1:12','1:10','1:8','1:7','1:5'];
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
  var GOALS={'Motors & ESCs':'More speed','Tyres & Wheels':'More grip','Shocks':'Smoother landings','Batteries & Chargers':'Longer runs',
    'Gears & Drivetrain':'Tougher drivetrain','Servos':'Sharper steering','Lights':'Light up the trail','Winch':'Get unstuck',
    'Radios & Receivers':'Better control','Tools & Accessories':'Keep it running'};
  function byId(id){for(var i=0;i<P.length;i++)if(P[i].id===id)return P[i];return null;}
  /* Variations (colour, size, CC…): each option may have its own price and photo */
  function opts(p){return p&&p.variants&&p.variants.options&&p.variants.options.length?p.variants.options:null;}
  function oPrice(p,o){return o&&o.price?o.price:p.price;}
  function oImg(p,o){return o&&o.img!=null&&p.images&&p.images[o.img]?p.images[o.img]:((p.images&&p.images[0])||'');}
  function keyOf(p,o){return o?p.id+'::'+o.name:p.id;}
  function priceRange(p){var o=opts(p);if(!o)return [p.price,p.price];var a=o.map(function(x){return oPrice(p,x);});return [Math.min.apply(null,a),Math.max.apply(null,a)];}

  /* ---------- Cart (shared by all pages, kept in this browser) ---------- */
  var cart={};
  try{cart=JSON.parse(localStorage.getItem('rc-cart2')||'{}')||{};}catch(e){cart={};}
  function save(){try{localStorage.setItem('rc-cart2',JSON.stringify(cart));}catch(e){}}
  // On the home page we know every product: refresh prices, drop removed parts
  if(PAGE==='home'){Object.keys(cart).forEach(function(k){
    var bits=k.split('::'),p=byId(bits[0]),o=null;
    if(p&&bits.length>1){o=(opts(p)||[]).filter(function(x){return x.name===bits.slice(1).join('::');})[0];if(!o)p=null;}
    if(!p)delete cart[k];else{cart[k].price=oPrice(p,o);cart[k].name=p.name;cart[k].img=oImg(p,o);}
  });save();}
  function snap(p,o){return{q:0,id:p.id,name:p.name,opt:o?p.variants.label+': '+o.name:'',price:oPrice(p,o),category:p.category,img:oImg(p,o),slug:p.slug};}
  function qty(k){return cart[k]?cart[k].q:0;}
  function add(p,btn,o){
    if(!p)return;
    var k=keyOf(p,o);
    if(!cart[k])cart[k]=snap(p,o);
    cart[k].q=Math.min(cart[k].q+1,99);save();renderCart();
    toast(p,o);
    var cb=$('openCart');cb.classList.remove('bump');void cb.offsetWidth;cb.classList.add('bump');
  }
  /* Small "Added" message at the bottom of the screen */
  var toastT=null;
  function toast(p,o){
    var t=$('toast');
    if(!t){t=document.createElement('div');t.id='toast';t.className='toast';t.setAttribute('role','status');document.body.appendChild(t);}
    var q=qty(keyOf(p,o));
    t.innerHTML='<span class="tick" aria-hidden="true">✓</span><span class="tt"><b>Added to cart</b><small>'+esc(p.name)+(o?' ('+esc(o.name)+')':'')+' · '+q+(q===1?' piece':' pieces')+' in your cart</small></span><button type="button" data-viewcart>View cart</button>';
    t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show');},3200);
  }
  /* Show how many of each part are already in the cart */
  function syncAdds(){
    document.querySelectorAll('[data-add]').forEach(function(b){
      var q=qty(b.getAttribute('data-add'));
      b.classList.toggle('in',q>0);
      b.innerHTML=q?'<span aria-hidden="true">✓</span> '+q+' in cart':(b.classList.contains('full')?'Add to cart':'Add');
      b.setAttribute('aria-label',q?q+' in cart. Add one more':'Add to cart');
    });
    var pa=$('pAdd'),pc=$('pInCart');
    if(pa&&PAGE==='part'&&P[0]){initPartWa();
      var q=qty(keyOf(P[0],selOpt));
      pa.textContent=q?'Add one more':'Add to cart';
      pc.hidden=!q;
      if(q)pc.innerHTML='<span aria-hidden="true">✓</span> '+q+(q===1?' piece':' pieces')+(selOpt?' of '+esc(selOpt.name):' of this part')+' in your cart · <button type="button" data-viewcart>View cart</button>';
    }
    var da=$('dAdd');
    if(da&&cur){var q2=qty(cur.id);da.textContent=q2?'✓ '+q2+' in cart · add one more':'Add to cart';}
  }
  function lines(){return Object.keys(cart).map(function(k){return{key:k,id:(cart[k]&&cart[k].id)||k.split('::')[0],c:cart[k]};}).filter(function(l){return l.c&&l.c.q>0;});}
  function waNum(){return (S.whatsapp||'').replace(/\D/g,'');}
  function msg(){
    var t=0,o=['Hi '+S.name+', I would like to order:',''];
    lines().forEach(function(l,i){var s=l.c.price*l.c.q;t+=s;o.push((i+1)+'. '+l.c.name+(l.c.opt?' ('+l.c.opt+')':'')+' ['+l.id+'] x '+l.c.q+' = '+money(s));});
    o.push('','Total: '+money(t),'','Please confirm availability and shipping.');
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
      return '<div class="it"><div class="th" style="'+cv(l.c.category)+'">'+th+'</div><div><div class="t">'+esc(l.c.name)+'</div>'+(l.c.opt?'<div class="s vo-s">'+esc(l.c.opt)+'</div>':'')+'<div class="s">'+money(l.c.price)+' each</div>'+
        '<div class="qty"><button data-dec="'+esc(l.key)+'" aria-label="One less">−</button><span>'+l.c.q+'</span><button data-inc="'+esc(l.key)+'" aria-label="One more">+</button></div></div>'+
        '<div class="r"><span class="lt">'+money(l.c.price*l.c.q)+'</span><button class="rm" data-rm="'+esc(l.key)+'">Remove</button></div></div>';
    }).join(''):'<div class="empty" style="margin-top:14px">Your cart is empty.<br><a class="more" href="'+ROOT+'index.html#shop" data-close>Browse parts →</a></div>';
    setWa($('waBtn'),$('waHint'),msg(),'Opens WhatsApp with your order typed in. Just press send.','Add at least one part to send an order.',!L.length);
    syncAdds();
  }

  /* ---------- Request a part (form on home page) ---------- */
  function renderReq(){
    if(!$('rqPart'))return;
    var part=$('rqPart').value.trim(),car=$('rqCar').value.trim();
    var o=['Hi '+S.name+', can you source a part for me?','','Part: '+(part||'-'),'Car and scale: '+(car||'-')];
    setWa($('rqBtn'),$('rqHint'),o.join('\n'),'','Type the part you need to continue.',!part);
  }

  /* ---------- Overlays ---------- */
  var drawer=$('drawer'),scrim=$('scrim'),dlg=$('dlg'),cur=null;
  function openCart(){if(dlg)dlg.classList.remove('open');drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');scrim.classList.add('open');$('closeCart').focus();}
  function closeAll(){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');if(dlg)dlg.classList.remove('open');scrim.classList.remove('open');}

  /* ---------- Home + shop ---------- */
  var state={cat:'All',scale:'All',brand:'All',q:'',sort:'pop',car:'',size:''},wantReq=false;
  // phones: swipe through all of a part's photos right on the card
  var TOUCH=window.matchMedia&&matchMedia('(hover:none)').matches;
  function swipeHTML(im){
    if(!TOUCH)return '';
    return '<span class="swipe">'+im.map(function(src,i){return '<img src="'+ROOT+esc(src)+'" alt="" loading="'+(i?'lazy':'eager')+'" draggable="false">';}).join('')+'</span>'+
      '<span class="sdots">'+im.map(function(_,i){return '<i'+(i?'':' class="on"')+'></i>';}).join('')+'</span>';
  }
  document.addEventListener('scroll',function(e){
    var sw=e.target;if(!sw.classList||!sw.classList.contains('swipe'))return;
    var i=Math.round(sw.scrollLeft/sw.clientWidth),d=sw.parentNode.querySelectorAll('.sdots i');
    for(var k=0;k<d.length;k++)d[k].className=k===i?'on':'';
  },true);
  function card(p){
    var q=qty(p.id),o=opts(p),r=priceRange(p),im=p.images||[];
    var price='<span class="price">'+(o&&r[0]!==r[1]?'<small>From </small>':'')+money(o?r[0]:p.price)+'</span>';
    var btn=o?'<a class="add full" href="'+partURL(p)+'">Choose '+esc((p.variants.label||'option').toLowerCase())+'</a>':
      '<button class="add full'+(q?' in':'')+'" data-add="'+p.id+'">'+(q?'<span aria-hidden="true">✓</span> '+q+' in cart':'Add to cart')+'</button>';
    return '<article class="card"><a class="pic'+(im.length?' photo':'')+(im.length>1?' two':'')+'" style="'+cv(p.category)+'" href="'+partURL(p)+'" aria-label="'+esc(p.name)+'">'+picHTML(p)+
      (im.length>1?'<img class="alt" src="'+ROOT+esc(im[1])+'" alt="" loading="lazy">'+swipeHTML(im):'')+'<span class="scale">'+esc(scaleLabel(p))+'</span></a>'+
      '<div class="cbody"><div class="cbrand">'+esc(p.brand)+(p.kind?'<span class="ckind">'+(p.brand?' · ':'')+esc(p.kind)+'</span>':'')+'</div><a class="cname" href="'+partURL(p)+'">'+esc(p.name)+'</a>'+
      '<div class="cfits">'+(p.fits?'Fits: '+esc(p.fits):'')+'</div>'+
      '<div class="cfoot">'+price+'</div>'+btn+'</div></article>';
  }
  function catIcon(c,attr,on){
    return '<button type="button" class="cat'+(on?' on':'')+'" '+attr+'="'+esc(c)+'"><span class="ci">'+(c==='All'?'<b>All</b>':(CIMG[c]?'<img src="'+ROOT+esc(CIMG[c])+'" alt="" loading="lazy">':art(c)))+'</span><span class="cn">'+(c==='All'?'All parts':esc(c))+'</span>'+(GOALS[c]?'<em class="goal">'+GOALS[c]+'</em>':'')+'</button>';
  }
  function renderHome(){
    if($('partCount'))$('partCount').textContent=P.length+(P.length===1?' part':' parts');
    $('tiles').innerHTML=CATS.map(function(c){return catIcon(c,'data-go-cat');}).join('');
    if($('scaleCards'))$('scaleCards').innerHTML=SCALES.map(function(s,i){
      var n=P.filter(function(p){return (p.scale||[]).indexOf(s)>=0;}).length;
      return '<button class="scale-card" style="--sc:'+SC[i%SC.length]+'" data-go-scale="'+s+'"><b>'+s+'</b><span>'+(n?n+(n===1?' part':' parts'):'Scale')+'</span></button>';
    }).join('');
    var top=P.slice().sort(function(a,b){return (b.pop||0)-(a.pop||0)||String(b.added||'').localeCompare(String(a.added||''));}).slice(0,4);
    if($('popularBlock')){$('popularBlock').hidden=!top.length;$('featured').innerHTML=top.map(card).join('');}
  }
  // "Find parts for my car": parts made for the car, then universal parts of the same scale
  function carScale(){for(var i=0;i<CARS.length;i++)if(CARS[i].name===state.car)return CARS[i].scale;return '';}
  function carInfo(n){for(var i=0;i<CARS.length;i++)if(CARS[i].name===n)return CARS[i];return {};}
  function madeFor(p){
    if(!state.car)return false;
    var m=p.models||[],me=carInfo(state.car);
    if(m.indexOf(state.car)>=0)return true;
    if(me.parent&&m.indexOf(me.parent)>=0)return true;              // "all versions" parts fit each version
    return m.some(function(x){return carInfo(x).parent===state.car;});  // version parts show under "all versions"
  }
  function carOK(p){
    if(!state.car)return true;
    if(madeFor(p))return true;
    return !(p.models&&p.models.length)&&(p.scale||[]).indexOf(carScale())>=0;
  }
  function carOptions(sel,blank){
    var groups={};CARS.forEach(function(c){(groups[c.scale]=groups[c.scale]||[]).push(c);});
    var o='<option value="">'+blank+'</option>';
    Object.keys(groups).sort(function(a,b){return parseFloat(b.split(':')[1])-parseFloat(a.split(':')[1]);}).forEach(function(s){o+='<optgroup label="'+s+' scale">'+groups[s].map(function(c){return '<option value="'+esc(c.name)+'"'+(state.car===c.name?' selected':'')+'>'+esc(c.name)+'</option>';}).join('')+'</optgroup>';});
    sel.innerHTML=o;
  }
  function sizeOK(p){
    if(!state.size)return true;
    var k=state.size.split('|');return ((p.sizes||{})[k[0]]||[]).indexOf(k[1])>=0;
  }
  function match(p,ignore){
    if(!carOK(p))return false;
    if(ignore!=='size'&&!sizeOK(p))return false;
    if(ignore!=='cat'&&state.cat!=='All'&&p.category!==state.cat)return false;
    if(ignore!=='scale'&&state.scale!=='All'&&(p.scale||[]).indexOf(state.scale)<0)return false;
    if(state.brand!=='All'&&p.brand!==state.brand)return false;
    var q=state.q.trim().toLowerCase();
    if(q){var h=(p.name+' '+p.brand+' '+p.fits+' '+(p.models||[]).join(' ')+' '+(p.kind||'')+' '+p.category+' '+(p.scale||[]).join(' ')+' '+p.id).toLowerCase();if(!q.split(/\s+/).every(function(w){return h.indexOf(w)>=0;}))return false;}
    return true;
  }
  function renderFilters(){
    if($('shopCats'))$('shopCats').innerHTML=['All'].concat(CATS).map(function(c){return catIcon(c,'data-cat',state.cat===c);}).join('');
    $('catSel').innerHTML=['All'].concat(CATS).map(function(c){
      var n=P.filter(function(p){return match(p,'cat')&&(c==='All'||p.category===c);}).length;
      return '<option value="'+esc(c)+'"'+(state.cat===c?' selected':'')+'>'+(c==='All'?'All categories':esc(c))+'</option>';
    }).join('');
    $('scaleSel').innerHTML=['All'].concat(SCALES).map(function(s){
      var n=P.filter(function(p){return match(p,'scale')&&(s==='All'||(p.scale||[]).indexOf(s)>=0);}).length;
      return '<option value="'+s+'"'+(state.scale===s?' selected':'')+'>'+(s==='All'?'All scales':s+' scale')+'</option>';
    }).join('');
    var b=['All'];P.forEach(function(p){if(p.brand&&b.indexOf(p.brand)<0)b.push(p.brand);});
    b=[b[0]].concat(b.slice(1).sort());
    if($('carSel'))carOptions($('carSel'),'Any car');
    if($('carTiles')){
      var top=CARS.filter(function(c){return !c.parent;});
      $('carTiles').innerHTML=top.map(function(c){
        var on=state.car===c.name||carInfo(state.car).parent===c.name;
        return '<button type="button" class="ctile'+(on?' on':'')+'" data-car="'+esc(c.name)+'">'+(c.photo?'<img src="'+ROOT+esc(c.photo)+'" alt="" loading="lazy">':'<span class="cnoimg"></span>')+
          '<span>'+esc(c.name.replace(/\s*\(.*$/,''))+'</span></button>';}).join('');
    }
    if($('sizeSel')){
      var sz={};P.forEach(function(p){if(!match(p,'size'))return;var s=p.sizes||{};Object.keys(s).forEach(function(k){s[k].forEach(function(v){(sz[k]=sz[k]||{})[v]=1;});});});
      var num=function(a,b){var x=parseFloat(a),y=parseFloat(b);return (isNaN(x)||isNaN(y))?String(a).localeCompare(b):x-y;},o='<option value="">Any size / type</option>',any=false;
      ['Wheel size','Shock length','Wheel hex','Battery cells','Plug'].forEach(function(k){if(!sz[k])return;any=true;
        o+='<optgroup label="'+k+'">'+Object.keys(sz[k]).sort(num).map(function(v){var key=k+'|'+v;return '<option value="'+esc(key)+'"'+(state.size===key?' selected':'')+'>'+esc(k==='Wheel hex'?v+' hex':k==='Battery cells'?v+' battery':k==='Plug'?v+' plug':v)+'</option>';}).join('')+'</optgroup>';});
      if(state.size&&!any)state.size='';
      $('sizeSel').innerHTML=o;$('sizeSel').hidden=!any&&!state.size;
    }
    $('brandSel').innerHTML=b.map(function(x){return '<option value="'+esc(x)+'"'+(x===state.brand?' selected':'')+'>'+(x==='All'?'All brands':esc(x))+'</option>';}).join('');
  }
  function renderGrid(){
    var f={pop:function(a,b){return(b.pop||0)-(a.pop||0);},lo:function(a,b){return priceRange(a)[0]-priceRange(b)[0];},hi:function(a,b){return priceRange(b)[1]-priceRange(a)[1];},az:function(a,b){return a.name.localeCompare(b.name);},new:function(a,b){return String(b.added||'').localeCompare(String(a.added||''));}}[state.sort];
    var l=P.filter(function(p){return match(p);}).sort(f);
    // searching: parts whose own name has the words come first, category-only matches last
    var qw=state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if(qw.length){
      var stem=function(w){return w.replace(/(es|s)$/,'');};
      var score=function(p){var n=p.name.toLowerCase(),b=(p.brand+' '+p.fits).toLowerCase(),sc=0;
        qw.forEach(function(w){var k=stem(w);sc+=n.indexOf(k)>=0?3:(b.indexOf(k)>=0?1:0);});return sc;};
      l=l.map(function(p,i){return [score(p),i,p];}).sort(function(a,b){return b[0]-a[0]||a[1]-b[1];}).map(function(x){return x[2];});
    }
    var bits=[];if(state.cat!=='All')bits.push(state.cat);if(state.scale!=='All')bits.push(state.scale+' scale');if(state.size)bits.push(state.size.split('|')[1]+(state.size.indexOf('hex')>=0?' hex':''));
    var mine=[],uni=[];
    if(state.car){l.forEach(function(p){(madeFor(p)?mine:uni).push(p);});l=mine.concat(uni);}
    $('countLine').textContent=state.car?(mine.length+' made for '+state.car+' · '+uni.length+' universal '+carScale()+' parts'+(bits.length?' · '+bits.join(' · '):''))
      :l.length+(l.length===1?' part':' parts')+(bits.length?' · '+bits.join(' · '):'');
    $('clearF').hidden=!(state.cat!=='All'||state.scale!=='All'||state.brand!=='All'||state.q||state.car||state.size);
    var rc='<div class="reqcard"><h3>Need a part that isn\'t here?</h3><p>We source parts on request for any brand and scale. Tell us what you need and we\'ll quote before you pay.</p><a href="'+ROOT+'index.html#request">Request a part</a></div>';
    setTimeout(reveal,0);
    if(state.car&&l.length){
      var dv='<div class="cardiv"><b>Universal '+carScale()+' parts</b><span>These suit most '+carScale()+' models. Check the size and mounting, or send us a photo of your car on WhatsApp.</span></div>';
      if(!mine.length)dv=dv.replace('class="cardiv"','class="cardiv first"');
      $('grid').innerHTML=mine.map(card).join('')+(uni.length?dv+uni.map(card).join(''):'')+rc;
      return;
    }
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
    r+='<tr><td>Shipping</td><td>Usually ships within '+DAYS+' days</td></tr>';
    $('dSpecs').innerHTML=r;
    $('dMore').href=partURL(p);
    syncAdds();
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
    else if(h==='faq'||h==='about'||h==='stages'||h==='fix'){var f=$(h);if(f)f.scrollIntoView();}
    else window.scrollTo(0,0);
    if(h==='cart')openCart();
  }
  function goShop(){refresh();if(location.hash==='#shop')route();else location.hash='shop';}

  /* ---------- Part page ---------- */
  var selOpt=null;
  function showPhoto(src){
    var main=$('gMain');if(!main||!src)return;
    if(main.getAttribute('src')!==src){main.classList.add('swap');setTimeout(function(){main.src=src;main.classList.remove('swap');applyTint(main,main.parentNode,93,89);},140);}
    document.querySelectorAll('[data-thumb]').forEach(function(x){x.setAttribute('aria-pressed',String(x.getAttribute('data-thumb')===src));});
  }
  function initPart(){
    var p=P[0];if(!p)return;
    var o=opts(p);selOpt=o?o[0]:null;
    document.querySelectorAll('[data-thumb]').forEach(function(t){
      t.addEventListener('click',function(){showPhoto(t.getAttribute('data-thumb'));});
    });
    document.querySelectorAll('[data-vi]').forEach(function(t){
      t.addEventListener('click',function(){
        selOpt=o[+t.getAttribute('data-vi')];
        document.querySelectorAll('[data-vi]').forEach(function(x){x.setAttribute('aria-pressed',String(x===t));});
        $('pVarName').textContent=selOpt.name;
        $('pPrice').textContent=money(oPrice(p,selOpt));
        if(selOpt.img!=null)showPhoto(ROOT+oImg(p,selOpt));
        syncAdds();
      });
    });
    var b=$('pAdd');if(b)b.addEventListener('click',function(){add(p,b,selOpt);});
    var gm=$('gMain');
    if(gm&&p.images&&p.images.length){
      gm.style.cursor='zoom-in';gm.setAttribute('title','Tap to open and zoom');
      var swiped=false;
      gm.addEventListener('click',function(){if(swiped)return;var all=p.images.map(function(i){return ROOT+i;});lightbox(all,all.indexOf(gm.getAttribute('src')));});
      // Swipe left/right on the photo (phones) to see the next or previous photo
      if(p.images.length>1){
        var sx=null,sy=null,box=gm.parentNode;
        box.addEventListener('touchstart',function(e){if(e.touches.length===1){sx=e.touches[0].clientX;sy=e.touches[0].clientY;swiped=false;}},{passive:true});
        box.addEventListener('touchend',function(e){
          if(sx===null)return;var dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=null;
          if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.3){
            swiped=true;setTimeout(function(){swiped=false;},400);
            var all=p.images.map(function(i){return ROOT+i;}),i=all.indexOf(gm.getAttribute('src'));
            showPhoto(all[(i+(dx<0?1:-1)+all.length)%all.length]);
          }
        },{passive:true});
      }
    }
    initPartWa();
  }
  function initPartWa(){
    var p=P[0],now=$('pNow');
    if(now&&p){
      var q=Math.max(1,qty(keyOf(p,selOpt))),pr=oPrice(p,selOpt);
      var text='Hi '+S.name+', I would like to order:\n\n1. '+p.name+(selOpt?' ('+p.variants.label+': '+selOpt.name+')':'')+' ['+p.id+'] x '+q+' = '+money(pr*q)+'\n\nPlease confirm availability and shipping.';
      setWa(now,$('pHint'),text,'','',false);
      if(waNum())$('pHint').textContent='';
    }
  }

  /* ---------- Gentle motion: fade things in as they scroll into view, settle the header ---------- */
  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){
    es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
  },{rootMargin:'0px 0px -6% 0px',threshold:.08}):null;
  function reveal(){
    if(!io){return;}
    var n=0;
    document.querySelectorAll('.cat,.fixc,.card,.step,.stg,.source,.qs details,.head,.promise,.faq-side,.strip,.pinfo>*,.gallery').forEach(function(el){
      if(el.classList.contains('rv'))return;
      el.classList.add('rv');
      var r=el.getBoundingClientRect();
      if(r.top<innerHeight&&r.bottom>0){el.style.transitionDelay=Math.min(n++,8)*40+'ms';}
      io.observe(el);
    });
  }
  var lastS=false;
  var trail=document.querySelector('.hero.photo .hbg img'),rmo=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onScroll(){if(trail&&!rmo&&window.scrollY<900)trail.parentNode.parentNode.style.setProperty('--drift',Math.round(window.scrollY*0.25));var s=window.scrollY>8;if(s!==lastS){document.body.classList.toggle('scrolled',s);lastS=s;}}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* ---------- "Shop" in the menu opens the shop with the search box ready for typing ---------- */
  function focusSearch(){var q=$('q');if(q)setTimeout(function(){try{q.focus({preventScroll:true});}catch(e){q.focus();}},60);}
  document.querySelectorAll('[data-shopsearch]').forEach(function(a){
    a.addEventListener('click',function(e){
      if(PAGE==='home'){e.preventDefault();if(location.hash!=='#shop'){location.hash='shop';}else{window.scrollTo(0,0);}focusSearch();}
      else{try{sessionStorage.setItem('rc-focus','1');}catch(x){}}
    });
  });

  /* ---------- Soft backgrounds picked from each photo's own colour ----------
     Looks at a tiny copy of the photo, finds its main colour (ignoring white/black backgrounds)
     and sets a very light tint of it behind the photo, so product shots blend into their tile. */
  var TINTS={};try{TINTS=JSON.parse(sessionStorage.getItem('rc-tints')||'{}');}catch(e){}
  var tcv=document.createElement('canvas');tcv.width=tcv.height=36;var tcx=null;try{tcx=tcv.getContext('2d',{willReadFrequently:true});}catch(e){}
  function hueOf(img){
    var key=img.currentSrc||img.src;if(key in TINTS)return TINTS[key];
    var res=null;
    try{
      tcx.clearRect(0,0,36,36);tcx.drawImage(img,0,0,36,36);var d=tcx.getImageData(0,0,36,36).data,x=0,y=0,w=0,lsum=0,n=0;
      for(var i=0;i<d.length;i+=4){
        var r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,c=mx-mn;
        if(d[i+3]<128)continue;n++;lsum+=l;
        if(c<0.12||l>0.93||l<0.08)continue;
        var h=mx===r?((g-b)/c)%6:mx===g?(b-r)/c+2:(r-g)/c+4;h*=Math.PI/3;
        var wt=c*c;x+=Math.cos(h)*wt;y+=Math.sin(h)*wt;w+=wt;
      }
      if(w>n*0.004){var hue=Math.round((Math.atan2(y,x)*180/Math.PI+360)%360),str=Math.min(1,Math.sqrt(x*x+y*y)/w);res=[hue,Math.round(str*100)];}
      else res=[0,0];
    }catch(e){res=null;}
    if(res){TINTS[key]=res;try{sessionStorage.setItem('rc-tints',JSON.stringify(TINTS));}catch(e){}}
    return res;
  }
  function applyTint(img,el,light,light2){
    if(!tcx||!el)return;
    function go(){var t=hueOf(img);if(!t)return;var neutral=t[1]<15,h=neutral?38:t[0],s=neutral?14:Math.min(58,22+t[1]*0.45);
      el.style.setProperty('--tint','hsl('+h+','+s+'%,'+(light||89)+'%)');el.style.setProperty('--tint2','hsl('+h+','+s+'%,'+(light2||84)+'%)');
      el.style.setProperty('--tintdark','hsl('+h+','+Math.min(30,s)+'%,13%)');el.style.setProperty('--tintmid','hsl('+h+','+Math.min(26,s)+'%,20%)');}
    if(img.complete&&img.naturalWidth)go();else img.addEventListener('load',go,{once:true});
  }
  function tintAll(){
    document.querySelectorAll('.vo.has-img img').forEach(function(img){
      var el=img;if(el.dataset.tinted===(img.getAttribute('src')||''))return;el.dataset.tinted=img.getAttribute('src')||'';applyTint(img,el);
    });
    document.querySelectorAll('.thumbs button img').forEach(function(img){applyTint(img,img.parentNode,93,89);});
    var st=document.querySelector('.stpic img');if(st)applyTint(st,document.querySelector('.stages'),90,86);
    var hi=document.querySelector('.hero.photo .hbg img');
    var gm=$('gMain');if(gm)applyTint(gm,gm.parentNode,93,89);
  }
  if(window.MutationObserver){var tq=null;new MutationObserver(function(){clearTimeout(tq);tq=setTimeout(tintAll,60);}).observe(document.body,{childList:true,subtree:true});}
  window.addEventListener('load',tintAll);

  /* ---------- Side menu (three lines, top left) ---------- */
  var sm=$('sideMenu'),msc=$('menuScrim'),mb=$('openMenu');
  function openMenu(){sm.hidden=false;msc.hidden=false;requestAnimationFrame(function(){sm.classList.add('open');msc.classList.add('open');});mb.setAttribute('aria-expanded','true');document.documentElement.style.overflow='hidden';$('closeMenu').focus();}
  function closeMenu(){sm.classList.remove('open');msc.classList.remove('open');mb.setAttribute('aria-expanded','false');document.documentElement.style.overflow='';setTimeout(function(){if(!sm.classList.contains('open')){sm.hidden=true;msc.hidden=true;}},300);}
  if(mb){
    mb.addEventListener('click',openMenu);$('closeMenu').addEventListener('click',closeMenu);msc.addEventListener('click',closeMenu);
    sm.addEventListener('click',function(e){
      var tg=e.target.closest('.smtoggle');
      if(tg){var open=tg.getAttribute('aria-expanded')!=='true';tg.setAttribute('aria-expanded',String(open));$(tg.getAttribute('aria-controls')).hidden=!open;return;}
      var a=e.target.closest('a');if(!a)return;
      if(a.hasAttribute('data-mcat')&&PAGE==='home'){e.preventDefault();state.cat=a.getAttribute('data-mcat');state.scale='All';goShop();}
      closeMenu();
    });
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!sm.hidden)closeMenu();});
  }

  /* ---------- Photo viewer: tap a part photo to see it full screen and zoom in ---------- */
  var LB=null;
  function lightbox(list,start){
    if(!LB){
      LB=document.createElement('div');LB.className='lb';LB.setAttribute('role','dialog');LB.setAttribute('aria-modal','true');LB.setAttribute('aria-label','Photo viewer');
      LB.innerHTML='<button class="lbx" aria-label="Close">✕</button><button class="lbp" aria-label="Previous photo">‹</button><div class="lbst"><img alt=""></div><button class="lbn" aria-label="Next photo">›</button><div class="lbc"></div><div class="lbh">Tap the photo to zoom</div>';
      document.body.appendChild(LB);
      var img=LB.querySelector('img'),st=LB.querySelector('.lbst'),zoom=false,drag=null;
      function setOrigin(x,y){var r=img.getBoundingClientRect();img.style.transformOrigin=Math.max(0,Math.min(100,(x-r.left)/r.width*100))+'% '+Math.max(0,Math.min(100,(y-r.top)/r.height*100))+'%';}
      LB.setZoom=function(z,x,y){zoom=z;if(z&&x!=null)setOrigin(x,y);LB.classList.toggle('zoomed',z);};
      img.addEventListener('click',function(e){if(drag&&drag.moved)return;LB.setZoom(!zoom,e.clientX,e.clientY);});
      st.addEventListener('mousemove',function(e){if(zoom&&e.pointerType!=='touch')setOrigin(e.clientX,e.clientY);});
      st.addEventListener('touchstart',function(e){if(e.touches.length===1)drag={x:e.touches[0].clientX,y:e.touches[0].clientY,moved:false};},{passive:true});
      st.addEventListener('touchmove',function(e){
        if(!drag||e.touches.length!==1)return;var t=e.touches[0],dx=t.clientX-drag.x,dy=t.clientY-drag.y;
        if(Math.abs(dx)+Math.abs(dy)>8)drag.moved=true;
        if(zoom){e.preventDefault();var r=img.getBoundingClientRect();var o=(img.style.transformOrigin||'50% 50%').split(' ').map(parseFloat);
          img.style.transformOrigin=Math.max(0,Math.min(100,o[0]-dx/r.width*60))+'% '+Math.max(0,Math.min(100,o[1]-dy/r.height*60))+'%';drag.x=t.clientX;drag.y=t.clientY;}
      },{passive:false});
      st.addEventListener('touchend',function(e){
        if(drag&&!zoom&&drag.moved){var dx=(e.changedTouches[0].clientX-drag.x);if(Math.abs(dx)>50)LB.go(dx<0?1:-1);}
        setTimeout(function(){drag=null;},50);
      });
      LB.querySelector('.lbx').addEventListener('click',function(){LB.close();});
      LB.querySelector('.lbp').addEventListener('click',function(){LB.go(-1);});
      LB.querySelector('.lbn').addEventListener('click',function(){LB.go(1);});
      LB.addEventListener('click',function(e){if(e.target===LB||e.target===st)LB.close();});
      document.addEventListener('keydown',function(e){if(!LB.classList.contains('open'))return;if(e.key==='Escape')LB.close();if(e.key==='ArrowRight')LB.go(1);if(e.key==='ArrowLeft')LB.go(-1);});
      LB.show=function(i){LB.i=(i+LB.list.length)%LB.list.length;LB.setZoom(false);img.style.transformOrigin='50% 50%';img.src=LB.list[LB.i];applyTint(img,LB,93,89);
        LB.querySelector('.lbc').textContent=LB.list.length>1?(LB.i+1)+' / '+LB.list.length:'';
        LB.classList.toggle('single',LB.list.length<2);};
      LB.go=function(d){LB.show(LB.i+d);};
      LB.close=function(){LB.classList.remove('open');document.documentElement.style.overflow='';setTimeout(function(){if(!LB.classList.contains('open'))LB.hidden=true;},250);};
    }
    LB.list=list;LB.hidden=false;LB.show(Math.max(0,start));document.documentElement.style.overflow='hidden';
    requestAnimationFrame(function(){LB.classList.add('open');});LB.querySelector('.lbx').focus();
  }

  /* ---------- Events ---------- */
  document.addEventListener('click',function(e){
    var t=e.target.closest('[data-cat],[data-scale],[data-add],[data-open],[data-inc],[data-dec],[data-rm],[data-go-cat],[data-go-scale],[data-close],[data-go-request],[data-viewcart]');
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
    else if(t.hasAttribute('data-viewcart')){var ts=$('toast');if(ts)ts.classList.remove('show');openCart();}
  });
  $('openCart').addEventListener('click',openCart);
  $('mbar').addEventListener('click',openCart);
  $('closeCart').addEventListener('click',closeAll);
  scrim.addEventListener('click',closeAll);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeAll();});
  document.querySelectorAll('.wa').forEach(function(a){a.addEventListener('click',function(e){if(a.getAttribute('aria-disabled')==='true')e.preventDefault();});});

  if(PAGE==='home'){
    $('q').addEventListener('input',function(e){state.q=e.target.value;refresh();});
    $('brandSel').addEventListener('change',function(e){state.brand=e.target.value;refresh();});
    $('catSel').addEventListener('change',function(e){state.cat=e.target.value;refresh();});
    $('scaleSel').addEventListener('change',function(e){state.scale=e.target.value;refresh();});
    if($('sizeSel'))$('sizeSel').addEventListener('change',function(e){state.size=e.target.value;refresh();});
    function showTiles(on){if(!$('carTiles'))return;$('carTiles').hidden=!on;$('carMore').setAttribute('aria-expanded',on);$('carMore').textContent=on?'Hide cars':'See all cars';}
    if($('carMore'))$('carMore').addEventListener('click',function(){showTiles($('carTiles').hidden);});
    if($('carTiles'))$('carTiles').addEventListener('click',function(e){var b=e.target.closest('[data-car]');if(!b)return;var n=b.getAttribute('data-car');state.car=(state.car===n?'':n);if(state.car)state.scale='All';showTiles(false);refresh();});
    if($('carSel'))$('carSel').addEventListener('change',function(e){state.car=e.target.value;if(state.car)state.scale='All';refresh();});
    if($('hCarSel')){carOptions($('hCarSel'),'Choose your car');$('hCarSel').addEventListener('change',function(e){if(!e.target.value)return;state.car=e.target.value;state.scale='All';state.cat='All';goShop();e.target.value='';});}
    $('sortSel').addEventListener('change',function(e){state.sort=e.target.value;renderGrid();});
    $('clearF').addEventListener('click',function(){state={cat:'All',scale:'All',brand:'All',q:'',sort:state.sort,car:'',size:''};$('q').value='';refresh();});
    ['rqPart','rqCar'].forEach(function(id){$(id).addEventListener('input',renderReq);});
    $('rqForm').addEventListener('submit',function(e){e.preventDefault();});
    $('closeDlg').addEventListener('click',closeAll);
    $('dAdd').addEventListener('click',function(e){if(cur)add(cur,e.currentTarget);});
    dlg.addEventListener('click',function(e){if(e.target===dlg)closeAll();});
    window.addEventListener('hashchange',route);
    try{var qcar=new URLSearchParams(location.search).get('car');if(qcar&&CARS.some(function(c){return c.name===qcar;})){state.car=qcar;history.replaceState(null,'',location.pathname+location.hash);}}catch(e){}
    try{var qc=new URLSearchParams(location.search).get('cat');if(qc&&CATS.indexOf(qc)>=0){state.cat=qc;state.scale='All';history.replaceState(null,'',location.pathname+location.hash);}}catch(e){}
    renderHome();refresh();renderReq();renderCart();route();reveal();tintAll();
    try{if(sessionStorage.getItem('rc-focus')){sessionStorage.removeItem('rc-focus');focusSearch();}}catch(e){}
  } else {
    initPart();renderCart();reveal();tintAll();
    if(location.hash==='#cart')openCart();
  }
})();
