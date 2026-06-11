# Timezone Policy for Trench Trace Portal

**Created**: 2025-09-12 08:15:00 SGT  
**Last Updated**: 2026-04-19 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

> **Cell-level primitives (W07 Phase 2, 2026-04-19)**: for DataTable columns showing dates, use `<DateCell>` / `<DateTimeCell>` from `@/components/primitives/shell`. For SGD amounts, `<CurrencyCell>`. Both wrap `timezoneUtils` / `currencyHelper` — one component, no inline `formatDisplayDateLong(...)` sprinkled through column defs. See [src/components/primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md#shell--s-shell-chrome-11-primitives--4-cells).

## 📋 Overview
[Brief description and purpose of this document]

## 📚 Related Documentation
[Links to related documents with brief descriptions]


## 📍 **Application Timezone**

**This application operates exclusively in Singapore timezone (UTC+8).**

All business operations, data entry, reporting, and displays are based on Singapore local time unless explicitly stated otherwise.

## 🏢 **Business Context**

- **Primary Location**: Singapore
- **Timezone**: Asia/Singapore (UTC+8)
- **Business Hours**: 8:30 AM - 5:30 PM Singapore Time
- **Working Days**: Monday to Saturday (excluding Singapore public holidays)

## 🗃️ **Database Storage Policy**

### **Critical Rule: ALL TIMESTAMP fields in the database are stored in UTC**

This includes but is not limited to:
- `worker_ot.start_datetime`
- `worker_ot.end_datetime` 
- `trial_trenches.tt_date`
- `worker_ot.created_at`
- `worker_ot.updated_at`
- All `*_at` timestamp fields
- Status log timestamps

### **Why UTC in Database?**
1. **Data Integrity**: Prevents timezone-related data corruption
2. **International Compatibility**: Future-proofs for potential expansion
3. **Server Independence**: Works regardless of server timezone settings
4. **Audit Trail Accuracy**: Maintains precise chronological order

## 💻 **Frontend Display Policy**

### **User Interface Requirements**
- **ALL datetime displays** must show Singapore local time
- **Date pickers** must interpret user input as Singapore local time
- **Date calculations** (e.g., "same day", "overnight shift") use Singapore dates
- **Reports and exports** use Singapore timezone unless specified

### **Display Formats**
- **Date**: DD/MM/YYYY (Singapore format)
- **Time**: HH:mm (24-hour format)
- **Full DateTime**: DD/MM/YYYY HH:mm
- **OT Calculator**: Dates grouped by Singapore local date

## 🔧 **Implementation Standards**

### **Required Import for All Date/Time Operations**
```typescript
import { 
  toUTCForDatabase,
  fromUTCToLocal,
  formatForDateTimeLocal,
  parseFromDateTimeLocal,
  getLocalDateString,
  formatDisplayTime,
  formatDisplayDate,
  getCurrentSingaporeTime
} from '@/utils/timezoneUtils';
```

### **Data Flow Standards**

#### **1. User Input → Database**
```typescript
// ✅ CORRECT: Parse user input as Singapore time, convert to UTC
const userDateTime = parseFromDateTimeLocal(datetimeInputValue);
const utcForDB = toUTCForDatabase(userDateTime);

// Store utcForDB in database
```

#### **2. Database → User Display**
```typescript
// ✅ CORRECT: Display UTC data as Singapore local time
const utcFromDB = record.start_datetime; // UTC string from database
const localDate = fromUTCToLocal(utcFromDB);
const displayTime = formatDisplayTime(localDate);
```

#### **3. Date Grouping/Comparison**
```typescript
// ✅ CORRECT: Group by Singapore local date
const dateKey = getLocalDateString(record.start_datetime);

// ❌ WRONG: Groups by UTC date (can cause date shifts)
const dateKey = record.start_datetime.split('T')[0];
```

## 🚨 **Common Pitfalls to Avoid**

### **❌ NEVER DO THESE:**

1. **Direct Date Creation from UTC Strings**
   ```typescript
   // ❌ WRONG: Can cause timezone shifts
   const date = new Date(utcString);
   const localTime = `${date.getHours()}:${date.getMinutes()}`;
   ```

2. **Using toISOString() for Date Keys**
   ```typescript
   // ❌ WRONG: UTC date might differ from Singapore date
   const dateKey = new Date().toISOString().split('T')[0];
   ```

3. **Timezone-Naive Date Calculations**
   ```typescript
   // ❌ WRONG: Doesn't account for timezone
   const sameDay = date1.getDate() === date2.getDate();
   ```

4. **🚨 PUBLIC HOLIDAY CHECKING WITHOUT TIMEZONE CONVERSION**
   ```typescript
   // ❌ WRONG: Checks UTC date against holiday list
   // CRITICAL BUG: This caused Oct 21 work to be paid as public holiday!
   const dateString = date.toISOString().split('T')[0];
   const isHoliday = PUBLIC_HOLIDAYS.includes(dateString);
   
   // Example of the bug:
   // Worker works: Oct 21, 2025 7:00 AM Singapore (Tuesday - regular day)
   // Stored in DB: Oct 20, 2025 11:00 PM UTC
   // Bug checks:   Oct 20 UTC → matches Deepavali → WRONG 2x pay!
   ```

### **✅ CORRECT PATTERNS:**

1. **Proper Date Display**
   ```typescript
   // ✅ CORRECT: Shows Singapore local time
   const displayTime = formatDisplayTime(utcString);
   ```

2. **Date Grouping**
   ```typescript
   // ✅ CORRECT: Groups by Singapore local date
   const dateKey = getLocalDateString(utcString);
   ```

3. **User Input Handling**
   ```typescript
   // ✅ CORRECT: Treats input as Singapore local time
   const localDateTime = parseFromDateTimeLocal(inputValue);
   ```

4. **Public Holiday Checking**
   ```typescript
   // ✅ CORRECT: Converts to Singapore date before checking
   const singaporeDateStr = getLocalDateString(date.toISOString());
   const isHoliday = PUBLIC_HOLIDAYS.includes(singaporeDateStr);
   
   // This ensures:
   // Oct 20, 2025 11:00 PM UTC → Oct 21 Singapore → NOT a holiday ✓
   // Oct 20, 2025 8:00 AM UTC → Oct 20 Singapore → IS Deepavali ✓
   ```

## 📅 **Special Cases**

### **Overnight Shifts**
- **Start Date**: Monday 11:00 PM Singapore time
- **End Date**: Tuesday 6:00 AM Singapore time
- **Classification**: Monday work (based on start date in Singapore timezone)

### **Cross-Day OT Calculator Display**
- Entries are grouped by **start date** in Singapore timezone
- An overnight shift starting Monday 11:00 PM appears under Monday column
- This maintains business logic consistency

### **Public Holidays**
- Singapore public holidays are defined by local dates
- Holiday detection **MUST** use Singapore local date, not UTC date
- **Critical**: Affected files must use `getLocalDateString()` for holiday checking:
  - `src/utils/otCalculations.ts` - OT calculation logic
  - `src/services/PublicHolidayService.ts` - Holiday service API
  - `src/utils/incompleteMonthCalculator.ts` - Month calculation logic

## 📋 **Testing Requirements**

### **Timezone Edge Cases to Test**
1. **Near Midnight Submissions**: 23:30 - 00:30 Singapore time
2. **Daylight Saving Boundaries**: Even though Singapore doesn't observe DST, test with UTC transitions
3. **Cross-Date Validation**: Ensure overnight shifts are classified correctly
4. **Holiday Detection**: Verify public holidays are detected using Singapore dates

### **Validation Checklist**
- [ ] User submits Monday 23:30 → appears under Monday in OT calculator
- [ ] Database stores all times in UTC format
- [ ] Edit forms display Singapore local time correctly
- [ ] Duplicate detection uses Singapore local dates
- [ ] Reports show Singapore timezone headers

## 🔄 **Migration Notes**

### **From Previous Implementation**
The previous implementation had inconsistent timezone handling that caused:
- Date shifts during edit operations
- Incorrect OT calculator grouping
- Monday entries appearing under Sunday

### **Post-Migration Verification**
After implementing this policy:
1. Verify existing data displays correctly
2. Test new submissions maintain proper dates
3. Ensure edit operations preserve intended dates
4. Validate OT calculator shows entries under correct dates

## 🐛 **Critical Bug Fixes**

### **Public Holiday Double Pay Bug (Fixed: 2025-11-07)**

**Issue**: Workers incorrectly received 2x public holiday pay for working on regular days after Deepavali.

**Root Cause**: 
- Public holiday checking used UTC dates instead of Singapore dates
- Workers working Oct 21, 2025 7:00 AM Singapore (Tuesday - regular day)
- Database stores as Oct 20, 2025 11:00 PM UTC
- Bug checked "Oct 20" → matched Deepavali → gave wrong 2x pay

**Impact**:
- All workers who worked Oct 21, 2025 were incorrectly paid double
- Similar issue would occur for any overnight/early morning work after public holidays
- Could cause significant payroll overpayment

**Fixed Files**:
- `src/utils/otCalculations.ts` - Both sync and async holiday checking
- `src/services/PublicHolidayService.ts` - Holiday service API
- `src/utils/incompleteMonthCalculator.ts` - Month calculation logic

**Solution**:
All public holiday checks now use `getLocalDateString()` to convert UTC timestamps to Singapore dates before comparison.

**Verification**:
```sql
-- Verify correct day classification
SELECT 
  '2025-10-20'::date as deepavali_monday,
  '2025-10-21'::date as regular_tuesday;
  
-- Workers who worked Oct 21 should get regular OT, not 2x pay
```

## 📞 **Contact & Support**

For timezone-related issues or questions:
- **Technical Lead**: Development Team
- **Business Context**: Singapore Operations Team
- **Policy Updates**: Require approval from both Technical and Business teams

---

**Last Updated**: November 7, 2025  
**Version**: 1.1 (Added public holiday bug fix documentation)  
**Status**: MANDATORY - All date/time code must follow this policy

## ⚡ **Quick Reference**

| Operation | Use This Function | Example |
|-----------|------------------|---------|
| User Input → DB | `parseFromDateTimeLocal()` + `toUTCForDatabase()` | OT form submission |
| DB → Display | `formatDisplayTime()` / `formatDisplayDate()` | Show times to user |
| Date Grouping | `getLocalDateString()` | OT calculator columns |
| Default Times | `createDefaultStartTime()` / `createDefaultEndTime()` | Form initialization |
| Current Time | `getCurrentSingaporeTime()` | Timestamps, defaults |

**Remember: When in doubt, all operations should result in Singapore local time for the user!**