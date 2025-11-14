const CONFIG = {
  TARGET_ADDRESSES: [
    'hoge@sample.com',
  ],

  SUBJECT_REGEX: /件名/,

  REPLY_BODY_HEADER: [
    'いつもお世話になっております。',
    '',
    'こちら自動生成された返信下書きです。',
    '',
  ].join('\n')
};


function createDraftForUnreadOnly() {

  const my = Session.getActiveUser().getEmail();

  // ★ ここで未読だけに完全固定
  const query = '(' + CONFIG.TARGET_ADDRESSES.map(a => `from:${a}`).join(' OR ') + ') is:unread';

  const threads = GmailApp.search(query, 0, 100);

  threads.forEach(thread => {

    // スレッド内に下書きがあるならスキップ（多重生成防止）
    if (thread.getMessages().some(m => m.isDraft())) return;

    const last = thread.getMessages().pop();

    // 件名マッチしないならスキップ
    if (!CONFIG.SUBJECT_REGEX.test(last.getSubject())) return;

    // reply-all 宛先構成
    const to = collectRecipients(last, my);

    const quoted = quote(stripHtml(last.getBody()));

    const body =
      CONFIG.REPLY_BODY_HEADER +
      '\n--- 元メール引用 ---\n' +
      quoted;

    GmailApp.createDraft(
      to.to,
      'Re: ' + last.getSubject(),
      body,
      {
        cc: to.cc,
        bcc: to.bcc,
        threadId: thread.getId(),
      }
    );
  });
}



// ======== ヘルパー群（そのまま使える） ========

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
