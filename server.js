require('dotenv').config();
const app = require('./app');
const path = require('path');

const generateSitemap = require('./dev_tools/sitemap-gen');

const PORT = process.env.PORT || 3000;

const websiteRoot = path.resolve(__dirname);
const baseUrl = 'https://' + process.env.DOMAIN;
const outputPath = path.join(websiteRoot, 'sitemap.xml');

generateSitemap(websiteRoot, baseUrl, outputPath);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});