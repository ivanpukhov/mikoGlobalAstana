const express = require('express');
const path = require('path');
const expressSitemapXml = require("express-sitemap-xml");

const app = express();

// Функция для генерации URL'ов для sitemap
const buildSitemapUrls = () => [
  { url: '/cosmetics', changefreq: 'daily', priority: 0.8 },
  { url: '/chimiya', changefreq: 'daily', priority: 0.8 },
  { url: '/products', changefreq: 'daily', priority: 0.8 },
  { url: '/head', changefreq: 'daily', priority: 0.8 },
  { url: '/bads', changefreq: 'daily', priority: 0.8 },
  { url: '/catalog', changefreq: 'daily', priority: 0.8 },
  { url: '/', changefreq: 'daily', priority: 1.0 },
  // ... дополнительные URL
];

// Укажите путь к собранным файлам
app.use(express.static(path.join(__dirname, 'build')));

// Явно определяем маршрут для sitemap.xml перед обработчиком app.get('*')
app.get('/sitemap.xml', expressSitemapXml(buildSitemapUrls, 'https://miko-astana.kz'));

// Обслуживайте index.html для всех оставшихся маршрутов, чтобы поддерживать клиентский роутинг
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
