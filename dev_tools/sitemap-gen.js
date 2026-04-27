const fs = require('fs');
const path = require('path');

var websiteRoot = path.resolve(__dirname, '..');
var baseUrl = 'https://example.com';
var outputPath = path.join(websiteRoot, 'sitemap.xml');

function generateSitemap(rootDir, baseUrl, outputFile = 'sitemap.xml') {
  const urls = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      // Skip unwanted directories
      if (entry.isDirectory()) {
        if (
          entry.name.startsWith('.') ||
          ['__pycache__', 'node_modules', 'partials'].includes(entry.name)
        ) {
          continue;
        }
        walk(path.join(dir, entry.name));
      }

      if (entry.isFile() && entry.name.endsWith('.ejs')) {
        const filepath = path.join(dir, entry.name);
        const relativePath = path.relative(rootDir, filepath);

        let urlPath = relativePath
          .replace(/\\/g, '/')
          .replace('index.ejs', '');

        const fullUrl = new URL(urlPath, baseUrl).href;

        const stats = fs.statSync(filepath);
        const lastmod = new Date(stats.mtime).toISOString().replace(/\.\d{3}Z$/, 'Z');

        urls.push({
          loc: fullUrl,
          changefreq: 'monthly',
          priority: entry.name === 'fees.ejs' ? '0.1' : '0.5',
          lastmod,
        });
      }
    }
  }

  walk(rootDir);

  // Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const url of urls) {
    xml += `  <url>\n`;
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;

  fs.writeFileSync(outputFile, xml, 'utf8');
  console.log(`Sitemap generated: ${outputFile}`);
}

// Example usage
if (require.main === module) {
  generateSitemap(websiteRoot, baseUrl, outputPath);
}

module.exports = generateSitemap;