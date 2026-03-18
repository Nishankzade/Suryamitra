# Complete Step-by-Step Guide to Get & Setup DATABASE_URL

## STEP 1: Go to Neon Console
1. Open browser and go to: https://console.neon.tech
2. Login with your account (you already have one since migration worked)

## STEP 2: Find Your Project
1. You should see your project dashboard
2. Look for your project name (e.g., "Suryamitra" or similar)
3. Click on it

## STEP 3: Get Connection String
1. On the project page, look for **"Connection String"** button (top right area)
   - OR look for **"Quick Start"** section
   - There should be a field that says something like "Connection string" or "Postgres"

2. You'll see a dropdown that says "Role: postgres" or similar
3. Make sure it's set to: **"neondb_owner"** role
4. Make sure database is: **"neondb"**

## STEP 4: Copy the String
The connection string should look like:
```
postgresql://neondb_owner:npg_XXXXXXXXXXXXXX@ep-XXXXX-XXXX.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**⚠️ IMPORTANT**: Add this parameter at the end:
```
&channel_binding=require
```

So it becomes:
```
postgresql://neondb_owner:npg_XXXXXXXXXXXXXX@ep-XXXXX-XXXX.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## STEP 5: Add to .env.local File
1. Open VS Code
2. In your project, create or edit `.env.local` file
3. Add this line:
```
DATABASE_URL=postgresql://neondb_owner:npg_XXXXXXXXXXXXXX@ep-XXXXX-XXXX.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

(Replace with your actual string from Neon)

## STEP 6: Add Other Required Keys
In the same `.env.local`, also add:
```
ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_FROM_CONSOLE_ANTHROPIC_COM
GROQ_API_KEY=gsk_YOUR_KEY_FROM_CONSOLE_GROQ_COM
JWT_SECRET=your_random_64_character_secret_string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## STEP 7: Run Migration
In terminal:
```powershell
npm run migrate
```

You should see:
```
✅ Column 'city' added successfully
✅ Column 'roof_size' added successfully
✅ Column 'energy_needs' added successfully
✅ Column 'additional_info' added successfully

✅ Migration completed successfully!
```

## STEP 8: Start Dev Server
```powershell
npm run dev
```

You should see:
```
- ready started server on 0.0.0.0:3000
```

## STEP 9: Test It
1. Go to http://localhost:3000
2. Login/Register
3. Try storing user information
4. Start a new chat - info should be remembered!

---

## TROUBLESHOOTING

### "Cannot find CONNECTION STRING"
Look at the Neon dashboard:
- Top left: Should show your project
- Top right: Look for button with "Connection" or settings icon
- Click it to reveal the PostgreSQL connection string

### "DATABASE_URL still not working"
1. Make sure you copied the ENTIRE string
2. Make sure BOTH slashes at start: `postgresql://`
3. Make sure the password part doesn't have special characters escaped
4. Restart your terminal after editing .env.local
5. Try: `npm run dev` again

### "Still getting column error"
Run this in Neon SQL Editor manually:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS roof_size VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS energy_needs VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS additional_info TEXT;
```

---

## NEED SCREENSHOTS?

If you can't find CONNECTION STRING in Neon:
1. Go to https://console.neon.tech
2. Click on your project name
3. Go to "Connection Pooling" or "Connection"
4. You should see a "Connection string" section
5. Select role: "neondb_owner"
6. Copy the full connection string

---

**Let me know when you have your DATABASE_URL and I'll help you test it!** 🚀
