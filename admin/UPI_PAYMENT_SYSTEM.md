# UPI Payment System Documentation

## ✅ Implementation Complete

The payment system has been simplified to use **UPI deep links** instead of Razorpay integration. This approach is:
- **Free** - No transaction fees
- **Simple** - No KYC or setup required
- **Instant** - Money reaches workers immediately
- **Flexible** - Pay from any UPI app

---

## 📋 Payment Flow

### **Step 1: Worker Registration**
Worker provides UPI ID during profile setup:
```json
PUT /workers/:id
{
  "upiId": "9876543210@paytm",
  "phone": "9876543210",
  "bankAccount": "optional",
  "panCard": "optional"
}
```

### **Step 2: Worker Completes Issue**
```json
POST /issues/:id/complete
{
  "amount": 500,
  "completionNotes": "Work completed successfully"
}
```

### **Step 3: Admin Reviews & Approves**
```json
POST /issues/:id/approve-and-pay
{
  "rating": 5,
  "comment": "Excellent work!",
  "amount": 500
}
```
**Response includes UPI links for all providers!**

### **Step 4: Admin Makes Payment**
1. Click any UPI link (Google Pay, PhonePe, Paytm, BHIM, or Generic)
2. UPI app opens with pre-filled details
3. Confirm and pay
4. Mark payment as complete

```json
POST /payments/:paymentId/complete
{
  "transactionId": "UPI123456789",
  "screenshotUrl": "optional",
  "notes": "Payment completed via Google Pay"
}
```

---

## 🔗 API Endpoints

### **Payment Management**

#### **Create Payment Record**
```http
POST /payments/create
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "issueId": "issue-uuid",
  "amount": 500
}
```

#### **Get UPI Payment Links**
```http
GET /payments/:paymentId/upi-links
Authorization: Bearer <token>
```

**Response:**
```json
{
  "payment": {
    "id": "payment-uuid",
    "amount": 500,
    "status": "pending"
  },
  "worker": {
    "name": "John Doe",
    "upiId": "9876543210@paytm",
    "provider": "Paytm"
  },
  "upiLinks": {
    "generic": "upi://pay?pa=9876543210@paytm&pn=John%20Doe&am=500&cu=INR&tn=Payment%20for%20issue...",
    "googlepay": "tez://upi/pay?pa=...",
    "phonepe": "phonepe://pay?pa=...",
    "paytm": "paytmmp://pay?pa=...",
    "bhim": "bhim://pay?pa=..."
  }
}
```

#### **Mark Payment as Complete**
```http
POST /payments/:paymentId/complete
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "transactionId": "UPI123456789",
  "screenshotUrl": "https://example.com/screenshot.jpg",
  "notes": "Payment completed successfully"
}
```

#### **Get Pending Payments**
```http
GET /payments/pending
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "totalPending": 5000,
  "count": 10,
  "payments": [
    {
      "id": "payment-uuid",
      "amount": 500,
      "worker": {
        "name": "John Doe",
        "upiId": "9876543210@paytm"
      },
      "issue": {
        "title": "Fix pothole"
      },
      "upiLinks": {
        "generic": "upi://pay?...",
        "googlepay": "tez://upi/pay?...",
        ...
      }
    }
  ]
}
```

#### **List All Payments**
```http
GET /payments?status=pending&workerId=worker-uuid&page=1&limit=10
Authorization: Bearer <token>
```

---

## 🛠️ UPI Utility Functions

### **Generate Generic UPI Link**
```typescript
import { generateUPILink } from '../utils/upi';

const link = generateUPILink({
  upiId: '9876543210@paytm',
  name: 'John Doe',
  amount: 500,
  transactionNote: 'Payment for completed work'
});
// Returns: upi://pay?pa=9876543210@paytm&pn=John%20Doe&am=500&cu=INR&tn=...
```

### **Generate Provider-Specific Links**
```typescript
import { generateProviderUPILink } from '../utils/upi';

const googlePayLink = generateProviderUPILink(
  { upiId: '9876543210@paytm', name: 'John', amount: 500 },
  'googlepay'
);
```

### **Get All Provider Links**
```typescript
import { getAllProviderLinks } from '../utils/upi';

const allLinks = getAllProviderLinks({
  upiId: '9876543210@paytm',
  name: 'John Doe',
  amount: 500
});
// Returns object with links for all providers
```

### **Validate UPI ID**
```typescript
import { validateUPIId } from '../utils/upi';

validateUPIId('9876543210@paytm'); // true
validateUPIId('invalid'); // false
```

---

## 📊 Database Schema Changes

