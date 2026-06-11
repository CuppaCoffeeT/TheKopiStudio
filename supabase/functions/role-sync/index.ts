// role-sync — privileged promote/demote/approve mechanism for public.users.
//
// POST { user_id: string, role?: string, is_approved?: boolean }
//   (at least one of role / is_approved is required)
//
// Flow:
//   1. Identify the caller via the anon-key client + Authorization header.
//   2. Authorize authoritatively from public.users + public.rls_capabilities
//      (manage_accounts) using the service-role client — the JWT app_metadata
//      claim may lag behind the database and is never trusted here.
//   3. Validate the target user and requested role; refuse to demote the last
//      active, approved super_admin.
//   4. Mutate public.users, then sync auth.users app_metadata.role via
//      auth.admin.updateUserById (preserving existing app_metadata keys).
//      public.profiles is intentionally never touched (legacy app semantics).
//
// Deployed with verify_jwt ON. The service-role key comes exclusively from
// the auto-provisioned SUPABASE_SERVICE_ROLE_KEY secret.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface RoleSyncRequest {
  user_id?: unknown
  role?: unknown
  is_approved?: unknown
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 role-sync invoked')

    // -------------------------------------------------------------------
    // Step 1 — caller identity (pdf-generation pattern: anon-key client
    // bound to the caller's Authorization header)
    // -------------------------------------------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser()

    if (callerError || !caller) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }
    console.log('👤 Caller authenticated:', caller.id)

    // -------------------------------------------------------------------
    // Step 2 — authoritative authorization (service-role read of the DB;
    // the JWT app_metadata.role claim is never trusted alone)
    // -------------------------------------------------------------------
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: callerRow, error: callerRowError } = await admin
      .from('users')
      .select('role, is_approved, is_active, is_deleted')
      .eq('id', caller.id)
      .maybeSingle()

    if (callerRowError) {
      console.error('❌ Failed to read caller row:', callerRowError)
      return jsonResponse({ error: 'Failed to verify caller account' }, 500)
    }

    if (
      !callerRow ||
      !callerRow.is_approved ||
      !callerRow.is_active ||
      callerRow.is_deleted
    ) {
      console.log('🚫 Caller account not approved/active:', caller.id)
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    const { data: capabilityRow, error: capabilityError } = await admin
      .from('rls_capabilities')
      .select('capability')
      .eq('capability', 'manage_accounts')
      .eq('role', callerRow.role)
      .maybeSingle()

    if (capabilityError) {
      console.error('❌ Failed to read capabilities:', capabilityError)
      return jsonResponse({ error: 'Failed to verify caller capability' }, 500)
    }

    if (!capabilityRow) {
      console.log(`🚫 Role '${callerRow.role}' lacks manage_accounts:`, caller.id)
      return jsonResponse({ error: 'Forbidden: manage_accounts capability required' }, 403)
    }
    console.log(`✅ Caller authorized (role: ${callerRow.role})`)

    // -------------------------------------------------------------------
    // Step 3 — validate the request body and the target
    // -------------------------------------------------------------------
    let body: RoleSyncRequest
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }

    const { user_id, role, is_approved } = body

    if (typeof user_id !== 'string' || user_id.length === 0) {
      return jsonResponse({ error: 'user_id is required and must be a string' }, 400)
    }
    if (role === undefined && is_approved === undefined) {
      return jsonResponse({ error: 'At least one of role or is_approved is required' }, 400)
    }
    if (role !== undefined && (typeof role !== 'string' || role.length === 0)) {
      return jsonResponse({ error: 'role must be a non-empty string' }, 400)
    }
    if (is_approved !== undefined && typeof is_approved !== 'boolean') {
      return jsonResponse({ error: 'is_approved must be a boolean' }, 400)
    }

    const { data: target, error: targetError } = await admin
      .from('users')
      .select('id, role, is_approved')
      .eq('id', user_id)
      .maybeSingle()

    if (targetError) {
      console.error('❌ Failed to read target user:', targetError)
      return jsonResponse({ error: 'Failed to read target user' }, 500)
    }
    if (!target) {
      return jsonResponse({ error: 'Target user not found' }, 404)
    }

    if (role !== undefined) {
      const { data: roleRow, error: roleError } = await admin
        .from('roles')
        .select('name, is_active')
        .eq('name', role)
        .maybeSingle()

      if (roleError) {
        console.error('❌ Failed to read roles:', roleError)
        return jsonResponse({ error: 'Failed to validate role' }, 500)
      }
      if (!roleRow || !roleRow.is_active) {
        return jsonResponse({ error: `Role '${role}' does not exist or is not active` }, 400)
      }

      // Never demote the last active, approved super_admin — that would
      // leave the system without any account able to administer RBAC.
      if (target.role === 'super_admin' && role !== 'super_admin') {
        const { count, error: countError } = await admin
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'super_admin')
          .eq('is_approved', true)
          .eq('is_active', true)
          .eq('is_deleted', false)

        if (countError) {
          console.error('❌ Failed to count super_admins:', countError)
          return jsonResponse({ error: 'Failed to validate super_admin invariant' }, 500)
        }
        if ((count ?? 0) <= 1) {
          return jsonResponse(
            { error: 'Cannot demote the last active, approved super_admin' },
            400
          )
        }
      }
    }

    // -------------------------------------------------------------------
    // Step 4 — mutate public.users, then sync auth app_metadata.role
    // -------------------------------------------------------------------
    const updates: { role?: string; is_approved?: boolean } = {}
    if (role !== undefined) updates.role = role
    if (is_approved !== undefined) updates.is_approved = is_approved

    console.log(`📝 Updating user ${user_id}:`, JSON.stringify(updates))

    const { error: updateError } = await admin
      .from('users')
      .update(updates)
      .eq('id', user_id)

    if (updateError) {
      console.error('❌ Failed to update public.users:', updateError)
      return jsonResponse({ error: 'Failed to update user record' }, 500)
    }

    const finalRole = role !== undefined ? role : target.role
    const finalIsApproved = is_approved !== undefined ? is_approved : target.is_approved
    const roleChanged = role !== undefined && role !== target.role

    if (roleChanged) {
      // Read the target's auth user FIRST and spread its existing
      // app_metadata so provider keys and other claims survive the update.
      const { data: authUser, error: authReadError } =
        await admin.auth.admin.getUserById(user_id)

      let authSyncError: { message: string } | null =
        authReadError ?? (authUser?.user ? null : { message: 'Auth user not found' })

      if (!authSyncError) {
        const { error: authUpdateError } = await admin.auth.admin.updateUserById(
          user_id,
          {
            app_metadata: {
              ...authUser!.user!.app_metadata,
              role: finalRole,
            },
          }
        )
        authSyncError = authUpdateError
      }

      if (authSyncError) {
        console.error('❌ Auth app_metadata sync failed, rolling back users row:', authSyncError)
        const { error: rollbackError } = await admin
          .from('users')
          .update({ role: target.role, is_approved: target.is_approved })
          .eq('id', user_id)

        if (rollbackError) {
          console.error('❌ Rollback of public.users failed:', rollbackError)
        }
        return jsonResponse(
          {
            error:
              'Failed to sync auth app_metadata; rollback of public.users was attempted ' +
              `and ${rollbackError ? 'FAILED — manual reconciliation required' : 'succeeded'}`,
          },
          500
        )
      }
      console.log(`✅ Auth app_metadata.role synced to '${finalRole}' for ${user_id}`)
    }

    console.log(`✅ role-sync complete for ${user_id}`)
    return jsonResponse(
      {
        success: true,
        user_id,
        role: finalRole,
        is_approved: finalIsApproved,
      },
      200
    )
  } catch (error) {
    console.error('❌ role-sync error:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      500
    )
  }
})
