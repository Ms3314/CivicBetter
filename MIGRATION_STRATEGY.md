# Database Migration Strategy

## 🎯 Recommended Approach: **CI/CD Migrations**

### Why CI/CD is Better:

✅ **No Race Conditions** - Migrations run once before deployment  
✅ **Better Error Handling** - Fail deployment if migrations fail  
✅ **Zero Downtime** - Migrations complete before new containers start  
✅ **Multiple Containers** - Safe with multiple instances  
✅ **Easier Debugging** - Migration errors visible in CI/CD logs  
✅ **Industry Standard** - Best practice for production  

### Why NOT in Dockerfile:

❌ **Race Conditions** - Multiple containers can try to migrate simultaneously  
❌ **Every Restart** - Migrations run on every container start (wasteful)  
❌ **Harder to Debug** - Migration errors buried in container logs  
❌ **Deployment Issues** - Container might start before migrations complete  

---

## 📋 Implementation Options

### **Option A: CI/CD Migrations (RECOMMENDED)** ✅

Run migrations in GitHub Actions before deploying containers.

**Workflow:**
```
1. Build Docker image
2. Run migrations (one-time, before deployment)
3. Deploy containers
4. Containers start (migrations already done)
```

**Pros:**
- Migrations run once per deployment
- No race conditions
- Better error visibility
- Production-ready

**Cons:**
- Requires CI/CD setup (you already have this!)

---

### **Option B: Dockerfile Migrations**

Run migrations when container starts.

**Workflow:**
```
1. Build Docker image
2. Deploy container
3. Container starts → runs migrations → starts app
```

**Pros:**
- Simple setup
- Works without CI/CD

**Cons:**
- Race conditions with multiple containers
- Migrations run on every restart
- Harder to debug

**When to use:**
- Single container deployments
- Development/testing
- Simple setups

---

### **Option C: Manual Migrations**

Run migrations manually before deployment.

**Workflow:**
```
1. Developer runs: prisma migrate deploy
2. Build and deploy containers
```

**Pros:**
- Full control
- Can test migrations first

**Cons:**
- Easy to forget
- Manual step required
- Not automated

---

## 🚀 Recommended Setup (CI/CD)

Your current workflow should be updated to:

```yaml
1. Build Docker image
2. Run migrations in a temporary container
3. Deploy new containers
4. Containers start (migrations already applied)
```

This ensures:
- Migrations complete before app starts
- No downtime
- Safe for multiple containers
- Easy to rollback if migrations fail

---

## 📝 Migration Commands

### **Development:**
```bash
bun run db:migrate        # Creates migration + applies
bun run db:generate       # Generates Prisma client
```

### **Production (CI/CD):**
```bash
bunx prisma migrate deploy  # Applies pending migrations only
```

### **Manual (if needed):**
```bash
docker run --rm \
  --env-file .env \
  civicbetter-api:latest \
  bunx prisma migrate deploy
```

---

## ⚠️ Important Notes

1. **Always backup database** before running migrations in production
2. **Test migrations** in staging first
3. **Monitor migration logs** in CI/CD
4. **Rollback plan** - Keep previous migration files
5. **Database locks** - Prisma handles this, but be aware

---

## 🔄 Migration Flow Diagram

```
CI/CD Pipeline:
┌─────────────────┐
│  Build Image    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Run Migrations  │ ← One-time, before deployment
│ (temp container) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy Containers│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Containers Start│ ← Migrations already done
│   (App Ready)   │
└─────────────────┘
```

---

## ✅ Final Recommendation

**Use CI/CD migrations** - Update your GitHub Actions workflow to run migrations before deploying containers.

This is the industry standard and best practice for production deployments.

