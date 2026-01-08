"""Configuration settings for SupplyMind"""
import os

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, '..', 'data')
DATABASE_PATH = os.path.join(DATA_DIR, 'inventory.db')
INVOICE_DIR = os.path.join(DATA_DIR, 'invoices')

# Categories with thresholds
CATEGORIES = {
    'Cosmetics': {'min_stock': 50, 'max_stock': 500, 'reorder_point': 100},
    'Electronics': {'min_stock': 20, 'max_stock': 200, 'reorder_point': 50},
    'Clothing': {'min_stock': 30, 'max_stock': 300, 'reorder_point': 80},
    'Food & Beverages': {'min_stock': 100, 'max_stock': 1000, 'reorder_point': 200},
    'Home & Kitchen': {'min_stock': 40, 'max_stock': 400, 'reorder_point': 100},
    'Books & Stationery': {'min_stock': 50, 'max_stock': 500, 'reorder_point': 120},
    'Sports & Fitness': {'min_stock': 25, 'max_stock': 250, 'reorder_point': 60},
    'Toys & Games': {'min_stock': 30, 'max_stock': 300, 'reorder_point': 80},
    'Health & Wellness': {'min_stock': 60, 'max_stock': 600, 'reorder_point': 150},
    'Automotive': {'min_stock': 15, 'max_stock': 150, 'reorder_point': 40}
}

# N-BEATS Model Configuration
NBEATS_CONFIG = {
    'stack_types': ['trend', 'seasonality'],
    'num_blocks': [3, 3],
    'num_layers': 4,
    'layer_width': 512,
    'expansion_coefficient_dim': 5,
    'trend_polynomial_degree': 3,
    'prediction_length': 30,
    'context_length': 60,
    'batch_size': 32,
    'max_epochs': 100,
    'learning_rate': 0.001
}

# Forecasting settings
FORECAST_DAYS = 30
MIN_TRAINING_SAMPLES = 60
TARGET_ACCURACY = 0.90

# Alert thresholds
UNDERSTOCK_CRITICAL = 0.8  # 80% below reorder point
UNDERSTOCK_WARNING = 0.5   # 50% below reorder point
OVERSTOCK_WARNING = 0.8    # 80% of max stock

# API Configuration
API_HOST = '0.0.0.0'
API_PORT = 5000
DEBUG = True