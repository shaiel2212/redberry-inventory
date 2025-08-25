-- הוספת עמודת תמונת הזמנה מקורי לטבלת המכירות
ALTER TABLE sales ADD COLUMN order_form_image VARCHAR(500) NULL COMMENT 'URL לתמונת טופס הזמנה מקורי';

-- הוספת אינדקס לשיפור ביצועים
CREATE INDEX idx_sales_order_form_image ON sales(order_form_image);

-- עדכון הערות על הטבלה
ALTER TABLE sales COMMENT = 'טבלת מכירות כולל תמונות טופסי הזמנה מקוריים'; 