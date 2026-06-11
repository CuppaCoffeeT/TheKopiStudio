import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the request
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { quotationId, templateId } = await req.json()

    if (!quotationId || !templateId) {
      return new Response(
        JSON.stringify({ error: 'Missing quotationId or templateId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch quotation data with spatial features (Issue 12)
    const { data: quotation, error: quotationError } = await supabaseClient
      .from('quotations')
      .select(`
        *,
        client_companies!quotations_client_company_id_fkey (
          company_name,
          company_phone,
          billing_address_1,
          billing_address_2,
          billing_address_3,
          billing_address_4
        ),
        quotation_line_items (
          *,
          products_services!quotation_line_items_product_service_id_fkey (
            id,
            code,
            name
          )
        ),
        quotation_cdw_parts (
          *,
          quotation_spatial_features (
            *,
            spatial_features (
              *
            )
          )
        )
      `)
      .eq('id', quotationId)
      .single()

    if (quotationError || !quotation) {
      return new Response(
        JSON.stringify({ error: 'Quotation not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch template data
    const { data: template, error: templateError } = await supabaseClient
      .from('quotation_pdf_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: 'Template not found or inactive' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get template file URL
    const { data: templateFile } = await supabaseClient.storage
      .from(template.storage_bucket || 'quotation-templates')
      .createSignedUrl(template.storage_path, 3600) // 1 hour expiry

    if (!templateFile) {
      return new Response(
        JSON.stringify({ error: 'Template file not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Helper function to format date as "dd mmm yyyy" (e.g., "16 Nov 2025")
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleDateString('en-SG', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    };

    // CRITICAL: Format numbers helper
    const formatNumber = (num: number, decimals: number = 2) => {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    };

    // Shapes for the dynamically-joined quotation payload from Supabase.
    interface QuotationLineItem {
      products_services?: { code?: string | null } | null;
      sort_order?: number | null;
      quantity?: number | null;
      unit_price?: number | null;
      line_total?: number | null;
      title?: string | null;
      description?: string | null;
      unit?: string | null;
      part_assignment?: string | null;
    }
    interface SpatialFeatureLink {
      spatial_features?: { id: string; feature_type: string; geometry: unknown } | null;
    }
    interface CdwPart {
      part_number?: number | string | null;
      part_name?: string | null;
      part_color?: string | null;
      quotation_spatial_features?: SpatialFeatureLink[] | null;
    }
    interface PdfFeature {
      feature_id: string;
      feature_type: string;
      geometry: unknown;
      part_number: number | string | null | undefined;
      part_name: string;
      part_color: string;
    }

    // Check if item is a Notes-type item (product code is "TH notes")
    // Note: "TH" prefix is used for ALL Trial Trench products, only "TH notes" is the actual Notes item
    const isNotesItem = (item: QuotationLineItem) => {
      const code = (item.products_services?.code || '').toLowerCase().trim();
      return code === 'th notes';
    };

    // CRITICAL: Format line items with explicit String() conversions (Issue 11)
    const lineItems: QuotationLineItem[] = quotation.quotation_line_items || [];
    const sortedItems = [...lineItems].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const formattedLineItems = sortedItems.map((item, index: number) => {
      const isNotes = isNotesItem(item);
      const quantity = item.quantity || 0;
      const unitPrice = item.unit_price || 0;
      const lineTotal = item.line_total || 0;

      return {
        item_number: index + 1,
        product_code: String(item.products_services?.code || `ITEM-${index + 1}`),
        title: String(item.title || ''),
        description: String(item.description || ''),
        // Notes items: show blank instead of values (keep description)
        quantity: isNotes ? '' : formatNumber(quantity, 1),
        unit: isNotes ? '' : String(item.unit || 'pcs'),
        unit_price: isNotes ? '' : `S$${formatNumber(unitPrice)}`,
        tax_rate: isNotes ? '' : '9.0%',
        line_total: isNotes ? '' : (quantity === 0 ? 'Rate only' : `S$${formatNumber(lineTotal)}`),
        part_assignment: String(item.part_assignment || '')
      };
    });

    // Calculate totals
    const subtotal = lineItems.reduce((sum: number, item) => sum + (item.line_total || 0), 0);
    const gstTotal = subtotal * 0.09;
    const finalTotal = subtotal + gstTotal;

    // Format quotation data for docxtpl with dual structure (Issue 11)
    const quotationData = {
      quotation: {
        number: quotation.quotation_number,
        date: quotation.quotation_date ? formatDate(quotation.quotation_date) : formatDate(quotation.created_at),
        expiry: quotation.valid_until ? formatDate(quotation.valid_until) : '',
        status: quotation.status,
        reference: quotation.client_reference_number || ''
      },
      client: {
        company_name: quotation.client_companies?.company_name || '',
        address: [
          quotation.client_companies?.billing_address_1,
          quotation.client_companies?.billing_address_2,
          quotation.client_companies?.billing_address_3,
          quotation.client_companies?.billing_address_4
        ].filter(Boolean).join('\n'),
        phone: quotation.client_companies?.company_phone || ''
      },
      project: {
        name: quotation.project_name || '',
        description: quotation.project_description || ''
      },
      // CRITICAL: Direct array for {% for item in line_items %} (Issue 11)
      line_items: formattedLineItems,
      // CRITICAL: Root-level totals for {{subtotal}}, etc. (Issue 11)
      subtotal: `S$${formatNumber(subtotal)}`,
      gst_total: `S$${formatNumber(gstTotal)}`,
      final_total: `S$${formatNumber(finalTotal)}`,
      items_count: formattedLineItems.length,
      terms: {
        conditions: quotation.custom_terms_conditions || 'Standard terms and conditions apply.',
        payment: quotation.custom_payment_terms || 'Net 30 days',
        validity: quotation.valid_until ? formatDate(quotation.valid_until) : ''
      },
      spatial: {
        parts_count: quotation.quotation_cdw_parts?.length || 0,
        total_area: '0 sqm', // TODO: Calculate from spatial features
        // CRITICAL: Send spatial features for map generation (Issue 12)
        // Note: PDF service expects key name 'features' not 'spatial_features'
        features: (() => {
          const cdwParts: CdwPart[] = quotation.quotation_cdw_parts || [];
          const features: PdfFeature[] = [];

          cdwParts.forEach((part) => {
            const spatialFeatures = part.quotation_spatial_features || [];
            spatialFeatures.forEach((qsf) => {
              if (qsf.spatial_features) {
                features.push({
                  feature_id: qsf.spatial_features.id,
                  feature_type: qsf.spatial_features.feature_type,
                  geometry: qsf.spatial_features.geometry,
                  part_number: part.part_number,
                  part_name: part.part_name || '',
                  part_color: part.part_color || '#3B82F6'
                });
              }
            });
          });

          return features;
        })()
      },
      company: {
        name: 'Your Company Pte Ltd',
        address: '123 Business Street, Singapore 123456',
        phone: '+65 6234 5678',
        email: 'info@jlcable.com',
        logo: '' // TODO: Add company logo
      }
    }

    // Call Railway PDF service
    const pdfServiceUrl = Deno.env.get('PDF_SERVICE_URL') || 'https://trench-trace-portal-app-production.up.railway.app'
    
    // Download template file
    const templateResponse = await fetch(templateFile.signedUrl)
    if (!templateResponse.ok) {
      throw new Error('Failed to download template file')
    }
    const templateFileBlob = await templateResponse.blob()

    // Prepare form data for PDF service
    const formData = new FormData()
    formData.append('template_file', templateFileBlob, template.template_file_name)
    formData.append('quotation_data', JSON.stringify(quotationData))

    // Call Railway PDF service
    const pdfResponse = await fetch(`${pdfServiceUrl}/generate-pdf`, {
      method: 'POST',
      body: formData,
    })

    if (!pdfResponse.ok) {
      const errorText = await pdfResponse.text()
      throw new Error(`PDF generation failed: ${pdfResponse.status} ${errorText}`)
    }

    const pdfBlob = await pdfResponse.blob()

    // Update quotation status to 'sent'
    await supabaseClient
      .from('quotations')
      .update({ 
        status: 'sent',
        selected_pdf_template_id: templateId,
        sent_at: new Date().toISOString()
      })
      .eq('id', quotationId)

    // Return PDF as response
    return new Response(pdfBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Quotation_${quotation.quotation_number}.pdf"`
      }
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
