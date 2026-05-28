import nodemailer from 'nodemailer';
import { Resend } from 'resend';

function buildAdminNotificationHtml({ nomeCliente, telefone, email, servico, dataFormatada, hora, observacoes }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#be123c;margin-bottom:8px">Novo agendamento recebido</h2>
  <p>Um cliente acabou de solicitar um horário no site.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Cliente</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${nomeCliente}</strong></td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Telefone</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${telefone}</strong></td></tr>
    ${email ? `<tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Email</td><td style="padding:8px;border-bottom:1px solid #eee">${email}</td></tr>` : ''}
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Serviço</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${servico}</strong></td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Data</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${dataFormatada}</strong></td></tr>
    <tr><td style="padding:8px;${observacoes ? 'border-bottom:1px solid #eee;' : ''}color:#555">Horário</td><td style="padding:8px;${observacoes ? 'border-bottom:1px solid #eee;' : ''}"><strong>${hora}</strong></td></tr>
    ${observacoes ? `<tr><td style="padding:8px;color:#555;vertical-align:top">Observações</td><td style="padding:8px">${observacoes}</td></tr>` : ''}
  </table>
  <p style="font-size:13px;color:#555">Acesse o painel para confirmar ou cancelar este agendamento.</p>
</body>
</html>`;
}

function buildBookingConfirmationHtml({ nomeCliente, servico, dataFormatada, hora }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#be123c;margin-bottom:8px">Agendamento recebido!</h2>
  <p>Olá, <strong>${nomeCliente}</strong>!</p>
  <p>Seu pedido foi registrado e está <strong>aguardando confirmação</strong>.</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Serviço</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${servico}</strong></td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#555">Data</td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${dataFormatada}</strong></td></tr>
    <tr><td style="padding:8px;color:#555">Horário</td><td style="padding:8px"><strong>${hora}</strong></td></tr>
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

async function sendViaGmail({ to, subject, html }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
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

async function sendEmail(payload) {
  const gmailResult = await sendViaGmail(payload);
  if (gmailResult) return gmailResult;

  const resendResult = await sendViaResend(payload);
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
