# Documentation Organization and Standards Plan

> 🔴 DEPRECATED 2026-05-30 — superseded by [WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md](./WORKSPACE_AND_AGENT_ARCHITECTURE_STANDARD.md) (folder structure + layering) and [.claude/rules/documentation.md](../../.claude/rules/documentation.md) (naming/header standards). Retained for history only.

**Created**: 2025-09-11 21:30:00 SGT
**Last Updated**: 2026-05-30 14:00:00 SGT
**Status**: 🔴 Deprecated
**Priority**: 🔴 Critical

## 📋 Overview

Documentation standards, templates, and organization rules for the AppBase docs system. Originally created Sept 2025 during the docs reorganization from flat to categorized structure.

## 📚 Related Documentation
- [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) - Central documentation index
- [MODULE_SYSTEM.md](../01-system-architecture/MODULE_SYSTEM.md) - Module implementation standards
- [DATABASE_POLICY.md](../01-system-architecture/DATABASE_POLICY.md) - Database security policies

---

## 🎯 **DOCUMENTATION SYSTEM STANDARDS**

### **Phase 1: Reorganization (Week 1)**

#### **A. New Directory Structure**
```
docs/
├── README.md                           # Main entry point
├── DOCUMENTATION_INDEX.md              # Comprehensive index with search
│
├── 01-system-architecture/             # Core system design
│   ├── DATABASE_POLICY.md
│   ├── MODULE_SYSTEM.md
│   ├── WORKFLOW_SYSTEM.md
│   ├── DESIGN_SYSTEM.md
│   ├── TIMEZONE_POLICY.md
│   └── URL_STANDARDS.md
│
├── 02-security/                        # Security policies and analysis
│   ├── DATABASE_SECURITY_VULNERABILITY_ANALYSIS_AND_REMEDIATION_PLAN.md
│   ├── AUTH_USER_ID_NORMALIZATION.md
│   └── SEO_BLOCKING_GUIDE.md
│
├── 03-features/                        # Feature specifications
│   ├── work-entry/                     # Work entry system
│   │   ├── WORKENTRY_OVERVIEW.md
│   │   ├── WORKENTRY_TRIAL_TRENCH.md
│   │   ├── WORKENTRY_GENERAL_WORKS.md
│   │   └── WORKING-HOURS.md
│   ├── jltt/                          # JLTT module
│   │   ├── JLTT_MODULE_ENHANCEMENT_PLAN.md
│   │   ├── JLTT_WORKFLOW_BACKTRACK_IMPLEMENTATION_PLAN.md
│   │   ├── JLTT_EXCEL_MIGRATION_PLAN.md
│   │   └── TRIAL_TRENCH_PHOTO_UPLOAD_IMPLEMENTATION.md
│   ├── ot-calculation/                # Overtime system
│   │   ├── OT_CALCULATION.md
│   │   ├── EDIT_OT_OVERVIEW_GRID.md
│   │   ├── WORKER_COMPENSATION_AND_OT_IMPLEMENTATION.md
│   │   └── INCOMPLETE_MONTH_CALCULATION.md
│   ├── notifications/                 # Notification system (deprecated)
│   │   └── NOTIFICATION_SYSTEM.md
│   ├── payroll/                       # Payroll features
│   │   └── PAYSLIP_GENERATOR.md
│   ├── quotation/                     # Quotation module
│   │   └── QUOTATION_MODULE.md
│   └── dashboards/                    # Dashboard features
│       └── SUPERVISOR_DAILY_DASHBOARD.md
│
├── 04-integrations/                    # External integrations
│   ├── SINGAPORE_OPENAPI_INTEGRATIONS.md
│   ├── STORING_SPATIAL_DATA.md
│   ├── MCP_DB_ACCESS.md
│   └── TOAST_SYSTEM.md
│
├── 05-implementation/                  # Implementation guides
│   ├── WORKENTRY_IMPLEMENTATION_PLAN.md
│   ├── WORKFLOW_SYSTEM_MODERNIZATION_PLAN.md
│   ├── TRIAL_TRENCH_SERVICES_STANDARDIZATION.md
│   └── ADD_COMMENT_TO_WORKER_ENTRY.md
│
├── 06-operations/                      # Operations and maintenance
│   ├── migrations/                     # Migration management
│   │   ├── MIGRATION_GOVERNANCE_FRAMEWORK.md
│   │   └── MIGRATION_SYSTEM_RECONSTRUCTION.md
│   └── business/                       # Business processes
│       ├── JL_WORKFLOW_OVERVIEW.md
│       └── SCOPE.md
│
└── 99-meta/                           # Meta documentation
    └── DOCUMENTATION_ORGANIZATION_AND_STANDARDS_PLAN.md (this file)
```

