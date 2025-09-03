-- יצירת טבלת חשבוניות
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  invoice_number VARCHAR(20) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255) NOT NULL,
  customer_tax_id VARCHAR(20),
  total_amount DECIMAL(10,2) NOT NULL,
  vat_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'error') DEFAULT 'pending',
  pdf_path VARCHAR(500),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_sale_id (sale_id),
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- יצירת טבלת תעודות משלוח
CREATE TABLE IF NOT EXISTS shipping_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  shipping_number VARCHAR(20) NOT NULL UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  customer_address TEXT NOT NULL,
  customer_phone VARCHAR(20),
  customer_email VARCHAR(255) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'error') DEFAULT 'pending',
  pdf_path VARCHAR(500),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_sale_id (sale_id),
  INDEX idx_shipping_number (shipping_number),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- הוספת עמודות חדשות לטבלת לקוחות אם לא קיימות
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) AFTER phone,
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(20) AFTER email;

-- הוספת אינדקסים לטבלת לקוחות
ALTER TABLE clients 
ADD INDEX IF NOT EXISTS idx_email (email),
ADD INDEX IF NOT EXISTS tax_id (tax_id);

-- הוספת עמודות חדשות לטבלת מכירות אם לא קיימות
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS documents_generated BOOLEAN DEFAULT FALSE AFTER has_unsupplied_items,
ADD COLUMN IF NOT EXISTS documents_generated_at TIMESTAMP NULL AFTER documents_generated;

-- הוספת אינדקס לטבלת מכירות
ALTER TABLE sales 
ADD INDEX IF NOT EXISTS idx_documents_generated (documents_generated);

-- יצירת טבלת לוג פעולות (אופציונלי - לניטור)
CREATE TABLE IF NOT EXISTS document_generation_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  action_type ENUM('invoice_created', 'shipping_created', 'email_sent', 'error_occurred') NOT NULL,
  status ENUM('success', 'error') NOT NULL,
  message TEXT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_sale_id (sale_id),
  INDEX idx_action_type (action_type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- הכנסת נתונים לדוגמה (אופציונלי)
-- INSERT INTO invoices (sale_id, invoice_number, customer_name, customer_address, customer_phone, customer_email, total_amount, vat_amount, final_amount, status) VALUES
-- (1, 'I000001', 'לקוח לדוגמה', 'כתובת לדוגמה', '050-1234567', 'customer@example.com', 100.00, 17.00, 117.00, 'completed');

-- INSERT INTO shipping_notes (sale_id, shipping_number, customer_name, customer_address, customer_phone, customer_email, total_amount, status) VALUES
-- (1, 'SN000001', 'לקוח לדוגמה', 'כתובת לדוגמה', '050-1234567', 'customer@example.com', 100.00, 'completed'); 