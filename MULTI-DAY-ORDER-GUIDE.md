# 🎉 Multi-Day Order System - Setup Guide

## Overview

Your MealkyWay application now supports comprehensive multi-day ordering with the following options:

- ✅ Single Day Order
- ✅ 3 Days Subscription
- ✅ 7 Days Subscription
- ✅ 10 Days Subscription
- ✅ 30 Days Subscription
- ✅ Custom Date Selection

## 📋 What's Been Implemented

### 1. Database Changes

- Added `order_type` column to track single vs multi-day orders
- Added unique constraint to prevent duplicate orders on same date
- Migration file: `database/multi-day-order-migration.sql`

### 2. Frontend Changes

#### Order Form (order.html)

- Added duration selection buttons (একদিন, ৩ দিন, ৭ দিন, ১০ দিন, ৩০ দিন, কাস্টম)
- Added start date picker for preset durations
- Added custom date picker calendar (60 days view)
- Added real-time order summary showing:
  - Daily quantity
  - Total days
  - Total price

#### Styling (styles.css)

- Beautiful card-based duration selector with hover effects
- Interactive calendar grid for custom date selection
- Responsive design for mobile devices
- Visual feedback for selected dates
- Color-coded date cells (today, selected, disabled)

#### JavaScript Logic (order.js)

- Duration type switching logic
- Custom date picker calendar generation
- Date selection/deselection functionality
- Real-time price calculation
- Date validation and conflict detection
- Automatic date generation for preset durations

### 3. Backend Changes (server.js)

#### Enhanced API Endpoint `/api/order`

- Accepts both single and multiple dates
- Creates multiple order records for multi-day orders
- Prevents duplicate orders with unique constraint
- Returns detailed response with:
  - Total orders created
  - Total amount
  - Skipped dates (if conflicts)
  - Conflict date list
- Backward compatible with old single-date format

## 🚀 Setup Instructions

### Step 1: Run Database Migration

**Important:** You MUST run this SQL migration in your Supabase dashboard before testing!

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents from: `database/multi-day-order-migration.sql`
5. Click **Run**

The migration will:

- Add `order_type` column to orders table
- Create unique constraint on (customer_id, date)
- Prevent duplicate orders

### Step 2: Restart Your Server

```powershell
# Stop the current server (Ctrl+C if running)
npm run dev
```

### Step 3: Test the Features

Visit: `http://localhost:3001/order`

## ✅ Testing Checklist

### Test 1: Single Day Order

- [ ] Select "একদিন" (Single Day)
- [ ] Choose a date
- [ ] Enter quantity (e.g., 2 pieces)
- [ ] Verify summary shows: 2 পিস, 1 দিন, 60 টাকা
- [ ] Submit order
- [ ] Check Supabase orders table - should see 1 order

### Test 2: 3 Days Subscription

- [ ] Select "৩ দিন" (3 Days)
- [ ] Choose start date (e.g., today)
- [ ] Enter quantity (e.g., 1 piece)
- [ ] Verify summary shows: 1 পিস, 3 দিন, 90 টাকা
- [ ] Submit order
- [ ] Check Supabase - should see 3 orders (consecutive days)

### Test 3: 7 Days Subscription

- [ ] Select "৭ দিন" (7 Days)
- [ ] Choose start date
- [ ] Enter quantity (e.g., 3 pieces)
- [ ] Verify summary shows: 3 পিস, 7 দিন, 630 টাকা
- [ ] Submit order
- [ ] Check Supabase - should see 7 orders

### Test 4: 10 Days Subscription

- [ ] Select "১০ দিন" (10 Days)
- [ ] Test with different quantities
- [ ] Verify 10 consecutive orders are created

### Test 5: 30 Days Subscription

- [ ] Select "৩০ দিন" (30 Days)
- [ ] Test with different quantities
- [ ] Verify 30 consecutive orders are created

### Test 6: Custom Date Selection

- [ ] Select "কাস্টম" (Custom)
- [ ] Calendar should appear showing next 60 days
- [ ] Click on multiple dates (e.g., select 5 random dates)
- [ ] Verify "নির্বাচিত তারিখ: 5 দিন" updates
- [ ] Verify price calculation (quantity × selected dates × 30)
- [ ] Submit order
- [ ] Check Supabase - should see orders for only selected dates

### Test 7: Duplicate Order Prevention

- [ ] Create an order for tomorrow (any duration)
- [ ] Try creating another order that includes tomorrow
- [ ] Should get error: "আপনি ইতিমধ্যে এই তারিখের জন্য অর্ডার করেছেন"
- [ ] Verify no duplicate orders in database

### Test 8: Partial Conflict Handling

- [ ] Create order for Dec 5, 6, 7
- [ ] Try creating order for Dec 6, 7, 8, 9
- [ ] System should:
  - Skip Dec 6, 7 (already exists)
  - Create orders for Dec 8, 9 only
  - Show message about skipped dates

