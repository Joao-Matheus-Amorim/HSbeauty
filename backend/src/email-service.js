import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch]);
}

const EMAIL_SEND_TIMEOUT_MS = 15000;

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timeout apos ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function buildAdminNotificationHtml({ nomeCliente, telefone, email, servico, dataFormatada, hora, observacoes }) {
  const n = escapeHtml(nomeCliente);
  const t = escapeHtml(telefone);
  const e = escapeHtml(email);
  const s = escapeHtml(servico);
  const d = escapeHtml(dataFormatada);
  const h = escapeHtml(hora);
  const o = escapeHtml(observacoes);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#be123c;margin-bottom:8px">Novo agendamento recebido</h2>
  <p>Um cliente acabou de solicitar um horário no site.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Cliente</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${n}</strong></td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Telefone</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${t}</strong></td></tr>
    ${email ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Email</td><td style="padding:8px;border-bottom:1px solid #eee">${e}</td></tr>` : ''}
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Serviço</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${s}</strong></td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Data</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${d}</strong></td></tr>
    <tr><td style="padding:8px;${observacoes ? 'border-bottom:1px solid #eee;' : ''}color:#555">Horário</td><td style="padding:8px;${observacoes ? 'border-bottom:1px solid #eee;' : ''}"><strong>${h}</strong></td></tr>
    ${observacoes ? `<tr><td style="padding:8px;color:#555;vertical-align:top">Observações</td><td style="padding:8px">${o}</td></tr>` : ''}
  </table>
  <p style="font-size:13px;color:#555">Acesse o painel para confirmar ou cancelar este agendamento.</p>
</body>
</html>`;
}

function buildBookingConfirmationHtml({ nomeCliente, servico, dataFormatada, hora }) {
  const n = escapeHtml(nomeCliente);
  const s = escapeHtml(servico);
  const d = escapeHtml(dataFormatada);
  const h = escapeHtml(hora);
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#be123c;margin-bottom:8px">Agendamento recebido!</h2>
  <p>Olá, <strong>${n}</strong>!</p>
  <p>Seu pedido foi registrado e está <strong>aguardando confirmação</strong>.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Serviço</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${s}</strong></td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Data</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${d}</strong></td></tr>
    <tr><td style="padding:8px;color:#555">Horário</td><td style="padding:8px"><strong>${h}</strong></td></tr>
  </table>
  <p style="font-size:13px;color:#555">Em breve entraremos em contato para confirmar seu horário.</p>
</body>
</html>`;
}

function formatBookingDate(data) {
  return new Date(data).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}

async function sendViaBrevo({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.BREVO_FROM_EMAIL;
  const fromName = process.env.BREVO_FROM_NAME || 'HSBeauty Studio';
  if (!apiKey || !fromEmail) return null;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Brevo ${response.status}: ${errText}`);
  }

  return { sent: true, provider: 'brevo' };
}

async function sendViaGmail({ to, subject, html }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });

  await transporter.sendMail({ from: `HSBeauty Studio <${user}>`, to, subject, html });
  return { sent: true, provider: 'gmail' };
}

async function sendViaResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) return null;

  const resend = new Resend(apiKey);
  await resend.emails.send({ from: fromEmail, to, subject, html });
  return { sent: true, provider: 'resend' };
}

async function tryProvider(label, fn, payload) {
  try {
    return await withTimeout(fn(payload), EMAIL_SEND_TIMEOUT_MS, label);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[email] ${label} falhou: ${err?.message || err}`);
    return null;
  }
}

async function sendEmail(payload) {
  const brevoResult = await tryProvider('brevo', sendViaBrevo, payload);
  if (brevoResult) return brevoResult;

  const gmailResult = await tryProvider('gmail', sendViaGmail, payload);
  if (gmailResult) return gmailResult;

  const resendResult = await tryProvider('resend', sendViaResend, payload);
  if (resendResult) return resendResult;

  return { sent: false, reason: 'missing_config' };
}

export async function sendBookingConfirmationEmail({ nomeCliente, email, servico, data, hora }) {
  if (!email) return { sent: false, reason: 'missing_email' };

  return sendEmail({
    to: email,
    subject: `Agendamento recebido — ${servico}`,
    html: buildBookingConfirmationHtml({
      nomeCliente,
      servico,
      dataFormatada: formatBookingDate(data),
      hora,
    }),
  });
}

export async function sendAdminBookingNotification({ nomeCliente, telefone, email, servico, data, hora, observacoes }) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER;
  if (!adminEmail) return { sent: false, reason: 'missing_admin_email' };

  return sendEmail({
    to: adminEmail,
    subject: `Novo agendamento: ${nomeCliente} — ${servico}`,
    html: buildAdminNotificationHtml({
      nomeCliente,
      telefone,
      email,
      servico,
      dataFormatada: formatBookingDate(data),
      hora,
      observacoes,
    }),
  });
}
