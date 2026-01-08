# SupplyMind  
**An AI-Driven Retail Inventory Forecasting and Alert Management System**

---

## What This Project Does

SupplyMind is an end-to-end AI-based system that automates retail inventory management by combining OCR-based invoice processing, deep learning demand forecasting, and real-time inventory alerts.  
The system helps retailers reduce stockouts, overstocking, and manual data errors while improving decision-making efficiency.

---

## Framework Overview

SupplyMind follows a modular pipeline:

1. **Invoice Data Extraction**  
   OCR is used to convert invoice images into structured digital data.

2. **Data Preprocessing**  
   Cleaning, normalization, and structuring of multi-category time-series data.

3. **Demand Forecasting**  
   Deep learning model predicts daily and weekly product demand.

4. **Alert Generation**  
   Intelligent logic detects stockout risks, overstock conditions, and demand spikes.

5. **Dashboard & APIs**  
   Real-time visualization and backend integration using REST APIs.

---

## Dataset Used

- Retail inventory and sales data extracted from invoices  
- Multi-category time-series records  
- Preprocessed to handle missing values, irregular intervals, and inconsistencies  

---

## Models & Methods (High-Level)

- **Forecasting Model:** N-BEATS (Neural Basis Expansion Analysis for Time Series)
- **OCR:** Tesseract OCR with OpenCV-based image preprocessing
- **Backend:** Flask APIs with SQLite database
- **Frontend:** HTML, CSS, JavaScript, Tailwind CSS
- **Visualization:** Chart.js
- **Data Processing:** Python, Pandas, NumPy

---

## Results

### AI Forecasting Output
Demand forecasts generated for multiple product categories with improved accuracy.

![AI Forecasting Screen](results/ai_forecasting.png)

---

### Inventory Dashboard
Real-time visualization of inventory health, forecasts, and alerts.

![Dashboard Screen](results/dashboard.png)

---

### Alerts & Notifications
Automatic detection of stockout risks, overstock conditions, and abnormal demand.

![Alerts Module](results/alerts.png)

---

## How to Run (Optional)

1. Clone the repository  
2. Install required Python dependencies  
3. Run the Flask backend  
4. Access the dashboard via browser  

(Exact setup depends on deployment environment.)

---

## Author

**Riya Kansal**  
B.Tech Computer Science & Engineering  
Amity School of Engineering & Technology  

---

## Citation

If you use or reference this project, please cite it as an academic or internship project developed at Amity School of Engineering & Technology.

---

