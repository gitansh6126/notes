const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const MAD2_DIR = path.join(__dirname, '..', 'Notes', 'MAD2 (Modern Application Development II)');
const REFERENCE_FILE = path.join(MAD2_DIR, 'Week 02 - Advanced JavaScript', 'L2 - Iteration & Destructuring.html');

const refContent = fs.readFileSync(REFERENCE_FILE, 'utf-8');
const refCSS = refContent.match(/<style>([\s\S]*?)<\/style>/)[1].trim();
const refHeader = `<style>${refCSS}</style>\n\n<div class="root">`;

function text(el) {
  return el.text().replace(/\s+/g, ' ').trim();
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function textNoLabel($el) {
  const $ = cheerio.load(`<d>${$el.html()}</d>`, { xmlMode: false });
  $('.label').remove();
  return text($('d'));
}

// ── Flatten DOM to ordered items (headings, cards, special blocks) ──────────
function flatten($, root) {
  const items = [];

  function walk(node) {
    const $el = $(node);
    const tag = (node.tagName || '').toLowerCase();
    const cls = ($el.attr('class') || '').toLowerCase();

    if (!tag || /^(style|script|svg|br|hr|path|i)$/.test(tag)) return;

    // ── Headings ──
    if (/^h[1-6]$/.test(tag)) {
      const t = text($el);
      if (t && t.length > 1 && !/^\d{1,2}$/.test(t)) {
        items.push({ type: 'heading', text: t, level: tag });
      }
      return;
    }

    // ── .section-tag → heading ──
    if (cls.includes('section-tag')) {
      const t = text($el).replace(/^\d+\s*/, '').trim();
      if (t) items.push({ type: 'heading', text: t, level: 'h2' });
      return;
    }

    // ── .kicker → contains h2 heading ──
    if (cls === 'kicker') {
      const $h = $el.find('h2, h3').first();
      if ($h.length) {
        const t = text($h);
        if (t) items.push({ type: 'heading', text: t, level: $h[0].tagName.toLowerCase() });
      }
      return;
    }

    // ── .card (original) → preserve as unit ──
    if (tag === 'div' && cls.split(/\s+/).includes('card')) {
      // Skip nested cards
      if ($el.parents('.card').length > 0) return;
      items.push({ type: 'card', el: $el });
      return;
    }

    // ── Standalone callout / special boxes ──
    if (cls.includes('callout') || cls.includes('analogy-box') ||
        cls.includes('industry-box') || cls.includes('mistake-box') ||
        cls.includes('tip-box') || cls.includes('takeaway') ||
        cls.includes('equation-card') || cls.includes('recap')) {
      items.push({ type: 'special', el: $el, cls });
      return;
    }

    // ── Standalone pre (code) ──
    if (tag === 'pre') {
      items.push({ type: 'code', el: $el });
      return;
    }

    // ── Standalone table ──
    if (tag === 'table') {
      items.push({ type: 'table', el: $el });
      return;
    }

    // ── Standalone list ──
    if (tag === 'ul' || tag === 'ol') {
      items.push({ type: 'list', el: $el });
      return;
    }

    // ── Standalone hero text ──
    if (cls === 'hero' || cls.includes('section-intro')) {
      items.push({ type: 'hero', el: $el });
      return;
    }

    // ── Standalone paragraph → text block ──
    if (tag === 'p') {
      const pCls = ($el.parent().attr('class') || '').toLowerCase();
      if (pCls.includes('eyebrow') || pCls.includes('label') || pCls.includes('icon')) return;
      if ($el.parents('.card, li, th, td, .label').length > 0) return;
      if ($el.parents('.eyebrow, .hero, .section-tag, .kicker').length > 0) return;

      const t = text($el);
      if (t && t.length > 5) {
        items.push({ type: 'para', el: $el });
      }
      return;
    }

    // ── Recurse into containers ──
    if (/^(div|section|header|footer|main|article|aside|nav|figure|figcaption|span|p)$/.test(tag)) {
      $(node).children().each((_, c) => walk(c));
    }
  }

  root.children().each((_, c) => walk(c));
  return items;
}

// ── Group items into sections by heading boundaries ──────────
function groupSections(items) {
  const sections = [];
  let cur = { heading: '', items: [] };

  for (const item of items) {
    if (item.type === 'heading') {
      if (cur.items.length > 0) sections.push(cur);
      cur = { heading: item.text, items: [] };
    } else {
      cur.items.push(item);
    }
  }
  if (cur.items.length > 0) sections.push(cur);
  return sections;
}

// ── Process a single original .card into output card blocks ──────────
function processCard($, $card) {
  const blocks = [];

  // Title
  const $term = $card.find('> .term, > h4, > h2, > .emoji-h, > .card-name');
  let title = '';
  if ($term.length) {
    title = text($term.first()).replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|\uFE0F/gu, '').replace(/\s+/g, ' ').trim();
    // If after cleanup title is just a generic word, use parent context
    if (!title || title.length < 2) title = text($term.first()).trim();
  }

  // Chalkboard: .row.analogy → analogy, .row with "Real Life" label → usecase
  $card.find('> .row').each(function () {
    const $r = $(this);
    const rCls = ($r.attr('class') || '').toLowerCase();
    const $label = $r.find('> .label');
    const labelTxt = $label.length ? text($label) : '';
    const content = textNoLabel($r) || text($r);

    if (!content) return;
    if (rCls.includes('analog') || /analogy/i.test(labelTxt)) {
      blocks.push({ type: 'analogy', text: content });
    } else if (rCls.includes('industry') || rCls.includes('usecase') || /real (life|use)/i.test(labelTxt)) {
      blocks.push({ type: 'usecase', text: content });
    } else {
      blocks.push({ type: 'text', text: content });
    }
  });

  // Dark emoji theme sub-boxes
  $card.find('> .analogy-box').each(function () {
    const t = textNoLabel($(this)) || text($(this));
    if (t) blocks.push({ type: 'analogy', text: t });
  });
  $card.find('> .industry-box').each(function () {
    const t = textNoLabel($(this)) || text($(this));
    if (t) blocks.push({ type: 'usecase', text: t });
  });
  $card.find('> .mistake-box').each(function () {
    const t = textNoLabel($(this)) || text($(this));
    if (t) blocks.push({ type: 'warn', text: t });
  });
  $card.find('> .tip-box').each(function () {
    const t = textNoLabel($(this)) || text($(this));
    if (t) blocks.push({ type: 'tip', text: t });
  });
  $card.find('> .callout').each(function () {
    const $co = $(this);
    const coCls = ($co.attr('class') || '').toLowerCase();
    const lbl = text($co.find('> .label'));
    const body = textNoLabel($co) || text($co);
    if (!body) return;
    if (coCls.includes('warn') || /warn|danger/i.test(lbl)) blocks.push({ type: 'warn', text: body });
    else if (coCls.includes('insight') || coCls.includes('tip') || /tip|insight/i.test(lbl)) blocks.push({ type: 'tip', text: body });
    else blocks.push({ type: 'text', text: body });
  });

  // Code in card
  $card.find('pre').each(function () {
    const code = text($(this));
    if (code) blocks.push({ type: 'code', text: code });
  });
  $card.find('> code').each(function () {
    const t = text($(this));
    if (t) blocks.push({ type: 'code', text: t });
  });

  // Lists in card
  $card.find('ul, ol').each(function () {
    const $l = $(this);
    if ($l.parents('li').length > 0) return;
    const items = [];
    $l.children('li').each(function () {
      const t = text($(this));
      if (t) items.push(t);
    });
    if (items.length) blocks.push({ type: 'list', items, ordered: $l[0].tagName.toLowerCase() === 'ol' });
  });

  // Tables in card
  $card.find('table').each(function () {
    const html = $.html($(this));
    blocks.push({ type: 'table', html });
  });

  // Remaining paragraphs in card
  $card.find('> p, > .def').each(function () {
    const $p = $(this);
    if ($p.is('.card-name, .card-sub, .term, .emoji-h, .label')) return;
    if ($p.find('.label').length > 0) return;
    const t = text($p);
    if (!t || t.length < 3) return;
    // Deduplicate
    const exists = blocks.some(b => b.type === 'text' && b.text.includes(t.substring(0, 25)));
    if (!exists) blocks.push({ type: 'text', text: t });
  });

  return { title, blocks };
}

