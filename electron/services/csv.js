const Papa = require('papaparse');

const REQUIRED = ['employee_id', 'employee_name', 'email', 'month'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseAndValidate(text) {
  const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
  const rows = [];
  const errors = [];
  const seen = new Set();

  parsed.data.forEach((raw, i) => {
    const rowNum = i + 2;
    const r = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k.trim().toLowerCase(), String(v ?? '').trim()]));

    for (const f of REQUIRED) {
      if (!r[f]) { errors.push({ row: rowNum, message: `missing ${f}` }); return; }
    }
    if (!EMAIL_RE.test(r.email)) { errors.push({ row: rowNum, message: `invalid email: ${r.email}` }); return; }
    const key = `${r.employee_id}|${r.month}`;
    if (seen.has(key)) { errors.push({ row: rowNum, message: `duplicate for ${r.employee_id} / ${r.month}` }); return; }
    seen.add(key);
    rows.push(r);
  });

  return { rows, errors };
}

module.exports = { parseAndValidate };
