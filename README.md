# 🛏️ Inventory Management App – Redberry

אפליקציית ניהול מלאי ומכירות לחנות רהיטים.

## 🔧 טכנולוגיות
- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MySQL
- **Authentication**: JWT (with role-based access)

## 🧪 יכולות
- ניהול משתמשים והרשאות
- ניהול מוצרים (CRUD)
- ביצוע מכירות ועדכון מלאי
- דוחות מלאי, מכירות, ומלאים נמוכים
- טפסים עם הודעות שגיאה, הצלחה וטעינה

## ▶️ הרצת הפרויקט מקומית

### 1. הרצת צד שרת

```bash
cd server
npm install
npm run dev
```

> ודא שיש קובץ `.env` עם:
```
PORT=5001
JWT_SECRET=some_secret_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_db_name
```

### 2. הרצת צד לקוח

```bash
cd client
npm install
npm start
```

## 🔐 משתמשים לדוגמה
- Admin: `admin / Admin1234`
- User: `user / User1234`

## 🛰️ פריסה
הפרויקט מוכן לפריסה על [Render.com](https://render.com).

## 📸 תמונות מסך
תוסיפו כאן תמונות של לוח הבקרה, ניהול מוצרים, ביצוע מכירה ועוד...

---

© Redberry Furniture Inventory System