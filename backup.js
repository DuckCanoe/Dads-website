/* --- Imports --- */
require('dotenv').config();
const path = require('path');
const express    = require('express');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const { Domain } = require('domain');
const { stringify } = require('querystring');

/* --- Create Express app --- */
const app  = express();
const PORT = process.env.PORT || 3000;

/* --- View engine --- */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* --- Static files (css, js, images) --- */
app.use(express.static(path.join(__dirname)));

/* --- Body parsing --- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* --- Resend -- */
const resend = new Resend(process.env.RESEND_API);

/* --- Run sitemap-gen.js in a separate process --- */
const generateSitemap = require('./dev_tools/sitemap-gen');
const websiteRoot = path.resolve(__dirname);
const baseUrl = 'https://'+process.env.DOMAIN;
const outputPath = path.join(websiteRoot, 'sitemap.xml');

/* --- Routes --- */
const servicesRoutes = require('./routes/services');
app.use('/services', servicesRoutes);
const pageRoutes = require('./routes/pages');
app.use('/', pageRoutes);

/* --- Site-wide variables --- */
const site = {
  businessName: process.env.NAME,
  phone:        process.env.PHONE,
  email:        process.env.EMAIL,
  hourlyRate:   205,
  year:         new Date().getFullYear(),
  url:          process.env.DOMAIN
};

app.post('/contact', async (req, res) => {
  const { fname, lname, email, phone, service, message } = req.body;

  // Server-side validation
  if (!fname || !lname || !email || !service || !message) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }

  const mailOptions = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #1a2340; border-bottom: 2px solid #b89a5a; padding-bottom: 12px;">
          New Contact Form Submission
        </h2>
        <table style="width:100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 140px;">Name</td>
            <td style="padding: 8px 0; font-weight: bold;">${fname} ${lname}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Email</td>
            <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Phone</td>
            <td style="padding: 8px 0;">${phone || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Service</td>
            <td style="padding: 8px 0;">${service}</td>
          </tr>
        </table>
        <h3 style="color: #1a2340; margin-top: 24px;">Message</h3>
        <p style="background: #f8f5f0; padding: 16px; border-radius: 4px; line-height: 1.7;">
          ${message.replace(/\n/g, '<br>')}
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          Submitted via ${site.businessName} website contact form
        </p>
      </div>
    `;

  try {
    await sendEmail(mailOptions);
    console.log(`Contact form submitted by ${fname} ${lname} <${email}>`);
    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

async function sendEmail(body) {
  const { data, error } = await resend.emails.send({
    from: 'Server <admin@fairgoworkadvocates.co.nz>',
    to: ['brian@fairgoworkadvocates.co.nz'],
    subject: 'New Inquiry',
    html: body,
  });

  if (error) {
    return console.error({ error });
  }

  console.log({ data });
};

/* --- Start server --- */
generateSitemap(websiteRoot, baseUrl, outputPath);
app.listen(PORT, () => {
  console.log(`${site.businessName} server listening at http://${site.url}:${PORT}`);
});