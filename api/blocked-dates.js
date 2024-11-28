import ical from "node-ical";
import fetch from "node-fetch";

const ICAL_URL = "https://raw.githubusercontent.com/dbarnesen/airbnb-link/refs/heads/main/listing-20958160.ics?token=GHSAT0AAAAAAC2YEIHQK6ULVAZ7SXCBERBMZ2IJVFQ";

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
  try {
    console.log("Fetching updated blocked dates (no caching)...");
    const blockedDates = await fetchBlockedDates();

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*"); // Allow all origins or specify your domain
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    res.status(200).json({ blockedDates });
  } catch (error) {
    console.error("Error in API handler:", error);
    res.status(500).json({ error: "Failed to fetch blocked dates" });
  }
};
