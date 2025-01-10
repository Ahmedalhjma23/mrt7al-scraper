const express = require('express');
const app = express();
const flightsRouter = require('./flights');
const sponsorsRouter = require('./sponsors');

// استخدم الراوتر الأول على مسار محدد
app.use('/api', flightsRouter);
// استخدم الراوتر الثاني
app.use('/api', sponsorsRouter);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`الخادم يعمل على المنفذ ${PORT}`);
});