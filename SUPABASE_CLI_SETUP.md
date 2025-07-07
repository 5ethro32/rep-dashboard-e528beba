# Supabase CLI Setup & Troubleshooting

## Issue: Supabase CLI Not Found in PATH

### Problem
When installing Supabase CLI via Scoop, it may not be automatically added to the system PATH, causing the following error:
```
supabase : The term 'supabase' is not recognized as the name of a cmdlet, function, script file, or operable program.
```

### Root Cause
Scoop installs Supabase CLI to `%USERPROFILE%\scoop\apps\supabase\current\supabase.exe` but doesn't always add this location to the PATH environment variable.

### Solution 1: Add to PATH Permanently ✅ (Recommended)

**Step 1: Add to PATH (PowerShell as Administrator)**
```powershell
[System.Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";$env:USERPROFILE\scoop\apps\supabase\current", [System.EnvironmentVariableTarget]::User)
```

**Step 2: Restart Terminal**
Close and reopen your PowerShell/Terminal window for the PATH changes to take effect.

**Step 3: Verify PATH Was Added**
```powershell
[System.Environment]::GetEnvironmentVariable("PATH", [System.EnvironmentVariableTarget]::User) -split ';' | Select-String "supabase"
```
Should output: `C:\Users\jethr\scoop\apps\supabase\current`

**Step 4: Restart Terminal & Test**
Close and reopen your PowerShell/Terminal, then run:
```powershell
supabase --version
```
Should output: `2.30.4` (or current version)

### Solution 2: Manual Path Fix (Temporary)

If you need to use Supabase CLI in the current session before restarting:

**Option A: Full Path**
```powershell
& "$env:USERPROFILE\scoop\apps\supabase\current\supabase.exe" --version
```

**Option B: Add to Current Session**
```powershell
$env:PATH += ";$env:USERPROFILE\scoop\apps\supabase\current"
supabase --version
```

### Solution 3: Scoop Shim Fix (Alternative)

If the PATH fix doesn't work, you can reset Scoop shims:
```powershell
scoop reset supabase
```

### Verification Commands

Once fixed, these commands should work:
```powershell
# Check version
supabase --version

# List linked projects
supabase projects list

# Check database status
supabase db push

# Link to project
supabase link --project-ref YOUR_PROJECT_REF
```

### Common Supabase CLI Commands

```powershell
# Database operations
supabase db push                    # Deploy migrations
supabase db pull                    # Pull schema changes
supabase db diff                    # View pending changes
supabase db reset                   # Reset local database

# Project operations
supabase projects list              # List all projects
supabase link --project-ref <ref>   # Link to project
supabase status                     # Check connection status

# Migration operations
supabase migration new <name>       # Create new migration
supabase migration up               # Apply migrations
supabase migration list             # List migrations
```

### Project-Specific Information

**Current Project:**
- **Project Ref:** `ukshnjjmsrhgvkwrzoah`
- **Database URL:** `https://ukshnjjmsrhgvkwrzoah.supabase.co`
- **Local Directory:** `C:\Users\jethr\OneDrive\Desktop\Reporting Dashboard\rep-dashboard-e528beba-4`

**Link Command:**
```powershell
supabase link --project-ref ukshnjjmsrhgvkwrzoah
```

### Troubleshooting Tips

1. **Environment Variables Not Loading:** Restart your terminal/IDE after PATH changes
2. **Permission Errors:** Run PowerShell as Administrator when setting system PATH
3. **Multiple Supabase Versions:** Check `scoop list supabase` for conflicts
4. **Scoop Issues:** Run `scoop checkup` to diagnose Scoop installation problems

### Installation Commands (Reference)

```powershell
# Install Scoop (if not installed)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop install supabase

# Update Supabase CLI
scoop update supabase
```

---

## Current Status ✅

**PATH Configuration:** ✅ **COMPLETED**
- Supabase CLI path added to user PATH: `C:\Users\jethr\scoop\apps\supabase\current`
- Verification command confirms PATH is set correctly
- **Next Step:** Restart your terminal to use `supabase` commands directly

**Quick Test After Restart:**
```powershell
supabase --version
# Should output: 2.30.4
```

---

**Last Updated:** January 2025  
**Supabase CLI Version:** 2.30.4  
**Status:** ✅ PATH configured permanently 