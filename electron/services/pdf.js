const fs = require('fs');
const PDFDocument = require('pdfkit');

function generateSalarySlip(row, settings, outPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    const company = settings?.company_name || 'Your Company';
    const address = settings?.company_address || '';

    doc.fillColor('#2563eb').fontSize(22).text(company, { align: 'left' });
    if (address) doc.fillColor('#64748b').fontSize(10).text(address);
    doc.moveDown(0.5);
    doc.fillColor('#0f172a').fontSize(16).text(`Salary Slip — ${row.month}`, { align: 'right' });
    doc.moveDown();

    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(11).fillColor('#0f172a');
    doc.text(`Employee ID: ${row.employee_id}`);
    doc.text(`Name: ${row.employee_name}`);
    doc.text(`Department: ${row.department || '-'}`);
    doc.text(`Email: ${row.email}`);
    doc.moveDown();

    const basic = num(row.basic);
    const allowances = num(row.allowances);
    const deductions = num(row.deductions);
    const net = num(row.net_salary) || (basic + allowances - deductions);

    table(doc, [
      ['Earnings', 'Amount'],
      ['Basic', fmt(basic)],
      ['Allowances', fmt(allowances)],
    ]);
    doc.moveDown(0.5);
    table(doc, [
      ['Deductions', 'Amount'],
      ['Total deductions', fmt(deductions)],
    ]);
    doc.moveDown();

    doc.fillColor('#2563eb').fontSize(14).text(`Net Salary: ${fmt(net)}`, { align: 'right' });
    doc.moveDown(2);
    doc.fillColor('#94a3b8').fontSize(9).text('This is a system-generated salary slip and does not require a signature.', { align: 'center' });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

function table(doc, rows) {
  const startX = 50, colW = 247;
  const startY = doc.y;
  rows.forEach((r, i) => {
    const y = startY + i * 22;
    if (i === 0) doc.rect(startX, y, colW * 2, 22).fill('#f1f5f9').fillColor('#0f172a');
    doc.fillColor('#0f172a').fontSize(11)
      .text(r[0], startX + 8, y + 6, { width: colW - 16 })
      .text(r[1], startX + colW + 8, y + 6, { width: colW - 16, align: 'right' });
    doc.strokeColor('#e2e8f0').rect(startX, y, colW * 2, 22).stroke();
  });
  doc.y = startY + rows.length * 22 + 4;
}

const num = (v) => Number(String(v || '').replace(/[^0-9.-]/g, '')) || 0;
const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

module.exports = { generateSalarySlip };
