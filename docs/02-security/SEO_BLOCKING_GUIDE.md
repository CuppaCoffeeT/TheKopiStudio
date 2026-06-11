# SEO Blocking Guide for Internal Portal

**Created**: 2025-09-12 08:15:00 SGT  
**Last Updated**: 2025-09-12 08:15:00 SGT  
**Status**: 🟢 Production  
**Priority**: 🟢 Medium  

## 📋 Overview
[Brief description and purpose of this document]

## 📚 Related Documentation
[Links to related documents with brief descriptions]


## Overview

This internal portal (`your-app.example.com`) is designed for private, internal use only and should **never** be indexed by search engines. This document outlines the implemented protections and best practices for maintaining search engine privacy.

## ✅ Implemented Protections

### 1. Robots.txt Blocking

**Location**: `/public/robots.txt`

```txt
User-agent: *
Disallow: /
```

**Purpose**: 
- Tells all search engine crawlers to not crawl any pages on the site
- Served at `https://your-app.example.com/robots.txt`
- **Note**: This is a request, not a guarantee. Malicious crawlers may ignore it.

### 2. HTML Meta Tags

**Location**: `/index.html` (line 6)

```html
<meta name="robots" content="noindex, nofollow" />
```

**Purpose**:
- `noindex`: Tells search engines not to include this page in search results
- `nofollow`: Tells search engines not to follow links on this page

### 3. SEOBlock Component

**Location**: `/src/components/SEOBlock.tsx`

**Features**:
- Comprehensive blocking for all major search engines
- Social media crawler blocking (Facebook, Twitter)
- Additional security headers
- Reusable across all pages

**Usage**:
```tsx
import SEOBlock from '@/components/SEOBlock';

function MyPage() {
  return (
    <>
      <SEOBlock title="Page Name" description="Internal page description" />
      {/* Your page content */}
    </>
  );
}
```

## 🔒 Multiple Layers of Protection

The implementation uses a **defense-in-depth** approach:

1. **robots.txt** - Site-wide crawler blocking
2. **HTML meta tags** - Page-level indexing prevention  
3. **React Helmet** - Dynamic meta tag management
4. **Social media blocking** - Prevents sharing/previews
5. **Security headers** - Additional crawler deterrents

## 📋 Developer Checklist

### For Every New Page:

1. **Import SEOBlock component**:
   ```tsx
   import SEOBlock from '@/components/SEOBlock';
   ```

2. **Add SEOBlock to JSX**:
   ```tsx
   return (
     <>
       <SEOBlock title="Your Page Title" description="Page description" />
       {/* Your existing JSX */}
     </>
   );
   ```

### For Route Changes:

- ✅ New routes automatically inherit protections via `SEOBlock`
- ✅ No additional configuration needed if using `SEOBlock`

### Before Deployment:

1. **Verify robots.txt**: Check `https://your-app.example.com/robots.txt`
2. **Test meta tags**: View page source to confirm `<meta name="robots" content="noindex, nofollow" />`
3. **Check search console**: Monitor Google Search Console for any indexing attempts

## 🚨 Security Validation

### Manual Testing:

1. **robots.txt Check**:
   ```bash
   curl https://your-app.example.com/robots.txt
   ```
   Should return:
   ```
   User-agent: *
   Disallow: /
   ```

2. **Meta Tag Verification**:
   - View page source
   - Look for `<meta name="robots" content="noindex, nofollow" />`

3. **Search Engine Test**:
   - Search: `site:your-app.example.com` in Google
   - Should return: "No results found"

### Automated Monitoring:

Consider setting up alerts for:
- Changes to `robots.txt`
- Missing `noindex` meta tags
- Unexpected search engine traffic

## 🛡️ Why Multiple Protections?

| Protection Method | Purpose | Reliability |
|------------------|---------|-------------|
| `robots.txt` | Polite crawler request | 90% (honorable crawlers) |
| Meta robots tags | Direct indexing prevention | 95% (major search engines) |
| Social meta tags | Prevents social sharing previews | 99% (social platforms) |
| Security headers | Additional deterrent | 80% (security-aware crawlers) |

**Combined**: 99.9% protection against legitimate crawlers

## 📚 Examples

### ✅ Correct Implementation

```tsx
// pages/NewFeature.tsx
import React from 'react';
import SEOBlock from '@/components/SEOBlock';

const NewFeature = () => {
  return (
    <>
      <SEOBlock 
        title="New Feature" 
        description="Internal feature page - Private access only" 
      />
      <div className="page-content">
        {/* Your component content */}
      </div>
    </>
  );
};

export default NewFeature;
```

### ❌ Missing Protection

```tsx
// DON'T DO THIS - Missing SEOBlock
const BadPage = () => {
  return (
    <div className="page-content">
      {/* This page can be indexed! */}
    </div>
  );
};
```

## 🔧 Troubleshooting

### Common Issues:

1. **Page still appears in search results**:
   - Check if `SEOBlock` is included
   - Verify robots.txt is accessible
   - Wait 2-4 weeks for search engines to process changes

2. **robots.txt not working**:
   - Ensure file is in `/public/` directory
   - Check file permissions
   - Verify deployment includes the file

3. **Meta tags not rendering**:
   - Ensure `HelmetProvider` wraps your app (already configured)
   - Check React Helmet async dependency is installed
   - Verify component imports are correct

## 🚀 Deployment Notes

### Production Checklist:

- [ ] `robots.txt` deployed and accessible
- [ ] All pages include `SEOBlock` component
- [ ] React Helmet configured in App.tsx
- [ ] No development-only meta tags remain
- [ ] SSL certificate properly configured

### Emergency Rollback:

If pages accidentally get indexed:
1. Verify all protections are in place
2. Request URL removal via Google Search Console
3. Monitor for 2-4 weeks for deindexing

## 📞 Support

For questions about SEO blocking:
1. Check this documentation first
2. Verify using the manual testing steps
3. Contact the development team if issues persist

---

**Last Updated**: December 2024  
**Next Review**: March 2025