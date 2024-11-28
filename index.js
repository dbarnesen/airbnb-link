const express = require("express");
const ical = require("node-ical");

const app = express();
const PORT = process.env.PORT || 3000;

let cachedBlockedDates = [];
let lastFetchedTime = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const ICAL_URL = "https://www.airbnb.no/calendar/ical/20958160.ics?s=1d31d8f1b8556a4e4af802bfaeabc207";

async function fetchBlockedDates() {
  const data = await ical.async.parseFile(ICAL_URL);

  const blockedDates = [];
  for (let key in data) {
    if (data[key].type === "VEVENT") {
      const start = new Date(data[key].start);
      const end = new Date(data[key].end);

      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        blockedDates.push(new Date(d).toISOString().split("T")[0]); // ISO format: YYYY-MM-DD
      }
    }
  }
  return blockedDates;
}

app.get("/blocked-dates", async (req, res) => {
  const now = Date.now();

  if (!lastFetchedTime || now - lastFetchedTime > CACHE_DURATION) {
    console.log("Fetching updated blocked dates...");
    cachedBlockedDates = await fetchBlockedDates();
    lastFetchedTime = now;
  }

  res.json({ blockedDates: cachedBlockedDates });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
