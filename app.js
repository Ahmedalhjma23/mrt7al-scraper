/***************************************
 * ملف: app.js
 * يستخدم Puppeteer لجلب بيانات رحلات
 * yemenia.com/ar/flights
 ***************************************/

const express = require('express');
const puppeteer = require('puppeteer');
const cron = require('node-cron');

// متغير لتخزين البيانات المحدثة
let flightsData = [];

/**
 * دالة لجلب بيانات الرحلات من موقع yemenia
 */
async function fetchFlightData() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://yemenia.com/ar/flights', { waitUntil: 'networkidle2' });

    const flights = await page.evaluate(() => {
      const allFlights = [];
      const sections = document.querySelectorAll('h3.text-primary');
      const tables = document.querySelectorAll('table.table-bordered');

      sections.forEach((section, index) => {
        const route = section.innerText.trim();
        const rows = tables[index]?.querySelectorAll('tbody tr') || [];

        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          allFlights.push({
            route,
            flightNumber: cells[0]?.innerText.trim() || 'N/A',
            status: cells[1]?.innerText.trim() || 'N/A',
            departureTime: cells[2]?.querySelector('strong')?.innerText.trim() || 'N/A',
            departureDate: cells[2]?.querySelector('.small')?.innerText.trim() || 'N/A',
            arrivalTime: cells[3]?.querySelector('strong')?.innerText.trim() || 'N/A',
            arrivalDate: cells[3]?.querySelector('.small')?.innerText.trim() || 'N/A',
          });
        });
      });

      return allFlights;
    });

    await browser.close();

    // قارن البيانات القديمة بالبيانات الجديدة لتحديث فقط الرحلات الجديدة
    const newFlights = flights.filter((flight) => {
      return !flightsData.some(
        (existingFlight) =>
          existingFlight.flightNumber === flight.flightNumber &&
          existingFlight.departureDate === flight.departureDate &&
          existingFlight.departureTime === flight.departureTime
      );
    });

    if (newFlights.length > 0) {
      flightsData = [...flightsData, ...newFlights];
      console.log(`تمت إضافة ${newFlights.length} رحلة جديدة`);
    } else {
      console.log('لا توجد رحلات جديدة');
    }
  } catch (error) {
    console.error('حدث خطأ أثناء جلب البيانات:', error.message);
  }
}

// جلب البيانات مرة عند بدء التشغيل
fetchFlightData();

// إنشاء تطبيق Express
const app = express();

// نقطة النهاية لعرض بيانات الرحلات كـ JSON
app.get('/api/flights', (req, res) => {
  res.json(flightsData);
});

// تحديث البيانات كل ساعة باستخدام node-cron (كل ٠ * * * * = رأس كل ساعة)
cron.schedule('0 * * * *', () => {
  console.log('تحديث البيانات (من الكرون) ...');
  fetchFlightData();
});

// تشغيل السيرفر على المنفذ 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`السيرفر الأول (رحلات) يعمل على http://localhost:${PORT}/api/flights`);
});