// ── Process a special block (callout/analogy/industry/etc) ──────────
function processSpecial($, $el, cls) {
  const blocks = [];
  const t = textNoLabel($el) || text($el);
  if (!t) return null;

  let type = 'text';
  if (cls.includes('analog')) type = 'analogy';
  else if (cls.includes('industry') || cls.includes('usecase')) type = 'usecase';
  else if (cls.includes('mistake') || cls.includes('warn') || cls.includes('danger')) type = 'warn';
  else if (cls.includes('tip') || cls.includes('insight')) type = 'tip';
  else if (cls.includes('equation') || cls.includes('code')) type = 'code';

  blocks.push({ type, text: t });

  // Also extract any code inside
  $el.find('pre, code').each(function () {
    if ($(this).parents('pre').length > 0) return;
    const ct = text($(this));
    if (ct) blocks.push({ type: 'code', text: ct });
  });

  return blocks;
}

// ── Convert flattened items into output cards ──────────
function buildCards($, items) {
  const cards = [];

  for (const item of items) {
    switch (item.type) {
      case 'card': {
        const result = processCard($, item.el);
        if (result.blocks.length > 0) {
          cards.push({ heading: result.title, blocks: result.blocks });
        }
        break;
      }
      case 'special': {
        const blocks = processSpecial($, item.el, item.cls);
        if (blocks && blocks.length > 0) {
          cards.push({ heading: '', blocks });
        }
        break;
      }
      case 'code': {
        const t = text(item.el);
        if (t) cards.push({ heading: '', blocks: [{ type: 'code', text: t }] });
        break;
      }
      case 'table': {
        const html = $.html(item.el);
        cards.push({ heading: '', blocks: [{ type: 'table', html }] });
        break;
      }
      case 'list': {
        const items_list = [];
        item.el.children('li').each(function () {
          const t = text($(this));
          if (t) items_list.push(t);
        });
        if (items_list.length) {
          cards.push({
            heading: '',
            blocks: [{ type: 'list', items: items_list, ordered: item.el[0].tagName.toLowerCase() === 'ol' }]
          });
        }
        break;
      }
      case 'hero':
      case 'para': {
        const t = text(item.el);
        if (t && t.length > 5) {
          // Check parent for context
          const pCls = (item.el.parent().attr('class') || '').toLowerCase();
          if (pCls.includes('analog') && !pCls.includes('label')) {
            cards.push({ heading: '', blocks: [{ type: 'analogy', text: textNoLabel(item.el.parent()) || t }] });
          } else if (pCls.includes('industry') || pCls.includes('usecase')) {
            cards.push({ heading: '', blocks: [{ type: 'usecase', text: textNoLabel(item.el.parent()) || t }] });
          } else {
            cards.push({ heading: '', blocks: [{ type: 'text', text: t }] });
          }
        }
        break;
      }
    }
  }

  return cards;
}

