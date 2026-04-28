/* --- Site-wide variables --- */
const site = {
  businessName: 'BCG Law',
  phone:        '0800 83 83 83',
  phoneTel:     '0800838383',
  email:        'info@bcglaw.co.nz',
  hourlyRate:   205,
  year:         new Date().getFullYear()
};

/* --- Run sitemap-gen.js in a separate process --- */
const path = require('path');
const generateSitemap = require('./dev_tools/sitemap-gen');
const websiteRoot = path.resolve(__dirname);
const baseUrl = 'https://example.com';
const outputPath = path.join(websiteRoot, 'sitemap.xml');
// Run on server start
generateSitemap(websiteRoot, baseUrl, outputPath);

/* --- Express server setup --- */
require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');

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

/* --- Routes --- */
app.get('/', (req, res) => {res.render('index', { site, page: 'home' });});
app.get('/contact', (req, res) => {res.render('contact', { site, page: 'contact' });});
app.get('/about', (req, res) => {res.render('about', { site, page: 'about' });});
app.get('/services', (req, res) => {res.render('services', { site, page: 'services' });});
app.get('/articles', (req, res) => {res.render('articles', { site, page: 'articles' });});
app.get('/fees', (req, res) => {res.render('fees', { site, page: 'fees' });});

app.get('/services/unfair-dismissal',        (req, res) => res.render('services/unfair-dismissal',        { site, page: 'services' }));
app.get('/services/disciplinary-meeting',    (req, res) => res.render('services/disciplinary-meeting',    { site, page: 'services' }));
app.get('/services/90-day-trial-dismissal',  (req, res) => res.render('services/90-day-trial-dismissal',  { site, page: 'services' }));
app.get('/services/redundancy',              (req, res) => res.render('services/redundancy',              { site, page: 'services' }));
app.get('/services/workplace-bullying',      (req, res) => res.render('services/workplace-bullying',      { site, page: 'services' }));
app.get('/services/sexual-harassment',       (req, res) => res.render('services/sexual-harassment',       { site, page: 'services' }));
app.get('/services/medical-termination',     (req, res) => res.render('services/medical-termination',     { site, page: 'services' }));
app.get('/services/unpaid-wages',            (req, res) => res.render('services/unpaid-wages',            { site, page: 'services' }));
app.get('/services/migrant-exploitation',    (req, res) => res.render('services/migrant-exploitation',    { site, page: 'services' }));
app.get('/services/personal-grievance',      (req, res) => res.render('services/personal-grievance',      { site, page: 'services' }));
app.get('/services/exit-packages',           (req, res) => res.render('services/exit-packages',           { site, page: 'services' }));

/* --- Contact form handling --- */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

  const mailOptions = {
    from:    `"${site.businessName} Website" <${process.env.EMAIL_USER}>`,
    to:      process.env.EMAIL_TO || process.env.EMAIL_USER,
    replyTo: email,
    subject: `New enquiry from ${fname} ${lname} — ${service}`,
    html: `
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
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Contact form submitted by ${fname} ${lname} <${email}>`);
    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

/* --- Start server --- */
app.listen(PORT, () => {
  console.log(`${site.businessName} server running at http://localhost:${PORT}`);
});
