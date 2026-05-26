const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// A4: 595 x 842 pt
const PAGE_W = 595;
const PAGE_H = 842;
const M = 50;                       // outer page margin
const CONTENT_W = PAGE_W - M * 2;   // 495

const COLORS = {
  text:    rgb(0.05, 0.05, 0.05),
  muted:   rgb(0.35, 0.35, 0.40),
  border:  rgb(0.55, 0.55, 0.60),
  headBg:  rgb(0.96, 0.96, 0.97),
};

async function generateSalarySlip(row, settings, outPath) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const ctx = { page, font, bold, doc };
  let y = PAGE_H - M;

  // -------- Header (logo + company info) --------
  y = await drawHeader(ctx, settings, y);

  y -= 30;

  // -------- Dated --------
  const dated = `Dated:${formatDate(new Date())}`;
  page.drawText(dated, { x: M, y, size: 10, font, color: COLORS.text });
  y -= 22;

  // -------- TO WHOMSOEVER IT MAY CONCERN --------
  const title = 'TO WHOMSOEVER IT MAY CONCERN';
  const titleSize = 16;
  const titleW = bold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, { x: (PAGE_W - titleW) / 2, y, size: titleSize, font: bold, color: COLORS.text });
  y -= 28;

  // -------- Intro line --------
  const intro = `This salary slip is issued in the name of ${row.employee_name} an employee who is working at ${settings.company_name || 'the company'}.`;
  y = drawWrapped(ctx, intro, M, y, CONTENT_W, 11, font) - 18;

  // -------- Main table --------
  y = drawSlipTable(ctx, row, settings, y);

  y -= 30;

  // -------- Signatory block --------
  const companyLabel = `For ${settings.company_name || 'Company'}`;
  page.drawText(companyLabel, { x: M, y, size: 11, font, color: COLORS.text });
  y -= 20;

  // Signature image (optional)
  if (settings.signature_image_path && fs.existsSync(settings.signature_image_path)) {
    try {
      const img = await embedImage(doc, settings.signature_image_path);
      const w = 110;
      const h = w * (img.height / img.width);
      page.drawImage(img, { x: M, y: y - h, width: w, height: h });
      y -= h + 8;
    } catch { y -= 30; }
  } else {
    y -= 30;
  }

  page.drawText('(Authorized Signatory)', { x: M, y, size: 10, font, color: COLORS.text });

  fs.writeFileSync(outPath, await doc.save());
}

async function drawHeader(ctx, settings, y) {
  const { page, font, bold, doc } = ctx;

  // Logo (optional)
  let logoH = 60;
  if (settings.logo_path && fs.existsSync(settings.logo_path)) {
    try {
      const img = await embedImage(doc, settings.logo_path);
      const w = 130;
      const h = w * (img.height / img.width);
      page.drawImage(img, { x: M, y: y - h, width: w, height: h });
      logoH = h;
    } catch {}
  } else {
    // Fallback: company name on left
    page.drawText(settings.company_name || '', { x: M, y: y - 18, size: 16, font: bold, color: COLORS.text });
  }

  // Company info on right (right-aligned)
  const company = settings.company_name || '';
  const addrLines = (settings.company_address || '').split('\n').filter(Boolean);
  const website = settings.company_website || '';

  const lines = [{ text: company, font: bold, size: 11 }];
  for (const l of addrLines) lines.push({ text: l, font, size: 10 });
  if (website) lines.push({ text: website, font, size: 10 });

  let ly = y - 8;
  for (const l of lines) {
    const tw = l.font.widthOfTextAtSize(l.text, l.size);
    page.drawText(l.text, { x: PAGE_W - M - tw, y: ly, size: l.size, font: l.font, color: COLORS.text });
    ly -= l.size + 4;
  }

  return y - Math.max(logoH, (y - ly));
}