#### **B. File Naming Convention**
- **Categories**: Numbered prefixes (01-, 02-, etc.) for logical ordering
- **Subcategories**: Descriptive folder names with hyphens
- **Files**: SCREAMING_SNAKE_CASE.md (maintain existing convention)
- **Timestamps**: ISO format in file headers

#### **C. Required File Header Standard**
```markdown
# Document Title

**Created**: YYYY-MM-DD HH:MM:SS SGT  
**Last Updated**: YYYY-MM-DD HH:MM:SS SGT  
**Status**: 🔵 Planning | ⚪ Draft | 🟢 Production | 🟡 Transitional | 🔴 Deprecated  
**Priority**: 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low  
**Maintainer**: Team/Person responsible  
**Review Cycle**: Weekly | Monthly | Quarterly | Annual

## 📋 Overview
Brief description and purpose of this document

## 📚 Related Documentation
- [Related Doc 1](../path/to/doc.md) - Brief description
- [Related Doc 2](../path/to/doc.md) - Brief description

## 📝 Change Log
| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial creation | Name |
| YYYY-MM-DD | Major revision | Name |

<!-- Document content follows -->
```

### **Phase 2: Standardization (Week 2)**

#### **A. Document Templates by Type**

##### **Feature Specification Template**
```markdown
# Feature Name

[Standard Header]

## 📋 Business Context
- Why this feature exists
- Business value and use cases
- Success criteria

## 🎯 Functional Requirements
- Core functionality
- User stories
- Acceptance criteria

## 🔧 Technical Requirements
- System dependencies
- Performance requirements
- Security considerations

## 🚀 Implementation Plan
- Phase breakdown
- Timeline and milestones
- Risk mitigation

## 🧪 Testing Strategy
- Test cases
- Validation criteria
- User acceptance testing

## 📊 Success Metrics
- KPIs and measurements
- Definition of done
```

##### **Implementation Plan Template**
```markdown
# Implementation Plan: Feature Name

[Standard Header]

## 📋 Overview
- Implementation summary
- Dependencies and prerequisites

## 🗂️ Phase Breakdown
### Phase 1: Foundation (Timeline)
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### Phase 2: Core Implementation (Timeline)
- [ ] Task 1
- [ ] Task 2

### Phase 3: Integration & Testing (Timeline)
- [ ] Task 1
- [ ] Task 2

## 🔧 Technical Details
- Database changes
- Frontend components
- Backend services

## 🧪 Testing & Validation
- Test cases
- Quality assurance
- User acceptance

## 📊 Progress Tracking
| Phase | Status | Completion Date | Notes |
|-------|--------|----------------|-------|
| Phase 1 | 🟢 Complete | YYYY-MM-DD | |
| Phase 2 | 🔵 In Progress | | |
| Phase 3 | ⚪ Pending | | |
```

##### **Policy/Standard Template**
```markdown
# Policy/Standard Name

[Standard Header]

## 📋 Policy Statement
- Clear statement of the policy
- Scope and applicability

## 🎯 Objectives
- Why this policy exists
- Expected outcomes

## 📝 Requirements
- Mandatory requirements
- Prohibited actions
- Best practices

## 🔧 Implementation
- How to comply
- Tools and processes
- Examples

## 📊 Compliance & Monitoring
- Compliance checking
- Violation consequences
- Review process
```

#### **B. Cross-Reference System**
- **Bidirectional links**: Every reference should be reciprocal
- **Link validation**: Regular checks for broken links
- **Dependency mapping**: Visual representation of document relationships
- **Tag system**: Categorize documents with searchable tags

### **Phase 3: Automation & Tooling (Week 3)**

#### **A. Documentation Automation**