### Test 9: Mobile Responsiveness

- [ ] Open on mobile device or resize browser
- [ ] Duration buttons should show 2 columns on mobile
- [ ] Calendar grid should be smaller but functional
- [ ] All interactions should work smoothly

### Test 10: Admin Panel Verification

- [ ] Login to admin panel: `http://localhost:3001/admin/panel`
- [ ] Check if multi-day orders appear correctly
- [ ] Each date should show as separate order
- [ ] Verify customer information is consistent

## 🔍 Database Structure

### Orders Table

```sql
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  quantity INTEGER NOT NULL,
  date DATE NOT NULL,
  order_type TEXT DEFAULT 'single',  -- NEW: 'single' or 'multi'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_customer_date_order UNIQUE (customer_id, date)  -- NEW: Prevents duplicates
);
```

## 💡 How It Works

### Single Day Order

1. User selects "একদিন"
2. Picks a single date
3. Backend creates 1 order record

### Preset Duration (3, 7, 10, 30 days)

1. User selects duration
2. Picks start date
3. Frontend calculates consecutive dates
4. Backend creates multiple order records (one per day)

### Custom Selection

1. User selects "কাস্টম"
2. Calendar displays 60 days
3. User clicks specific dates
4. Selected dates stored in Set
5. Backend creates orders for selected dates only

### Conflict Prevention

- Unique constraint: `(customer_id, date)`
- If order exists for a date, that date is skipped
- User gets feedback about conflicts
- Remaining valid dates are processed

## 🎨 UI Features

### Duration Cards

- Visual card-based selection
- Active state highlighting (blue gradient)
- Hover effects with shadow
- Icon + label for each option

### Custom Calendar

- 60-day view
- Day of week headers (বাংলা)
- Color-coded cells:
  - **Blue gradient**: Selected dates
  - **Yellow border**: Today
  - **Gray**: Past/disabled dates
- Click to select/deselect
- Real-time count update

### Order Summary

- Shows daily quantity
- Shows total days
- Shows total price
- Updates in real-time
- Clear visual hierarchy

## 🔧 API Response Format

### Successful Multi-Day Order

```json
{
  "success": true,
  "message": "5 দিনের অর্ডার সফলভাবে সম্পন্ন হয়েছে",
  "orderId": 123,
  "orderIds": [123, 124, 125, 126, 127],
  "totalOrders": 5,
  "totalAmount": 450,
  "skippedDates": 0,
  "conflictDates": [],
  "orders": [...]
}
```

### With Conflicts

```json
{
  "success": true,
  "message": "3 দিনের অর্ডার সফলভাবে সম্পন্ন হয়েছে",
  "totalOrders": 3,
  "totalAmount": 270,
  "skippedDates": 2,
  "conflictDates": ["2025-12-05", "2025-12-06"]
}
```

## 🐛 Troubleshooting

### Issue: "Duplicate key value violates unique constraint"

**Solution:** Run the database migration. The unique constraint is essential.

### Issue: Custom calendar not showing

**Solution:** Check browser console for errors. Make sure JavaScript is loaded.

### Issue: Price not updating

**Solution:** Ensure `updateOrderSummary()` is called on quantity/date changes.

### Issue: Orders created but duplicate error

**Solution:** Check if migration was applied. Query:

```sql
SELECT * FROM pg_indexes WHERE tablename = 'orders' AND indexname = 'unique_customer_date_order';
```

### Issue: Custom dates not saving

**Solution:** Check that `selectedDates` Set is populated and passed to API.

## 📊 Monitoring Tips

### Check Orders in Supabase

```sql
-- See all orders for a customer
SELECT o.*, c.name, c.contact_number
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.contact_number = '01234567890'
ORDER BY o.date;

-- Find duplicate prevention working
SELECT customer_id, date, COUNT(*)
FROM orders
GROUP BY customer_id, date
HAVING COUNT(*) > 1;
-- Should return 0 rows if working correctly
```

## ✨ Features Summary

✅ **User-Friendly**: Simple card-based selection
✅ **Flexible**: Supports any date combination
✅ **Safe**: Prevents duplicate orders
✅ **Fast**: Real-time price calculation
✅ **Mobile-Ready**: Fully responsive design
✅ **Conflict-Aware**: Handles existing orders gracefully
✅ **Backward Compatible**: Old single-date API still works

## 🎯 Next Steps (Optional Enhancements)

1. **Recurring Orders**: Weekly/monthly auto-renewal
2. **Order History**: Show past multi-day subscriptions
3. **Bulk Discounts**: Discount for 30-day orders
4. **Pause/Resume**: Pause subscription temporarily
5. **Calendar Export**: Export orders to Google Calendar

---

**Congratulations!** 🎉 Your multi-day order system is now ready to use!

For any issues or questions, check the browser console and server logs.