function drawSlipTable(ctx, row, settings, startY) {
  const { page, font, bold } = ctx;
  const colW = CONTENT_W / 4;
  const x0 = M;
  const x1 = M + colW;
  const x2 = M + colW * 2;
  const x3 = M + colW * 3;
  const x4 = M + CONTENT_W;
  const rowH = 26;

  let y = startY;

  // --- Title row (full width) ---
  const titleText = `Salary Slip for the ${row.month}`;
  drawCell(ctx, M, y, CONTENT_W, rowH, titleText, { font: bold, size: 13, align: 'center', bg: COLORS.headBg });
  y -= rowH;

  // --- Info rows (4 columns: label | value | label | value) ---
  const infoRows = [
    ['Name of Employee:', row.employee_name, 'Date of Joining:', row.date_of_joining || ''],
    ['Designation:', row.designation || '', 'Emp ID:', row.employee_id],
    ['Effective Working Days:', row.effective_working_days || '', 'Pan Card:', row.pan_card || ''],
  ];
  for (const r of infoRows) {
    drawCell(ctx, x0, y, colW, rowH, r[0], { font: bold, size: 10, align: 'left', bg: COLORS.headBg });
    drawCell(ctx, x1, y, colW, rowH, String(r[1] || ''), { font, size: 10, align: 'left' });
    drawCell(ctx, x2, y, colW, rowH, r[2], { font: bold, size: 10, align: 'left', bg: COLORS.headBg });
    drawCell(ctx, x3, y, colW, rowH, String(r[3] || ''), { font, size: 10, align: 'left' });
    y -= rowH;
  }

  // --- Earnings/Deductions header row ---
  drawCell(ctx, x0, y, colW, rowH, 'Particulars:', { font: bold, size: 10, bg: COLORS.headBg });
  drawCell(ctx, x1, y, colW, rowH, 'Amount Rs.', { font: bold, size: 10, bg: COLORS.headBg });
  drawCell(ctx, x2, y, colW, rowH, 'Deduction:', { font: bold, size: 10, bg: COLORS.headBg });
  drawCell(ctx, x3, y, colW, rowH, 'Amount Rs.', { font: bold, size: 10, bg: COLORS.headBg });
  y -= rowH;

  // Earnings and deductions in parallel
  const earnings = [
    ['Basic Salary',       row.basic_salary       ?? row.basic],
    ['House Rent Allowance', row.house_rent_allowance ?? row.hra],
    ['Conveyance Allowance', row.conveyance_allowance ?? row.conveyance],
    ['Medical Allowance',  row.medical_allowance  ?? row.medical],
    ['Internet Allowance', row.internet_allowance ?? row.internet],
    ['Mobile Allowance',   row.mobile_allowance   ?? row.mobile],
    ['Other Allowance',    row.other_allowance],
    ['Fuel Reimbursement', row.fuel_reimbursement],
  ];
  const deductions = [
    ['Leave Without Pay(LWP)', row.lwp],
    ['Punjab Development Tax', row.punjab_development_tax ?? row.pdt],
    ['TDS', row.tds],
    ['EPF Contribution Emp.', row.epf_emp ?? row.epf_employee],
    ['EPF Contribution', row.epf],
    ['Group Health Insurance', row.group_health_insurance ?? row.ghi],
    ['Soft Loan', row.soft_loan],
    ['Other Deduction', row.other_deduction],
  ];

  const lineRows = Math.max(earnings.length, deductions.length);
  for (let i = 0; i < lineRows; i++) {
    const [eLbl, eVal] = earnings[i] || ['', ''];
    const [dLbl, dVal] = deductions[i] || ['', ''];
    drawCell(ctx, x0, y, colW, rowH, eLbl, { font, size: 10 });
    drawCell(ctx, x1, y, colW, rowH, fmtAmount(eVal), { font, size: 10 });
    drawCell(ctx, x2, y, colW, rowH, dLbl, { font, size: 10 });
    drawCell(ctx, x3, y, colW, rowH, fmtAmount(dVal), { font, size: 10 });
    y -= rowH;
  }

  // Totals
  const totalEarning = num(row.total_earning) || sum(earnings.map(e => num(e[1])));
  const totalDeduction = num(row.total_deduction) || sum(deductions.map(d => num(d[1])));
  const netSalary = num(row.net_salary) || (totalEarning - totalDeduction);

  drawCell(ctx, x0, y, colW, rowH, 'Total Earning:', { font: bold, size: 10 });
  drawCell(ctx, x1, y, colW, rowH, String(totalEarning), { font: bold, size: 10 });
  drawCell(ctx, x2, y, colW, rowH, 'Total Deductions:', { font: bold, size: 10 });
  drawCell(ctx, x3, y, colW, rowH, String(totalDeduction), { font: bold, size: 10 });
  y -= rowH;

  // Net salary row
  drawCell(ctx, x0, y, colW, rowH, '', { font, size: 10 });
  drawCell(ctx, x1, y, colW, rowH, '', { font, size: 10 });
  drawCell(ctx, x2, y, colW, rowH, 'Net Salary Credited:', { font: bold, size: 10 });
  drawCell(ctx, x3, y, colW, rowH, String(netSalary), { font: bold, size: 10 });
  y -= rowH;

  // Amount in words
  const wordsHeight = rowH * 2;
  const words = row.amount_in_words || (numberToIndianWords(netSalary) + ' Rupees');
  drawCell(ctx, x0, y, colW, wordsHeight, 'Amount in words', { font: bold, size: 10 });
  drawCell(ctx, x1, y, colW * 2, wordsHeight, words, { font, size: 10, wrap: true });
  drawCell(ctx, x3, y, colW, wordsHeight, '', { font, size: 10 });
  y -= wordsHeight;

  return y;
}

