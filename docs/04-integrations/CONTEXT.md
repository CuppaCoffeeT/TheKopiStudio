# External Integrations
> Last updated: 2026-05-25

Documentation for all third-party services and APIs the portal connects to: NAS file storage, email, maps, PDF generation, accounting, and Supabase edge functions.

## What belongs here

- API references and configuration guides for external services
- Deployment and troubleshooting guides for integrations
- Integration-specific debugging history

## What does NOT belong here

- Feature specifications that use integrations → `docs/03-features/`
- Implementation plans for new integrations → `docs/05-implementation/active/`
- MCP configuration → `CLAUDE.md` and `.claude/CONTEXT.md`

## Navigation

| File | Service | Purpose |
|------|---------|---------|
| `SYNOLOGY_NAS_API_INTEGRATION.md` | Synology NAS | File Station API for file upload/download |
| `SYNOLOGY_FILE_STATION_API_REFERENCE.md` | Synology NAS | Detailed API endpoint reference |
| `NAS_PHOTO_VIEWING_SYSTEM.md` | Synology NAS | Photo viewing via NAS URLs |
| `NAS_UPLOAD_DEBUGGING_GUIDE.md` | Synology NAS | Upload troubleshooting |
| `COMPLEX_NAS_FOLDER_STRUCTURE_TEST_IMPLEMENTATION.md` | Synology NAS | Folder structure test cases |
| `RESEND_EMAIL_INTEGRATION.md` | Resend | Email sending service |
| `EMAIL_SENDING_TROUBLESHOOTING.md` | Resend | Email debugging |
| `ONEMAP_API_INTEGRATION.md` | OneMap | Singapore map API |
| `SINGAPORE_OPENAPI_INTEGRATIONS.md` | SG Gov APIs | Government data APIs |
| `STORING_SPATIAL_DATA.md` | PostGIS | Spatial data storage patterns |
| `PDF_SERVICE_RAILWAY_DEPLOYMENT_GUIDE.md` | Railway | PDF generation microservice deployment |
| `VERCEL_DEPLOYMENT_GUIDE.md` | Vercel | Portal hosting (your-app.example.com) — CLI setup, env, deploy flow |
| `EDGE_FUNCTION_DEPLOYMENT_GUIDE.md` | Supabase | Edge function deployment |
| `XERO_SECURITY_SETUP.md` | Xero | Accounting API security config |
| `MCP_DB_ACCESS.md` | Supabase MCP | MCP database access patterns |
| `TOAST_SYSTEM.md` | Sonner | Toast notification library (legacy doc — rules in `.claude/rules/toast-system.md`) |

## Before working here

- Integration code lives in: `src/services/` and `supabase/functions/`
- NAS-related features: `docs/03-features/` (trial trench photos, report generation)
- Edge function SQL: `supabase/` workspace
