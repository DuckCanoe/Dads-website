const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const EDITS_DIR = path.join(__dirname, '..', 'data', 'client-edits');
fs.mkdirSync(EDITS_DIR, { recursive: true });

const pageRoutes = {
  '/': { view: 'index', page: 'home' },
  '/contact': { view: 'contact', page: 'contact' },
  '/about': { view: 'about', page: 'about' },
  '/services': { view: 'services', page: 'services' },
  '/articles': { view: 'articles', page: 'articles' },
  '/fees': { view: 'fees', page: 'fees' },
  '/privacy': { view: 'privacy', page: 'privacy' },
  '/terms': { view: 'terms', page: 'terms' }
};

const servicePages = [
  'unfair-dismissal',
  'disciplinary-meeting',
  '90-day-trial-dismissal',
  'redundancy',
  'workplace-bullying',
  'sexual-harassment',
  'medical-termination',
  'unpaid-wages',
  'migrant-exploitation',
  'personal-grievance',
  'exit-packages',
  'workplace-discrimination'
];

function safeToken(token) {
  return /^[A-Za-z0-9_-]{8,128}$/.test(token);
}

function getTarget(requestPath) {
  const clean = requestPath.replace(/\/+$/, '') || '/';

  if (pageRoutes[clean]) {
    return pageRoutes[clean];
  }

  const match = clean.match(/^\/services\/([^/]+)$/);
  if (match && servicePages.includes(match[1])) {
    return {
      view: `services/${match[1]}`,
      page: 'services'
    };
  }

  return null;
}

function editsFile(token) {
  return path.join(EDITS_DIR, `${token}.json`);
}

function readEdits(token) {
  try {
    return JSON.parse(fs.readFileSync(editsFile(token), 'utf8'));
  } catch {
    return {};
  }
}

function writeEdits(token, edits) {
  const file = editsFile(token);
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(edits, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

function renderPreview(req, res) {
  if (!safeToken(req.params.token)) {
    return res.status(404).send('Preview not found');
  }

  const wildcardPath = req.params[0] || '';
  const requestedPath = wildcardPath ? `/${wildcardPath}` : '/';
  const target = getTarget(requestedPath);
  if (!target) {
    return res.status(404).send('Page not found');
  }

  const token = req.params.token;

  res.render(target.view, {
    site: req.app.locals.site,
    page: target.page
  }, (err, html) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Unable to render preview');
    }

    const base = `/preview/${encodeURIComponent(token)}`;
    const editorAssets = `
      <link rel="stylesheet" href="/client-editor/editor.css">
      <script>
        window.CLIENT_PREVIEW = {
          token: ${JSON.stringify(token)},
          page: ${JSON.stringify(req.path)}
        };
      </script>
      <script src="/client-editor/editor.js" defer></script>
    `;

    html = html.replace('</head>', `${editorAssets}</head>`);
    res.send(html);
  });
}


router.get('/:token/api/edits', (req, res) => {
  if (!safeToken(req.params.token)) return res.status(404).json({ error: 'Preview not found' });

  res.json({
    edits: readEdits(req.params.token)
  });
});

router.post('/:token/api/edits', (req, res) => {
  if (!safeToken(req.params.token)) return res.status(404).json({ error: 'Preview not found' });

  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return res.status(400).json({ error: 'Invalid edits' });
  }

  const current = readEdits(req.params.token);

  for (const [page, pageEdits] of Object.entries(incoming)) {
    if (typeof page !== 'string' || !pageEdits || typeof pageEdits !== 'object') continue;

    current[page] = current[page] || {};

    for (const [id, value] of Object.entries(pageEdits)) {
      if (typeof id !== 'string' || typeof value !== 'string') continue;
      if (id.length > 200 || value.length > 10000) continue;
      current[page][id] = value;
    }
  }

  writeEdits(req.params.token, current);
  res.json({ success: true });
});

router.delete('/:token/api/edits', (req, res) => {
  if (!safeToken(req.params.token)) return res.status(404).json({ error: 'Preview not found' });

  writeEdits(req.params.token, {});
  res.json({ success: true });
});

router.get('/:token', renderPreview);
router.get('/:token/*', renderPreview);

module.exports = router;
