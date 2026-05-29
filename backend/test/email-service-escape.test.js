import test from 'node:test';
import assert from 'node:assert/strict';
import { sendBookingConfirmationEmail, sendAdminBookingNotification } from '../src/email-service.js';

/**
 * Garantia anti-XSS: o conteudo nunca pode chegar nao-escapado ao
 * provider. Substituimos fetch globalmente, capturamos o htmlContent
 * enviado para a Brevo e verificamos.
 */

function withMockBrevo(run) {
  const original = global.fetch;
  const previous = { ...process.env };
  process.env.BREVO_API_KEY = 'fake';
  process.env.BREVO_FROM_EMAIL = 'noreply@hsbeauty.com';
  process.env.ADMIN_NOTIFICATION_EMAIL = 'admin@hsbeauty.com';

  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body) : null });
    return { ok: true, status: 200, text: async () => '' };
  };

  return run(calls).finally(() => {
    global.fetch = original;
    process.env = previous;
  });
}

test('confirmacao para cliente escapa HTML do nome', async () => {
  await withMockBrevo(async (calls) => {
    await sendBookingConfirmationEmail({
      nomeCliente: '<script>alert(1)</script>',
      email: 'maria@x.com',
      servico: 'Unhas',
      data: '2026-05-25T09:00:00.000Z',
      hora: '09:00',
    });
    assert.equal(calls.length, 1);
    const html = calls[0].body.htmlContent;
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'nome deveria estar escapado');
    assert.ok(!html.includes('<script>alert(1)</script>'), 'nome bruto nao deveria aparecer');
  });
});

test('notificacao para admin escapa nome, telefone e observacoes', async () => {
  await withMockBrevo(async (calls) => {
    await sendAdminBookingNotification({
      nomeCliente: '"><img src=x onerror=alert(1)>',
      telefone: '21999998888',
      email: 'a@b.com',
      servico: 'Cílios',
      data: '2026-05-25T10:00:00.000Z',
      hora: '10:00',
      observacoes: '<a href="javascript:bad()">click</a>',
    });
    assert.equal(calls.length, 1);
    const html = calls[0].body.htmlContent;
    assert.ok(!html.includes('<img src=x onerror'), 'tag img bruta nao deveria existir');
    assert.ok(!html.includes('<a href="javascript:'), 'link com href javascript nao pode renderizar');
    assert.ok(html.includes('&lt;img'), 'tag deveria estar escapada');
    assert.ok(html.includes('&lt;a href=&quot;javascript:bad()&quot;'), 'observacao deveria estar escapada');
  });
});

test('confirmacao sem email retorna missing_email sem chamar provider', async () => {
  await withMockBrevo(async (calls) => {
    const r = await sendBookingConfirmationEmail({
      nomeCliente: 'Maria',
      email: null,
      servico: 'Unhas',
      data: '2026-05-25T09:00:00.000Z',
      hora: '09:00',
    });
    assert.deepEqual(r, { sent: false, reason: 'missing_email' });
    assert.equal(calls.length, 0);
  });
});
