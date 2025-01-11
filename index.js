require('dotenv').config(); // تحميل المتغيرات البيئية

const express = require('express');
const mongoose = require('mongoose');

// إعداد تطبيق Express
const app = express();
const PORT = process.env.PORT || 3000;

// التحقق من وجود MONGODB_URI
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the environment variables.');
  process.exit(1); // إنهاء التطبيق إذا لم يتم تعريف URI
}

// الاتصال بقاعدة بيانات MongoDB عبر الرابط الذي قدمته
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // إنهاء التطبيق إذا فشل الاتصال
});

// نموذج Mongoose للبيانات (رحلات الطيران)
const flightSchema = new mongoose.Schema({
  flightNumber: String,
  airline: String,
  departure: String,
  arrival: String,
  date: Date,
  price: Number
});

const Flight = mongoose.model('Flight', flightSchema);

// نقطة النهاية API لعرض جميع الرحلات
app.get('/api/flights', async (req, res) => {
  try {
    const flights = await Flight.find();  // جلب جميع الرحلات من قاعدة البيانات
    res.json(flights);  // إرسال البيانات بتنسيق JSON
  } catch (err) {
    console.error('Error retrieving flights:', err);
    res.status(500).send('Error retrieving flights');
  }
});

// نقطة النهاية الرئيسية (اختياري) - إذا كنت ترغب في صفحة ترحيبية
app.get('/', (req, res) => {
  res.send('Welcome to the API! Use /api/flights to get flight data.');
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(Server is running on http://localhost:${PORT});
});