### **Worker Model**
- ✅ Added `upiId` (String?) - UPI ID for payments
- ✅ Added `bankAccount` (String?) - Optional backup
- ✅ Added `panCard` (String?) - For records
- ❌ Removed `razorpayContactId`
- ❌ Removed `razorpayFundId`

### **Payment Model**
- ✅ Added `transactionId` (String?) - UPI transaction ID (manual entry)
- ✅ Added `screenshotUrl` (String?) - Optional payment screenshot
- ✅ Added `notes` (String?) - Additional notes
- ❌ Removed `razorpayOrderId`
- ❌ Removed `razorpayPaymentId`
- ❌ Removed `razorpayFundId`
- ❌ Removed `failureReason`
- Simplified `PaymentStatus` enum: `pending`, `completed`, `failed`

---

## 🎯 Supported UPI Providers

The system generates deep links for:

1. **Generic UPI** - Works with all UPI apps
2. **Google Pay** - `tez://upi/pay?...`
3. **PhonePe** - `phonepe://pay?...`
4. **Paytm** - `paytmmp://pay?...`
5. **BHIM** - `bhim://pay?...`

---

## 💡 Usage Examples

### **Frontend Integration**

```javascript
// React example
function PaymentButton({ payment }) {
  const handlePay = (provider) => {
    const link = payment.upiLinks[provider];
    window.location.href = link; // Opens UPI app
  };

  return (
    <div>
      <button onClick={() => handlePay('googlepay')}>
        Pay with Google Pay
      </button>
      <button onClick={() => handlePay('phonepe')}>
        Pay with PhonePe
      </button>
      <button onClick={() => handlePay('paytm')}>
        Pay with Paytm
      </button>
      <button onClick={() => handlePay('generic')}>
        Pay with Any UPI App
      </button>
    </div>
  );
}
```

### **Mobile App Integration**

```javascript
// React Native example
import { Linking } from 'react-native';

const openUPIApp = (upiLink) => {
  Linking.openURL(upiLink).catch(err => {
    console.error('Failed to open UPI app:', err);
    // Fallback: show UPI ID and amount for manual entry
  });
};
```

---

## 📝 Payment Workflow Summary

```
1. Worker completes issue
   ↓
2. Admin reviews & approves
   ↓
3. Payment record created (status: pending)
   ↓
4. Admin clicks UPI link
   ↓
5. UPI app opens with pre-filled details
   ↓
6. Admin confirms payment
   ↓
7. Admin marks payment as complete
   ↓
8. Worker earnings updated
```

---

## 🔒 Security & Best Practices

1. **Validate UPI IDs** - System validates format before creating links
2. **Transaction ID Tracking** - Always record transaction ID after payment
3. **Screenshot Storage** - Optional but recommended for records
4. **Admin Only** - Only admins can create/complete payments
5. **Audit Trail** - All payments tracked with `processedBy` and timestamps

---

## 📈 Next Steps

1. **Run Migration**: `bun run db:migrate`
2. **Update Worker Profiles**: Add UPI IDs to existing workers
3. **Test Payment Flow**: Test with real UPI apps
4. **Build Dashboard**: Create admin dashboard with payment queue
5. **Add Notifications**: Notify workers when payment is processed

---

## 🚀 Additional Features to Consider

- **Bulk Payment Export** - Export pending payments as CSV
- **Payment Reminders** - Auto-remind admins of pending payments
- **Payment Analytics** - Track payment trends
- **QR Code Generation** - Generate QR codes for UPI payments
- **Payment Templates** - Save common payment amounts
- **Auto-complete Suggestions** - Suggest payment amounts based on issue type

---

## ❓ FAQ

**Q: What if worker doesn't have UPI ID?**
A: System will return error. Worker must update profile with UPI ID first.

**Q: Can I pay multiple workers at once?**
A: Currently manual, but you can export pending payments and use bank bulk transfer.

**Q: What about transaction limits?**
A: UPI has ₹1-2 lakh per transaction limit. For larger amounts, use bank transfer.

**Q: How do I track payments?**
A: All payments are stored in database with transaction IDs and timestamps.

**Q: Can workers see payment status?**
A: Yes, workers can query their payment history via API.

---

## 🎉 Benefits of This Approach

✅ **Zero Setup Cost** - No Razorpay fees or KYC  
✅ **Instant Payments** - Money reaches immediately  
✅ **Simple Integration** - Just UPI deep links  
✅ **Multiple Providers** - Support all UPI apps  
✅ **Full Control** - You control when and how to pay  
✅ **Easy Tracking** - All payments in database  

