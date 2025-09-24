# 🔒 Safe Database Sync Workflow

## ⚠️ Why NOT Bidirectional Sync?

**NEVER use bidirectional sync** for production booking systems because:
- 🚨 **Double-bookings:** Development experiments conflict with live reservations
- 💳 **Payment corruption:** Credit card data could be corrupted or lost
- 🔐 **Security violations:** PCI/PII data exposed between environments
- 💥 **Data conflicts:** Concurrent changes create irrecoverable corruption

## 🛡️ SAFE Alternative: One-Way Promotion Pipeline

### 📊 Data Flow Strategy
```
Production (Source of Truth) → Development (Safe Content)
Development (Vetted Changes) → Production (Content Only)
```

---

## 🔄 Workflow Commands

### 1️⃣ Production → Development (Safe Content)
**Purpose:** Seed development with sanitized production data
```bash
npx tsx scripts/sync-dev-from-production.ts
```

**What it includes:**
- ✅ Property information
- ✅ Amenities and categories  
- ✅ Photo gallery
- ✅ Site settings (sanitized)
- ✅ Email templates
- ✅ Content blocks

**What it EXCLUDES (for security):**
- ❌ Bookings and reservations
- ❌ Guest personal information
- ❌ Payment data
- ❌ Admin passwords
- ❌ API keys and secrets
- ❌ Production logs

### 2️⃣ Development → Production (Content Only)
**Purpose:** Promote vetted content changes to production
```bash
npx tsx scripts/sync-content-to-production.ts
```

**What it syncs:**
- ✅ Property details updates
- ✅ New amenities
- ✅ Photo gallery changes
- ✅ Email template updates
- ✅ Content and layout changes

**What it PROTECTS:**
- 🛡️ Live bookings (NEVER touched)
- 🛡️ Guest data (NEVER touched)
- 🛡️ Payment records (NEVER touched)
- 🛡️ Admin accounts (NEVER overwritten)

---

## 🚨 Safety Features

### Automatic Backups
- 💾 Creates timestamped backups before any production changes
- 🔄 Transaction-based updates (rollback on failure)
- 📝 Audit logging of all sync operations

### Data Protection
- 🔒 **Production-Protected Tables:** Bookings, guests, payments never sync
- 🧹 **Sanitization:** Removes all PII, API keys, secrets
- ✅ **Validation:** Checks data integrity before import

### Security Compliance
- 🛡️ **PCI Compliant:** No payment data leaves production
- 🔐 **GDPR Safe:** No personal data in development
- 📊 **Audit Ready:** Full logging of data movements

---

## 📋 Step-by-Step Workflow

### Initial Development Setup
1. Run production → development sync to seed dev database:
   ```bash
   npx tsx scripts/sync-dev-from-production.ts
   ```

### Making Content Changes
1. Make changes in **development environment**
2. Test thoroughly in development  
3. Export development content:
   ```bash
   npx tsx scripts/export-production-data.ts
   ```
4. Sync content to production:
   ```bash
   npx tsx scripts/sync-content-to-production.ts
   ```

### Regular Maintenance
- **Weekly:** Refresh development with latest production content
- **As needed:** Promote approved content changes to production
- **Never:** Direct production database edits

---

## ⚡ Quick Commands

```bash
# Seed development with safe production data
npx tsx scripts/sync-dev-from-production.ts

# Promote content changes to production  
npx tsx scripts/sync-content-to-production.ts

# Traditional full production import (for deployment)
npx tsx scripts/import-production-data.ts
```

---

## 🎯 Benefits

### Security
- ✅ **Zero PII exposure** in development
- ✅ **Payment data protected** at all times
- ✅ **Audit trail** for all data movements

### Reliability  
- ✅ **No data conflicts** between environments
- ✅ **Automatic backups** before changes
- ✅ **Transaction safety** with rollback

### Productivity
- ✅ **Fresh content** in development regularly
- ✅ **Safe content promotion** to production
- ✅ **Zero downtime** deployments

This approach gives you **controlled data flow** while protecting your live booking system! 🎉