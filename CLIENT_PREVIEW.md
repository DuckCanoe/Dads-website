# Client text-editable website previews

This project now supports private client preview links where the client can edit
visible website text directly in the browser.

## Create a preview link

On the server, from the project directory:

```bash
npm run preview-token
```

This generates a random preview token and prints a URL such as:

```text
https://your-domain.co.nz/preview/AbCdEf123...
```

Send that URL to the client.

## Client editing

The client can:

- Click any visible text and edit it directly.
- Navigate between pages using the normal website navigation.
- Save their changes.
- Reset all changes for the preview.

Changes are stored separately under:

```text
data/client-edits/<token>.json
```

The original EJS templates are never modified.

## Important security note

The preview URL is the access credential. Anyone who has the URL can edit
that preview, so use a long random token and do not publish the URL publicly.

For a production deployment, keep `data/client-edits/` writable by the Node
process and back it up along with the site.

## Existing production website

Normal routes such as `/`, `/about`, `/services`, etc. are unchanged and do
not load the editor.
