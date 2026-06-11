/**
 * Supabase post-action evidence runner.
 * Uses service-role key (bypasses RLS) so tests can verify DB state
 * regardless of what the logged-in user could see.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const VOLUME_SECRETS = '/Volumes/YourVolume/.env.secrets';
const LOCAL_SECRETS = resolve(process.cwd(), '.env.secrets');
config({ path: existsSync(VOLUME_SECRETS) ? VOLUME_SECRETS : LOCAL_SECRETS });

const SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://your-project-ref.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_KEY;

if (!SERVICE_KEY) {
  throw new Error(
    '[supabaseChecks] SUPABASE_KEY (service role) not set. ' +
      'Source /Volumes/YourVolume/.env.secrets or set SUPABASE_KEY env var in CI.',
  );
}

export const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Returns auth.users row for a given email, or null.
 * Used to confirm a user exists + auth session state is sane.
 */
export async function getAuthUserByEmail(email: string) {
  const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 200 });
  if (error) throw new Error(`[getAuthUserByEmail] ${error.message}`);
  return data.users.find((u) => u.email === email) ?? null;
}

/**
 * Confirm the given user signed in recently (within the last N seconds).
 * Default window: 60s — aligned with a single test run.
 */
export async function assertRecentSignIn(email: string, withinSeconds = 60) {
  const user = await getAuthUserByEmail(email);
  if (!user) throw new Error(`[assertRecentSignIn] user not found: ${email}`);

  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
  if (!lastSignIn) throw new Error(`[assertRecentSignIn] no last_sign_in_at for ${email}`);

  const ageSeconds = (Date.now() - lastSignIn.getTime()) / 1000;
  if (ageSeconds > withinSeconds) {
    throw new Error(
      `[assertRecentSignIn] last_sign_in_at too old for ${email}: ${ageSeconds.toFixed(1)}s ago (expected < ${withinSeconds}s)`,
    );
  }

  return {
    userId: user.id,
    email: user.email,
    lastSignInAt: lastSignIn.toISOString(),
    ageSeconds: Math.round(ageSeconds),
  };
}

/**
 * Fetch all active modules for smoke testing.
 */
export async function fetchActiveModules() {
  const { data, error } = await adminClient
    .from('modules')
    .select('id, name, path, category')
    .eq('is_active', true)
    .order('category')
    .order('sort_order')
    .limit(500);
  if (error) throw new Error(`[fetchActiveModules] ${error.message}`);
  return data ?? [];
}

/**
 * Material-stock evidence helpers (WF-MI01).
 *
 * The Receive/Adjust flows mutate prod rows in place (no seed/cleanup — they
 * operate on a real seeded material and the change is the assertion). These
 * read the authoritative DB state so a spec can verify the UI mutation actually
 * landed: on_hand_qty moved + a movement-ledger row of the right type exists.
 */
export async function fetchMaterialOnHand(productServiceId: string) {
  const { data, error } = await adminClient
    .from('material_stock')
    .select('product_service_id, on_hand_qty')
    .eq('product_service_id', productServiceId)
    .single();
  if (error) throw new Error(`[fetchMaterialOnHand] ${error.message}`);
  return Number(data.on_hand_qty);
}

/**
 * Most-recent movement-ledger rows for a material (newest first).
 * Used to assert a `receipt`/`adjustment` movement appeared with the right delta.
 */
export async function fetchRecentMaterialMovements(productServiceId: string, limit = 5) {
  const { data, error } = await adminClient
    .from('material_stock_movements')
    .select('id, product_service_id, delta, movement_type, reason, created_at, created_by')
    .eq('product_service_id', productServiceId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`[fetchRecentMaterialMovements] ${error.message}`);
  return data ?? [];
}

/**
 * Material-request lifecycle evidence helpers (WF-LIFECYCLE-MR).
 *
 * The lifecycle spec drives a Material Request through the full UI flow
 * (draft → submitted → partially_approved → prepared) as the seeded super_admin
 * and verifies the authoritative DB state at each gate: header status, per-line
 * line_status, prepared_photo_path, and the stock deduction that
 * `record_stock_issue` performs for tracked prepared lines.
 */
export interface MaterialRequestHeaderRow {
  id: string;
  request_number: string | null;
  status: string;
  project_id: string | null;
  requested_by: string | null;
  prepared_by: string | null;
  prepared_at: string | null;
  prepared_photo_path: string | null;
}

/** Read a material_requests header row by id (service-role; bypasses RLS). */
export async function fetchMaterialRequestById(
  requestId: string,
): Promise<MaterialRequestHeaderRow | null> {
  const { data, error } = await adminClient
    .from('material_requests')
    .select(
      'id, request_number, status, project_id, requested_by, prepared_by, prepared_at, prepared_photo_path',
    )
    .eq('id', requestId)
    .maybeSingle();
  if (error) throw new Error(`[fetchMaterialRequestById] ${error.message}`);
  return (data as MaterialRequestHeaderRow | null) ?? null;
}

