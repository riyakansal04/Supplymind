"""Database operations - ENHANCED VERSION with Category Support"""
import sqlite3
import pandas as pd
from datetime import datetime
import os
from config import DATABASE_PATH, DATA_DIR, CATEGORIES

class Database:
    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self.db_path = DATABASE_PATH
        self.conn = None
        self.init_db()
    
    def get_conn(self):
        """Get database connection"""
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row
        return self.conn
    
    def execute_query(self, query, params=None):
        """Execute a query and return results as list of dicts"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        if params:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        
        if query.strip().upper().startswith('SELECT'):
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        
        conn.commit()
        return None
    
    def init_db(self):
        """Initialize database with fixed schema"""
        conn = self.get_conn()
        c = conn.cursor()
        
        # Products table
        c.execute('''CREATE TABLE IF NOT EXISTS products (
            product_id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_name TEXT NOT NULL,
            brand TEXT NOT NULL,
            category TEXT NOT NULL,
            purchase_price REAL NOT NULL,
            selling_price REAL NOT NULL,
            current_quantity INTEGER DEFAULT 0,
            reorder_level INTEGER DEFAULT 50,
            max_stock_level INTEGER DEFAULT 500,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(product_name, brand)
        )''')
        
        # Drop old sales table if exists and recreate
        c.execute("DROP TABLE IF EXISTS sales")
        c.execute('''CREATE TABLE sales (
            sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            quantity_sold INTEGER,
            sale_date DATE,
            selling_price REAL,
            revenue REAL,
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        )''')
        
        # Transactions table
        c.execute('''CREATE TABLE IF NOT EXISTS transactions (
            transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            type TEXT,
            quantity INTEGER,
            transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT,
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        )''')
        
        # Alerts table
        c.execute('''CREATE TABLE IF NOT EXISTS alerts (
            alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            alert_type TEXT,
            severity TEXT,
            message TEXT,
            recommendation TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved INTEGER DEFAULT 0,
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        )''')
        
        # Forecasts table
        c.execute('''CREATE TABLE IF NOT EXISTS forecasts (
            forecast_id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            forecast_date DATE,
            predicted_demand REAL,
            lower_bound REAL,
            upper_bound REAL,
            accuracy REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        )''')
        
        # Suppliers table
        c.execute('''CREATE TABLE IF NOT EXISTS suppliers (
            supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_name TEXT NOT NULL,
            contact_person TEXT,
            phone TEXT,
            email TEXT,
            address TEXT,
            payment_terms TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')
        
        conn.commit()
        print("✅ Database initialized")
    
    def get_categories(self):
        """Get all unique categories from products"""
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('SELECT DISTINCT category FROM products ORDER BY category')
        categories = [row[0] for row in c.fetchall()]
        return categories
    
    def add_product(self, product_name, brand, category, purchase_price, selling_price, initial_quantity=0):
        """Add new product or update existing one"""
        conn = self.get_conn()
        c = conn.cursor()
        
        thresholds = CATEGORIES.get(category, {'reorder_point': 50, 'max_stock': 500})
        
        # Check if product already exists
        c.execute('SELECT product_id, current_quantity FROM products WHERE product_name = ? AND brand = ?', 
                  (product_name, brand))
        existing = c.fetchone()
        
        if existing:
            # Update existing product
            product_id = existing[0]
            new_quantity = existing[1] + initial_quantity
            
            c.execute('''UPDATE products 
                SET purchase_price = ?, 
                    selling_price = ?, 
                    current_quantity = ?,
                    category = ?,
                    reorder_level = ?,
                    max_stock_level = ?
                WHERE product_id = ?''',
                (purchase_price, selling_price, new_quantity, category,
                 thresholds['reorder_point'], thresholds['max_stock'], product_id))
            
            if initial_quantity > 0:
                c.execute('''INSERT INTO transactions (product_id, type, quantity, notes)
                    VALUES (?, 'restock', ?, 'Product restocked')''', (product_id, initial_quantity))
            
            conn.commit()
            print(f"✅ Updated existing product: {product_name} ({brand})")
            return product_id
        else:
            # Insert new product
            c.execute('''INSERT INTO products 
                (product_name, brand, category, purchase_price, selling_price, 
                 current_quantity, reorder_level, max_stock_level)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                (product_name, brand, category, purchase_price, selling_price, 
                 initial_quantity, thresholds['reorder_point'], thresholds['max_stock']))
            
            pid = c.lastrowid
            
            if initial_quantity > 0:
                c.execute('''INSERT INTO transactions (product_id, type, quantity, notes)
                    VALUES (?, 'initial', ?, 'Initial stock')''', (pid, initial_quantity))
            
            conn.commit()
            print(f"✅ Added new product: {product_name} ({brand})")
            return pid
    
    def get_all_products(self):
        """Get all products as list of dicts"""
        query = 'SELECT * FROM products ORDER BY category, product_name'
        return self.execute_query(query)
    
    def get_product(self, product_id):
        """Get single product"""
        query = 'SELECT * FROM products WHERE product_id = ?'
        results = self.execute_query(query, (product_id,))
        return results[0] if results else None
    
    def get_products_by_category(self, category):
        """Get products by category"""
        query = 'SELECT * FROM products WHERE category = ? ORDER BY product_name'
        return self.execute_query(query, (category,))
    
    def update_quantity(self, product_id, quantity_change, trans_type, notes=''):
        """Update product quantity"""
        conn = self.get_conn()
        c = conn.cursor()
        
        c.execute('''UPDATE products SET current_quantity = current_quantity + ?
            WHERE product_id = ?''', (quantity_change, product_id))
        
        c.execute('''INSERT INTO transactions (product_id, type, quantity, notes)
            VALUES (?, ?, ?, ?)''', (product_id, trans_type, quantity_change, notes))
        
        conn.commit()
    
    def record_purchase(self, product_id, quantity, notes=''):
        """Record purchase (add stock)"""
        self.update_quantity(product_id, quantity, 'purchase', notes)
    
    def record_sale(self, product_id, quantity, sale_date=None):
        """Record sale and update quantity"""
        if not sale_date:
            sale_date = datetime.now().strftime('%Y-%m-%d')
        
        conn = self.get_conn()
        c = conn.cursor()
        
        # Get current product info
        c.execute('SELECT selling_price, current_quantity FROM products WHERE product_id=?', 
                  (product_id,))
        result = c.fetchone()
        
        if not result:
            raise ValueError("Product not found")
        
        selling_price = result[0]
        current = result[1]
        
        if current < quantity:
            raise ValueError(f"Insufficient stock: {current} available, {quantity} requested")
        
        revenue = selling_price * quantity
        
        # Insert into sales
        c.execute('''INSERT INTO sales (product_id, quantity_sold, sale_date, selling_price, revenue)
            VALUES (?, ?, ?, ?, ?)''', 
            (product_id, quantity, sale_date, selling_price, revenue))
        
        # Update product quantity
        c.execute('''UPDATE products SET current_quantity = current_quantity - ?
            WHERE product_id = ?''', (quantity, product_id))
        
        # Record transaction
        c.execute('''INSERT INTO transactions (product_id, type, quantity, notes)
            VALUES (?, 'sale', ?, ?)''', (product_id, -quantity, f'Sale on {sale_date}'))
        
        conn.commit()
    
    def record_bulk_sale(self, items):
        """Record multiple items sale at once"""
        sale_date = datetime.now().strftime('%Y-%m-%d')
        conn = self.get_conn()
        
        for item in items:
            self.record_sale(item['product_id'], item['quantity'], sale_date)
        
        conn.commit()
        return sale_date
    
    def get_products(self, product_id=None):
        """Get products DataFrame for compatibility"""
        conn = self.get_conn()
        query = 'SELECT * FROM products'
        params = ()
        
        if product_id:
            query += ' WHERE product_id = ?'
            params = (product_id,)
        
        df = pd.read_sql_query(query, conn, params=params)
        return df
    
    def get_sales(self, product_id=None, days=90):
        """Get sales history DataFrame"""
        conn = self.get_conn()
        
        if product_id:
            query = '''SELECT s.*, p.product_name, p.category 
                FROM sales s JOIN products p ON s.product_id = p.product_id
                WHERE s.product_id = ? AND s.sale_date >= date('now', '-' || ? || ' days')
                ORDER BY s.sale_date'''
            df = pd.read_sql_query(query, conn, params=(product_id, days))
        else:
            query = '''SELECT s.*, p.product_name, p.category 
                FROM sales s JOIN products p ON s.product_id = p.product_id
                WHERE s.sale_date >= date('now', '-' || ? || ' days')
                ORDER BY s.sale_date'''
            df = pd.read_sql_query(query, conn, params=(days,))
        
        return df
    
    def save_forecast(self, product_id, forecasts, accuracy):
        """Save forecast results"""
        conn = self.get_conn()
        c = conn.cursor()
        
        c.execute('DELETE FROM forecasts WHERE product_id = ?', (product_id,))
        
        for f in forecasts:
            c.execute('''INSERT INTO forecasts 
                (product_id, forecast_date, predicted_demand, lower_bound, upper_bound, accuracy)
                VALUES (?, ?, ?, ?, ?, ?)''',
                (product_id, f['date'], f['demand'], f['lower'], f['upper'], accuracy))
        
        conn.commit()
    
    def get_forecasts(self, product_id):
        """Get saved forecasts DataFrame"""
        conn = self.get_conn()
        df = pd.read_sql_query(
            'SELECT * FROM forecasts WHERE product_id = ? ORDER BY forecast_date',
            conn, params=(product_id,))
        return df
    
    def create_alert(self, product_id, alert_type, severity, message, recommendation):
        """Create alert"""
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('''INSERT INTO alerts 
            (product_id, alert_type, severity, message, recommendation)
            VALUES (?, ?, ?, ?, ?)''',
            (product_id, alert_type, severity, message, recommendation))
        conn.commit()
    
    def get_stats(self):
        """Dashboard stats"""
        conn = self.get_conn()
        c = conn.cursor()
        
        stats = {}
        c.execute('SELECT COUNT(*) FROM products')
        stats['total_products'] = c.fetchone()[0]
        
        c.execute('''SELECT SUM(current_quantity * purchase_price) FROM products''')
        stats['inventory_value'] = c.fetchone()[0] or 0
        
        c.execute('SELECT COUNT(*) FROM alerts WHERE resolved = 0')
        stats['active_alerts'] = c.fetchone()[0]
        
        c.execute('''SELECT SUM(revenue) FROM sales 
            WHERE sale_date >= date('now', '-30 days')''')
        stats['monthly_revenue'] = c.fetchone()[0] or 0
        
        return stats
    
    def add_supplier(self, supplier_name, contact_person='', phone='', email='', address='', payment_terms=''):
        """Add new supplier"""
        conn = self.get_conn()
        c = conn.cursor()
        
        c.execute('''INSERT INTO suppliers 
            (supplier_name, contact_person, phone, email, address, payment_terms)
            VALUES (?, ?, ?, ?, ?, ?)''',
            (supplier_name, contact_person, phone, email, address, payment_terms))
        
        supplier_id = c.lastrowid
        conn.commit()
        return supplier_id
    
    def get_suppliers(self, supplier_id=None):
        """Get suppliers"""
        if supplier_id:
            query = 'SELECT * FROM suppliers WHERE supplier_id = ? ORDER BY supplier_name'
            return self.execute_query(query, (supplier_id,))
        else:
            query = 'SELECT * FROM suppliers ORDER BY supplier_name'
            return self.execute_query(query)
    
    def delete_supplier(self, supplier_id):
        """Delete supplier"""
        conn = self.get_conn()
        c = conn.cursor()
        c.execute('DELETE FROM suppliers WHERE supplier_id = ?', (supplier_id,))
        conn.commit()
    
    def __del__(self):
        """Close connection on cleanup"""
        if self.conn:
            self.conn.close()