// تحميل مكتبة dotenv فقط في بيئة التطوير
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
  
  const express = require('express');
  const mongoose = require('mongoose');
  
  // إعداد تطبيق Express
  const app = express();
  
  // تحديد المنفذ الذي سيستمع عليه الخادم
  const PORT = process.env.PORT || 3000;
  
  // التحقق من وجود MONGODB_URI في المتغيرات البيئية
  if (!process.env.MONGODB_URI) {
    console.error('خطأ: متغير البيئة MONGODB_URI غير معرف.');
    process.exit(1); // إنهاء التطبيق إذا لم يتم تعريف URI
  }
  
  // الاتصال بقاعدة بيانات MongoDB باستخدام MONGODB_URI
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('تم الاتصال بـ MongoDB بنجاح'))
  .catch((err) => {
    console.error('خطأ في الاتصال بقاعدة بيانات MongoDB:', err);
    process.exit(1); // إنهاء التطبيق إذا فشل الاتصال
  });
  
  // تعريف نموذج Mongoose لرحلات الطيران
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
      console.error('خطأ في جلب بيانات الرحلات:', err);
      res.status(500).send('خطأ في جلب بيانات الرحلات');
    }
  });
  
  // نقطة النهاية الرئيسية - صفحة ترحيبية
  app.get('/', (req, res) => {
    res.send('مرحبًا بك في الـ API! استخدم /api/flights للحصول على بيانات الرحلات.');
  });
  
  // بدء تشغيل الخادم
  app.listen(PORT, () => {
    console.log(`الخادم يعمل على http://localhost:${PORT}`);
  });