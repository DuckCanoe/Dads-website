const express = require('express');
const path = require('path');

const app = express();

/* view engine */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* static */
app.use(express.static(path.join(__dirname)));

/* body parsing */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* site global data */
app.locals.site = {
  businessName: process.env.NAME,
  phone: process.env.PHONE,
  email: process.env.EMAIL,
  hourlyRate: 205,
  year: new Date().getFullYear(),
  url: process.env.DOMAIN
};

/* routes */
app.use('/', require('./routes/pages'));
app.use('/services', require('./routes/services'));

/* contact route (keep here for now) */
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API);

app.post('/contact', async (req, res) => {
  const { fname, lname, email, phone, service, message } = req.body;

  if (!fname || !lname || !email || !service || !message) {
    return res.status(400).json({ success: false });
  }

  await resend.emails.send({
    from: 'Server <admin@fairgoworkadvocates.co.nz>',
    to: ['brian@fairgoworkadvocates.co.nz'],
    subject: 'New Inquiry',
    html: `
      <h2>New Contact</h2>
      <p>${fname} ${lname}</p>
      <p>${email}</p>
      <p>${message}</p>
    `
  });

  res.json({ success: true }); 
  console.log("Form submission")
});

module.exports = app;