export interface MaterialRequestItemDbRow {
  id: string;
  product_service_id: string | null;
  quantity: number;
  unit: string | null;
  line_status: string;
  qty_issued: number | null;
}

/** Read a request's line items (ordered by sort_order) by request id. */
export async function fetchMaterialRequestItems(
  requestId: string,
): Promise<MaterialRequestItemDbRow[]> {
  const { data, error } = await adminClient
    .from('material_request_items')
    .select('id, product_service_id, quantity, unit, line_status, qty_issued')
    .eq('request_id', requestId)
    .order('sort_order', { ascending: true })
    .limit(500);
  if (error) throw new Error(`[fetchMaterialRequestItems] ${error.message}`);
  return (data ?? []) as MaterialRequestItemDbRow[];
}

/**
 * The `issue` movement rows `record_stock_issue` wrote for this request.
 * Scoped by `request_id` (the RPC stamps it) so the assertion can't collide
 * with unrelated stock activity on the same material from a parallel run.
 */
export async function fetchIssueMovementsForRequest(requestId: string) {
  const { data, error } = await adminClient
    .from('material_stock_movements')
    .select('id, product_service_id, delta, movement_type, request_id, created_at')
    .eq('request_id', requestId)
    .eq('movement_type', 'issue')
    .limit(50);
  if (error) throw new Error(`[fetchIssueMovementsForRequest] ${error.message}`);
  return data ?? [];
}

/**
 * Purchase-order lifecycle evidence helpers (WF-LIFECYCLE-PO).
 *
 * The PO lifecycle spec drives one MATERIAL purchase order through the full UI
 * flow (draft → submitted → approved → issued → received) as the seeded
 * super_admin and verifies the authoritative DB state at each gate: header
 * status + workflow stamps (approved_by / issued_at / received_at), per-line
 * qty_received, and the stock receipt that `record_stock_receipt` performs for
 * tracked material lines (a `receipt` movement scoped by purchase_order_id +
 * an on_hand_qty increase). Pairs with `fetchMaterialOnHand` (reused for the
 * baseline + delta + restore assertions).
 */
export interface PurchaseOrderHeaderRow {
  id: string;
  po_number: string | null;
  status: string;
  po_type: string;
  supplier_company_id: string | null;
  project_id: string | null;
  subtotal: number;
  tax: number;
  total: number;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  issued_at: string | null;
  received_at: string | null;
}

/** Read a purchase_orders header row by id (service-role; bypasses RLS). */
export async function fetchPurchaseOrderById(
  poId: string,
): Promise<PurchaseOrderHeaderRow | null> {
  const { data, error } = await adminClient
    .from('purchase_orders')
    .select(
      'id, po_number, status, po_type, supplier_company_id, project_id, subtotal, tax, total, created_by, approved_by, approved_at, issued_at, received_at',
    )
    .eq('id', poId)
    .maybeSingle();
  if (error) throw new Error(`[fetchPurchaseOrderById] ${error.message}`);
  return (data as PurchaseOrderHeaderRow | null) ?? null;
}

export interface PurchaseOrderLineItemDbRow {
  id: string;
  purchase_order_id: string;
  product_service_id: string | null;
  title: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  tax_rate: number;
  line_total: number;
  qty_received: number;
  sort_order: number | null;
}

/** Read a PO's line items (ordered by sort_order) by PO id. */
export async function fetchPOLineItems(
  poId: string,
): Promise<PurchaseOrderLineItemDbRow[]> {
  const { data, error } = await adminClient
    .from('purchase_order_line_items')
    .select(
      'id, purchase_order_id, product_service_id, title, quantity, unit, unit_price, tax_rate, line_total, qty_received, sort_order',
    )
    .eq('purchase_order_id', poId)
    .order('sort_order', { ascending: true })
    .limit(500);
  if (error) throw new Error(`[fetchPOLineItems] ${error.message}`);
  return (data ?? []) as PurchaseOrderLineItemDbRow[];
}

/**
 * The `receipt` movement rows `record_stock_receipt` wrote for this PO. Scoped
 * by `purchase_order_id` (the RPC stamps it) so the assertion can't collide
 * with unrelated stock activity on the same material from a parallel run.
 */
export async function fetchReceiptMovementsForPO(poId: string) {
  const { data, error } = await adminClient
    .from('material_stock_movements')
    .select('id, product_service_id, delta, movement_type, purchase_order_id, created_at')
    .eq('purchase_order_id', poId)
    .eq('movement_type', 'receipt')
    .limit(50);
  if (error) throw new Error(`[fetchReceiptMovementsForPO] ${error.message}`);
  return data ?? [];
}

