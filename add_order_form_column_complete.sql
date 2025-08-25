-- =====================================================
-- הוספת עמודת תמונת הזמנה מקורי לטבלת המכירות
-- =====================================================

-- בדיקה אם העמודה כבר קיימת
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'sales' 
    AND COLUMN_NAME = 'order_form_image'
);

-- הוספת העמודה רק אם היא לא קיימת
SET @sql = IF(
  @column_exists = 0,
  'ALTER TABLE sales ADD COLUMN order_form_image VARCHAR(500) NULL COMMENT "URL לתמונת טופס הזמנה מקורי"',
  'SELECT "Column order_form_image already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- הוספת אינדקס לשיפור ביצועים (רק אם לא קיים)
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'sales' 
    AND INDEX_NAME = 'idx_sales_order_form_image'
);

SET @sql_index = IF(
  @index_exists = 0,
  'CREATE INDEX idx_sales_order_form_image ON sales(order_form_image)',
  'SELECT "Index idx_sales_order_form_image already exists" as message'
);

PREPARE stmt_index FROM @sql_index;
EXECUTE stmt_index;
DEALLOCATE PREPARE stmt_index;

-- עדכון הערות על הטבלה
ALTER TABLE sales COMMENT = 'טבלת מכירות כולל תמונות טופסי הזמנה מקוריים';

-- בדיקה שהעמודה נוספה בהצלחה
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'sales' 
  AND COLUMN_NAME = 'order_form_image';

-- הצגת מבנה הטבלה המעודכן
DESCRIBE sales;

-- בדיקת הקשרים הקיימים
SELECT 
  CONSTRAINT_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'sales';

-- הוספת הערות על העמודה החדשה
COMMENT ON COLUMN sales.order_form_image IS 'URL לתמונת טופס הזמנה מקורי - שמור ב-Cloudinary';

-- הצגת הודעת סיום
SELECT '✅ עמודת order_form_image נוספה בהצלחה לטבלת sales' as status_message; 