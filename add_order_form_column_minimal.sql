-- =====================================================
-- הוספת עמודת תמונת הזמנה מקורי לטבלת המכירות
-- גרסה מינימלית - עובדת בכל גרסה של MySQL
-- =====================================================

-- הוספת העמודה החדשה
ALTER TABLE sales 
ADD COLUMN order_form_image VARCHAR(500) NULL;

-- הוספת אינדקס לשיפור ביצועים
CREATE INDEX idx_sales_order_form_image ON sales(order_form_image);

-- הצגת הודעת סיום
SELECT '✅ עמודת order_form_image נוספה בהצלחה' as message; 