##### **Cursor Rule: Documentation Standards**
```markdown
---
description: Enforce documentation standards for all .md files
globs: docs/**/*.md
alwaysApply: true
---
# Documentation Standards Rule

## MANDATORY File Header
ALL .md files MUST include this exact header:

```markdown
# Document Title

**Created**: YYYY-MM-DD HH:MM:SS SGT  
**Last Updated**: YYYY-MM-DD HH:MM:SS SGT  
**Status**: 🔵 Planning | ⚪ Draft | 🟢 Production | 🟡 Transitional | 🔴 Deprecated  
**Priority**: 🔴 Critical | 🟡 High | 🟢 Medium | ⚪ Low  

## 📋 Overview
[Required: Brief description]

## 📚 Related Documentation
[Required: Links to related docs]
```

## File Organization Rules
- Use numbered category prefixes: 01-, 02-, etc.
- Group related documents in subdirectories
- Maintain SCREAMING_SNAKE_CASE.md naming
- Update DOCUMENTATION_INDEX.md when creating new files

## Update Triggers
MUST update documentation when:
- Creating new features/modules
- Modifying existing functionality
- Changing business processes
- Updating system architecture
- Deprecating features

## Cross-Reference Requirements
- All related documents MUST be linked in "Related Documentation"
- Use relative paths: `../category/DOCUMENT.md`
- Include brief description of relationship
- Validate links regularly
```

##### **Cursor Rule: Module Implementation Documentation**
```markdown
---
description: Ensure proper documentation when implementing new modules
globs: src/**/*
alwaysApply: true
---
# Module Implementation Documentation Rule

## MANDATORY Documentation for New Modules

When creating a new module, you MUST:

1. **Create Module Documentation**
   - File: `docs/03-features/[category]/MODULE_NAME.md`
   - Use Feature Specification Template
   - Include database schema changes
   - Document RBAC permissions

2. **Update Documentation Index**
   - Add entry to `DOCUMENTATION_INDEX.md`
   - Set appropriate status and priority
   - Include maintenance schedule

3. **Follow Security Standards**
   - Reference DATABASE_SECURITY_VULNERABILITY_ANALYSIS_AND_REMEDIATION_PLAN.md
   - Follow DATABASE_POLICY.md for RLS policies
   - Document security considerations

4. **Update Routing Documentation**
   - Document new routes in URL_STANDARDS.md
   - Update App.tsx route table
   - Ensure user_modules table permissions

## Database Migration Documentation
Every migration MUST be documented with:
- Purpose and business context
- Tables/functions affected
- Security implications
- Rollback procedures

## Module Permission Integration
Reference MODULE_SYSTEM.md for:
- Role-based access control
- Permission matrix
- Database integration
- Frontend integration
```

#### **B. Maintenance Automation**
- **Scheduled reviews**: Automated reminders for document updates
- **Link checking**: Regular validation of cross-references
- **Status tracking**: Automated status updates based on implementation progress
- **Archive management**: Automated deprecation and archival process

### **Phase 4: Migration & Training (Week 4)**

#### **A. File Migration Process**
1. **Create new directory structure**
2. **Move files to appropriate categories**
3. **Update all cross-references**
4. **Add standard headers to all files**
5. **Update DOCUMENTATION_INDEX.md**
6. **Validate all links**

#### **B. Team Training**
- **Documentation standards workshop**
- **Tool usage training**
- **Review process establishment**
- **Maintenance responsibility assignment**

---

## 🔧 **IMPLEMENTATION DETAILS**

### **Phase 1: Directory Reorganization**

#### **Step 1: Create New Structure**
```bash
# Create new directory structure
mkdir -p docs/01-system-architecture
mkdir -p docs/02-security
mkdir -p docs/03-features/{work-entry,jltt,ot-calculation,notifications,payroll,quotation,dashboards}
mkdir -p docs/04-integrations
mkdir -p docs/05-implementation
mkdir -p docs/06-operations/{migrations,business}
mkdir -p docs/99-meta
```