// ── Build card HTML ──────────
function buildCardHTML(card) {
  const { heading, blocks } = card;
  const hasAna = blocks.some(b => b.type === 'analogy');
  const hasUse = blocks.some(b => b.type === 'usecase');
  const codes = blocks.filter(b => b.type === 'code');
  const warns = blocks.filter(b => b.type === 'warn');
  const tips = blocks.filter(b => b.type === 'tip');
  const texts = blocks.filter(b => b.type === 'text');
  const summaries = blocks.filter(b => b.type === 'summary');
  const lists = blocks.filter(b => b.type === 'list');
  const tables = blocks.filter(b => b.type === 'table');

  let icon = 'ti ti-file-text';
  if (hasAna && hasUse) icon = 'ti ti-books';
  else if (hasAna) icon = 'ti ti-eye';
  else if (hasUse) icon = 'ti ti-building-store';
  else if (codes.length) icon = 'ti ti-code';
  else if (warns.length) icon = 'ti ti-alert-triangle';
  else if (tips.length) icon = 'ti ti-info-circle';

  let h = '';
  h += '  <div class="card">\n';
  h += '    <div class="card-top">\n';
  h += `      <i class="${icon} card-icon" aria-hidden="true"></i>\n`;
  h += '      <div>\n';
  h += `        <p class="card-name">${esc(heading || 'Notes')}</p>\n`;
  h += '        <p class="card-sub">Key concepts and examples</p>\n';
  h += '      </div>\n';
  h += '    </div>\n';

  if (hasAna && hasUse) {
    h += '    <div class="row2">\n';
    for (const b of blocks) {
      if (b.type === 'analogy') h += `      <div class="pill analogy"><span class="pill-label">Analogy</span>${esc(b.text)}</div>\n`;
      if (b.type === 'usecase') h += `      <div class="pill usecase"><span class="pill-label">Real Use</span>${esc(b.text)}</div>\n`;
    }
    h += '    </div>\n';
  } else {
    for (const b of blocks) {
      if (b.type === 'analogy') h += `    <div class="pill analogy"><span class="pill-label">Analogy</span>${esc(b.text)}</div>\n`;
      if (b.type === 'usecase') h += `    <div class="pill usecase"><span class="pill-label">Real Use</span>${esc(b.text)}</div>\n`;
    }
  }

  for (const b of codes) h += `    <div class="pill code">${esc(b.text)}</div>\n`;
  for (const b of warns) h += `    <div class="warn"><i class="ti ti-alert-triangle" aria-hidden="true"></i>${esc(b.text)}</div>\n`;
  for (const b of tips) h += `    <div class="tip"><i class="ti ti-info-circle" aria-hidden="true"></i>${esc(b.text)}</div>\n`;
  for (const b of [...texts, ...summaries]) h += `    <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:8px 0 0;">${esc(b.text)}</p>\n`;

  for (const b of lists) {
    const tg = b.ordered ? 'ol' : 'ul';
    h += `    <${tg} style="margin:8px 0;padding-left:18px;font-size:12px;color:var(--text-secondary);line-height:1.7;">\n`;
    for (const item of b.items) h += `      <li>${esc(item)}</li>\n`;
    h += `    </${tg}>\n`;
  }

  for (const b of tables) h += `    <div style="overflow-x:auto;margin:8px 0;font-size:12px;">${b.html}</div>\n`;

  h += '  </div>\n';
  return h;
}

