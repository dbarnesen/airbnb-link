import ical from "node-ical";
import fetch from "node-fetch";

let cachedBlockedDates = [];
let lastFetchedTime = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const ICAL_URL = "https://www.airbnb.no/calendar/ical/20958160.ics?s=1d31d8f1b8556a4e4af802bfaeabc207";

async function fetchBlockedDates() {
  try {
    console.log("Fetching iCal from Airbnb...");
    const response = await fetch(ICAL_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal: ${response.statusText}`);
    }
    const icalData = await response.text();

    // Parse the iCal data
    const data = ical.parseICS(icalData);

    const blockedDates = [];
    for (let key in data) {
      const event = data[key];

      // Ensure this is a VEVENT with DTSTART and DTEND
      if (event.type === "VEVENT" && event.start && event.end) {
        const start = new Date(event.start);
        const end = new Date(event.end);

        // Iterate over the range and add each date
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          blockedDates.push(new Date(d).toISOString().split("T")[0]); // ISO format: YYYY-MM-DD
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
