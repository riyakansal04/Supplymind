import React, { useState, useEffect, useRef } from 'react';
import { Printer, Plus, Trash2, ShoppingCart, X, Search } from 'lucide-react';

const BillingSystem = () => {
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const [loading, setLoading] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [billData, setBillData] = useState(null);

  // New category modal
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const API_URL = 'http://localhost:5000/api';

  const catRef = useRef(null);
  const prodRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const filtered = allProducts.filter((p) => p.category === selectedCategory);
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  }, [selectedCategory, allProducts]);

  useEffect(() => {
    const onClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
      }
      if (prodRef.current && !prodRef.current.contains(e.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      if (data.success) {
        setAllProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Filter categories based on search
  const getFilteredCategories = () => {
    if (!categorySearch) return categories;
    return categories.filter((cat) => cat.toLowerCase().includes(categorySearch.toLowerCase()));
  };

  // Filter products based on search
  const getFilteredProductsList = () => {
    if (!productSearch) return filteredProducts;
    return filteredProducts.filter(
      (p) =>
        p.product_name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.brand.toLowerCase().includes(productSearch.toLowerCase())
    );
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCategorySearch(category);
    setShowCategoryDropdown(false);
    setProductSearch('');
  };

  const handleProductSelect = (product) => {
    addToCart(product);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const addToCart = (product) => {
    const existing = cartItems.find((item) => item.product_id === product.product_id);

    if (existing) {
      if (existing.quantity >= product.current_quantity) {
        alert(`Only ${product.current_quantity} units available!`);
        return;
      }
      setCartItems(
        cartItems.map((item) =>
          item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      if (product.current_quantity <= 0) {
        alert('Product out of stock!');
        return;
      }
      setCartItems([
        ...cartItems,
        {
          product_id: product.product_id,
          product_name: product.product_name,
          brand: product.brand,
          category: product.category,
          price: product.selling_price,
          quantity: 1,
          max_quantity: product.current_quantity,
        },
      ]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    const item = cartItems.find((i) => i.product_id === productId);
    if (!item) return;
    if (newQuantity > item.max_quantity) {
      alert(`Only ${item.max_quantity} units available!`);
      return;
    }
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(
      cartItems.map((i) => (i.product_id === productId ? { ...i, quantity: newQuantity } : i))
    );
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter((item) => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const validateForm = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty! Add products first.');
      return false;
    }
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return false;
    }
    if (!customerPhone.trim() || customerPhone.length < 10) {
      alert('Please enter valid phone number (10 digits)');
      return false;
    }
    return true;
  };

  const generateBill = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Record each sale
      for (const item of cartItems) {
        await fetch(`${API_URL}/products/${item.product_id}/sale`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: item.quantity }),
        });
      }

      // Create bill data
      const billNumber = `BILL-${Date.now()}`;
      const billInfo = {
        bill_number: billNumber,
        date: new Date().toLocaleString('en-IN'),
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_method: paymentMethod,
        items: cartItems,
        total_amount: calculateTotal(),
        success: true,
      };

      // Save bill to localStorage for history
      const existingBills = JSON.parse(localStorage.getItem('bills') || '[]');
      existingBills.push(billInfo);
      localStorage.setItem('bills', JSON.stringify(existingBills));

      setBillData(billInfo);
      setShowBill(true);

      // Clear form
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('Cash');
      setSelectedCategory('');
      setCategorySearch('');
      setProductSearch('');

      alert('Sale completed successfully! ✅');
    } catch (error) {
      console.error('Billing error:', error);
      alert('Failed to complete sale: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const printBill = () => {
    window.print();
  };

  const addNewCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Please enter category name');
      return;
    }

    // Add to categories list (local UI add — server add can be wired here if you expose an endpoint)
    if (!categories.includes(newCategoryName)) {
      setCategories([...categories, newCategoryName]);
      alert(`Category "${newCategoryName}" added! You can now add products to it.`);
    } else {
      alert('Category already exists!');
    }

    setNewCategoryName('');
    setShowNewCategoryModal(false);
  };

  // Inject simple print styles
  const PrintStyles = () => (
    <style>{`
      @media print {
        body * { visibility: hidden; }
        #bill-wrapper, #bill-wrapper * { visibility: visible; }
        #bill-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
      }
    `}</style>
  );

  if (showBill && billData) {
    return (
      <div id="bill-wrapper" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        <PrintStyles />
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            onClick={() => setShowBill(false)}
            style={{
              padding: '10px 20px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
            }}
          >
            <X size={20} /> Back to Billing
          </button>
          <button
            onClick={printBill}
            style={{
              padding: '10px 20px',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
            }}
          >
            <Printer size={20} /> Print Bill
          </button>
        </div>

        <div
          id="bill-content"
          style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ textAlign: 'center', borderBottom: '2px solid #4f46e5', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '32px', margin: '0 0 10px 0', color: '#4f46e5' }}>📦 SupplyMind</h1>
            <p style={{ margin: '5px 0', color: '#666' }}>AI-Powered Inventory Management</p>
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#999' }}>Invoice #{billData.bill_number}</p>
          </div>

          <div style={{ margin: '30px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  <strong>Customer:</strong> {billData.customer_name}
                </p>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  <strong>Phone:</strong> {billData.customer_phone}
                </p>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  <strong>Payment:</strong> {billData.payment_method}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  <strong>Date:</strong> {billData.date}
                </p>
              </div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #4f46e5' }}>Item</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #4f46e5' }}>Qty</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #4f46e5' }}>Price</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #4f46e5' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {billData.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <strong>{item.product_name}</strong>
                    <br />
                    <small style={{ color: '#666' }}>{item.brand}</small>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    ₹{Number(item.price).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                    ₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={3}
                  style={{
                    padding: '16px',
                    textAlign: 'right',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    borderTop: '2px solid #4f46e5',
                  }}
                >
                  TOTAL:
                </td>
                <td
                  style={{
                    padding: '16px',
                    textAlign: 'right',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#4f46e5',
                    borderTop: '2px solid #4f46e5',
                  }}
                >
                  ₹{Number(billData.total_amount).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div
            style={{
              marginTop: '50px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb',
              textAlign: 'center',
              color: '#666',
            }}
          >
            <p style={{ margin: '5px 0' }}>Thank you for your business!</p>
            <p style={{ margin: '5px 0', fontSize: '12px' }}>This is a computer-generated invoice.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
        {/* Left Side - Billing Form */}
        <div>
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px',
            }}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontFamily: 'Inter, sans-serif' }}>
              👤 Customer Details
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Online">Online Transfer</option>
                </select>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px', fontFamily: 'Inter, sans-serif' }}>📦 Select Products</h2>
              <button
                onClick={() => setShowNewCategoryModal(true)}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                + New Category
              </button>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              {/* Category Search */}
              <div style={{ position: 'relative' }} ref={catRef}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Category
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => {
                      setCategorySearch(e.target.value);
                      setShowCategoryDropdown(true);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    placeholder="Type to search categories..."
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                  <Search
                    size={20}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                    }}
                  />
                </div>

                {showCategoryDropdown && getFilteredCategories().length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      marginTop: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    {getFilteredCategories().map((cat, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleCategorySelect(cat)}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Search */}
              <div style={{ position: 'relative' }} ref={prodRef}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Product
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    placeholder={selectedCategory ? 'Type to search products...' : 'Select category first'}
                    disabled={!selectedCategory}
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 12px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontFamily: 'Inter, sans-serif',
                      background: selectedCategory ? 'white' : '#f9fafb',
                    }}
                  />
                  <Search
                    size={20}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                    }}
                  />
                </div>

                {showProductDropdown && selectedCategory && getFilteredProductsList().length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      marginTop: '4px',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      zIndex: 10,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    {getFilteredProductsList().map((product, idx) => (
                      <div
                        key={idx}
                        onClick={() => product.current_quantity > 0 && handleProductSelect(product)}
                        style={{
                          padding: '12px',
                          cursor: product.current_quantity > 0 ? 'pointer' : 'not-allowed',
                          borderBottom: '1px solid #f3f4f6',
                          fontFamily: 'Inter, sans-serif',
                          opacity: product.current_quantity > 0 ? 1 : 0.5,
                        }}
                        onMouseEnter={(e) => {
                          if (product.current_quantity > 0) {
                            e.currentTarget.style.background = '#f3f4f6';
                          }
                        }}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '600' }}>{product.product_name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{product.brand}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '700', color: '#4f46e5' }}>₹{product.selling_price}</div>
                            <div
                              style={{
                                fontSize: '11px',
                                color: product.current_quantity > 0 ? '#10b981' : '#ef4444',
                                fontWeight: '600',
                              }}
                            >
                              {product.current_quantity > 0
                                ? `${product.current_quantity} in stock`
                                : 'Out of stock'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Cart */}
        <div>
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              position: 'sticky',
              top: '20px',
            }}
          >
            <h2
              style={{
                margin: '0 0 20px 0',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <ShoppingCart size={24} /> Cart ({cartItems.length})
            </h2>

            <div style={{ marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <ShoppingCart size={48} style={{ opacity: 0.3 }} />
                  <p style={{ marginTop: '10px' }}>Cart is empty</p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.product_id}
                    style={{
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.product_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{item.brand}</div>
                        <div style={{ fontSize: '14px', color: '#4f46e5', fontWeight: '600', marginTop: '4px' }}>
                          ₹{item.price} × {item.quantity} = ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        style={{
                          padding: '4px 12px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 0)}
                        style={{
                          width: '60px',
                          padding: '4px',
                          textAlign: 'center',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                        }}
                        min={1}
                        max={item.max_quantity}
                      />
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        style={{
                          padding: '4px 12px',
                          background: '#f3f4f6',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                padding: '16px 0',
                borderTop: '2px solid #e5e7eb',
                borderBottom: '2px solid #e5e7eb',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#4f46e5',
                }}
              >
                <span>TOTAL:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={generateBill}
              disabled={cartItems.length === 0 || loading}
              style={{
                width: '100%',
                padding: '14px',
                background: cartItems.length === 0 ? '#d1d5db' : '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <Printer size={20} />
                  Complete Sale & Generate Bill
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              width: '400px',
              maxWidth: '90%',
            }}
          >
            <h3 style={{ margin: '0 0 20px 0', fontFamily: 'Inter, sans-serif' }}>Add New Category</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '15px',
                marginBottom: '20px',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={addNewCategory}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Add Category
              </button>
              <button
                onClick={() => {
                  setShowNewCategoryModal(false);
                  setNewCategoryName('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSystem;
