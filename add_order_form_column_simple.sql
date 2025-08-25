-- =====================================================
-- הוספת עמודת תמונת הזמנה מקורי לטבלת המכירות
-- גרסה פשוטה ל-MySQL
-- =====================================================

-- הוספת העמודה החדשה
ALTER TABLE sales 
ADD COLUMN order_form_image VARCHAR(500) NULL 
COMMENT 'URL לתמונת טופס הזמנה מקורי - שמור ב-Cloudinary';

-- הוספת אינדקס לשיפור ביצועים
CREATE INDEX idx_sales_order_form_image ON sales(order_form_image);

-- עדכון הערות על הטבלה
ALTER TABLE sales COMMENT = 'טבלת מכירות כולל תמונות טופסי הזמנה מקוריים';

-- בדיקה שהעמודה נוספה בהצלחה
SHOW COLUMNS FROM sales LIKE 'order_form_image';

-- הצגת מבנה הטבלה המעודכן
DESCRIBE sales;

-- הצגת הודעת סיום
SELECT '✅ עמודת order_form_image נוספה בהצלחה לטבלת sales' as status_message; 