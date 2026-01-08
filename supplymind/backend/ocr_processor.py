"""OCR Module for Invoice Processing"""
import cv2
import pytesseract
import re
from PIL import Image
import numpy as np

# Set Tesseract path (Windows)
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class OCRProcessor:
    """Extract data from invoice images"""
    
    def __init__(self):
        self.supported_formats = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
    
    def preprocess_image(self, image_path):
        """Preprocess image for better OCR"""
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                return None
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply thresholding
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Denoise
            denoised = cv2.fastNlMeansDenoising(thresh, None, 10, 7, 21)
            
            return denoised
        except Exception as e:
            print(f"Preprocessing error: {e}")
            return None
    
    def extract_text(self, image_path):
        """Extract text from invoice"""
        try:
            processed_img = self.preprocess_image(image_path)
            if processed_img is None:
                return None
            
            # OCR with Tesseract
            text = pytesseract.image_to_string(processed_img, config='--psm 6')
            return text
        except Exception as e:
            print(f"OCR error: {e}")
            return None
    
    def parse_invoice(self, text):
        """Parse invoice text to extract products"""
        if not text:
            return []
        
        products = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Try to extract product, quantity, and price
            # Format: Product Name | Brand | Quantity | Price
            parts = re.split(r'[|,\t]', line)
            
            if len(parts) >= 3:
                try:
                    product_info = {
                        'product_name': parts[0].strip(),
                        'brand': parts[1].strip() if len(parts) > 1 else 'Unknown',
                        'quantity': self._extract_number(parts[-2]),
                        'price': self._extract_price(parts[-1])
                    }
                    
                    if product_info['quantity'] and product_info['price']:
                        products.append(product_info)
                except:
                    continue
        
        return products
    
    def _extract_number(self, text):
        """Extract number from text"""
        match = re.search(r'\d+', text)
        return int(match.group()) if match else None
    
    def _extract_price(self, text):
        """Extract price from text"""
        match = re.search(r'[\d,]+\.?\d*', text.replace(',', ''))
        return float(match.group()) if match else None
    
    def process_invoice(self, image_path, category='General'):
        """Complete invoice processing"""
        text = self.extract_text(image_path)
        if not text:
            return None, "Failed to extract text from image"
        
        products = self.parse_invoice(text)
        if not products:
            return None, "No products found in invoice"
        
        # Add category to all products
        for p in products:
            p['category'] = category
        
        return products, f"Extracted {len(products)} products"
    
    def manual_entry_to_dict(self, product_name, brand, category, 
                            purchase_price, selling_price, quantity):
        """Convert manual entry to product dict"""
        return {
            'product_name': product_name,
            'brand': brand,
            'category': category,
            'purchase_price': float(purchase_price),
            'selling_price': float(selling_price),
            'quantity': int(quantity)
        }