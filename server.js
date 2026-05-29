require('dotenv').config();
const app = require('./app');
const path = require('path');

const generateSitemap = require('./dev_tools/sitemap-gen');
const { time } = require('console');

const PORT = process.env.PORT || 3000;

const websiteRoot = path.resolve(__dirname);
const baseUrl = 'https://' + process.env.DOMAIN;
const outputPath = path.join(websiteRoot, 'sitemap.xml');

let now = new Date();
let currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} at ${currentTime} \n` );
});