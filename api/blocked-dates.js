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

    console.log("Parsed iCal Data:", data); // Log parsed data

    const blockedDates = [];
    for (let key in data) {
      if (data[key].type === "VEVENT") {
        const start = new Date(data[key].start);
        const end = new Date(data[key].end);

        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          blockedDates.push(new Date(d).toISOString().split("T")[0]);
        }
      }
    }

    console.log("Blocked Dates:", blockedDates); // Log blocked dates
    return blockedDates;
  } catch (error) {
    console.error("Error fetching or parsing iCal:", error);
    return [];
  }
}


export default async (req, res) => {
  const now = Date.now();

  if (!lastFetchedTime || now - lastFetchedTime > CACHE_DURATION) {
    console.log("Fetching updated blocked dates...");
    cachedBlockedDates = await fetchBlockedDates();
    lastFetchedTime = now;
  }

  res.status(200).json({ blockedDates: cachedBlockedDates });
};