#### **Step 2: File Migration Mapping**
```
# System Architecture
DATABASE_POLICY.md → 01-system-architecture/
MODULE_SYSTEM.md → 01-system-architecture/
WORKFLOW_SYSTEM.md → 01-system-architecture/
DESIGN_SYSTEM.md → 01-system-architecture/
TIMEZONE_POLICY.md → 01-system-architecture/
URL_STANDARDS.md → 01-system-architecture/

# Security
DATABASE_SECURITY_VULNERABILITY_ANALYSIS_AND_REMEDIATION_PLAN.md → 02-security/
AUTH_USER_ID_NORMALIZATION.md → 02-security/
SEO_BLOCKING_GUIDE.md → 02-security/

# Features - Work Entry
WORKENTRY_OVERVIEW.md → 03-features/work-entry/
WORKENTRY_TRIAL_TRENCH.md → 03-features/work-entry/
WORKENTRY_GENERAL_WORKS.md → 03-features/work-entry/
WORKING-HOURS.md → 03-features/work-entry/

# Features - JLTT
JLTT_MODULE_ENHANCEMENT_PLAN.md → 03-features/jltt/
JLTT_WORKFLOW_BACKTRACK_IMPLEMENTATION_PLAN.md → 03-features/jltt/
JLTT_EXCEL_MIGRATION_PLAN.md → 03-features/jltt/
TRIAL_TRENCH_PHOTO_UPLOAD_IMPLEMENTATION.md → 03-features/jltt/

# Features - OT Calculation
OT_CALCULATION.md → 03-features/ot-calculation/
EDIT_OT_OVERVIEW_GRID.md → 03-features/ot-calculation/
WORKER_COMPENSATION_AND_OT_IMPLEMENTATION.md → 03-features/ot-calculation/
INCOMPLETE_MONTH_CALCULATION.md → 03-features/ot-calculation/

# Features - Other
NOTIFICATION_SYSTEM.md → 03-features/notifications/
PAYSLIP_GENERATOR.md → 03-features/payroll/
QUOTATION_MODULE.md → 03-features/quotation/
SUPERVISOR_DAILY_DASHBOARD.md → 03-features/dashboards/

# Integrations
SINGAPORE_OPENAPI_INTEGRATIONS.md → 04-integrations/
STORING_SPATIAL_DATA.md → 04-integrations/
MCP_DB_ACCESS.md → 04-integrations/
TOAST_SYSTEM.md → 04-integrations/

# Implementation
WORKENTRY_IMPLEMENTATION_PLAN.md → 05-implementation/
WORKFLOW_SYSTEM_MODERNIZATION_PLAN.md → 05-implementation/
TRIAL_TRENCH_SERVICES_STANDARDIZATION.md → 05-implementation/
ADD_COMMENT_TO_WORKER_ENTRY.md → 05-implementation/

# Operations
MIGRATION_GOVERNANCE_FRAMEWORK.md → 06-operations/migrations/
MIGRATION_SYSTEM_RECONSTRUCTION.md → 06-operations/migrations/
JL_WORKFLOW_OVERVIEW.md → 06-operations/business/
SCOPE.md → 06-operations/business/
```

### **Phase 2: Header Standardization**

#### **Script to Add Headers**
```bash
#!/bin/bash
# add_headers.sh - Add standard headers to all documentation files

for file in $(find docs -name "*.md" -not -path "*/DOCUMENTATION_INDEX.md"); do
  if ! grep -q "**Created**" "$file"; then
    # Get current date
    current_date=$(date "+%Y-%m-%d %H:%M:%S SGT")
    
    # Extract title from first # line
    title=$(grep "^# " "$file" | head -1 | sed 's/^# //')
    
    # Create temp file with header
    cat > temp_header.md << EOF
# $title

**Created**: $current_date  
**Last Updated**: $current_date  
**Status**: 🔵 Planning  
**Priority**: 🟢 Medium  

## 📋 Overview
[TODO: Add brief description and purpose]

## 📚 Related Documentation
[TODO: Add links to related documents]

EOF
    
    # Append original content (skip original title)
    tail -n +2 "$file" >> temp_header.md
    
    # Replace original file
    mv temp_header.md "$file"
    
    echo "Added header to $file"
  fi
done
```

### **Phase 3: Documentation Index Rebuild**

