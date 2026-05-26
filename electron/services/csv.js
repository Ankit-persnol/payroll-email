const Papa = require('papaparse');

const REQUIRED = ['employee_id', 'employee_name', 'email', 'month'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Map of "user CSV header" → canonical internal name.
// Headers from the file are normalized first (lowercase + collapse spaces/dashes to underscore),
// so the keys here are post-normalization.
const HEADER_ALIASES = {
  // identity
  'employee_code': 'employee_id',
  'emp_id': 'employee_id',
  'emp_code': 'employee_id',
  'employee_id_no': 'employee_id',
  'name': 'employee_name',
  'employee': 'employee_name',
  'name_of_employee': 'employee_name',
  'email_address': 'email',
  'email_id': 'email',
  'mail': 'email',

  // metadata
  'pan': 'pan_card',
  'pan_no': 'pan_card',
  'pan_number': 'pan_card',
  'doj': 'date_of_joining',
  'joining_date': 'date_of_joining',
  'working_days': 'effective_working_days',
  'days_worked': 'effective_working_days',

  // earnings
  'basic': 'basic_salary',
  'hra': 'house_rent_allowance',
  'house_rent': 'house_rent_allowance',
  'conveyance': 'conveyance_allowance',
  'medical': 'medical_allowance',
  'internet': 'internet_allowance',
  'mobile': 'mobile_allowance',
  'fuel': 'fuel_reimbursement',
  'gross_salary': 'total_earning',
  'gross': 'total_earning',

  // deductions
  'loss_of_pay': 'lwp',
  'pdt': 'punjab_development_tax',
  'punjab_dev_tax': 'punjab_development_tax',
  'provident_fund_employee': 'epf_emp',
  'pf_employee': 'epf_emp',
  'epf_employee': 'epf_emp',
  'pf': 'epf',
  'provident_fund': 'epf',
  'ghi': 'group_health_insurance',
  'health_insurance': 'group_health_insurance',
  'loan': 'soft_loan',

  // totals
  'total_deductions': 'total_deduction',
  'total_earnings': 'total_earning',
  'net': 'net_salary',
  'net_pay': 'net_salary',
  'take_home': 'net_salary',
  'amount_in_word': 'amount_in_words',
  'in_words': 'amount_in_words',
};

function normalizeHeader(h) {
  return String(h || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, '_')   // spaces and dashes → underscores
    .replace(/[^\w]/g, '');     // strip everything else (dots, parens, etc.)
}

function parseAndValidate(text) {
  const parsed = Papa.parse(text.trim(), { header: true, skipEmptyLines: true });
  const rows = [];
  const errors = [];
  const seen = new Set();

  parsed.data.forEach((raw, i) => {
    const rowNum = i + 2;
    const r = {};
    for (const [k, v] of Object.entries(raw)) {
      const key = normalizeHeader(k);
      const canonical = HEADER_ALIASES[key] || key;
      r[canonical] = String(v ?? '').trim();
    }

    for (const f of REQUIRED) {
      if (!r[f]) { errors.push({ row: rowNum, message: `missing ${f}` }); return; }
    }
    if (!EMAIL_RE.test(r.email)) {
      errors.push({ row: rowNum, message: `invalid email: ${r.email}` });
      return;
    }
    const key = `${r.employee_id}|${r.month}`;
    if (seen.has(key)) {
      errors.push({ row: rowNum, message: `duplicate for ${r.employee_id} / ${r.month}` });
      return;
    }
    seen.add(key);
    rows.push(r);
  });

  return { rows, errors };
}

module.exports = { parseAndValidate };
