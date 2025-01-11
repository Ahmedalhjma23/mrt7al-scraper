/***************************************
 * ملف: index.js
 ***************************************/

const puppeteer = require('puppeteer');
const express = require('express');
const cron = require('node-cron');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const winston = require('winston');

// تحميل المتغيرات البيئية من ملف .env
dotenv.config();

// إعداد Winson لإدارة السجلات
const logger = winston.createLogger({
  level: 'info', // مستوى السجلات
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console(), // تسجيل السجلات في وحدة التحكم
    new winston.transports.File({ filename: 'app.log' }) // تسجيل السجلات في ملف
  ],
});

// تعريف نموذج بيانات الرحلات باستخدام Mongoose
const flightSchema = new mongoose.Schema({
  route: { type: String, required: true },
  flightNumber: { type: String, required: true },
  status: { type: String, required: true },
  departureTime: { type: String, required: true },
  departureDate: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  arrivalDate: { type: String, required: true },
  fetchedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Flight = mongoose.model('Flight', flightSchema);

// تعريف نموذج بيانات الحافلات باستخدام Mongoose
const busSchema = new mongoose.Schema({
  route: { type: String, required: true },
  busNumber: { type: String, required: true },
  status: { type: String, required: true },
  departureTime: { type: String, required: true },
  departureDate: { type: String, required: true },
  arrivalTime: { type: String, required: true },
  arrivalDate: { type: String, required: true },
  fetchedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Bus = mongoose.model('Bus', busSchema);

/** 
 * كائن يحتوي على الروابط والطلبات التي سيتم تنفيذها
 * يمكنك تعديل هذا الكائن وفقًا لاحتياجاتك
 */
const snippet = {
  "info": {
    "_postman_id": "1712d4d3-7f24-419b-ad22-ee3ca075615c",
    "name": "sponsors mrt7al",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "_exporter_id": "740699"
  },
  "item": [
    {
      "name": "cities",
      "protocolProfileBehavior": {
        "disableBodyPruning": true
      },
      "request": {
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "{{websiteToken}}",
              "type": "string"
            }
          ]
        },
        "method": "GET",
        "header": [],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "from_city",
              "value": "1",
              "type": "text",
              "disabled": false // تأكد من تمكين الحقول المطلوبة
            },
            {
              "key": "to_city",
              "value": "2",
              "type": "text",
              "disabled": false
            }
            // قم بتمكين أو تعطيل الحقول حسب الحاجة
          ]
        },
        "url": {
          "raw": "https://administrator.mrt7al.com/rest/sponsors/cities.json?page=1",
          "protocol": "https",
          "host": [
            "administrator",
            "mrt7al",
            "com"
          ],
          "path": [
            "rest",
            "sponsors",
            "cities.json"
          ],
          "query": [
            {
              "key": "page",
              "value": "1"
            }
          ]
        }
      },
      "response": []
    },
    {
      "name": "home & search",
      "request": {
        "auth": {
          "type": "bearer",
          "bearer": [
            {
              "key": "token",
              "value": "{{websiteToken}}",
              "type": "string"
            }
          ]
        },
        "method": "POST",
        "header": [],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "from_city",
              "value": "23",
              "type": "text",
              "disabled": false
            },
            {
              "key": "to_city",
              "value": "29",
              "type": "text",
              "disabled": false
            },
            {
              "key": "tripDate",
              "value": "2025-01-06",
              "type": "text",
              "disabled": false
            },
            {
              "key": "city_id",
              "value": "2",
              "type": "text",
              "disabled": false
            },
            {
              "key": "bus_type",
              "value": "Vip",
              "type": "text",
              "disabled": false
            },
            {
              "key": "is_direct",
              "value": "on",
              "type": "text",
              "disabled": false
            },
            {
              "key": "from_price",
              "value": "0",
              "type": "text",
              "disabled": false
            },
            {
              "key": "to_price",
              "value": "59",
              "type": "text",
              "disabled": false
            }
          ]
        },
        "url": {
          "raw": "https://administrator.mrt7al.com/rest/sponsors/home.json?page=1",
          "protocol": "https",
          "host": [
            "administrator",
            "mrt7al",
            "com"
          ],
          "path": [
            "rest",
            "sponsors",
            "home.json"
          ],
          "query": [
            {
              "key": "page",
              "value": "1"
            }
          ]
        }
      },
      "response": []
    }
  ]
};

