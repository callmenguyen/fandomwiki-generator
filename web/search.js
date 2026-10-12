const normalize = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase();
const results = document.querySelector('#search-results');
if (results) {
  const input = document.querySelector('#global-search');
  const filter = document.querySelector('#type-filter');
  const status = document.querySelector('#search-status');
  const form = document.querySelector('.search-form');
  const labels = { universe: 'Vũ trụ', series: 'Bộ truyện', character: 'Nhân vật', event: 'Sự kiện' };
  input.value = new URLSearchParams(location.search).get('q') ?? '';
  let index;
  let loadError = false;
  function search() {
    if (!index) return;
    results.replaceChildren();
    const query = normalize(input.value.trim());
    const terms = query.split(/\s+/).filter(Boolean);
    const matches = index.filter(article => {
      const haystack = normalize([article.name, article.summary, ...article.aliases, ...article.tags].join(' '));
      return (!filter.value || article.type === filter.value) && terms.every(term => haystack.includes(term));
    });
    status.textContent = `${matches.length} bài viết${query ? ` cho “${input.value.trim()}”` : ' trong thư viện'}.`;
    for (const article of matches) {
      const row = document.createElement('article');
      const type = document.createElement('span');
      type.className = 'list-type'; type.textContent = labels[article.type];
      const heading = document.createElement('h3');
      const link = document.createElement('a');
      link.href = article.url; link.textContent = article.name;
      const summary = document.createElement('p'); summary.textContent = article.summary;
      heading.append(link); row.append(type, heading, summary); results.append(row);
    }
  }
  input.addEventListener('input', search);
  filter.addEventListener('change', search);
  form.addEventListener('submit', event => {
    event.preventDefault();
    history.replaceState(null, '', `?q=${encodeURIComponent(input.value)}`);
    if (loadError) location.reload();
    else search();
  });
  status.textContent = 'Đang tải thư viện…';
  fetch(new URL('../search-index.json', document.querySelector('script[src$="/assets/search.js"]').src))
    .then(response => { if (!response.ok) throw new Error('Search unavailable'); return response.json(); })
    .then(data => { index = data; search(); })
    .catch(() => { loadError = true; status.textContent = 'Không thể tải tìm kiếm. Nhấn Tìm kiếm để thử lại hoặc duyệt các danh mục.'; });
}
