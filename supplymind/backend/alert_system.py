"""Enhanced Alert System with AI-Powered Suggestions"""
import numpy as np
from config import UNDERSTOCK_CRITICAL, UNDERSTOCK_WARNING, OVERSTOCK_WARNING

class AlertSystem:
    """Generate intelligent stock alerts with AI forecasting suggestions"""
    
    def __init__(self, db):
        self.db = db
    
    def analyze_inventory(self):
        """Analyze all products and generate alerts with AI suggestions"""
        products = self.db.get_products()
        alerts = []
        
        for _, product in products.iterrows():
            product_alerts = self._check_product_with_forecast(product)
            alerts.extend(product_alerts)
        
        return alerts
    
    def _calculate_sales_velocity(self, product_id):
        """Calculate average daily sales velocity"""
        try:
            sales = self.db.get_sales(product_id, days=30)
            if len(sales) > 0:
                total_sold = sales['quantity_sold'].sum()
                days = len(sales['sale_date'].unique())
                return total_sold / days if days > 0 else 0
            return 0
        except:
            return 0
    
    def _check_product_with_forecast(self, product):
        """Check individual product with AI-powered suggestions"""
        alerts = []
        
        pid = product['product_id']
        name = product['product_name']
        current = product['current_quantity']
        reorder = product['reorder_level']
        max_stock = product['max_stock_level']
        category = product['category']
        purchase_price = product['purchase_price']
        selling_price = product['selling_price']
        
        # Calculate sales velocity
        velocity = self._calculate_sales_velocity(pid)
        days_of_stock = (current / velocity) if velocity > 0 else 999
        
        # Get 30-day forecast if available
        forecast_df = self.db.get_forecasts(pid)
        future_demand = 0
        if not forecast_df.empty:
            future_demand = forecast_df['predicted_demand'].sum()
        
        # === CRITICAL UNDERSTOCK ===
        if current <= reorder * UNDERSTOCK_CRITICAL:
            shortage = reorder - current
            
            # AI-powered suggestions
            if velocity > 0:
                # Based on sales velocity
                urgent_qty = int(velocity * 14)  # 2 weeks supply
                safe_qty = int(velocity * 30)     # 1 month supply
                
                suggestion = (
                    f"🚨 IMMEDIATE ACTION REQUIRED:\n"
                    f"• Current Stock: {current} units (CRITICALLY LOW)\n"
                    f"• Sales Velocity: {velocity:.1f} units/day\n"
                    f"• Days Until Stockout: {days_of_stock:.0f} days\n\n"
                    f"📦 ORDERING RECOMMENDATIONS:\n"
                    f"• Minimum Order: {urgent_qty} units (2-week supply)\n"
                    f"• Recommended Order: {safe_qty} units (1-month supply)\n"
                    f"• Cost: ₹{safe_qty * purchase_price:,.0f}\n\n"
                    f"⚡ ACTIONS:\n"
                    f"1. Place URGENT order with your supplier\n"
                    f"2. Consider expedited shipping\n"
                    f"3. Limit sales to prevent stockout\n"
                    f"4. Check with alternate suppliers"
                )
            else:
                suggestion = (
                    f"🚨 CRITICAL STOCK ALERT:\n"
                    f"• Order {shortage + 50} units immediately\n"
                    f"• Cost: ₹{(shortage + 50) * purchase_price:,.0f}\n"
                    f"• This will restore stock to reorder level + safety buffer"
                )
            
            alerts.append({
                'product_id': pid,
                'product_name': name,
                'type': 'understock',
                'severity': 'critical',
                'message': f'CRITICAL: {name} will run out in {days_of_stock:.0f} days!',
                'recommendation': suggestion,
                'current_stock': current,
                'reorder_level': reorder,
                'action_required': True
            })
            
            self.db.create_alert(pid, 'understock', 'critical',
                f'{name} critically low: {current} units',
                suggestion)
        
        # === WARNING UNDERSTOCK ===
        elif current <= reorder:
            shortage = reorder - current
            
            if velocity > 0:
                standard_qty = int(velocity * 21)  # 3 weeks supply
                optimal_qty = int(velocity * 30)    # 1 month supply
                
                suggestion = (
                    f"⚠️ LOW STOCK WARNING:\n"
                    f"• Current Stock: {current} units\n"
                    f"• Sales Velocity: {velocity:.1f} units/day\n"
                    f"• Days Remaining: {days_of_stock:.0f} days\n\n"
                    f"📦 SUGGESTED ORDERS:\n"
                    f"• Standard Order: {standard_qty} units (3-week supply)\n"
                    f"  Cost: ₹{standard_qty * purchase_price:,.0f}\n"
                    f"• Optimal Order: {optimal_qty} units (1-month supply)\n"
                    f"  Cost: ₹{optimal_qty * purchase_price:,.0f}\n\n"
                    f"💡 RECOMMENDATIONS:\n"
                    f"• Place order within 3-5 days\n"
                    f"• Expected profit margin: {((selling_price - purchase_price)/purchase_price*100):.1f}%\n"
                    f"• Monitor daily sales closely"
                )
            else:
                suggestion = (
                    f"⚠️ Stock below reorder point\n"
                    f"• Order {shortage + 30} units within next week\n"
                    f"• Cost: ₹{(shortage + 30) * purchase_price:,.0f}"
                )
            
            alerts.append({
                'product_id': pid,
                'product_name': name,
                'type': 'understock',
                'severity': 'warning',
                'message': f'WARNING: {name} stock running low',
                'recommendation': suggestion,
                'current_stock': current,
                'reorder_level': reorder,
                'action_required': True
            })
            
            self.db.create_alert(pid, 'understock', 'warning',
                f'{name} low stock: {current} units',
                suggestion)
        
        # === OVERSTOCK ===
        elif current >= max_stock * OVERSTOCK_WARNING:
            excess = current - max_stock
            holding_cost = excess * purchase_price
            
            # Calculate discount recommendations
            if velocity > 0:
                days_to_clear = excess / velocity
                
                # Discount tiers based on severity
                if days_to_clear > 90:
                    discount = 30
                    urgency = "URGENT"
                elif days_to_clear > 60:
                    discount = 20
                    urgency = "HIGH"
                else:
                    discount = 15
                    urgency = "MEDIUM"
                
                discounted_price = selling_price * (1 - discount/100)
                profit_at_discount = discounted_price - purchase_price
                total_revenue = excess * discounted_price
                
                suggestion = (
                    f"📊 OVERSTOCK ANALYSIS:\n"
                    f"• Excess Stock: {excess} units ({(excess/max_stock*100):.1f}% over max)\n"
                    f"• Days to Clear at Current Rate: {days_to_clear:.0f} days\n"
                    f"• Holding Cost: ₹{holding_cost:,.0f}\n"
                    f"• Urgency Level: {urgency}\n\n"
                    f"💰 DISCOUNT STRATEGY:\n"
                    f"• Recommended Discount: {discount}%\n"
                    f"• Discounted Price: ₹{discounted_price:.2f} (was ₹{selling_price:.2f})\n"
                    f"• Profit per Unit: ₹{profit_at_discount:.2f}\n"
                    f"• Expected Revenue: ₹{total_revenue:,.0f}\n\n"
                    f"🎯 PROMOTION IDEAS:\n"
                    f"• 'Buy 2 Get {discount}% Off' deals\n"
                    f"• Bundle with complementary products\n"
                    f"• Limited time flash sale\n"
                    f"• Loyalty program exclusive offer\n\n"
                    f"📈 EXPECTED OUTCOMES:\n"
                    f"• Clear excess in ~{int(days_to_clear/2)} days\n"
                    f"• Free up ₹{holding_cost:,.0f} in capital\n"
                    f"• Reduce storage costs"
                )
            else:
                discount = min(35, int((excess / max_stock) * 100))
                suggestion = (
                    f"📦 OVERSTOCK DETECTED:\n"
                    f"• Excess: {excess} units\n"
                    f"• Recommended Action: {discount}% discount\n"
                    f"• Alternative: Bundle deals or clearance sale"
                )
            
            alerts.append({
                'product_id': pid,
                'product_name': name,
                'type': 'overstock',
                'severity': 'warning',
                'message': f'OVERSTOCK: {name} has excess inventory',
                'recommendation': suggestion,
                'current_stock': current,
                'max_stock': max_stock,
                'discount_suggestion': discount,
                'action_required': False
            })
            
            self.db.create_alert(pid, 'overstock', 'warning',
                f'{name} overstocked: {current} units',
                suggestion)
        
        # === OPTIMAL STOCK (INFO) ===
        elif velocity > 0 and current > reorder and current < max_stock * 0.8:
            days_remaining = days_of_stock
            
            if days_remaining < 14:
                suggestion = (
                    f"ℹ️ STOCK STATUS - GOOD:\n"
                    f"• Current Stock: {current} units\n"
                    f"• Sales Rate: {velocity:.1f} units/day\n"
                    f"• Stock will last ~{days_remaining:.0f} days\n\n"
                    f"📅 PLANNING AHEAD:\n"
                    f"• Consider reordering in {int(days_remaining - 7)} days\n"
                    f"• Suggested quantity: {int(velocity * 30)} units\n"
                    f"• This maintains optimal stock levels"
                )
                
                alerts.append({
                    'product_id': pid,
                    'product_name': name,
                    'type': 'info',
                    'severity': 'info',
                    'message': f'INFO: {name} stock healthy, reorder in {int(days_remaining - 7)} days',
                    'recommendation': suggestion,
                    'current_stock': current,
                    'action_required': False
                })
        
        return alerts
    
    def generate_forecast_recommendations(self, product, forecast_data):
        """Generate enhanced recommendations based on forecast"""
        if not forecast_data:
            return []
        
        recommendations = []
        current_stock = product['current_quantity']
        product_name = product['product_name']
        purchase_price = product['purchase_price']
        selling_price = product['selling_price']
        
        # Calculate metrics
        avg_demand = np.mean([f['demand'] for f in forecast_data])
        total_30day_demand = sum([f['demand'] for f in forecast_data[:30]])
        max_demand = max([f['demand'] for f in forecast_data])
        min_demand = min([f['demand'] for f in forecast_data])
        
        # Stock sufficiency
        if avg_demand > 0:
            days_of_stock = current_stock / avg_demand
        else:
            days_of_stock = float('inf')
        
        # URGENT REORDER
        if days_of_stock < 7:
            order_qty = int(total_30day_demand * 1.3)
            cost = order_qty * purchase_price
            revenue = order_qty * selling_price
            profit = revenue - cost
            
            recommendations.append({
                'type': 'urgent_reorder',
                'priority': 'high',
                'icon': '🚨',
                'message': f'CRITICAL: Stock will last only {int(days_of_stock)} days',
                'action': (
                    f"IMMEDIATE ORDER REQUIRED:\n"
                    f"• Quantity: {order_qty} units (30-day forecast + 30% buffer)\n"
                    f"• Investment: ₹{cost:,.0f}\n"
                    f"• Expected Revenue: ₹{revenue:,.0f}\n"
                    f"• Expected Profit: ₹{profit:,.0f}\n"
                    f"• Profit Margin: {(profit/revenue*100):.1f}%\n"
                    f"• Action: Place order TODAY with expedited shipping"
                )
            })
        
        elif days_of_stock < 14:
            order_qty = int(total_30day_demand * 1.2)
            cost = order_qty * purchase_price
            
            recommendations.append({
                'type': 'reorder_soon',
                'priority': 'medium',
                'icon': '⚠️',
                'message': f'Stock sufficient for only {int(days_of_stock)} days',
                'action': (
                    f"PLAN TO ORDER:\n"
                    f"• Quantity: {order_qty} units (30-day demand + 20% buffer)\n"
                    f"• Cost: ₹{cost:,.0f}\n"
                    f"• Timeline: Order within 3-5 days\n"
                    f"• Delivery: Plan for standard shipping"
                )
            })
        
        # TREND ANALYSIS
        first_week = np.mean([f['demand'] for f in forecast_data[:7]])
        last_week = np.mean([f['demand'] for f in forecast_data[-7:]])
        
        if first_week > 0:
            trend_change = ((last_week - first_week) / first_week * 100)
        else:
            trend_change = 0
        
        if trend_change > 20:
            increase_qty = int(total_30day_demand * 0.3)
            recommendations.append({
                'type': 'increasing_demand',
                'priority': 'high',
                'icon': '📈',
                'message': f'Demand SURGING: +{trend_change:.1f}% growth trend',
                'action': (
                    f"CAPITALIZE ON GROWTH:\n"
                    f"• Increase stock by {increase_qty} units (30% boost)\n"
                    f"• Consider bulk purchasing discount\n"
                    f"• Forecast shows sustained growth\n"
                    f"• Potential revenue opportunity: ₹{increase_qty * selling_price:,.0f}"
                )
            })
        
        elif trend_change < -20:
            discount = min(25, int(abs(trend_change) / 2))
            recommendations.append({
                'type': 'decreasing_demand',
                'priority': 'medium',
                'icon': '📉',
                'message': f'Demand DECLINING: {abs(trend_change):.1f}% drop detected',
                'action': (
                    f"MITIGATE DECLINE:\n"
                    f"• Launch {discount}% promotional discount\n"
                    f"• Run targeted marketing campaign\n"
                    f"• Bundle with popular products\n"
                    f"• Review pricing strategy\n"
                    f"• Consider seasonal factors"
                )
            })
        
        # PEAK DEMAND WARNING
        if max_demand > avg_demand * 1.5:
            peak_date = forecast_data[[f['demand'] for f in forecast_data].index(max_demand)]['date']
            buffer_qty = int(max_demand * 1.2)
            
            recommendations.append({
                'type': 'peak_warning',
                'priority': 'high',
                'icon': '⚡',
                'message': f'PEAK DEMAND FORECAST: {max_demand:.0f} units expected',
                'action': (
                    f"PREPARE FOR PEAK:\n"
                    f"• Peak Date: Around {peak_date}\n"
                    f"• Peak Demand: {max_demand:.0f} units (vs avg {avg_demand:.0f})\n"
                    f"• Buffer Stock Needed: {buffer_qty} units\n"
                    f"• Ensure supplier can fulfill urgent orders\n"
                    f"• Plan promotional activities for peak period"
                )
            })
        
        # CONSISTENCY CHECK
        demand_std = np.std([f['demand'] for f in forecast_data])
        if demand_std / avg_demand < 0.2 and avg_demand > 5:  # Very stable demand
            optimal_order = int(avg_demand * 45)  # 1.5 months
            recommendations.append({
                'type': 'stable_demand',
                'priority': 'low',
                'icon': '✅',
                'message': f'STABLE DEMAND: Highly predictable sales pattern',
                'action': (
                    f"OPTIMIZE ORDERING:\n"
                    f"• Demand is very stable (~{avg_demand:.1f} units/day)\n"
                    f"• Consider bulk order: {optimal_order} units (45-day supply)\n"
                    f"• Negotiate better pricing for larger orders\n"
                    f"• Set up automatic reordering system\n"
                    f"• Reduce safety stock to minimize holding costs"
                )
            })
        
        # PROFITABILITY INSIGHT
        profit_per_unit = selling_price - purchase_price
        margin = (profit_per_unit / selling_price) * 100
        monthly_profit = total_30day_demand * profit_per_unit
        
        if margin < 20:
            recommendations.append({
                'type': 'margin_warning',
                'priority': 'medium',
                'icon': '💰',
                'message': f'LOW PROFIT MARGIN: Only {margin:.1f}%',
                'action': (
                    f"IMPROVE PROFITABILITY:\n"
                    f"• Current Margin: {margin:.1f}% (₹{profit_per_unit:.2f}/unit)\n"
                    f"• Expected Monthly Profit: ₹{monthly_profit:,.0f}\n"
                    f"• Options:\n"
                    f"  1. Negotiate lower purchase price\n"
                    f"  2. Increase selling price by ₹{selling_price * 0.1:.2f} (10%)\n"
                    f"  3. Find cheaper supplier\n"
                    f"  4. Focus on higher-margin products"
                )
            })
        
        return recommendations