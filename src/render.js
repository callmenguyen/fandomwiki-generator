import MarkdownIt from 'markdown-it';

export const collections = { universe: 'universes', series: 'series', character: 'characters', event: 'events' };
export const labels = { universe: 'Vũ trụ', series: 'Bộ truyện', character: 'Nhân vật', event: 'Sự kiện' };
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
export const articleUrl = (entity, basePath) => `${basePath}/${collections[entity.type]}/${entity.id}.html`;
const parser = new MarkdownIt({ html: false, linkify: false, typographer: false });
parser.inline.ruler.before('link', 'wiki_link', (state, silent) => {
  const match = /^\[\[([a-z0-9]+(?:-[a-z0-9]+)*)(?:\|([^\]\n]+))?\]\]/.exec(state.src.slice(state.pos));
  if (!match) return false;
  if (!silent) {
    const token = state.push('wiki_link', '', 0);
    token.meta = { id: match[1], label: match[2] };
    state.env.references?.push(match[1]);
  }
  state.pos += match[0].length;
  return true;
});
parser.renderer.rules.wiki_link = (tokens, index, options, env) => {
  const { id, label } = tokens[index].meta;
  const entity = env.byId.get(id);
  if (!entity) throw new Error(`Unresolved wiki link: ${id}`);
  return `<a href="${escapeHtml(articleUrl(entity, env.basePath))}">${escapeHtml(label ?? entity.name)}</a>`;
};
export function wikiReferences(body) {
  const env = { references: [] };
  parser.parse(body, env);
  return env.references;
}
export const markdown = (body, byId, basePath) => parser.render(body, { byId, basePath });
export const articleLink = (entity, basePath) => `<a href="${escapeHtml(articleUrl(entity, basePath))}">${escapeHtml(entity.name)}</a>`;

export function layout(content, title, body, { active = '', toc = [] } = {}) {
  const { site, entities } = content;
  const base = site.basePath;
  const nav = Object.entries(collections).map(([type, directory]) => `<a ${active === type ? 'aria-current="page"' : ''} href="${base}/${directory}/index.html"><span>${labels[type]}</span><span class="nav-count">${entities.filter(e => e.type === type).length}</span></a>`).join('');
  return `<!doctype html>
<html lang="${escapeHtml(site.language)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escapeHtml(site.description)}"><title>${escapeHtml(title)} · ${escapeHtml(site.name)}</title><link rel="stylesheet" href="${base}/assets/style.css"><script src="${base}/assets/search.js" defer></script></head>
<body><a class="skip-link" href="#main">Đến nội dung</a>
<header class="topbar"><a class="brand" href="${base}/index.html"><span class="brand-mark" aria-hidden="true">W</span><span>${escapeHtml(site.name)}<small>BÁCH KHOA THẾ GIỚI TƯỞNG TƯỢNG</small></span></a><form class="search-form" action="${base}/search.html"><label class="sr-only" for="global-search">Tìm kiếm bài viết</label><input id="global-search" name="q" type="search" placeholder="Tìm trong thư viện…"><button type="submit">Tìm kiếm</button></form></header>
<div class="shell"><aside class="sidebar"><p class="eyebrow">THƯ VIỆN</p><nav aria-label="Điều hướng chính"><a href="${base}/index.html" ${active === 'home' ? 'aria-current="page"' : ''}>Trang chính</a>${nav}<a href="${base}/timeline.html" ${active === 'timeline' ? 'aria-current="page"' : ''}>Dòng thời gian</a></nav><div class="sidebar-note"><span class="status-dot"></span> Kho tri thức mở<p>Những câu chuyện được kết nối, từng trang một.</p></div></aside>
<main id="main">${body}</main><aside class="contents"><p class="eyebrow">TRÊN TRANG NÀY</p><nav aria-label="Mục lục"><a href="#main">Tổng quan</a>${toc.map(([anchor, label]) => `<a href="#${anchor}">${escapeHtml(label)}</a>`).join('')}</nav><p class="contents-note">${entities.length} bài viết<br>Được xây dựng từ YAML</p></aside></div>
<footer>${escapeHtml(site.name)} <span>·</span> ${escapeHtml(site.description)}</footer></body></html>`;
}

