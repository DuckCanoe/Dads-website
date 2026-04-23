/* ============================================
   BCG LAW — server.js
   - Serves EJS views with shared partials
   - Site config passed to every page
   - Handles POST /contact and sends email
============================================ */

require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const path       = require('path');

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

/* ============================================
   SITE CONFIG
   Update values here — they flow through to
   every page and every partial automatically
============================================ */
const site = {
  businessName: 'BCG Law',
  phone:        '0800 83 83 83',
  phoneTel:     '0800838383',
  email:        'info@bcglaw.co.nz',
  year:         new Date().getFullYear()
};

/* ============================================
   PAGE ROUTES
   Add new pages here — pass { site, page }
   to every render call so the header can
   highlight the active nav link
============================================ */
app.get('/', (req, res) => {
  res.render('index', { site, page: 'home' });
});

app.get('/contact', (req, res) => {
  res.render('contact', { site, page: 'contact' });
});

app.get('/about', (req, res) => {
  res.render('about', { site, page: 'about' });
});

app.get('/services/boilerplate', (req, res) => {
  res.render('services/boilerplate', { site, page: 'boilerplate' });
});

// Add more pages as you build them:
// app.get('/about',    (req, res) => res.render('about',    { site, page: 'about' }));
// app.get('/services', (req, res) => res.render('services', { site, page: 'services' }));
// app.get('/fees',     (req, res) => res.render('fees',     { site, page: 'fees' }));

/* ============================================
   CONTACT FORM — POST /contact
============================================ */
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
