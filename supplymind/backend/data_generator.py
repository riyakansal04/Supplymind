"""Generate sample data for demonstration"""
import random
import numpy as np
from datetime import datetime, timedelta

SAMPLE_PRODUCTS = [
    # Cosmetics
    {'name': 'Maybelline Lipstick Red Rouge', 'brand': 'Maybelline', 'cat': 'Cosmetics', 'buy': 150, 'sell': 250, 'qty': 120},
    {'name': 'Maybelline Lipstick Pink Blush', 'brand': 'Maybelline', 'cat': 'Cosmetics', 'buy': 150, 'sell': 250, 'qty': 85},
    {'name': 'Lakme Foundation Natural Beige', 'brand': 'Lakme', 'cat': 'Cosmetics', 'buy': 300, 'sell': 450, 'qty': 200},
    {'name': 'Lakme Foundation Ivory Glow', 'brand': 'Lakme', 'cat': 'Cosmetics', 'buy': 300, 'sell': 450, 'qty': 150},
    {'name': 'MAC Lipstick Ruby Woo', 'brand': 'MAC', 'cat': 'Cosmetics', 'buy': 800, 'sell': 1200, 'qty': 45},
    {'name': 'Loreal Mascara Voluminous Black', 'brand': 'Loreal', 'cat': 'Cosmetics', 'buy': 250, 'sell': 400, 'qty': 180},
    {'name': 'Revlon ColorStay Foundation', 'brand': 'Revlon', 'cat': 'Cosmetics', 'buy': 350, 'sell': 550, 'qty': 90},
    
    # Electronics
    {'name': 'Samsung Galaxy Buds Pro', 'brand': 'Samsung', 'cat': 'Electronics', 'buy': 3000, 'sell': 4500, 'qty': 65},
    {'name': 'Apple AirPods Pro 2', 'brand': 'Apple', 'cat': 'Electronics', 'buy': 15000, 'sell': 20000, 'qty': 30},
    {'name': 'JBL Flip 6 Bluetooth Speaker', 'brand': 'JBL', 'cat': 'Electronics', 'buy': 2000, 'sell': 3000, 'qty': 80},
    {'name': 'Sony WH-1000XM5 Headphones', 'brand': 'Sony', 'cat': 'Electronics', 'buy': 18000, 'sell': 25000, 'qty': 25},
    {'name': 'boAt Airdopes 131', 'brand': 'boAt', 'cat': 'Electronics', 'buy': 800, 'sell': 1299, 'qty': 150},
    
    # Clothing
    {'name': 'Levis 511 Slim Fit Jeans Blue', 'brand': 'Levis', 'cat': 'Clothing', 'buy': 1200, 'sell': 2000, 'qty': 95},
    {'name': 'Levis 501 Original Fit Black', 'brand': 'Levis', 'cat': 'Clothing', 'buy': 1200, 'sell': 2000, 'qty': 110},
    {'name': 'Nike Dri-FIT T-Shirt White', 'brand': 'Nike', 'cat': 'Clothing', 'buy': 500, 'sell': 899, 'qty': 200},
    {'name': 'Adidas Ultraboost Running Shoes', 'brand': 'Adidas', 'cat': 'Clothing', 'buy': 2500, 'sell': 4000, 'qty': 70},
    {'name': 'Puma Essentials Track Pants', 'brand': 'Puma', 'cat': 'Clothing', 'buy': 800, 'sell': 1299, 'qty': 140},
    {'name': 'Zara Casual Shirt', 'brand': 'Zara', 'cat': 'Clothing', 'buy': 600, 'sell': 999, 'qty': 85},
    
    # Food & Beverages
    {'name': 'Coca Cola 2 Liter', 'brand': 'Coca Cola', 'cat': 'Food & Beverages', 'buy': 60, 'sell': 90, 'qty': 500},
    {'name': 'Lays Classic Salted 50g', 'brand': 'Lays', 'cat': 'Food & Beverages', 'buy': 10, 'sell': 20, 'qty': 800},
    {'name': 'Cadbury Dairy Milk 55g', 'brand': 'Cadbury', 'cat': 'Food & Beverages', 'buy': 25, 'sell': 40, 'qty': 600},
    {'name': 'Nestle Maggi Masala Noodles', 'brand': 'Nestle', 'cat': 'Food & Beverages', 'buy': 12, 'sell': 20, 'qty': 900},
    {'name': 'Amul Taaza Toned Milk 1L', 'brand': 'Amul', 'cat': 'Food & Beverages', 'buy': 48, 'sell': 60, 'qty': 400},
    {'name': 'Britannia Good Day Cookies', 'brand': 'Britannia', 'cat': 'Food & Beverages', 'buy': 15, 'sell': 25, 'qty': 700},
    
    # Home & Kitchen
    {'name': 'Prestige Deluxe Pressure Cooker 5L', 'brand': 'Prestige', 'cat': 'Home & Kitchen', 'buy': 1200, 'sell': 1800, 'qty': 120},
    {'name': 'Milton Thermosteel Bottle 1L', 'brand': 'Milton', 'cat': 'Home & Kitchen', 'buy': 200, 'sell': 350, 'qty': 180},
    {'name': 'Hawkins Futura Non-Stick Frying Pan', 'brand': 'Hawkins', 'cat': 'Home & Kitchen', 'buy': 400, 'sell': 650, 'qty': 95},
    {'name': 'Pigeon Mixer Grinder', 'brand': 'Pigeon', 'cat': 'Home & Kitchen', 'buy': 1500, 'sell': 2299, 'qty': 60},
]

def initialize_sample_data(db):
    """Initialize database with sample products and sales history"""
    print("🔄 Initializing sample data...")
    
    product_ids = []
    
    # Add products
    for p in SAMPLE_PRODUCTS:
        pid = db.add_product(
            p['name'], p['brand'], p['cat'],
            p['buy'], p['sell'], p['qty']
        )
        product_ids.append(pid)
    
    print(f"✅ Added {len(product_ids)} products")
    
    # Generate 180 days of sales history
    print("🔄 Generating sales history...")
    end_date = datetime.now()
    
    for pid in product_ids:
        for day in range(180):
            date = (end_date - timedelta(days=180-day)).strftime('%Y-%m-%d')
            
            # Base demand with patterns
            base = random.randint(3, 15)
            
            # Weekend boost
            day_of_week = (end_date - timedelta(days=180-day)).weekday()
            if day_of_week >= 5:
                base = int(base * 1.4)
            
            # Month-end boost
            day_of_month = (end_date - timedelta(days=180-day)).day
            if day_of_month >= 25:
                base = int(base * 1.3)
            
            # Random variation
            quantity = max(1, int(np.random.normal(base, base * 0.2)))
            
            try:
                db.record_sale(pid, quantity, date)
            except:
                # Restock if needed
                db.update_quantity(pid, 100, 'restock', 'Automatic restock')
                try:
                    db.record_sale(pid, quantity, date)
                except:
                    pass
    
    print("✅ Sales history generated")
    print(f"✨ Sample data initialization complete!")
    return len(product_ids)