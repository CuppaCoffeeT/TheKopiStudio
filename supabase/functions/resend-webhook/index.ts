import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
}

interface ResendWebhookPayload {
  type: string
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
    // Additional fields based on event type
    bounce_type?: string
    bounce_reason?: string
    complaint_feedback_type?: string
  }
}

/**
 * Verify webhook signature from Resend
 * Uses Svix standard webhook signature verification
 */
async function verifyWebhookSignature(
  payload: string,
  headers: Headers
): Promise<boolean> {
  try {
    const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.warn('⚠️ RESEND_WEBHOOK_SECRET not configured, skipping signature verification');
      return true; // Allow in development if secret not set
    }
    
    // Get Svix headers
    const svixId = headers.get('svix-id');
    const svixTimestamp = headers.get('svix-timestamp');
    const svixSignature = headers.get('svix-signature');
    
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('❌ Missing Svix headers');
      return false;
    }
    
    // Verify timestamp is recent (within 5 minutes)
    const timestamp = parseInt(svixTimestamp);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > 300) {
      console.error('❌ Webhook timestamp too old');
      return false;
    }
    
    // Compute expected signature
    const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret.split('_')[1]), // Remove 'whsec_' prefix
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedContent)
    );
    
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    // Compare signatures
    const providedSignatures = svixSignature.split(' ');
    const isValid = providedSignatures.some(sig => {
      const [, sigValue] = sig.split(',');
      return sigValue === expectedSignature;
    });
    
    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return false;
    }
    
    console.log('✅ Webhook signature verified');
    return true;
    
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    return false;
  }
}

/**
 * Map Resend webhook event to email status
 */
function mapEventToStatus(eventType: string): string {
  const statusMap: Record<string, string> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.delivery_delayed': 'sent', // Keep as sent, just delayed
    'email.bounced': 'bounced',
    'email.complained': 'complained',
    'email.opened': 'delivered', // Already delivered if opened
    'email.clicked': 'delivered', // Already delivered if clicked
  };
  
  return statusMap[eventType] || 'sent';
}

/** Columns this webhook may patch on an `email_logs` row. */
interface EmailLogStatusUpdate {
  status: string;
  sent_at?: string;
  delivered_at?: string;
  bounced_at?: string;
  opened_at?: string;
  error_message?: string;
}

/**
 * Update email log status from webhook event
 */
async function updateEmailLogStatus(
  supabaseClient: SupabaseClient,
  payload: ResendWebhookPayload
) {
  try {
    const { email_id, created_at } = payload.data;
    const status = mapEventToStatus(payload.type);
    const timestamp = new Date(created_at).toISOString();

    console.log(`📧 Updating email ${email_id} to status: ${status}`);

    // Prepare update data
    const updateData: EmailLogStatusUpdate = { status };
    
    // Set appropriate timestamp based on event type
    switch (payload.type) {
      case 'email.sent':
        updateData.sent_at = timestamp;
        break;
      case 'email.delivered':
        updateData.delivered_at = timestamp;
        break;
      case 'email.bounced':
        updateData.bounced_at = timestamp;
        if (payload.data.bounce_reason) {
          updateData.error_message = payload.data.bounce_reason;
        }
        break;
      case 'email.opened':
        updateData.opened_at = timestamp;
        break;
      case 'email.complained':
        if (payload.data.complaint_feedback_type) {
          updateData.error_message = `Complaint: ${payload.data.complaint_feedback_type}`;
        }
        break;
    }
    
    // Update email log
    const { error } = await supabaseClient
      .from('email_logs')
      .update(updateData)
      .eq('resend_email_id', email_id)
      .eq('is_deleted', false);
    
    if (error) {
      console.error('❌ Failed to update email log:', error);
      throw error;
    }
    
    console.log('✅ Email log updated successfully');
    
  } catch (error) {
    console.error('❌ Error updating email log:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    console.log('🔔 Resend webhook received');
    
    // Get raw payload for signature verification
    const rawPayload = await req.text();
    
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(rawPayload, req.headers);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Parse payload
    const payload: ResendWebhookPayload = JSON.parse(rawPayload);
    console.log('📧 Webhook event type:', payload.type);
    console.log('📧 Email ID:', payload.data.email_id);
    
    // Create Supabase admin client (webhooks don't have user auth)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Update email log status
    await updateEmailLogStatus(supabaseClient, payload);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        eventType: payload.type,
        emailId: payload.data.email_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})














