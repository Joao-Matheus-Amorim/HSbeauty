import { Resend } from 'resend';

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

export async function sendBookingConfirmationEmail({ nomeCliente, email, servico, data, hora }) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) return { sent: false, reason: 'missing_config' };
  if (!email) return { sent: false, reason: 'missing_email' };

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: `Agendamento recebido — ${servico}`,
    html: buildBookingConfirmationHtml({
      nomeCliente,
      servico,
      dataFormatada: formatBookingDate(data),
      hora,
    }),
  });

  return { sent: true };
}
