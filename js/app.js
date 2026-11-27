(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const PAGE_SIZE = 20;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = (value) => {
    try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : '#'; } catch { return '#'; }
  };
  function applyFilters(items, query, form, topic) {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((it) => (form === 'all' || it.form === form) &&
      (topic === 'all' || it.topic === topic || it.topic_secondary === topic) &&
      words.every((word) => it._hay.includes(word)));
  }
  function sortItems(items, mode) {
    return items.slice().sort((a,b) => {
      const date = String(b.created_at_shanghai || '').localeCompare(String(a.created_at_shanghai || ''));
      if (mode === 'likes-desc') return (Number(b.likes) || 0) - (Number(a.likes) || 0) || date || String(b.id).localeCompare(String(a.id));
      return (mode === 'date-asc' ? -1 : 1) * (date || String(b.id).localeCompare(String(a.id)));
    });
  }
  function boot(data) {
    const forms = data.taxonomy?.forms || [];
    const topics = data.taxonomy?.topics || [];
    const formName = Object.fromEntries(forms.map((x) => [x.id,x.name]));
    const topicName = Object.fromEntries(topics.map((x) => [x.id,x.name]));
    const items = (data.items || []).map((it) => ({...it, _hay: [it.title,it.summary,it.id,it.url,it.article_url,formName[it.form],topicName[it.topic],topicName[it.topic_secondary]].join('\n').toLowerCase()}));
    const counts = data.counts || {};
    const total = counts.total ?? items.length;
    const articleCount = counts.articles ?? counts.by_form?.article ?? items.filter((it) => it.form === 'article').length;
    $('stats').innerHTML = `<div class="stat"><b>${escapeHtml(total)}</b>条公开分享</div><div class="stat"><b>${escapeHtml(articleCount)}</b>篇长文 / 文章</div>`;
    $('stats-detail').textContent = forms.map((f) => `${f.name} ${counts.by_form?.[f.id] ?? 0}`).join(' ｜ ');
    $('subtitle').textContent = `来源 ${data.source || '@Khazix0918'}；时间均为 ${data.timezone || 'Asia/Shanghai'}。${data.checked_at ? '数据校对于 ' + data.checked_at + '。' : ''}`;
    $('coverage').textContent = data.coverage_note || '';
    $('footer').textContent = `已收录 ${total} 条公开分享。原帖与文章在新窗口打开。`;
    const definition = (x) => `<div class="def"><strong>${escapeHtml(x.name)}</strong><p>${escapeHtml(x.definition)}</p></div>`;
    $('defs').innerHTML = `<div><h3>体裁</h3>${forms.map(definition).join('')}</div><div><h3>主题</h3>${topics.map(definition).join('')}</div>`;
    const chip = (value,label) => `<button type="button" class="chip" data-value="${escapeHtml(value)}" aria-pressed="false"><span>${escapeHtml(label)}</span><span class="n"></span></button>`;
    $('forms').innerHTML = chip('all','全部体裁') + forms.map((f) => chip(f.id,f.name)).join('');
    $('topics').innerHTML = chip('all','全部主题') + topics.map((t) => chip(t.id,t.name)).join('');
    const q = $('q'), sort = $('sort');
    q.disabled = false; sort.disabled = false;
    let state, timer, composing = false;
    function readState() {
      const p = new URLSearchParams(location.search);
      const page = Number(p.get('page'));
      state = {q: p.get('q') || '', form: Object.hasOwn(formName,p.get('form')) ? p.get('form') : 'all', topic: Object.hasOwn(topicName,p.get('topic')) ? p.get('topic') : 'all', sort: ['date-desc','date-asc','likes-desc'].includes(p.get('sort')) ? p.get('sort') : 'date-desc', page: Number.isSafeInteger(page) && page > 0 ? page : 1};
      q.value = state.q; sort.value = state.sort;
    }
    function writeState(mode) {
      const url = new URL(location.href);
      for (const key of ['q','form','topic','sort','page']) url.searchParams.delete(key);
      if (state.q) url.searchParams.set('q',state.q);
      if (state.form !== 'all') url.searchParams.set('form',state.form);
      if (state.topic !== 'all') url.searchParams.set('topic',state.topic);
      if (state.sort !== 'date-desc') url.searchParams.set('sort',state.sort);
      if (state.page > 1) url.searchParams.set('page',state.page);
      if (url.href !== location.href) history[mode === 'push' ? 'pushState' : 'replaceState'](null,'',url);
    }
    function updateChips(root, selected, candidates, field) {
      root.querySelectorAll('button').forEach((button) => {
        const value = button.dataset.value;
        const n = value === 'all' ? candidates.length : candidates.filter((it) => it[field] === value || (field === 'topic' && it.topic_secondary === value)).length;
        button.setAttribute('aria-pressed',String(value === selected));
        button.querySelector('.n').textContent = n;
      });
    }
    function card(it) {
      const external = 'target="_blank" rel="noopener noreferrer"';
      const mainUrl = safeUrl(it.article_url || it.url);
      return `<article class="card" data-form="${escapeHtml(it.form)}" data-id="${escapeHtml(it.id)}">
        <div class="card-top"><span class="form-label">${escapeHtml(formName[it.form] || it.form)}</span><time class="date">${escapeHtml(it.created_at_shanghai)}</time><span class="likes">${escapeHtml(it.likes ?? 0)} 赞</span></div>
        <h3><a href="${escapeHtml(mainUrl)}" ${external}>${escapeHtml(it.title)}</a></h3>
        ${it.summary && it.summary !== it.title ? `<p class="sum">${escapeHtml(it.summary)}</p>` : ''}
        <div class="card-bottom"><div class="tags"><span class="tag">${escapeHtml(topicName[it.topic] || it.topic)}</span>${it.topic_secondary ? `<span class="tag">次要：${escapeHtml(topicName[it.topic_secondary] || it.topic_secondary)}</span>` : ''}</div>
        <div class="links"><a href="${escapeHtml(safeUrl(it.url))}" ${external}>查看原帖 <span aria-hidden="true">↗</span></a>${it.article_url ? `<a href="${escapeHtml(safeUrl(it.article_url))}" ${external}>阅读文章 <span aria-hidden="true">↗</span></a>` : ''}</div></div></article>`;
    }
    function render(mode = 'replace') {
      const filtered = sortItems(applyFilters(items,state.q,state.form,state.topic),state.sort);
      const pages = Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
      state.page = Math.min(state.page,pages);
      updateChips($('forms'),state.form,applyFilters(items,state.q,'all',state.topic),'form');
      updateChips($('topics'),state.topic,applyFilters(items,state.q,state.form,'all'),'topic');
      const start = (state.page-1)*PAGE_SIZE;
      const active = Boolean(state.q.trim() || state.form !== 'all' || state.topic !== 'all');
      $('result-title').textContent = state.topic === 'all' ? (state.form === 'all' ? '全部内容' : formName[state.form]) : topicName[state.topic];
      $('mobile-topic').textContent = topicName[state.topic] || '全部主题';
      $('result-count').textContent = `共 ${filtered.length} 条${filtered.length ? `，本页 ${start+1}–${Math.min(start+PAGE_SIZE,filtered.length)} 条` : ''} · 时间均为 ${data.timezone || 'Asia/Shanghai'}`;
      $('active-filters').hidden = !active;
      $('filter-description').textContent = [state.q.trim() ? `搜索“${state.q.trim()}”` : '',formName[state.form],topicName[state.topic]].filter(Boolean).join(' / ');
      $('list').innerHTML = filtered.length ? filtered.slice(start,start+PAGE_SIZE).map(card).join('') : '<div class="empty"><h3>暂时没有找到相关内容</h3><p>试试更短的关键词，或清空筛选重新探索。</p><button type="button" data-reset>查看全部内容</button></div>';
      $('list').setAttribute('aria-busy','false');
      $('pagination').hidden = pages <= 1;
      $('prev').disabled = state.page === 1; $('next').disabled = state.page === pages;
      $('page-info').textContent = `第 ${state.page} / ${pages} 页`;
      writeState(mode);
    }
    function change(patch, mode = 'push') {
      clearTimeout(timer);
      state = {...state,q:q.value,...patch,page:1};
      render(mode);
    }
    function reset() {
      q.value = ''; change({q:'',form:'all',topic:'all'}); q.focus();
    }
    for (const [root,key] of [[$('forms'),'form'],[$('topics'),'topic']]) {
      root.addEventListener('click',(event) => {
        const button = event.target.closest('button[data-value]');
        if (!button) return;
        change({[key]:button.dataset.value});
      });
    }
    q.addEventListener('compositionstart',() => {composing = true; clearTimeout(timer);});
    q.addEventListener('compositionend',() => {composing = false; change({},'replace');});
    q.addEventListener('input',() => { if (!composing) {clearTimeout(timer); timer = setTimeout(() => change({},'replace'),180);} });
    sort.addEventListener('change',() => change({sort:sort.value}));
    $('reset').addEventListener('click',reset);
    $('list').addEventListener('click',(event) => {if (event.target.closest('[data-reset]')) reset();});
    for (const [id,delta] of [['prev',-1],['next',1]]) $(id).addEventListener('click',() => {
      clearTimeout(timer);
      if (q.value !== state.q) change({},'push');
      else {state.page += delta; render('push');}
      $('results').focus({preventScroll:true}); $('results').scrollIntoView({block:'start'});
    });
    window.addEventListener('popstate',() => {clearTimeout(timer);readState();render();});
    document.addEventListener('keydown',(event) => {
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !event.isComposing && !event.target.closest('input,textarea,select,[contenteditable]')) {event.preventDefault();q.focus();}
    });
    const mobile = matchMedia('(max-width: 800px)');
    const adaptTopics = () => {$('topic-panel').open = !mobile.matches;};
    adaptTopics(); mobile.addEventListener('change',adaptTopics);
    readState(); render();
    window.__catalogFilter = {applyFilters,sortItems,items,formName,topicName};
  }
  function fail(message) {
    $('list').setAttribute('aria-busy','false');
    $('result-count').textContent = '目录未加载';
    $('subtitle').textContent = '数据来源暂时无法读取。';
    $('list').innerHTML = `<div class="error" role="alert"><p>${escapeHtml(message)}</p><button type="button" id="retry">重新加载</button></div>`;
    $('retry').addEventListener('click',() => location.reload());
  }
  if (location.protocol === 'file:') {fail('请在仓库根目录运行 python3 -m http.server 4173，再访问 http://127.0.0.1:4173/。');return;}
  fetch('data/catalog.json').then((response) => {if (!response.ok) throw new Error(`HTTP ${response.status}`);return response.json();}).then(boot).catch((error) => {console.error(error);fail('目录加载失败，请检查网络后重新加载。');});
})();