// ── Convert one file ──────────
function convertFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.trim()) return;

  const fileName = path.basename(filePath);
  if (path.resolve(filePath) === path.resolve(REFERENCE_FILE)) {
    console.log(`  SKIP  ${fileName}`);
    return;
  }

  const $ = cheerio.load(content, { decodeEntities: false });
  const title = $('title').text().trim() || path.basename(filePath, '.html');
  $('style, head, script').remove();

  const root = $('body').length ? $('body') : $.root();
  const items = flatten($, root);
  const sections = groupSections(items);

  // Build output for each section
  let pageTitle = title;
  let contentSections = sections;

  // If first section is title-like, use as page title
  if (sections.length > 0 && sections[0].heading) {
    const hasContent = sections[0].items.length > 0;
    if (!hasContent) {
      pageTitle = sections[0].heading;
      contentSections = sections.slice(1);
    }
  }

  if (contentSections.length === 0 && items.length > 0) {
    // Put all items in one section
    contentSections = [{ heading: '', items }];
  }

  let output = refHeader + '\n';
  output += `<h2 class="sr-only">${esc(pageTitle)}</h2>\n\n`;

  let secNum = 0;
  for (const sec of contentSections) {
    if (!sec.heading && sec.items.length === 0) continue;
    secNum++;

    const cards = buildCards($, sec.items);
    if (cards.length === 0) continue;

    output += '<div class="section">\n';
    output += '  <div class="sec-header">\n';
    output += `    <div class="sec-num">${secNum}</div>\n`;
    output += `    <p class="sec-title">${esc(sec.heading || `Section ${secNum}`)}</p>\n`;
    output += '  </div>\n';

    for (const card of cards) {
      output += buildCardHTML(card);
    }

    output += '</div>\n\n';
  }

  output += '</div>\n';
  fs.writeFileSync(filePath, output, 'utf-8');
  console.log(`  OK    ${fileName} (${secNum} sections)`);
}

// ── Main ──────────
function main() {
  console.log('MAD2 Notes Converter');
  console.log(`Reference: ${path.basename(REFERENCE_FILE)}\n`);

  const weekDirs = fs.readdirSync(MAD2_DIR)
    .filter(f => fs.statSync(path.join(MAD2_DIR, f)).isDirectory())
    .sort();

  for (const weekDir of weekDirs) {
    const weekPath = path.join(MAD2_DIR, weekDir);
    const files = fs.readdirSync(weekPath)
      .filter(f => f.endsWith('.html') && fs.statSync(path.join(weekPath, f)).size > 0)
      .sort();
    if (files.length === 0) continue;

    console.log(`── ${weekDir} ──`);
    for (const file of files) {
      convertFile(path.join(weekPath, file));
    }
  }

  console.log('\nDone.');
}

main();
