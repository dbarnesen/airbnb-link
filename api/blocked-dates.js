import ical from "node-ical";
import fetch from "node-fetch";

let cachedBlockedDates = [];
let lastFetchedTime = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const ICAL_URL = "https://www.airbnb.no/calendar/ical/20958160.ics?s=1d31d8f1b8556a4e4af802bfaeabc207";

async function fetchBlockedDates() {
  try {
    const response = await fetch(ICAL_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal: ${response.statusText}`);
    }
    const icalData = await response.text();
    const data = ical.parseICS(icalData);
    const blockedDates = [];
    for (let key in data) {
      const event = data[key];
      if (event.type === "VEVENT" && event.start && event.end) {
        const start = new Date(event.start);
        const end = new Date(event.end);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          blockedDates.push(new Date(d).toISOString().split("T")[0]);
        }
      }
    }
    return blockedDates;
  } catch (error) {
    console.error("Error fetching or parsing iCal:", error);
    return [];
  }
}

export default async (req, res) => {
  const now = Date.now();

  // Allow only one fetch per cache duration
  if (!lastFetchedTime || now - lastFetchedTime > CACHE_DURATION) {
    cachedBlockedDates = await fetchBlockedDates();
    lastFetchedTime = now;
  }

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins or specify your domain
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  res.status(200).json({ blockedDates: cachedBlockedDates });
};
