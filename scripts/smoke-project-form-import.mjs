// Smoke test: build template -> parse it -> assert payload structure.
// Run: node scripts/smoke-project-form-import.mjs
import * as XLSX from 'xlsx';
import {
  CONTACT_BLOCKS,
  CONTACT_BLOCK_TO_ROLE,
  PROJECT_CELLS,
  EARTHWORK_TYPE_CELL_MAP,
} from '../src/components/shared/project-form-import/lib/cellMap.ts';

// Mimic the template generator + a manual fill, then re-read it via
// the same address map (which the parser uses).
const SHEET_NAME = 'Form';

function setCell(ws, addr, v) { ws[addr] = { t: typeof v === 'number' ? 'n' : 's', v }; }

const ws = {};

// Fill some sample values on the form
setCell(ws, PROJECT_CELLS.project_name.cell, 'Instrumentation and Monitoring works for LTA project DE182');
setCell(ws, PROJECT_CELLS.company_name.cell, 'Geomotion (Singapore) Pte Ltd');
setCell(ws, PROJECT_CELLS.company_uen.cell, '200104293D');
setCell(ws, PROJECT_CELLS.company_address.cell, '50 Ubi Cres, #01-09, Singapore 408568');
setCell(ws, PROJECT_CELLS.contract_period_from.cell, '01/04/2026');
setCell(ws, PROJECT_CELLS.contract_period_to.cell, '31/03/2028');
setCell(ws, PROJECT_CELLS.contract_no.cell, 'DE182');
setCell(ws, PROJECT_CELLS.earthwork_location.cell, 'LTA DE182 sites');
setCell(ws, PROJECT_CELLS.earthwork_duration_from.cell, '01/04/2026');
setCell(ws, PROJECT_CELLS.earthwork_duration_to.cell, '31/03/2028');
setCell(ws, PROJECT_CELLS.earthwork_nature.cell, 'Installation of Borehole instruments to monitor the ground movements');
setCell(ws, EARTHWORK_TYPE_CELL_MAP.soil_investigation, 'Y');
setCell(ws, PROJECT_CELLS.earthwork_depth.cell, '30m approx.');

// Primary PIC
setCell(ws, CONTACT_BLOCKS.primary_pic.full_name, 'Subramanian Chellapandi');
setCell(ws, CONTACT_BLOCKS.primary_pic.nric, 'G3326042W');
setCell(ws, CONTACT_BLOCKS.primary_pic.designation, 'Project Manager');
setCell(ws, CONTACT_BLOCKS.primary_pic.tel, '65465585');
setCell(ws, CONTACT_BLOCKS.primary_pic.fax, '65465595');
setCell(ws, CONTACT_BLOCKS.primary_pic.mobile, '90082278');
setCell(ws, CONTACT_BLOCKS.primary_pic.email, 's.chellapandi@geomotion.com.sg');

// RES
setCell(ws, CONTACT_BLOCKS.res.full_name, 'Munisamy Sasikumar');
setCell(ws, CONTACT_BLOCKS.res.nric, 'G6687854L');
setCell(ws, CONTACT_BLOCKS.res.mobile, '87683170');
setCell(ws, CONTACT_BLOCKS.res.res_reg_number, '854L1003MUNISA');
setCell(ws, CONTACT_BLOCKS.res.res_dob, '10/03/1986');
setCell(ws, CONTACT_BLOCKS.res.res_license_expiry, '08/09/2027');

// Invoice contact
setCell(ws, CONTACT_BLOCKS.invoice.full_name, 'Jane Tan');
setCell(ws, CONTACT_BLOCKS.invoice.designation, 'Finance Manager');
setCell(ws, CONTACT_BLOCKS.invoice.tel, '63525969');
setCell(ws, CONTACT_BLOCKS.invoice.email, 'finance@geomotion.com.sg');
setCell(ws, CONTACT_BLOCKS.invoice.cc_emails, 'admin@geomotion.com.sg, accounts@geomotion.com.sg');
setCell(ws, CONTACT_BLOCKS.invoice.special_instructions, '30 day payment term');

// Officer 2 — leave blank to test "skip empty"

// Set range
ws['!ref'] = 'A1:D64';

const wb = { SheetNames: [SHEET_NAME], Sheets: { [SHEET_NAME]: ws } };
const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

// Read it back through the same parser logic (mirror of excelParser.ts)
const workbook = XLSX.read(buf, { type: 'array', cellDates: true });
const sheet = workbook.Sheets[SHEET_NAME];

function readCell(s, addr) {
  if (!addr) return null;
  const c = s[addr];
  if (!c) return null;
  return String(c.v).trim() || null;
}

const projectName = readCell(sheet, PROJECT_CELLS.project_name.cell);
const companyName = readCell(sheet, PROJECT_CELLS.company_name.cell);
const contractFrom = readCell(sheet, PROJECT_CELLS.contract_period_from.cell);
const earthworkSoil = readCell(sheet, EARTHWORK_TYPE_CELL_MAP.soil_investigation);
const picName = readCell(sheet, CONTACT_BLOCKS.primary_pic.full_name);
const picMobile = readCell(sheet, CONTACT_BLOCKS.primary_pic.mobile);
const resReg = readCell(sheet, CONTACT_BLOCKS.res.res_reg_number);
const invoiceCC = readCell(sheet, CONTACT_BLOCKS.invoice.cc_emails);
const officer2Name = readCell(sheet, CONTACT_BLOCKS.project_owner_officer_2.full_name);

const checks = [
  ['project_name', projectName, 'Instrumentation and Monitoring works for LTA project DE182'],
  ['company_name', companyName, 'Geomotion (Singapore) Pte Ltd'],
  ['contract_from', contractFrom, '01/04/2026'],
  ['earthwork_soil_investigation', earthworkSoil, 'Y'],
  ['pic_name', picName, 'Subramanian Chellapandi'],
  ['pic_mobile', picMobile, '90082278'],
  ['res_reg_number', resReg, '854L1003MUNISA'],
  ['invoice_cc_emails contains comma', invoiceCC?.includes(','), true],
  ['officer2_blank', officer2Name, null],
];

let pass = 0, fail = 0;
for (const [name, got, want] of checks) {
  if (got === want) { pass++; console.log(`  ✓ ${name} = ${JSON.stringify(got)}`); }
  else { fail++; console.error(`  ✗ ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
}

// Verify role mapping is exhaustive
const roleNames = new Set(Object.values(CONTACT_BLOCK_TO_ROLE));
const expectedRoles = ['Primary PIC', 'RES', 'Project Owner Officer 1', 'Project Owner Officer 2', 'Invoice Contact'];
const allRoles = expectedRoles.every(r => roleNames.has(r));
if (allRoles) { pass++; console.log('  ✓ all 5 form roles mapped'); }
else { fail++; console.error('  ✗ role mapping incomplete:', expectedRoles.filter(r => !roleNames.has(r))); }

console.log(`\nResult: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
