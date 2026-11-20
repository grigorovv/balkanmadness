// Combines content/events/*.json (one file per event, edited in /admin) into content/events.json for the site.
// Runs on every Netlify deploy (see netlify.toml). Locally: `node scripts/build-content.js --watch`.
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'content', 'events');
const out = path.join(__dirname, '..', 'content', 'events.json');

function build() {
  const events = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().reverse()
    .map((f) => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
      catch (e) { console.warn(`Skipping ${f}: ${e.message}`); return null; }
    })
    .filter(Boolean);
  fs.writeFileSync(out, JSON.stringify({ events }, null, 2) + '\n');
  console.log(`content/events.json: ${events.length} events`);
}

build();
if (process.argv.includes('--watch')) {
  let t;
  fs.watch(dir, () => { clearTimeout(t); t = setTimeout(build, 150); });
  console.log('Watching content/events/ for changes…');
}
