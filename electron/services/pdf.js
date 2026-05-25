const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function generateSalarySlip(row, settings, outPath) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const company = settings?.company_name || 'Your Company';
  const address = settings?.company_address || '';

  const brand = rgb(0.145, 0.388, 0.922); // #2563eb
  const text = rgb(0.058, 0.090, 0.165);  // #0f172a
  const muted = rgb(0.392, 0.455, 0.545); // #64748b
  const border = rgb(0.886, 0.910, 0.941); // #e2e8f0
  const headerBg = rgb(0.945, 0.961, 0.976); // #f1f5f9

  const M = 50;
  let y = 800;

  page.drawText(company, { x: M, y, size: 22, font: bold, color: brand });
  page.drawText(`Salary Slip — ${row.month}`, { x: 595 - M - bold.widthOfTextAtSize(`Salary Slip — ${row.month}`, 16), y, size: 16, font: bold, color: text });
  y -= 20;
  if (address) {
    page.drawText(address, { x: M, y, size: 10, font, color: muted });
    y -= 16;
  }
  y -= 10;
  page.drawLine({ start: { x: M, y }, end: { x: 595 - M, y }, thickness: 1, color: border });
  y -= 20;

  const lines = [
    `Employee ID: ${row.employee_id}`,
    `Name: ${row.employee_name}`,
    `Department: ${row.department || '-'}`,
    `Email: ${row.email}`,
  ];
  for (const line of lines) {
    page.drawText(line, { x: M, y, size: 11, font, color: text });
    y -= 16;
  }
  y -= 10;

  const basic = num(row.basic);
  const allowances = num(row.allowances);
  const deductions = num(row.deductions);
  const net = num(row.net_salary) || (basic + allowances - deductions);

  y = drawTable(page, M, y, 495, [
    ['Earnings', 'Amount'],
    ['Basic', fmt(basic)],
    ['Allowances', fmt(allowances)],
  ], { font, bold, text, border, headerBg });
  y -= 10;

  y = drawTable(page, M, y, 495, [
    ['Deductions', 'Amount'],
    ['Total deductions', fmt(deductions)],
  ], { font, bold, text, border, headerBg });
  y -= 30;

  const netText = `Net Salary: ${fmt(net)}`;
  page.drawText(netText, {
    x: 595 - M - bold.widthOfTextAtSize(netText, 14),
    y, size: 14, font: bold, color: brand,
  });
  y -= 60;

  const footer = 'This is a system-generated salary slip and does not require a signature.';
  page.drawText(footer, {
    x: (595 - font.widthOfTextAtSize(footer, 9)) / 2,
    y, size: 9, font, color: muted,
  });

  const bytes = await doc.save();
  fs.writeFileSync(outPath, bytes);
}

function drawTable(page, x, y, width, rows, { font, bold, text, border, headerBg }) {
  const rowH = 22;
  const colW = width / 2;
  rows.forEach((r, i) => {
    const topY = y - i * rowH;
    if (i === 0) {
      page.drawRectangle({ x, y: topY - rowH, width, height: rowH, color: headerBg });
    }
    page.drawRectangle({ x, y: topY - rowH, width, height: rowH, borderColor: border, borderWidth: 1 });
    const f = i === 0 ? bold : font;
    page.drawText(r[0], { x: x + 8, y: topY - rowH + 7, size: 11, font: f, color: text });
    const rightText = r[1];
    page.drawText(rightText, {
      x: x + width - 8 - f.widthOfTextAtSize(rightText, 11),
      y: topY - rowH + 7, size: 11, font: f, color: text,
    });
  });
  return y - rows.length * rowH;
}

const num = (v) => Number(String(v || '').replace(/[^0-9.-]/g, '')) || 0;
const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

module.exports = { generateSalarySlip };
