const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

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
    employee_id: row.employee_id,
    month: row.month,
    department: row.department || '',
    net_salary: row.net_salary,
    company_name: settings.company_name || '',
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

  if (t.kind === 'sendgrid') {
    await t.sg.send({
      to: row.email, from, subject, text: body,
      attachments: [{ content: attachment.content.toString('base64'), filename: attachment.filename, type: 'application/pdf', disposition: 'attachment' }],
    });
  } else {
    await t.tx.sendMail({ from, to: row.email, subject, text: body, attachments: [attachment] });
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
