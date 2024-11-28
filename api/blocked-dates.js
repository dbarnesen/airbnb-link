import ical from "node-ical";
import fetch from "node-fetch";

let cachedBlockedDates = [];
let lastFetchedTime = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const ICAL_URL = "https://raw.githubusercontent.com/dbarnesen/airbnb-link/refs/heads/main/listing-20958160.ics?token=GHSAT0AAAAAAC2YEIHQ5OAQJKMVWFEYK2VSZ2IJIHA";

async function fetchBlockedDates() {
  try {
    console.log("Fetching iCal from Airbnb...");
    const response = await fetch(ICAL_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal: ${response.statusText}`);
    }

    const icalData = await response.text();
    console.log("Raw iCal Data:", icalData.slice(0, 500)); // Log first 500 characters of raw iCal data

    // Parse the iCal data
    const data = ical.parseICS(icalData);
    console.log("Parsed iCal Data:", JSON.stringify(data, null, 2)); // Log parsed iCal data

    const blockedDates = [];
    for (let key in data) {
      const event = data[key];

      // Ensure this is a VEVENT with DTSTART and DTEND
      if (event.type === "VEVENT" && event.start && event.end) {
        console.log(`Processing VEVENT: Start=${event.start}, End=${event.end}`);
        const start = new Date(event.start);
        const end = new Date(event.end);

        // Iterate over the range and add each date
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          blockedDates.push(new Date(d).toISOString().split("T")[0]); // ISO format: YYYY-MM-DD
        }
      } else {
        console.log("Skipping Non-VEVENT or Incomplete Event:", event);
      }
    }

    console.log("Blocked Dates:", blockedDates); // Log final blocked dates array
    return blockedDates;
  } catch (error) {
    console.error("Error fetching or parsing iCal:", error);
    return [];
  }
}


export default async (req, res) => {
  console.log("Fetching updated blocked dates (bypassing cache)...");
  const blockedDates = await fetchBlockedDates();
  res.status(200).json({ blockedDates });
};
