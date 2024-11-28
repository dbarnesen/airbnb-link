document.addEventListener("DOMContentLoaded", async function () {
    try {
      // Fetch blocked dates
      const response = await fetch("https://airbnb-link-eight.vercel.app/api/blocked-dates");
      const data = await response.json();
      const blockedDates = data.blockedDates;

      console.log("Blocked Dates:", blockedDates); // Debug log to verify the dates

      // Initialize Flatpickr for the check-in field
      const checkinPicker = flatpickr("#checkin", {
        mode: "single",
        minDate: "today",
        dateFormat: "d-m-Y",
        locale: "no", // Norwegian locale
        disable: blockedDates,
        onChange: function (selectedDates) {
          const checkinDate = selectedDates[0];
          if (checkinDate) {
            // Set the minimum date for checkout to the day after check-in
            checkoutPicker.set("minDate", new Date(checkinDate.getTime() + 86400000));
            checkoutField.focus();
          }
        },
      });

      // Initialize Flatpickr for the checkout field
      const checkoutPicker = flatpickr("#checkout", {
        mode: "single",
        minDate: "today",
        dateFormat: "d-m-Y",
        locale: "no", // Norwegian locale
        disable: blockedDates,
      });

      const checkoutField = document.querySelector("#checkout");
      const checkinField = document.querySelector("#checkin");

      checkoutField.addEventListener("click", function () {
        if (!checkinField.value) {
          checkinField.focus();
          checkinPicker.open();
        }
      });
    } catch (error) {
      console.error("Error initializing Flatpickr:", error);
    }
  });