#### **New DOCUMENTATION_INDEX.md Structure**
```markdown
# Documentation Index

**Last Updated**: YYYY-MM-DD HH:MM:SS SGT  
**Total Documents**: XX files  
**Categories**: 6 main categories

## 🔍 Quick Search
- [System Architecture](#01-system-architecture) - Core system design
- [Security](#02-security) - Security policies and analysis  
- [Features](#03-features) - Feature specifications
- [Integrations](#04-integrations) - External integrations
- [Implementation](#05-implementation) - Implementation guides
- [Operations](#06-operations) - Operations and maintenance

## 📊 Status Overview
| Status | Count | Description |
|--------|-------|-------------|
| 🟢 Production | X | Currently implemented |
| 🔵 Planning | X | Specification complete |
| ⚪ Draft | X | Work in progress |
| 🟡 Transitional | X | Being modified |
| 🔴 Deprecated | X | No longer relevant |

## 01-system-architecture/
Core system design and architecture decisions.

| Document | Purpose | Status | Priority | Last Updated |
|----------|---------|--------|----------|--------------|
| [DATABASE_POLICY.md](./01-system-architecture/DATABASE_POLICY.md) | Database security and RLS policies | 🟢 Production | 🔴 Critical | YYYY-MM-DD |

<!-- Continue for all categories -->
```

---

## 🚀 **EXECUTION PLAN**

### **Week 1: Foundation (5 days)**
- **Day 1**: Create new directory structure
- **Day 2**: Migrate files to new locations
- **Day 3**: Update all cross-references
- **Day 4**: Add standard headers to all files
- **Day 5**: Rebuild DOCUMENTATION_INDEX.md

### **Week 2: Standardization (5 days)**
- **Day 1**: Create and implement Cursor rules
- **Day 2**: Standardize feature documentation
- **Day 3**: Standardize implementation plans
- **Day 4**: Standardize policies and standards
- **Day 5**: Validate all links and references

### **Week 3: Automation (5 days)**
- **Day 1**: Set up automated link checking
- **Day 2**: Implement status tracking system
- **Day 3**: Create maintenance reminders
- **Day 4**: Set up review cycles
- **Day 5**: Test automation systems

### **Week 4: Training & Validation (5 days)**
- **Day 1**: Team training on new standards
- **Day 2**: Process documentation
- **Day 3**: Final validation and testing
- **Day 4**: Go-live preparation
- **Day 5**: Launch new documentation system

---

## 📋 **SUCCESS CRITERIA**

### **Immediate Success (End of Week 1) - ✅ COMPLETED**
- ✅ All 33 files reorganized into logical categories
- ✅ Standard headers added to all files
- ✅ New DOCUMENTATION_INDEX.md created
- ✅ All cross-references updated and validated

### **Phase 2 Standardization (Week 2) - ✅ COMPLETED**
- ✅ Standardized headers added to all 33 documentation files
- ✅ Cross-references updated to use new directory structure
- ✅ Feature documentation standardized with proper templates
- ✅ Implementation plans and policies standardized
- ✅ Links validated and broken references fixed

### **Short-term Success (End of Week 4)**
- ✅ Cursor rules implemented and enforced
- ✅ Team trained on new standards
- ✅ Automation systems operational
- ✅ Documentation system fully functional

### **Long-term Success (3 months)**
- ✅ Documentation stays current with development
- ✅ New features automatically documented
- ✅ Team consistently follows standards
- ✅ Documentation provides clear value to development

---

## 🎯 **SPECIAL REQUIREMENTS FOR YOUR WORKFLOW**

### **Feature Planning Documentation**
Based on your workflow of stating requirements and asking for comprehensive analysis:

#### **Template for New Feature Requests**
```markdown
# Feature Request: [Feature Name]

**Created**: YYYY-MM-DD HH:MM:SS SGT  
**Status**: 🔵 Planning - Comprehensive Analysis Required  
**Priority**: [Set based on business need]  

## 📋 Feature Requirements
[Your detailed requirements here]

## 🚫 Implementation Hold
```
Dont execute it first, Can you analyze my requirement comprehensively and check all the existing files and application flow, let me know what and how to plan to implement, just write a new .md file and how you intend to implement it phase by phase make it as comprehensive as possible
Let me know if you have any questions as well
```

## 📚 Analysis Documentation
[AI analysis will be added here after comprehensive review]

## 🚀 Implementation Plan
[Phase-by-phase implementation plan will be added here]

## ❓ Questions & Clarifications
[Questions from AI analysis will be added here]
```

### **Module Implementation Checklist**
When implementing new modules, the documentation must cover:

