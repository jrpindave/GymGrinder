/* ── Supabase client ── */
const SUPA_URL = "https://wetwdokwnstjidoceoib.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldHdkb2t3bnN0amlkb2Nlb2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NTAyNDQsImV4cCI6MjA5NTIyNjI0NH0.PMC2z6gXGE_wnyo7esdP_F-Vp-N0RZbHKPa9am6CQE0";

function fetchWithTimeout(url, opts, ms = 10000) {
  return Promise.race([
    fetch(url, opts),
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))
  ]);
}

const supa = {
  async rpc(fn, params = {}) {
    const res = await fetchWithTimeout(`${SUPA_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY,
        "Content-Type": "application/json", "Content-Profile": "public"
      },
      body: JSON.stringify(params)
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${fn}: ${text}`);
    return text ? JSON.parse(text) : null;
  },
  async insert(table, row) {
    const res = await fetchWithTimeout(`${SUPA_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY,
        "Content-Type": "application/json", "Prefer": "return=minimal"
      },
      body: JSON.stringify(row)
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`insert ${table}: ${text}`);
    return text ? JSON.parse(text) : null;
  }
};