// -------- helpers --------
function drawCell(ctx, x, y, w, h, text, opts = {}) {
  const { page } = ctx;
  const { font, size = 10, align = 'left', bg, wrap = false } = opts;
  const top = y;
  if (bg) page.drawRectangle({ x, y: top - h, width: w, height: h, color: bg });
  page.drawRectangle({ x, y: top - h, width: w, height: h, borderColor: COLORS.border, borderWidth: 0.7 });
  const padX = 6;
  const innerW = w - padX * 2;
  const lines = wrap ? wrapText(text, innerW, font, size) : [text];
  const lineH = size + 3;
  const blockH = lines.length * lineH;
  let ty = top - h / 2 + blockH / 2 - lineH + 2;
  for (const line of lines) {
    const tw = font.widthOfTextAtSize(line, size);
    let tx = x + padX;
    if (align === 'center') tx = x + (w - tw) / 2;
    if (align === 'right') tx = x + w - padX - tw;
    page.drawText(line, { x: tx, y: ty, size, font, color: COLORS.text });
    ty -= lineH;
  }
}

function drawWrapped(ctx, text, x, y, w, size, font) {
  const lines = wrapText(text, w, font, size);
  let yy = y;
  for (const l of lines) {
    ctx.page.drawText(l, { x, y: yy, size, font, color: COLORS.text });
    yy -= size + 5;
  }
  return yy;
}

function wrapText(text, maxW, font, size) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (font.widthOfTextAtSize(test, size) > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function embedImage(doc, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const bytes = fs.readFileSync(filePath);
  if (ext === '.jpg' || ext === '.jpeg') return await doc.embedJpg(bytes);
  return await doc.embedPng(bytes);
}

function formatDate(d) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

const num = (v) => Number(String(v ?? '').replace(/[^0-9.-]/g, '')) || 0;
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const fmtAmount = (v) => {
  if (v === '' || v == null) return '';
  const n = num(v);
  return n === 0 ? (String(v).trim() === '0' ? '0' : '') : String(n);
};

// Simple Indian-style number-to-words (lakh/crore)
function numberToIndianWords(n) {
  n = Math.floor(num(n));
  if (n === 0) return 'Zero';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const twoDigit = (x) => x < 20 ? ones[x] : tens[Math.floor(x/10)] + (x%10 ? ' ' + ones[x%10] : '');
  const threeDigit = (x) => {
    const h = Math.floor(x/100), rest = x % 100;
    return (h ? ones[h] + ' Hundred' + (rest ? ' ' : '') : '') + (rest ? twoDigit(rest) : '');
  };
  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh  = Math.floor(n / 100000);   n %= 100000;
  const thou  = Math.floor(n / 1000);     n %= 1000;
  const rest  = n;
  if (crore) parts.push(twoDigit(crore) + ' Crore');
  if (lakh)  parts.push(twoDigit(lakh) + ' Lakh');
  if (thou)  parts.push(twoDigit(thou) + ' Thousand');
  if (rest)  parts.push(threeDigit(rest));
  return parts.join(' ').trim();
}

module.exports = { generateSalarySlip };
