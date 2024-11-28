import ical from "node-ical";
import fetch from "node-fetch";

const ICAL_URL = "https://www.airbnb.no/calendar/ical/20958160.ics?s=1d31d8f1b8556a4e4af802bfaeabc207";

// Cache setup
let cachedBlockedDates = [];
let lastFetchedTime = null;
const CACHE_DURATION = 1000 * 60 * 60; // Cache for 1 hour (in milliseconds)

// Fetch blocked dates from Airbnb
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

        // Push each day in the range to the blockedDates array
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
  try {
    const now = Date.now();

    // Check if cached data is still valid
    if (!lastFetchedTime || now - lastFetchedTime > CACHE_DURATION) {
      console.log("Cache expired or missing. Fetching new data...");
      cachedBlockedDates = await fetchBlockedDates();
      lastFetchedTime = now;
    } else {
      console.log("Serving data from cache...");
    }

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins or specify your domain
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Return cached or fresh data
    res.status(200).json({ blockedDates: cachedBlockedDates });
  } catch (error) {
    console.error("Error in API handler:", error);
    res.status(500).json({ error: "Failed to fetch blocked dates" });
  }
};
