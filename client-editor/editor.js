(() => {
  'use strict';

  const config = window.CLIENT_PREVIEW;
  if (!config) return;

  const state = {
    edits: {},
    dirty: false
  };

  const ignoredTags = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'HEAD',
    'META', 'LINK', 'TITLE', 'INPUT', 'TEXTAREA', 'SELECT',
    'OPTION'
  ]);

  function pageKey() {
    return window.location.pathname || '/';
  }

  function getTextNodes(root) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;

          let parent = node.parentElement;
          while (parent) {
            if (ignoredTags.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
            if (parent.closest('#client-editor-toolbar')) return NodeFilter.FILTER_REJECT;
            parent = parent.parentElement;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    return nodes;
  }

  function makeId(node, index) {
    const parent = node.parentElement;
    if (!parent) return `text-${index}`;

    const parts = [];
    let current = parent;

    while (current && current !== document.body) {
      let childIndex = 0;
      let sibling = current;
      while ((sibling = sibling.previousElementSibling)) childIndex++;
      parts.unshift(`${current.tagName.toLowerCase()}:${childIndex}`);
      current = current.parentElement;
    }

    return `${parts.join('/')}/text:${index}`;
  }

  function wrapTextNodes() {
    const nodes = getTextNodes(document.body);

    nodes.forEach((node, index) => {
      // Skip whitespace-only and editor-generated nodes.
      if (!node.nodeValue.trim()) return;

      const span = document.createElement('span');
      span.className = 'client-editable-text';
      span.dataset.clientEditId = makeId(node, index);
      span.contentEditable = 'true';
      span.spellcheck = true;

      node.parentNode.insertBefore(span, node);
      span.appendChild(node);

      span.addEventListener('input', () => {
        state.dirty = true;
        markChanged(span);
        updateStatus();
      });

      span.addEventListener('focus', () => {
        span.classList.add('client-editing');
      });

      span.addEventListener('blur', () => {
        span.classList.remove('client-editing');
      });
    });
  }

  function markChanged(element) {
    element.classList.add('client-changed');
  }

  function collectEdits() {
    const result = {};
    const page = pageKey();
    result[page] = {};

    document.querySelectorAll('.client-editable-text').forEach(element => {
      const id = element.dataset.clientEditId;
      const text = element.textContent;
      result[page][id] = text;
    });

    return result;
  }

  async function loadEdits() {
    try {
      const response = await fetch(`/preview/${encodeURIComponent(config.token)}/api/edits`);
      if (!response.ok) throw new Error('Unable to load edits');

      const data = await response.json();
      state.edits = data.edits || {};

      applyEdits();
    } catch (error) {
      console.error(error);
      showStatus('Could not load saved changes', true);
    }
  }

  function applyEdits() {
    const pageEdits = state.edits[pageKey()] || {};

    document.querySelectorAll('.client-editable-text').forEach(element => {
      const id = element.dataset.clientEditId;

      if (Object.prototype.hasOwnProperty.call(pageEdits, id)) {
        element.textContent = pageEdits[id];
        element.classList.add('client-changed');
      }
    });

    state.dirty = false;
    updateStatus();
  }

  async function save() {
    const edits = collectEdits();

    setSaving(true);

    try {
      const response = await fetch(`/preview/${encodeURIComponent(config.token)}/api/edits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edits)
      });

      if (!response.ok) throw new Error('Save failed');

      state.edits = {
        ...state.edits,
        ...edits
      };

      state.dirty = false;
      document.querySelectorAll('.client-changed').forEach(el => el.classList.remove('client-changed'));
      showStatus('Changes saved');
    } catch (error) {
      console.error(error);
      showStatus('Could not save changes', true);
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    if (!confirm('Reset all client edits on this website? This cannot be undone.')) return;

    setSaving(true);

    try {
      const response = await fetch(`/preview/${encodeURIComponent(config.token)}/api/edits`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Reset failed');

      location.reload();
    } catch (error) {
      console.error(error);
      showStatus('Could not reset changes', true);
      setSaving(false);
    }
  }

  function setSaving(saving) {
    const saveButton = document.querySelector('#client-editor-save');
    const resetButton = document.querySelector('#client-editor-reset');

    if (saveButton) {
      saveButton.disabled = saving;
      saveButton.textContent = saving ? 'Saving…' : 'Save changes';
    }

    if (resetButton) resetButton.disabled = saving;
  }

  function showStatus(message, error = false) {
    const status = document.querySelector('#client-editor-status');
    if (!status) return;

    status.textContent = message;
    status.classList.toggle('error', error);

    clearTimeout(showStatus.timer);
    showStatus.timer = setTimeout(() => {
      status.textContent = state.dirty ? 'Unsaved changes' : 'All changes saved';
      status.classList.remove('error');
    }, 3000);
  }

  function updateStatus() {
    const status = document.querySelector('#client-editor-status');
    if (!status) return;

    status.textContent = state.dirty ? 'Unsaved changes' : 'All changes saved';
  }

  function addToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'client-editor-toolbar';

    toolbar.innerHTML = `
      <div class="client-editor-title">
        <strong>Client Preview</strong>
        <span>Click any text to edit</span>
      </div>
      <div class="client-editor-actions">
        <span id="client-editor-status">All changes saved</span>
        <button id="client-editor-reset" type="button">Reset</button>
        <button id="client-editor-save" type="button">Save changes</button>
      </div>
    `;

    document.body.appendChild(toolbar);

    document.querySelector('#client-editor-save').addEventListener('click', save);
    document.querySelector('#client-editor-reset').addEventListener('click', reset);
  }

  function interceptInternalLinks() {
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');

      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      if (href.startsWith('/')) {
        link.href = `/preview/${encodeURIComponent(config.token)}${href}`;
      }
    });
  }

  function init() {
    addToolbar();
    wrapTextNodes();
    interceptInternalLinks();
    loadEdits();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
