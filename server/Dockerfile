# השתמש ב-node הרשמי
FROM node:18

# צור תיקיית עבודה
WORKDIR /app

# העתק רק את תיקיית השרת
COPY server/ ./server

# העתק קובץ package.json והתקן תלויות
COPY server/package*.json ./server/
RUN cd server && npm install

# פתיחת פורט (שמשתנה לפי Railway)
EXPOSE 8080

# הפעלת השרת
CMD ["node", "server/server.js"]
