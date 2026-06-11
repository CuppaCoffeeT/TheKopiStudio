# Supabase Edge Functions Deployment Guide

**Created**: 2025-11-04  
**Project**: AppBase Trench Trace Portal  
**Project Ref**: `your-project-ref`

This guide covers everything you need to know about deploying and managing Supabase Edge Functions for the AppBase project.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [First-Time Setup](#first-time-setup)
3. [Deploying Edge Functions](#deploying-edge-functions)
4. [Verification and Testing](#verification-and-testing)
5. [Viewing Logs](#viewing-logs)
6. [Environment Variables](#environment-variables)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)
9. [Common Commands Reference](#common-commands-reference)

---

## Prerequisites

### 1. Install Supabase CLI

**macOS (Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Windows (Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux:**
```bash
brew install supabase/tap/supabase
```

**Verify Installation:**
```bash
supabase --version
# Should output: supabase 1.x.x
```

### 2. Required Accounts

- Supabase account with access to project `your-project-ref`
- Admin permissions to deploy functions

---

## First-Time Setup

### Step 1: Login to Supabase

**Method 1: Browser Login (Recommended)**
```bash
supabase login
```

This will:
1. Open your browser automatically
2. Authenticate with Supabase dashboard
3. Generate and save an access token locally
4. Display success message

**Method 2: Token Login**
```bash
# Get your access token from: https://supabase.com/dashboard/account/tokens
supabase login --token YOUR_ACCESS_TOKEN_HERE
```

**Verify Login:**
```bash
# Check if you're logged in
supabase projects list
```

You should see your project listed.

### Step 2: Link Your Local Project

Navigate to your project directory and link it:

```bash
cd /Users/tanweijie/repo/AppBase/trench-trace-portal-app

# Link to your Supabase project
supabase link --project-ref your-project-ref
```

**What this does:**
- Creates a `.supabase/` directory in your project
- Stores project configuration locally
- Enables you to deploy functions to this project

**Verify Link:**
```bash
# Check linked project details
supabase projects list
```

---

## Deploying Edge Functions

### Available Functions in This Project

Our project currently has these Edge Functions:

```
supabase/functions/
├── send-email/              # Universal email sender via Resend API
├── resend-webhook/          # Webhook handler for Resend events
├── send-payslip-smtp/       # Legacy SMTP sender (to be removed)
├── onemap-search/           # Singapore address search
├── pdf-generation/          # PDF generation service
├── synology-nas/            # NAS file operations
└── upload-trial-trench-attachment/  # File upload handler
```

### Deploy Single Function

```bash
# Deploy the send-email function
supabase functions deploy send-email

# Deploy the webhook handler
supabase functions deploy resend-webhook
```

### Deploy Multiple Functions

```bash
# Deploy both Resend functions at once
supabase functions deploy send-email resend-webhook

# Deploy all functions (not recommended - deploy only what you need)
supabase functions deploy
```

### Deployment Output

You'll see output like this:

```
Deploying Function (project-ref: your-project-ref)
        send-email (project: default)
Bundled send-email in 234ms.
✓ Deployed Function send-email in 1.2s

Function URL:
  https://your-project-ref.supabase.co/functions/v1/send-email
```

**Save these URLs!** You'll need them for:
- Frontend API calls
- Webhook configuration (Resend dashboard)
- Testing and debugging

---

## Verification and Testing

### List Deployed Functions

```bash
# Simple list
supabase functions list

# Detailed JSON output
supabase functions list --format json
```

**Example Output:**
```
┌─────────────────┬──────────┬─────────────────────────────────────────┐
│ NAME            │ STATUS   │ URL                                      │
├─────────────────┼──────────┼─────────────────────────────────────────┤
│ send-email      │ DEPLOYED │ /functions/v1/send-email                 │
│ resend-webhook  │ DEPLOYED │ /functions/v1/resend-webhook             │
└─────────────────┴──────────┴─────────────────────────────────────────┘

https://your-project-ref.supabase.co/functions/v1/send-email
https://your-project-ref.supabase.co/functions/v1/resend-webhook
```

### Test Function with curl

**Test send-email function:**

```bash
# Get your Supabase anon key from: 
# https://supabase.com/dashboard/project/your-project-ref/settings/api

curl -X POST \
  https://your-project-ref.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello World</h1>",
    "emailType": "generic"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "emailId": "re_abc123xyz",
  "message": "Email sent successfully"
}
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": "Missing authorization header",
  "timestamp": "2025-11-04T12:30:00.000Z"
}
```

---

## Viewing Logs

### Real-Time Logs

**Watch logs as they happen:**
```bash
# Tail logs for send-email function
supabase functions logs send-email --tail

# Tail logs for webhook handler
supabase functions logs resend-webhook --tail
```

**What you'll see:**
- Function invocations
- Console.log statements
- Errors and stack traces
- Response times

### Historical Logs

```bash
# View last 100 logs
supabase functions logs send-email --limit 100

# View logs from specific time range
supabase functions logs send-email --since "1 hour ago"
```

### Filter Logs by Level

```bash
# Show only errors
supabase functions logs send-email --level error

# Show warnings and errors
supabase functions logs send-email --level warn
```

### Save Logs to File

```bash
# Export logs for analysis
supabase functions logs send-email --limit 1000 > logs.txt
```

---

## Environment Variables

Edge Functions access environment variables (Supabase Secrets) at runtime.

### View Existing Secrets

```bash
# List all secrets (values are hidden)
supabase secrets list
```

**Expected Output:**
```
NAME                     | VALUE (REDACTED)
-------------------------|-----------------
RESEND_API_KEY          | re_***
RESEND_WEBHOOK_SECRET   | whsec_***
RESEND_FROM_EMAIL       | noreply@example.com
RESEND_FROM_NAME        | Your Company
RESEND_ADMIN_EMAIL      | admin@example.com
SUPABASE_URL            | https://***
SUPABASE_SERVICE_ROLE_KEY | eyJ***
```

### Set/Update Secrets

```bash
# Set a single secret
supabase secrets set RESEND_API_KEY=re_your_actual_api_key_here

# Set multiple secrets at once
supabase secrets set \
  RESEND_API_KEY=re_your_key \
  RESEND_WEBHOOK_SECRET=whsec_your_secret \
  RESEND_FROM_EMAIL=noreply@example.com
```

### Delete Secrets

```bash
# Remove a secret (use with caution!)
supabase secrets unset OLD_SECRET_NAME
```

### Load Secrets from File

```bash
# Create a .env file (DO NOT commit to git!)
cat > .env.production << EOF
RESEND_API_KEY=re_your_key
RESEND_WEBHOOK_SECRET=whsec_your_secret
RESEND_FROM_EMAIL=noreply@example.com
EOF

# Load all secrets from file
supabase secrets set --env-file .env.production
```

**⚠️ Important:**
- Secrets are encrypted and stored securely in Supabase
- Functions access secrets via `Deno.env.get('SECRET_NAME')`
- After updating secrets, **redeploy affected functions**

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "Access token not provided"

**Problem:** Not logged in to Supabase CLI

**Solution:**
```bash
supabase login
# Or
supabase login --token YOUR_ACCESS_TOKEN
```

#### 2. "Project not linked"

**Problem:** Local project not linked to Supabase project

**Solution:**
```bash
supabase link --project-ref your-project-ref
```

#### 3. "Function deployment failed"

**Problem:** Syntax errors or missing dependencies in function code

**Solution:**
```bash
# Check function logs for errors
supabase functions logs send-email --limit 50

# Common fixes:
# - Check TypeScript syntax
# - Verify import statements
# - Check for missing npm packages
# - Validate JSON in request/response
```

#### 4. "RESEND_API_KEY not configured"

**Problem:** Missing environment variable

**Solution:**
```bash
# Set the secret
supabase secrets set RESEND_API_KEY=re_your_actual_key

# Redeploy the function
supabase functions deploy send-email
```

#### 5. "CORS error in browser"

**Problem:** CORS headers not properly configured

**Solution:**  
Check your Edge Function has proper CORS headers:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle OPTIONS request
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}
```

#### 6. "Function timeout"

**Problem:** Function exceeds 30-second limit

**Solution:**
- Optimize slow operations
- Use async/await properly
- Consider moving long-running tasks to background jobs
- Check for infinite loops or deadlocks

#### 7. "Rate limit exceeded"

**Problem:** Too many function invocations

**Solution:**
```typescript
// Add rate limiting in your function
// Use Redis or similar for distributed rate limiting
// Or use Supabase storage for simple counters
```

---

## Best Practices

### 1. Version Control

**Always commit function code to git:**
```bash
git add supabase/functions/
git commit -m "feat: Add send-email Edge Function"
git push origin main
```

### 2. Test Locally First

```bash
# Start local Supabase (includes Edge Functions)
supabase start

# Serve functions locally
supabase functions serve send-email

# Test locally before deploying
curl http://localhost:54321/functions/v1/send-email \
  -H "Authorization: Bearer YOUR_LOCAL_ANON_KEY" \
  -d '{"test": true}'
```

### 3. Use Proper Error Handling

```typescript
serve(async (req) => {
  try {
    // Your function logic
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
```

### 4. Log Appropriately

```typescript
// ✅ Good - Structured logging
console.log('📧 Sending email to:', recipient)
console.log('✅ Email sent successfully, ID:', emailId)
console.error('❌ Failed to send email:', error)

// ❌ Bad - No context
console.log('Done')
console.log(result)
```

### 5. Secure Sensitive Data

```typescript
// ✅ Good - Use environment variables
const apiKey = Deno.env.get('RESEND_API_KEY')

// ❌ Bad - Hardcoded secrets
const apiKey = 're_abc123xyz' // NEVER DO THIS!
```

### 6. Keep Functions Small and Focused

- One function = one purpose
- Break complex logic into utilities
- Reuse code via shared modules
- Keep functions under 500 lines

### 7. Monitor Performance

```typescript
// Add timing logs
const startTime = Date.now()
// ... do work ...
const duration = Date.now() - startTime
console.log(`⏱️ Completed in ${duration}ms`)
```

---

## Common Commands Reference

### Quick Reference Card

```bash
# ============================================
# AUTHENTICATION
# ============================================
supabase login                              # Login via browser
supabase login --token YOUR_TOKEN           # Login with token
supabase projects list                      # List your projects

# ============================================
# PROJECT LINKING
# ============================================
supabase link --project-ref your-project-ref  # Link to project
supabase status                             # Check project status

# ============================================
# DEPLOYMENT
# ============================================
supabase functions deploy send-email        # Deploy single function
supabase functions deploy send-email resend-webhook  # Deploy multiple
supabase functions list                     # List deployed functions

# ============================================
# SECRETS MANAGEMENT
# ============================================
supabase secrets list                       # List all secrets
supabase secrets set KEY=value              # Set a secret
supabase secrets unset KEY                  # Delete a secret

# ============================================
# LOGS AND DEBUGGING
# ============================================
supabase functions logs send-email          # View logs
supabase functions logs send-email --tail   # Real-time logs
supabase functions logs send-email --limit 100  # Last 100 logs

# ============================================
# LOCAL DEVELOPMENT
# ============================================
supabase start                              # Start local Supabase
supabase functions serve                    # Serve all functions locally
supabase functions serve send-email         # Serve specific function
supabase stop                               # Stop local Supabase
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Code reviewed and tested locally
- [ ] All required secrets are set
- [ ] CORS headers properly configured
- [ ] Error handling implemented
- [ ] Logging added for debugging
- [ ] Function tested with curl/Postman
- [ ] Documentation updated
- [ ] Team notified of deployment

After deployment:

- [ ] Verify function URL is accessible
- [ ] Test function with real data
- [ ] Check logs for errors
- [ ] Monitor performance (response time)
- [ ] Update frontend code with new URLs
- [ ] Test end-to-end user flow

---

## Related Documentation

- [RESEND_EMAIL_INTEGRATION.md](./RESEND_EMAIL_INTEGRATION.md) - Email system setup
- [MCP_DB_ACCESS.md](./MCP_DB_ACCESS.md) - Database access patterns
- [SYNOLOGY_NAS_API_INTEGRATION.md](./SYNOLOGY_NAS_API_INTEGRATION.md) - NAS Edge Functions

---

## Support and Resources

**Supabase Documentation:**
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [Deno Runtime](https://deno.land/manual)

**Project Specific:**
- Project Dashboard: https://supabase.com/dashboard/project/your-project-ref
- Function URL Base: `https://your-project-ref.supabase.co/functions/v1/`

**Get Help:**
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues
- Team Slack: #tech-support

---

**Last Updated**: 2025-11-04  
**Maintainer**: Development Team  
**Version**: 1.0














