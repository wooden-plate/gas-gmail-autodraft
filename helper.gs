// helpers.js

function collectRecipients(msg, my) {
  const to = extract(msg.getTo());
  const cc = extract(msg.getCc());
  const bcc = extract(msg.getBcc());
  const from = [extractOne(msg.getFrom())];

  const all = new Set([...to, ...cc, ...bcc, ...from]);
  all.delete(my);

  return {
    to: Array.from(all).join(','),
    cc: cc.filter(e => e !== my).join(','),
    bcc: bcc.filter(e => e !== my).join(','),
  };
}

function extract(str) {
  if (!str) return [];
  return str.split(',').map(s => extractOne(s.trim())).filter(Boolean);
}

function extractOne(str) {
  const m = str.match(/<(.+?)>/);
  return m ? m[1] : str;
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function quote(text) {
  return text.split('\n').map(l => '> ' + l).join('\n');
}
