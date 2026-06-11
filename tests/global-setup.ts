/**
 * Playwright globalSetup — seeds the TEST_INVOICE_AUTOMATION fixture into prod
 * once per suite invocation. TS port of tests/fixtures/seedTestInvoiceProject.sql.
 *
 * Idempotent: every insert uses upsert(ignoreDuplicates) keyed on the seeded uuid.
 * Safe to re-run if a prior suite cancelled before teardown.
 *
 * Paired with tests/global-teardown.ts. See tests/fixtures/seedTestInvoiceProject.sql
 * for the original SQL + schema-gotcha notes (kept as documentation).
 */
import { adminClient } from './runners/supabaseChecks';
import { claimFixtureLock } from './fixtureLock';

const COMPANY_1   = '11111111-1111-1111-1111-000000000001';
const XERO_MAP_1  = '11111111-1111-1111-1111-000000000002';
const PROJECT_1   = '11111111-1111-1111-1111-000000000010';
const QUOTATION_1 = '11111111-1111-1111-1111-000000000020';
const QLINE_1A    = '11111111-1111-1111-1111-000000000030';
const QLINE_1B    = '11111111-1111-1111-1111-000000000031';
const QLINE_1C    = '11111111-1111-1111-1111-000000000032';
const CLAIM_1A    = '11111111-1111-1111-1111-000000000040';
const CLAIM_1B    = '11111111-1111-1111-1111-000000000041';
const CLAIM_1C    = '11111111-1111-1111-1111-000000000042';
const MAP_1A      = '11111111-1111-1111-1111-000000000050';
const MAP_1B      = '11111111-1111-1111-1111-000000000051';
const MAP_1C      = '11111111-1111-1111-1111-000000000052';

const PROJECT_GROUP = '11111111-1111-1111-1111-000000000099';

const COMPANY_2   = '11111111-1111-1111-1111-000000000101';
const XERO_MAP_2  = '11111111-1111-1111-1111-000000000102';
const PROJECT_2   = '11111111-1111-1111-1111-000000000110';
const QUOTATION_2 = '11111111-1111-1111-1111-000000000120';
const QLINE_2A    = '11111111-1111-1111-1111-000000000130';
const CLAIM_2A    = '11111111-1111-1111-1111-000000000140';
const MAP_2A      = '11111111-1111-1111-1111-000000000150';

const CONTRACTOR_CLIENT_TYPE = '0ac2cce5-cc31-4a94-8c64-a678c62c6387';
const PRODUCT_SERVICE        = 'c8c9973a-4bbf-4a1d-bf68-204ce0c3486b';

async function upsertOrThrow(table: string, rows: Record<string, unknown>[]) {
  const { error } = await adminClient.from(table).upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(`[global-setup] ${table} upsert failed: ${error.message}`);
}