1. **Security Compliance**
   - [ ] References DATABASE_SECURITY_VULNERABILITY_ANALYSIS_AND_REMEDIATION_PLAN.md
   - [ ] Follows DATABASE_POLICY.md RLS standards
   - [ ] Documents security considerations

2. **Module Integration**
   - [ ] References MODULE_SYSTEM.md for RBAC
   - [ ] Updates routing in App.tsx
   - [ ] Configures user_modules table permissions
   - [ ] Documents role-based access

3. **Database Changes**
   - [ ] Creates proper migration with security policies
   - [ ] Documents schema changes
   - [ ] Includes rollback procedures

4. **Documentation Updates**
   - [ ] Creates feature documentation
   - [ ] Updates DOCUMENTATION_INDEX.md
   - [ ] Links related documents
   - [ ] Sets maintenance schedule

---

## ❓ **QUESTIONS FOR CLARIFICATION**

### **1. Priority and Timeline**
- Should this documentation reorganization be the top priority before implementing new features?
- Is the 4-week timeline acceptable, or do you need it faster/slower?

### **2. Team Involvement**
- Who should be responsible for maintaining different categories of documentation?
- Do you want to review the reorganization plan before execution?

### **3. Automation Level**
- How much automation do you want for documentation maintenance?
- Should the system automatically update document statuses based on code changes?

### **4. Integration with Development Workflow**
- Should documentation updates be required before code reviews?
- Do you want automated checks for missing documentation on new features?

### **5. Migration Strategy**
- Should we migrate all files at once or gradually?
- Do you want to preserve git history for moved files?

---

## 📊 **CONCLUSION**

This comprehensive plan addresses all the issues you identified:

1. **Organization**: Clear category-based structure with logical grouping
2. **Standards**: Consistent headers, formatting, and maintenance processes
3. **Discoverability**: Improved index, search, and cross-referencing
4. **Maintenance**: Automated systems and clear ownership
5. **Integration**: Seamless integration with your development workflow

The structured approach ensures that your documentation becomes a valuable asset rather than a maintenance burden, supporting your development process and providing clear guidance for new features and modules.

---

*Documentation system originally reorganized Sept 2025. Doc health is now checked automatically via `/check-docs` (integrated into `/git-sync`).*

---

## 🤖 **SLASH COMMANDS FOR DOCUMENTATION**

The following Claude Code slash commands support the documentation workflow:

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/prd-write [module]` | Write a full ultracode-executable PRD for a new module | Before building a new module |
| `/check-docs [topic]` | Review all `.md` files related to a topic for quality and coherence | When docs feel stale or before a release |
| `/check-docs` | Validate `DOCUMENTATION_INDEX.md` — broken links, unlisted files, wrong counts | After any doc creation/update (auto-runs in `/prd-write`) |
| `/git-sync` | Full git workflow — includes `/check-docs` automatically | Before committing and pushing |

### `/prd-write` — How It Works

This command is run **before building a new module** to produce a single, ultracode-executable PRD that Claude Code reads to know what to build, why, in what order, and where the build currently stands.

**What it produces:**
- A new `docs/05-implementation/active/<MODULE>_PRD.md` file with the standard header + a live Progress/State table
- Product definition (what / why / target user), source-repo prior art, and an explicit cut-list
- Module spec (archetype, routes, data model, RBAC) pointing to MODULE_CREATION_SOP steps rather than inlining mechanics
- MVP→full phases + a per-phase Execution Blueprint (self-contained subagent prompts + dependency map)
- Cross-cutting compliance checklist (primitives, dark mode, mobile, timezone, toast, URL state) + Playwright @p0 test plan + the 8-gate Definition of Done
- Updated `DOCUMENTATION_INDEX.md` entry + `/check-docs` run automatically

**The Progress/State table is the most valuable part** — every ultracode executor flips it as phases pass the 8-gate, so any later session instantly knows where the build stands. The post-build feature doc (`docs/03-features/<slug>/`) is authored by the executors during the build, not by a separate command.

**Usage:**
```bash
# With module name
/prd-write Work Orders

# Without argument — command will ask what to build
/prd-write
```

**File placement**: PRDs live in `docs/05-implementation/active/`; move to `completed/` once the 8-gate is green.
