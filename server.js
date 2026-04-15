const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

function supaFetch(pathAndQuery, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${pathAndQuery}`;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: options.prefer || "",
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Get all entries
app.get("/api/entries", async (req, res) => {
  try {
    const r = await supaFetch("entries?select=*");
    const rows = await r.json();
    // Convert from DB format (dates is postgres array) to frontend format
    const entries = rows.map((row) => ({
      name: row.name,
      location: row.location,
      dates: row.dates || [],
    }));
    res.json(entries);
  } catch (e) {
    console.error("Error fetching entries:", e);
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// Add an entry
app.post("/api/entries", async (req, res) => {
  const { name, location, dates } = req.body;
  if (!name || !location || !Array.isArray(dates)) {
    return res.status(400).json({ error: "name, location, and dates[] are required" });
  }
  try {
    await supaFetch("entries", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), location, dates }),
      prefer: "return=minimal",
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("Error inserting entry:", e);
    res.status(500).json({ error: "Failed to insert" });
  }
});

// Replace all entries for a person (used by Edit)
app.put("/api/entries/:name", async (req, res) => {
  const { jersey, london } = req.body;
  const name = req.params.name;
  try {
    // Delete existing entries for this person
    await supaFetch(`entries?name=ilike.${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    // Insert new entries
    const toInsert = [];
    if (jersey && jersey.length > 0) {
      toInsert.push({ name, location: "jersey", dates: jersey });
    }
    if (london && london.length > 0) {
      toInsert.push({ name, location: "london", dates: london });
    }
    if (toInsert.length > 0) {
      await supaFetch("entries", {
        method: "POST",
        body: JSON.stringify(toInsert),
        prefer: "return=minimal",
      });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error("Error updating entries:", e);
    res.status(500).json({ error: "Failed to update" });
  }
});

// Delete all entries for a person
app.delete("/api/entries/:name", async (req, res) => {
  try {
    await supaFetch(`entries?name=ilike.${encodeURIComponent(req.params.name)}`, {
      method: "DELETE",
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("Error deleting entries:", e);
    res.status(500).json({ error: "Failed to delete" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
