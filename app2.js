/***************************************
 * ملف: app.js
 ***************************************/


const puppeteer = require('puppeteer');
const express = require('express');
const app = express();

// اختر منفذًا مختلفًا عن 3000
const PORT = 4000;

/** هذا هو الكائن الذي يحتوي على الروابط التي سنجرب الوصول إليها  */
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
              "disabled": true
            },
            {
              "key": "to_city",
              "value": "2",
              "type": "text",
              "disabled": true
            }
            // بقية الحقول معطّلة (disabled)
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
              "disabled": true
            },
            {
              "key": "to_city",
              "value": "29",
              "type": "text",
              "disabled": true
            },
            {
              "key": "tripDate",
              "value": "2025-01-06",
              "type": "text",
              "disabled": true
            },
            {
              "key": "city_id",
              "value": "2",
              "type": "text",
              "disabled": true
            },
            {
              "key": "bus_type",
              "value": "Vip",
              "type": "text",
              "disabled": true
            },
            {
              "key": "is_direct",
              "value": "on",
              "type": "text",
              "disabled": true
            },
            {
              "key": "from_price",
              "value": "0",
              "type": "text",
              "disabled": true
            },
            {
              "key": "to_price",
              "value": "59",
              "type": "text",
              "disabled": true
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

let cachedData = null;

/**
 * دالة لاستخراج البيانات بالاعتماد على snippet:
 * - تفتح متصفح puppeteer
 * - تتنقل بين الروابط (GET أو POST) حسب التعريف
 * - تحفظ النتائج في متغير cachedData
 */
const fetchData = async () => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // لتخزين النتائج
    const allResults = [];

    // نفعّل اعتراض الطلبات للتعامل مع الـPOST
    await page.setRequestInterception(true);

    // الحدث الذي سيُستدعى عند كل طلب
    page.on('request', (req) => {
      // إذا كان الطلب من نوع المستند (navigation) سنقرر هنا هل هو GET أم POST
      // وسنضيف الـ body المناسب إذا كنا نحتاج POST
      const currentItem = getCurrentItem(req.url()); 
      if (currentItem && currentItem.request.method === 'POST') {
        // نجمع formdata المفعّلة (التي ليست disabled)
        const formDataString = buildFormDataString(currentItem.request.body);

        // نضبط الطلب ليكون POST
        req.continue({
          method: 'POST',
          postData: formDataString,
          headers: {
            ...req.headers(),
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      } else {
        // إذا لم يكن POST، نمرّر الطلب كما هو
        req.continue();
      }
    });

    /**
     * نجول على جميع عناصر الـ snippet.item
     * كل عنصر يحتوي:
     *  - الاسم
     *  - طريقة الطلب (GET/POST)
     *  - الـ URL
     *  - إن وجدت بيانات formdata
     */
    for (const item of snippet.item) {
      const url = item.request.url.raw;

      // نتوجّه إلى الرابط
      // إذا كان GET فما عليك إلا الصفحة تعمل GOTO
      // إذا كان POST سيُعترض عند event request أعلاه ويُعدّل إلى POST
      await page.goto(url, { waitUntil: 'networkidle2' });

      // بعد التحميل، نحاول جلب النص من الـ <body>
      const pageContent = await page.evaluate(() => {
        return document.querySelector('body')?.innerText || '';
      });

      let parsedData = {};
      try {
        parsedData = JSON.parse(pageContent);
      } catch {
        parsedData = { rawText: pageContent };
      }

      // نخزن النتيجة مصنفة باسم الطلب
      allResults.push({
        name: item.name,
        request: {
          method: item.request.method,
          url: item.request.url.raw
        },
        data: parsedData
      });
    }

    await browser.close();
    cachedData = {
      info: snippet.info,
      results: allResults,
    };

    console.log('تم تحديث البيانات بنجاح.');
  } catch (error) {
    console.error('حدث خطأ أثناء استخراج البيانات:', error);
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
      // لاحظ استخدام backticks هنا:
      return `${key}=${value}`; // تم إصلاح السطر هنا
    });
  return fields.join('&');
}

// تشغيل الخادم
app.get('/api/data', (req, res) => {
  if (cachedData) {
    res.json(cachedData);
  } else {
    res.status(503).send('البيانات غير متاحة في الوقت الحالي.');
  }
});

// بدء الخادم وتشغيل عملية استخراج البيانات عند التشغيل
app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
  // استخراج البيانات أول مرة عند بدء السيرفر
  fetchData();

  // تحديث البيانات كل ساعة (3600000 مللي ثانية)
  setInterval(fetchData, 3600000);
});
