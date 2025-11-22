// main.js

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

  const query = '(' + CONFIG.TARGET_ADDRESSES.map(a => `from:${a}`).join(' OR ') + ') is:unread';

  const threads = GmailApp.search(query, 0, 100);

  threads.forEach(thread => {

    if (thread.getMessages().some(m => m.isDraft())) return;

    const last = thread.getMessages().pop();

    if (!CONFIG.SUBJECT_REGEX.test(last.getSubject())) return;

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
