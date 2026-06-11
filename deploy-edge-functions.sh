#!/bin/bash
# Supabase Edge Functions Deployment Script
# Project: AppBase Trench Trace Portal
# Project Ref: your-project-ref

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Supabase Edge Functions Deployment Script                  ║"
echo "║  Project: AppBase Trench Trace Portal                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_REF="your-project-ref"

# Function to print colored output
print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Supabase CLI is installed
print_step "Checking Supabase CLI installation..."
if ! command -v supabase &> /dev/null; then
    print_error "Supabase CLI is not installed!"
    echo ""
    echo "Install it with:"
    echo "  macOS:   brew install supabase/tap/supabase"
    echo "  Windows: scoop install supabase"
    echo ""
    exit 1
fi

SUPABASE_VERSION=$(supabase --version 2>&1 | head -n 1)
print_success "Supabase CLI installed: $SUPABASE_VERSION"
echo ""

# Check if logged in
print_step "Checking authentication status..."
if ! supabase projects list &> /dev/null; then
    print_warning "Not logged in to Supabase CLI"
    echo ""
    echo "Please login first:"
    echo "  supabase login"
    echo ""
    echo "Or use access token:"
    echo "  supabase login --token YOUR_TOKEN"
    echo ""
    echo "Get your token from: https://supabase.com/dashboard/account/tokens"
    echo ""
    exit 1
fi
print_success "Authenticated to Supabase"
echo ""

# Check if project is linked
print_step "Checking project linkage..."
if [ ! -d ".supabase" ]; then
    print_warning "Project not linked to Supabase"
    echo ""
    echo "Linking project now..."
    supabase link --project-ref $PROJECT_REF
    print_success "Project linked successfully"
else
    print_success "Project already linked"
fi
echo ""

# List available functions
print_step "Available Edge Functions:"
echo ""
ls -1 supabase/functions/ | grep -v "\.md$" | while read func; do
    if [ -d "supabase/functions/$func" ]; then
        echo "  • $func"
    fi
done
echo ""

# Prompt user for deployment choice
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Deployment Options:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1) Deploy send-email only"
echo "  2) Deploy resend-webhook only"
echo "  3) Deploy both send-email and resend-webhook (Recommended)"
echo "  4) Deploy all functions"
echo "  5) Cancel"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        DEPLOY_FUNCTIONS="send-email"
        ;;
    2)
        DEPLOY_FUNCTIONS="resend-webhook"
        ;;
    3)
        DEPLOY_FUNCTIONS="send-email resend-webhook"
        ;;
    4)
        read -p "⚠️  Are you sure you want to deploy ALL functions? (y/N): " confirm
        if [[ $confirm != [yY] ]]; then
            print_warning "Deployment cancelled"
            exit 0
        fi
        DEPLOY_FUNCTIONS=""
        ;;
    5)
        print_warning "Deployment cancelled"
        exit 0
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_step "Deploying functions..."
echo ""

# Deploy the functions
if [ -z "$DEPLOY_FUNCTIONS" ]; then
    # Deploy all functions
    supabase functions deploy
else
    # Deploy specific functions
    supabase functions deploy $DEPLOY_FUNCTIONS
fi

if [ $? -eq 0 ]; then
    echo ""
    print_success "Deployment completed successfully!"
    echo ""
    
    # Show function URLs
    print_step "Function URLs:"
    echo ""
    for func in $DEPLOY_FUNCTIONS; do
        echo "  $func:"
        echo "  └─ https://$PROJECT_REF.supabase.co/functions/v1/$func"
        echo ""
    done
    
    # Show next steps
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Next Steps:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. Verify deployment:"
    echo "   supabase functions list"
    echo ""
    echo "2. View logs:"
    echo "   supabase functions logs send-email --tail"
    echo ""
    echo "3. Test the function:"
    echo "   curl -X POST https://$PROJECT_REF.supabase.co/functions/v1/send-email \\"
    echo "     -H \"Authorization: Bearer YOUR_ANON_KEY\" \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d '{\"to\":\"test@example.com\",\"subject\":\"Test\",\"html\":\"<p>Hello</p>\"}'"
    echo ""
    echo "4. For Resend webhook:"
    echo "   Add this URL to Resend dashboard:"
    echo "   https://$PROJECT_REF.supabase.co/functions/v1/resend-webhook"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo ""
    print_error "Deployment failed!"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check function logs: supabase functions logs send-email"
    echo "  2. Verify secrets are set: supabase secrets list"
    echo "  3. Check syntax errors in function code"
    echo "  4. See full guide: docs/04-integrations/EDGE_FUNCTION_DEPLOYMENT_GUIDE.md"
    echo ""
    exit 1
fi

echo ""
print_success "All done! 🚀"
echo ""