export default async function globalSetup() {
  // Register this run BEFORE seeding so an overlapping run's teardown sees us.
  claimFixtureLock();
  console.log('[global-setup] seeding TEST_INVOICE_AUTOMATION fixture...');

  // --- Project 1 -----------------------------------------------------------
  await upsertOrThrow('client_companies', [
    { id: COMPANY_1, company_name: 'TEST_INVOICE_AUTOMATION_CLIENT' },
  ]);

  await upsertOrThrow('xero_contact_mappings', [
    { id: XERO_MAP_1, company_id: COMPANY_1, xero_contact_id: 'mock-xero-contact-test-automation', xero_contact_name: 'TEST_INVOICE_AUTOMATION_CLIENT' },
  ]);

  await upsertOrThrow('projects', [
    {
      id: PROJECT_1,
      project_number: 'TESTAUTO',
      project_name: 'TEST_INVOICE_AUTOMATION — DO NOT TOUCH',
      status: 'active',
      company_id: COMPANY_1,
      billing_company_id: COMPANY_1,
      project_name_short: 'TEST_INVOICE_AUTOMATION',
      file_number: 9999001,
      client_type_id: CONTRACTOR_CLIENT_TYPE,
      project_group_id: PROJECT_GROUP,
    },
  ]);

  await upsertOrThrow('quotations', [
    { id: QUOTATION_1, client_company_id: COMPANY_1, source: 'manual', project_name: 'TEST_INVOICE_AUTOMATION' },
  ]);

  // quotation_project uses composite PK — upsert with ignoreDuplicates on full row.
  {
    const { error } = await adminClient
      .from('quotation_project')
      .upsert([{ quotation_id: QUOTATION_1, project_id: PROJECT_1 }], {
        onConflict: 'quotation_id,project_id',
        ignoreDuplicates: true,
      });
    if (error) throw new Error(`[global-setup] quotation_project (1) failed: ${error.message}`);
  }

  await upsertOrThrow('quotation_line_items', [
    // quantity must be set so the QUOTATION-mode picker can compute
    // total_quoted = quantity × unit_price > 0 (50% Upfront button gates on
    // total_quoted > 0). Set after qli-picker-50-upfront-balance spec landed.
    { id: QLINE_1A, quotation_id: QUOTATION_1, title: 'TEST Line A — Cable detection work', quantity: 1, unit_price: 100.00, product_service_id: PRODUCT_SERVICE },
    { id: QLINE_1B, quotation_id: QUOTATION_1, title: 'TEST Line B — Mobilization',         quantity: 1, unit_price: 250.00, product_service_id: PRODUCT_SERVICE },
    { id: QLINE_1C, quotation_id: QUOTATION_1, title: 'TEST Line C — Reporting',            quantity: 1, unit_price:  50.00, product_service_id: PRODUCT_SERVICE },
  ]);

  await upsertOrThrow('claimable_items', [
    { id: CLAIM_1A, project_id: PROJECT_1, item_type: 'manual', item_name: 'TEST Claimable A', ready_to_claim: true, source_quotation_line_item_id: QLINE_1A },
    { id: CLAIM_1B, project_id: PROJECT_1, item_type: 'manual', item_name: 'TEST Claimable B', ready_to_claim: true, source_quotation_line_item_id: QLINE_1B },
    { id: CLAIM_1C, project_id: PROJECT_1, item_type: 'manual', item_name: 'TEST Claimable C', ready_to_claim: true, source_quotation_line_item_id: QLINE_1C },
  ]);

  await upsertOrThrow('claimable_item_quotation_mappings', [
    { id: MAP_1A, claimable_item_id: CLAIM_1A, quotation_line_item_id: QLINE_1A, project_id: PROJECT_1, total_quantity: 1 },
    { id: MAP_1B, claimable_item_id: CLAIM_1B, quotation_line_item_id: QLINE_1B, project_id: PROJECT_1, total_quantity: 1 },
    { id: MAP_1C, claimable_item_id: CLAIM_1C, quotation_line_item_id: QLINE_1C, project_id: PROJECT_1, total_quantity: 1 },
  ]);

  // --- Project 2 (cross-project mode, shares project_group_id) -------------
  await upsertOrThrow('client_companies', [
    { id: COMPANY_2, company_name: 'TEST_INVOICE_AUTOMATION_CLIENT_2' },
  ]);

  await upsertOrThrow('xero_contact_mappings', [
    { id: XERO_MAP_2, company_id: COMPANY_2, xero_contact_id: 'mock-xero-contact-test-automation-2', xero_contact_name: 'TEST_INVOICE_AUTOMATION_CLIENT_2' },
  ]);

  await upsertOrThrow('projects', [
    {
      id: PROJECT_2,
      project_number: 'TESTAUT2',
      project_name: 'TEST_INVOICE_AUTOMATION_2 — DO NOT TOUCH',
      status: 'active',
      company_id: COMPANY_2,
      billing_company_id: COMPANY_2,
      project_name_short: 'TEST_INVOICE_AUTOMATION_2',
      file_number: 9999002,
      client_type_id: CONTRACTOR_CLIENT_TYPE,
      project_group_id: PROJECT_GROUP,
    },
  ]);

  await upsertOrThrow('quotations', [
    { id: QUOTATION_2, client_company_id: COMPANY_2, source: 'manual', project_name: 'TEST_INVOICE_AUTOMATION_2' },
  ]);

  {
    const { error } = await adminClient
      .from('quotation_project')
      .upsert([{ quotation_id: QUOTATION_2, project_id: PROJECT_2 }], {
        onConflict: 'quotation_id,project_id',
        ignoreDuplicates: true,
      });
    if (error) throw new Error(`[global-setup] quotation_project (2) failed: ${error.message}`);
  }

  await upsertOrThrow('quotation_line_items', [
    { id: QLINE_2A, quotation_id: QUOTATION_2, title: 'TEST P2 Line A', unit_price: 200.00, product_service_id: PRODUCT_SERVICE },
  ]);

  await upsertOrThrow('claimable_items', [
    { id: CLAIM_2A, project_id: PROJECT_2, item_type: 'manual', item_name: 'TEST P2 Claimable A', ready_to_claim: true, source_quotation_line_item_id: QLINE_2A },
  ]);

  await upsertOrThrow('claimable_item_quotation_mappings', [
    { id: MAP_2A, claimable_item_id: CLAIM_2A, quotation_line_item_id: QLINE_2A, project_id: PROJECT_2, total_quantity: 1 },
  ]);

  console.log('[global-setup] seed complete.');
}
