require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

// إعداد تطبيق Express
const app = express();
const PORT = process.env.PORT || 3000;

// الاتصال بقاعدة بيانات MongoDB عبر الرابط الذي قدمته
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.log('MongoDB connection error:', err));

// نموذج Mongoose للبيانات (رحلات الطيران)
const Flight = mongoose.model('Flight', new mongoose.Schema({
  flightNumber: String,
  airline: String,
  departure: String,
  arrival: String,
  date: Date,
  price: Number
}));

// نقطة النهاية API لعرض جميع الرحلات
app.get('/api/flights', async (req, res) => {
  try {
    const flights = await Flight.find();  // جلب جميع الرحلات من قاعدة البيانات
    res.json(flights);  // إرسال البيانات بتنسيق JSON
  } catch (err) {
    res.status(500).send('Error retrieving flights');
  }
});

// نقطة النهاية الرئيسية (اختياري) - إذا كنت ترغب في صفحة ترحيبية
app.get('/', (req, res) => {
  res.send('Welcome to the API! Use /api/flights to get flight data.');
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
