const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Converts HR's plain-text body into a styled HTML email automatically.
// HR never sees or touches any HTML/CSS.
function buildHtml(subject, plainText) {
  // Split on blank lines → paragraphs. Lines with just "---" become a divider.
  const paragraphs = plainText.split(/\n{2,}/).map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed === '---') {
      return '<hr style="border:none;border-top:1px solid #ddd;margin:24px 0 12px 0;">';
    }
    // Preserve single line-breaks inside a block (e.g. "Best regards,\nAccount Manager")
    const html = trimmed
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    return `<p style="margin:0 0 14px 0;">${html}</p>`;
  }).filter(Boolean).join('\n');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;">
  <div style="font-family:Arial,sans-serif;font-size:15px;color:#222;line-height:1.7;max-width:640px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    <div style="padding:28px 32px 8px 32px;">
      <h2 style="font-size:22px;font-weight:bold;margin:0 0 22px 0;color:#111;">${subject.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</h2>
      ${paragraphs}
    </div>
  </div>
</body></html>`;
}

function buildTransport(s) {
  if (s.transport === 'sendgrid') {
    const sg = require('@sendgrid/mail');
    sg.setApiKey(s.sendgrid_key);
    return { kind: 'sendgrid', sg };
  }
  const tx = nodemailer.createTransport({
    host: s.smtp_host,
    port: Number(s.smtp_port) || 587,
    secure: !!s.smtp_secure,
    auth: s.smtp_user ? { user: s.smtp_user, pass: s.smtp_pass } : undefined,
  });
  return { kind: 'smtp', tx };
}

function render(tpl, row, settings) {
  const ctx = {
    employee_name: row.employee_name,
    employee_id:   row.employee_id,
    month:         row.month,
    designation:   row.designation || '',
    department:    row.department  || '',
    net_salary:    row.net_salary  || '',
    pan_card:      row.pan_card    || '',
    company_name:    settings.company_name    || '',
    company_address: (settings.company_address || '').replace(/\n/g, ', '),
    company_website: settings.company_website || '',
    year:            String(new Date().getFullYear()),
  };
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => ctx[k] ?? '');
}

async function sendPayrollEmail(row, settings, template, pdfPath) {
  if (!settings.from_email) throw new Error('Sender not configured (Settings → From email)');
  const subject = render(template.subject, row, settings);
  const body = render(template.body, row, settings);
  const from = settings.from_name ? `"${settings.from_name}" <${settings.from_email}>` : settings.from_email;
  const t = buildTransport(settings);
  const attachment = { filename: path.basename(pdfPath), content: fs.readFileSync(pdfPath) };

  const mailBody = { html: buildHtml(subject, body), text: body };

  if (t.kind === 'sendgrid') {
    await t.sg.send({
      to: row.email, from, subject, ...mailBody,
      attachments: [{ content: attachment.content.toString('base64'), filename: attachment.filename, type: 'application/pdf', disposition: 'attachment' }],
    });
  } else {
    await t.tx.sendMail({ from, to: row.email, subject, ...mailBody, attachments: [attachment] });
  }
}

async function sendTest(settings) {
  if (!settings.from_email) throw new Error('From email required');
  const t = buildTransport(settings);
  const from = settings.from_name ? `"${settings.from_name}" <${settings.from_email}>` : settings.from_email;
  const payload = {
    to: settings.from_email, from,
    subject: 'Payroll Email — test message',
    text: 'This is a test email from your Payroll Email desktop app. If you received this, your configuration works.',
  };
  if (t.kind === 'sendgrid') await t.sg.send(payload);
  else await t.tx.sendMail(payload);
  return { ok: true };
}

module.exports = { sendPayrollEmail, sendTest };