/**
 * دالة لجلب البيانات باستخدام Puppeteer وتخزينها في قاعدة بيانات MongoDB
 */
const fetchData = async () => {
  let browser;
  try {
    logger.info('بدء تشغيل Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      // إزالة 'executablePath' للسماح لـ Puppeteer باستخدام Chromium الافتراضي
      // إذا كنت تعرف المسار الصحيح لـ Chromium على نظامك، يمكنك إضافته هنا
      // executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });
    logger.info('تم تشغيل Puppeteer بنجاح.');
    const page = await browser.newPage();
    logger.info('تم فتح صفحة جديدة.');

    // لتخزين النتائج
    const allResults = [];

    // تفعيل اعتراض الطلبات للتعامل مع طلبات POST
    await page.setRequestInterception(true);

    // الحدث الذي سيتم استدعاؤه عند كل طلب
    page.on('request', (req) => {
      const currentItem = getCurrentItem(req.url());
      if (currentItem && currentItem.request.method === 'POST') {
        // تحويل بيانات النموذج إلى سلسلة
        const formDataString = buildFormDataString(currentItem.request.body);

        // تعديل الطلب ليكون POST مع بيانات النموذج
        req.continue({
          method: 'POST',
          postData: formDataString,
          headers: {
            ...req.headers(),
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      } else {
        // تمرير الطلب كما هو إذا لم يكن POST
        req.continue();
      }
    });

    /**
     * تنفيذ جميع الطلبات المعرفة في snippet.item
     */
    for (const item of snippet.item) {
      const url = item.request.url.raw;
      const method = item.request.method.toUpperCase();

      logger.info(`تنفيذ الطلب: ${method} ${url}`);

      if (method === 'GET') {
        // تنفيذ طلب GET
        await page.goto(url, { waitUntil: 'networkidle2' });
      } else if (method === 'POST') {
        // تنفيذ طلب POST عبر الانتقال إلى الصفحة التي تتعامل مع POST
        await page.goto(url, { waitUntil: 'networkidle2' });
      } else {
        logger.warn(`طريقة الطلب غير مدعومة: ${method}`);
        continue;
      }

      // بعد التحميل، جلب محتوى الصفحة
      const pageContent = await page.evaluate(() => {
        return document.querySelector('body')?.innerText || '';
      });

      let parsedData = {};
      try {
        parsedData = JSON.parse(pageContent);
      } catch {
        parsedData = { rawText: pageContent };
      }

      // تخزين النتيجة مصنفة باسم الطلب
      allResults.push({
        name: item.name,
        request: {
          method: item.request.method,
          url: item.request.url.raw
        },
        data: parsedData
      });

      logger.info(`تم تنفيذ الطلب: ${item.name}`);
    }

    await browser.close();
    logger.info('تم إغلاق Puppeteer.');

    // تخزين البيانات في قاعدة البيانات
    for (const result of allResults) {
      const { name, request, data } = result;
      
      try {
        // مثال على تخزين بيانات الرحلات
        if (data.flights && Array.isArray(data.flights)) {
          for (const flight of data.flights) {
            // التحقق من عدم وجود الرحلة مسبقًا لتجنب التكرار
            const exists = await Flight.findOne({
              flightNumber: flight.flightNumber,
              departureDate: flight.departureDate,
              departureTime: flight.departureTime
            });

            if (!exists) {
              const newFlight = new Flight(flight);
              await newFlight.save();
              logger.info(`تمت إضافة رحلة جديدة: ${flight.flightNumber}`);
            } else {
              logger.info(`الرحلة موجودة بالفعل: ${flight.flightNumber}`);
            }
          }
        }

        // مثال على تخزين بيانات الحافلات
        if (data.buses && Array.isArray(data.buses)) {
          for (const bus of data.buses) {
            // التحقق من عدم وجود الحافلة مسبقًا لتجنب التكرار
            const exists = await Bus.findOne({
              busNumber: bus.busNumber,
              departureDate: bus.departureDate,
              departureTime: bus.departureTime
            });

            if (!exists) {
              const newBus = new Bus(bus);
              await newBus.save();
              logger.info(`تمت إضافة حافلة جديدة: ${bus.busNumber}`);
            } else {
              logger.info(`الحافلة موجودة بالفعل: ${bus.busNumber}`);
            }
          }
        }

      } catch (dbError) {
        logger.error(`خطأ عند حفظ البيانات للطلب ${name}: ${dbError.message}`);
      }
    }

    logger.info('تم تحديث البيانات بنجاح.');
  } catch (error) {
    logger.error(`حدث خطأ أثناء استخراج البيانات: ${error.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
        logger.info('تم إغلاق Puppeteer في الـ finally.');
      } catch (closeError) {
        logger.error(`خطأ عند إغلاق Puppeteer في الـ finally: ${closeError.message}`);
      }
    }
  }
};

/**
 * تبحث عن العنصر في snippet.item الذي يطابق الرابط الحالي
 * لكي نعرف هل هو GET أم POST ونأخذ أي بيانات إضافية
 */
function getCurrentItem(url) {
  return snippet.item.find(item => {
    const host = item.request.url.host.join('.');
    const path = item.request.url.path.join('/');
    return url.includes(host) && url.includes(path);
  });
}

/**
 * تحويل الـ formdata من الصيغة الموجودة في snippet
 * إلى key=value&key=value لاستخدامها كـ postData
 */
function buildFormDataString(body) {
  if (!body || body.mode !== 'formdata' || !body.formdata) {
    return '';
  }
  // نجلب الحقول غير المعطّلة ونحوّلها لصيغة:
  // key=value&key=value
  const fields = body.formdata
    .filter(field => !field.disabled) // الحقول غير المعطّلة
    .map(field => {
      // نتأكد من تفريغ أي حروف خاصة
      const key = encodeURIComponent(field.key);
      const value = encodeURIComponent(field.value);
      return `${key}=${value}`;
    });
  return fields.join('&');
}

// إنشاء تطبيق Express
const app = express();

// تفعيل CORS للسماح بالطلبات من مصادر مختلفة
app.use(cors());

// نقطة النهاية API لعرض جميع الرحلات كـ JSON من قاعدة البيانات
app.get('/api/flights', async (req, res) => {
  try {
    const flights = await Flight.find().sort({ fetchedAt: -1 });
    if (flights.length === 0) {
      return res.status(503).json({ message: 'البيانات قيد التحميل. الرجاء المحاولة لاحقًا.' });
    }
    res.json(flights);
  } catch (error) {
    logger.error(`خطأ أثناء جلب البيانات من قاعدة البيانات: ${error.message}`);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب البيانات.', error: error.message });
  }
});

// نقطة النهاية API لعرض جميع الحافلات كـ JSON من قاعدة البيانات
app.get('/api/buses', async (req, res) => {
  try {
    const buses = await Bus.find().sort({ fetchedAt: -1 });
    if (buses.length === 0) {
      return res.status(503).json({ message: 'البيانات قيد التحميل. الرجاء المحاولة لاحقًا.' });
    }
    res.json(buses);
  } catch (error) {
    logger.error(`خطأ أثناء جلب البيانات من قاعدة البيانات: ${error.message}`);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب البيانات.', error: error.message });
  }
});

// نقطة النهاية الرئيسية - صفحة ترحيبية
app.get('/', (req, res) => {
  res.send('مرحبًا بك في الـ API! استخدم /api/flights و /api/buses للحصول على بيانات الرحلات والحافلات.');
});

/**
 * الاتصال بقاعدة بيانات MongoDB وبدء الخادم
 */
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    logger.info('تم الاتصال بقاعدة بيانات MongoDB بنجاح.');

    // بدء تشغيل الخادم بعد الاتصال بقاعدة البيانات
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      logger.info(`الخادم يعمل على http://localhost:${PORT}`);
      logger.info(`استخدم http://localhost:${PORT}/api/flights للحصول على بيانات الرحلات.`);
      logger.info(`استخدم http://localhost:${PORT}/api/buses للحصول على بيانات الحافلات.`);
    });

    // استخراج البيانات أول مرة عند بدء السيرفر
    fetchData().then(() => {
      logger.info('تم جلب البيانات الأولية.');
    }).catch(error => {
      logger.error(`خطأ في جلب البيانات الأولية: ${error.message}`);
    });

    // جدولة تحديث البيانات كل ساعة باستخدام node-cron
    cron.schedule('0 * * * *', () => {
      logger.info('بدء مهمة مجدولة: fetchData');
      fetchData();
    });

  })
  .catch(error => {
    logger.error(`فشل الاتصال بقاعدة بيانات MongoDB: ${error.message}`);
    process.exit(1);
  });