// ============================================================================
// Material Issuance extension helpers (WF-LIFECYCLE-RETURNS / FUEL / PPE)
// ============================================================================

/**
 * Read a material_requests return-request header row by id (same shape as the
 * issue header; discriminated by `request_kind='return'`).
 */
export async function fetchReturnRequestById(
  requestId: string,
): Promise<MaterialRequestHeaderRow | null> {
  const { data, error } = await adminClient
    .from('material_requests')
    .select(
      'id, request_number, status, project_id, requested_by, prepared_by, prepared_at, prepared_photo_path',
    )
    .eq('id', requestId)
    .maybeSingle();
  if (error) throw new Error(`[fetchReturnRequestById] ${error.message}`);
  return (data as MaterialRequestHeaderRow | null) ?? null;
}

/**
 * The `return` movement rows `record_stock_return` wrote for this request.
 * Scoped by `request_id` + `movement_type='return'` so assertions can't collide
 * with unrelated stock activity.
 */
export async function fetchReturnMovementsForRequest(requestId: string) {
  const { data, error } = await adminClient
    .from('material_stock_movements')
    .select('id, product_service_id, delta, movement_type, request_id, condition, photo_paths, created_at')
    .eq('request_id', requestId)
    .eq('movement_type', 'return')
    .limit(50);
  if (error) throw new Error(`[fetchReturnMovementsForRequest] ${error.message}`);
  return data ?? [];
}

/**
 * Read a fuel_requests header row by id (service-role; bypasses RLS).
 * Returns the core fields needed for lifecycle assertions: status, fill_limit_type,
 * requested_litres, litres_issued, odometer_km, and photo paths.
 */
export interface FuelRequestHeaderRow {
  id: string;
  fuel_request_number: string | null;
  status: string;
  fill_limit_type: string;
  requested_litres: number | null;
  litres_issued: number | null;
  odometer_km: number | null;
  odometer_photo_path: string | null;
  dispenser_photo_path: string | null;
  fulfilled_by: string | null;
  fulfilled_at: string | null;
}

export async function fetchFuelRequestById(
  fuelRequestId: string,
): Promise<FuelRequestHeaderRow | null> {
  const { data, error } = await adminClient
    .from('fuel_requests')
    .select(
      'id, fuel_request_number, status, fill_limit_type, requested_litres, litres_issued, odometer_km, odometer_photo_path, dispenser_photo_path, fulfilled_by, fulfilled_at',
    )
    .eq('id', fuelRequestId)
    .maybeSingle();
  if (error) throw new Error(`[fetchFuelRequestById] ${error.message}`);
  return (data as FuelRequestHeaderRow | null) ?? null;
}

/**
 * The `issue` movement rows `record_fuel_fulfilment` wrote for this fuel request.
 * Scoped by `fuel_request_id` (the RPC stamps it) so the assertion can't collide
 * with unrelated stock activity on the same diesel material.
 */
export async function fetchFuelMovementsForRequest(fuelRequestId: string) {
  const { data, error } = await adminClient
    .from('material_stock_movements')
    .select('id, product_service_id, delta, movement_type, fuel_request_id, created_at')
    .eq('fuel_request_id', fuelRequestId)
    .limit(10);
  if (error) throw new Error(`[fetchFuelMovementsForRequest] ${error.message}`);
  return data ?? [];
}

/**
 * The most-recent `issue` movement rows `record_ppe_issue` wrote for a given
 * (PPE product, recipient worker) pair — newest first. Scoped tightly to
 * avoid collisions with unrelated PPE issues from other test runs.
 */
export async function fetchPpeMovementsForWorker(
  productServiceId: string,
  recipientWorkerId: string,
) {
  const { data, error } = await adminClient
    .from('material_stock_movements')
    .select('id, product_service_id, delta, movement_type, recipient_worker_id, photo_paths, created_at')
    .eq('product_service_id', productServiceId)
    .eq('recipient_worker_id', recipientWorkerId)
    .eq('movement_type', 'issue')
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw new Error(`[fetchPpeMovementsForWorker] ${error.message}`);
  return data ?? [];
}

/**
 * Confirm the user's public.users profile row is approved + active.
 * These flags gate /dashboard access per Login.tsx logic.
 */
export async function assertUserProfileLive(userId: string) {
  const { data, error } = await adminClient
    .from('users')
    .select('id, is_approved, is_active, role')
    .eq('id', userId)
    .single();

  if (error) throw new Error(`[assertUserProfileLive] ${error.message}`);
  if (!data.is_approved) throw new Error(`[assertUserProfileLive] user ${userId} not approved`);
  if (!data.is_active) throw new Error(`[assertUserProfileLive] user ${userId} not active`);

  return data;
}