export function articlePage(content, entity) {
  const { site, byId, entities } = content;
  const refs = ids => ids.map(id => articleLink(byId.get(id), site.basePath)).join(', ');
  const facts = [
    ['Loại bài', labels[entity.type]],
    ...(entity.universe ? [['Vũ trụ', refs([entity.universe])]] : []),
    ...(entity.series.length ? [['Bộ truyện', refs(entity.series)]] : []),
    ...(entity.aliases.length ? [['Tên khác', escapeHtml(entity.aliases.join(', '))]] : []),
    ...(entity.date ? [['Thời điểm', escapeHtml(entity.date)]] : []),
    ...Object.entries(entity.facts).map(([key, value]) => [escapeHtml(key), escapeHtml(value)]),
  ];
  const image = entity.image ? `<figure><img src="${escapeHtml(entity.image.startsWith('/') ? site.basePath + entity.image : entity.image)}" alt="${escapeHtml(entity.name)}" loading="lazy">${entity.imageCaption ? `<figcaption>${escapeHtml(entity.imageCaption)}</figcaption>` : ''}</figure>` : `<div class="article-monogram" aria-hidden="true">${escapeHtml(entity.name.charAt(0))}</div>`;
  const sections = entity.sections.map((section, index) => `<section id="section-${index + 1}"><h2>${escapeHtml(section.title)}</h2>${markdown(section.body, byId, site.basePath)}</section>`).join('');
  const members = entity.type === 'universe' ? entities.filter(e => e.universe === entity.id) : entity.type === 'series' ? entities.filter(e => e.series.includes(entity.id)) : [];
  const related = [...new Set([...entity.related, ...entity.participants, ...members.map(e => e.id)])];
  const toc = entity.sections.map((section, index) => [`section-${index + 1}`, section.title]);
  if (related.length) toc.push(['related', 'Bài viết liên quan']);
  if (entity.backlinks.length) toc.push(['backlinks', 'Liên kết đến đây']);
  const body = `<div class="breadcrumb"><a href="${site.basePath}/index.html">Trang chính</a> / <a href="${site.basePath}/${collections[entity.type]}/index.html">${labels[entity.type]}</a></div><div class="article-header"><p class="eyebrow">${labels[entity.type]}</p><h1>${escapeHtml(entity.name)}</h1><p class="subtitle">Từ ${escapeHtml(site.name)}, bách khoa thế giới tưởng tượng</p></div><div class="article-body"><aside class="infobox"><h2>${escapeHtml(entity.name)}</h2>${image}<dl>${facts.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('')}</dl></aside><p class="lead">${escapeHtml(entity.summary)}</p>${entity.tags.length ? `<div class="tags">${entity.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}${sections}${related.length ? `<section id="related"><h2>Bài viết liên quan</h2><ul>${related.map(id => `<li>${articleLink(byId.get(id), site.basePath)} <span class="muted">· ${labels[byId.get(id).type]}</span></li>`).join('')}</ul></section>` : ''}${entity.backlinks.length ? `<section id="backlinks"><h2>Liên kết đến đây</h2><ul>${entity.backlinks.map(id => `<li>${articleLink(byId.get(id), site.basePath)}</li>`).join('')}</ul></section>` : ''}</div>`;
  return layout(content, entity.name, body, { active: entity.type, toc });
}

export function articleList(entities, basePath) {
  return entities.length ? `<div class="article-list">${entities.map(entity => `<article><span class="list-type">${labels[entity.type]}</span><h3>${articleLink(entity, basePath)}</h3><p>${escapeHtml(entity.summary)}</p>${entity.date ? `<small>${escapeHtml(entity.date)}</small>` : ''}</article>`).join('')}</div>` : '<p class="empty">Chưa có bài viết. Thêm file YAML vào thư mục content để bắt đầu.</p>';
}

export function homePage(content) {
  const { site, entities } = content;
  const universes = entities.filter(e => e.type === 'universe');
  const body = `<div class="welcome"><p class="eyebrow">MỖI THẾ GIỚI, MỘT CÂU CHUYỆN</p><h1>Những thế giới.<br>Những câu chuyện.<br><em>Một thư viện.</em></h1><p>${escapeHtml(site.description)}</p><div class="archive-stats">${Object.keys(collections).map(type => `<a href="${site.basePath}/${collections[type]}/index.html"><strong>${entities.filter(e => e.type === type).length}</strong>${labels[type]}</a>`).join('')}</div></div><section id="universes"><div class="section-heading"><h2>Khám phá các vũ trụ</h2><span class="eyebrow">THE WORLD INDEX</span></div>${articleList(universes, site.basePath)}</section><section id="articles"><h2>Trong thư viện</h2>${articleList(entities.filter(e => e.type !== 'universe'), site.basePath)}</section>`;
  return layout(content, 'Trang chính', body, { active: 'home', toc: [['universes', 'Các vũ trụ'], ['articles', 'Trong thư viện']] });
}
