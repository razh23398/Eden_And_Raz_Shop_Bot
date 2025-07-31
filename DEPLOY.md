# 🚀 בוט טלגרם לניהול הוצאות - הפעלה בענן

## 🌐 פריסה ל-Railway (חינם)

### שלב 1: הכנת הקוד
הקוד כבר מוכן! יש:
- ✅ `package.json` מוגדר נכון
- ✅ `Procfile` ליידוי
- ✅ `start` script

### שלב 2: הרשמה ל-Railway
1. כנס ל: **https://railway.app/**
2. לחץ **"Start a New Project"**
3. בחר **"Deploy from GitHub repo"**

### שלב 3: העלאת הקוד ל-GitHub
```bash
# אם אין לך GitHub repo:
git init
git add .
git commit -m "Telegram expense bot"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/expense-bot.git
git push -u origin main
```

### שלב 4: פריסה ב-Railway
1. בחר את הריפו שלך
2. Railway יבנה אוטומטית
3. הוסף משתני סביבה:
   - `TELEGRAM_TOKEN`
   - `SHEET_ID` 
   - `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`

### שלב 5: ✅ הבוט רץ 24/7!

---

## 🚀 אלטרנטיבה: Render

### הרשמה ופריסה:
1. **https://render.com/**
2. **"New Web Service"**
3. חבר GitHub
4. `Build Command`: `npm install`
5. `Start Command`: `npm start`
6. הוסף משתני סביבה
7. Deploy!

---

## 💰 עלויות:
- **Railway**: 500 שעות חינם = ~20 ימים מלאים
- **Render**: 750 שעות חינם = ~31 ימים מלאים  
- **Heroku**: 550-1000 שעות, אבל נרדם

## 🎯 המלצה:
**Railway או Render** - שניהם מעולים לבוטים של טלגרם!
