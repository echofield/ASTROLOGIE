/* =========================================================================
   THE ASTROLAB — the header. One component, mounted on every page.
   Identity · three muted word-places · one gold invitation. Nothing else —
   no clock, no language switch, no day/night toggle, no nav icons.
   Mount: put <header id="astro-header"></header> in the body and load this
   script after it. In the app (SPA) set window.AstroGo = show; this header
   then drives surface swaps in-page; on static pages the links navigate.
   ========================================================================= */
(function(){
  'use strict';
  const HOME='AstroLab%20Home.html', APP='The%20AstroLab.html', ATLAS='Constellation%20Atlas.html';

  /* ---- style: injected once, scoped to .topbar, leaning on the page's tokens ---- */
  if(!document.getElementById('astro-header-style')){
    const st=document.createElement('style'); st.id='astro-header-style';
    st.textContent=`
    .topbar{position:fixed;top:0;left:0;right:0;z-index:60;display:flex;align-items:center;justify-content:space-between;
      padding:30px 56px;font-family:var(--mono);font-size:12px;letter-spacing:.3em;text-transform:uppercase;
      background:linear-gradient(180deg,rgba(5,8,15,.96) 32%,rgba(5,8,15,.82) 68%,rgba(5,8,15,0) 100%);
      backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px)}
    .topbar .brand{display:flex;align-items:center;gap:13px;text-decoration:none}
    .topbar .brand .seal{width:7px;height:7px;background:var(--gold);border-radius:50%;box-shadow:0 0 10px rgba(226,200,132,.7);flex:none}
    .topbar .brand .name{font-family:var(--serif);font-size:23px;letter-spacing:.5px;text-transform:none;color:var(--ivory);font-weight:500}
    .topbar .nav{display:flex;align-items:center;gap:30px}
    .topbar .place{font-family:var(--mono);font-size:11.5px;letter-spacing:.24em;text-transform:uppercase;
      background:none;border:0;cursor:pointer;color:var(--slate);display:inline-flex;align-items:center;gap:8px;padding:6px 0;text-decoration:none;
      transition:color .5s var(--ease)}
    .topbar .place:hover{color:var(--ivory)}
    .topbar .place.on{color:var(--gold-bright)}
    .topbar .nav-div{width:1px;height:18px;background:var(--rule);flex:none}
    .topbar .nav-reading{font-family:var(--mono);font-size:11px;letter-spacing:.22em;text-transform:uppercase;
      color:var(--gold-bright);background:none;border:1px solid var(--gold);cursor:pointer;text-decoration:none;
      padding:8px 17px;display:inline-flex;align-items:center;gap:9px;
      transition:background .5s var(--ease),color .5s var(--ease),border-color .5s var(--ease)}
    .topbar .nav-reading:hover{background:rgba(194,162,95,.07);color:#f3e3bd;border-color:var(--gold-bright)}
    .topbar .nav-reading.on{border-color:var(--gold-bright);color:#f3e3bd}
    .topbar .nav-group{position:relative;display:flex;align-items:center}
    .topbar .caret{width:9px;height:9px;display:inline-flex;align-items:center;color:var(--slate-dim);transition:transform .4s var(--ease),color .4s var(--ease)}
    .topbar .caret svg{width:9px;height:7px;stroke:currentColor;fill:none;stroke-width:1.4}
    .topbar .nav-group:hover .group-label,.topbar .nav-group.open .group-label{color:var(--ivory)}
    .topbar .nav-group:hover .caret,.topbar .nav-group.open .caret{color:var(--gold-deep)}
    .topbar .nav-group.open .caret{transform:rotate(180deg)}
    .topbar .nav-menu{position:absolute;top:calc(100% + 12px);left:-14px;min-width:166px;z-index:70;
      background:linear-gradient(180deg,rgba(11,18,36,.98),rgba(7,11,24,.98));border:1px solid var(--rule-soft);padding:8px;
      display:flex;flex-direction:column;gap:2px;opacity:0;transform:translateY(-6px);pointer-events:none;
      transition:opacity .4s var(--ease),transform .4s var(--ease);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
    .topbar .nav-menu::before{content:"";position:absolute;top:-12px;left:0;right:0;height:12px}
    .topbar .nav-group:hover .nav-menu,.topbar .nav-group.open .nav-menu{opacity:1;transform:none;pointer-events:auto}
    .topbar .menu-item{font-family:var(--mono);font-size:11px;letter-spacing:.2em;text-transform:uppercase;
      background:none;border:0;cursor:pointer;color:var(--slate);display:block;
      padding:10px 12px;text-decoration:none;transition:color .4s var(--ease),background .4s var(--ease)}
    .topbar .menu-item:hover{color:var(--ivory);background:rgba(194,162,95,.05)}
    .topbar .menu-item.on{color:var(--gold-bright)}
    @media (max-width:1080px){ .topbar{padding:24px 30px} .topbar .nav{gap:20px} }
    @media (max-width:760px){
      .topbar{flex-wrap:wrap;gap:14px 0;padding:16px 20px}
      .topbar .brand{order:1}.topbar .brand .name{font-size:20px}
      .topbar .nav{order:3;width:100%;justify-content:flex-start;flex-wrap:wrap;gap:12px 18px;margin-top:2px}
      .topbar .place{font-size:10.5px;letter-spacing:.14em}
      .topbar .nav-div{display:none}
      .topbar .nav-reading{font-size:10px;padding:6px 12px;letter-spacing:.16em}
    }`;
    document.head.appendChild(st);
  }

  /* ---- markup ---- */
  let bar=document.getElementById('astro-header');
  if(!bar){ bar=document.createElement('header'); document.body.insertBefore(bar,document.body.firstChild); }
  bar.className='topbar';
  bar.innerHTML=
    '<a class="brand" href="'+HOME+'"><span class="seal"></span><span class="name">The AstroLab</span></a>'+
    '<nav class="nav">'+
      '<div class="nav-group">'+
        '<button class="place group-label" data-group type="button">The Sky<span class="caret"><svg viewBox="0 0 10 7"><path d="M1 1.5l4 4 4-4"/></svg></span></button>'+
        '<div class="nav-menu">'+
          '<a class="menu-item" data-surface="calendar" href="'+APP+'#calendar">Calendar</a>'+
          '<a class="menu-item" href="'+ATLAS+'">Atlas</a>'+
        '</div>'+
      '</div>'+
      '<a class="place" data-surface="cabinet" href="'+APP+'#cabinet">Cabinet</a>'+
      '<a class="place" data-surface="genius" href="'+APP+'#genius">Genius</a>'+
      '<span class="nav-div"></span>'+
      '<a class="nav-reading" data-surface="offering" href="'+APP+'#reading">The Reading</a>'+
    '</nav>';

  const group=bar.querySelector('.nav-group');
  const groupLabel=bar.querySelector('.group-label');

  /* ---- active state (the app calls this through show()) ---- */
  function setActive(id){
    bar.querySelectorAll('[data-surface]').forEach(a=>a.classList.toggle('on', a.dataset.surface===id));
    if(groupLabel) groupLabel.classList.toggle('on', id==='calendar');
  }
  window.AstroHeader={ setActive };

  /* ---- behaviour: dropdown + in-app surface swaps vs. plain navigation ---- */
  bar.addEventListener('click',e=>{
    if(e.target.closest('[data-group]')){ e.preventDefault(); e.stopPropagation(); group.classList.toggle('open'); return; }
    const item=e.target.closest('[data-surface]');
    if(item && typeof window.AstroGo==='function'){ e.preventDefault(); window.AstroGo(item.dataset.surface); group.classList.remove('open'); return; }
    if(e.target.closest('.menu-item')) group.classList.remove('open');   // let the link navigate, but close the menu
  });
  document.addEventListener('click',e=>{ if(group && !e.target.closest('.nav-group')) group.classList.remove('open'); });
})();
