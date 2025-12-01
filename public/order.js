// Order Page JavaScript
const API_URL = window.location.origin;

// Hall data for different institutions
const hallData = {
  RU: [
    "শের-ই-বাংলা ফজলুল হক হল",
    "শাহ্‌ মখদুম হল",
    "নবাব আব্দুল লতিফ হল",
    "সৈয়দ আমীর আলী হল",
    "শহীদ শামসুজ্জোহা হল",
    "শহীদ হবিবুর রহমান হল",
    "মতিহার হল",
    "মাদার বখ্‌শ হল",
    "হোসেন শহীদ সোহ্‌রাওয়ার্দী হল",
    "শহীদ জিয়াউর রহমান হল",
    "বিজয়-২৪ হল",
  ],
  RMC: [
    "শহীদ শাহ মাইনুল আহসান চৌধুরী পিংকু ছাত্রাবাস",
    "শহীদ মুক্তিযোদ্ধা কাজী নূরুন্নবী ছাত্রাবাস",
    "শহীদ জামিল আখতার রতন ইন্টার্ন হোস্টেল",
    "Nursing Hostel",
  ],
};

// State for multi-day orders
let selectedDates = new Set();
let currentDurationType = "single";

document.addEventListener("DOMContentLoaded", () => {
  const orderForm = document.getElementById("orderForm");
  const contactNumberInput = document.getElementById("contactNumber");
  const nameInput = document.getElementById("name");
  const institutionInput = document.getElementById("institution");
  const hallInput = document.getElementById("hall");
  const roomInput = document.getElementById("room");
  const quantityInput = document.getElementById("quantity");
  const dateInput = document.getElementById("date");
  const startDateInput = document.getElementById("startDate");
  const totalPriceElement = document.getElementById("totalPrice");
  const formMessage = document.getElementById("formMessage");

  // Set today's date as default
  const today = new Date().toISOString().split("T")[0];
  dateInput.value = today;
  dateInput.min = today;
  startDateInput.min = today;

  // Initialize duration type listeners
  initializeDurationOptions();

  // Initialize custom date picker
  initializeCustomDatePicker();

  // Handle institution selection to populate halls
  institutionInput.addEventListener("change", () => {
    const institution = institutionInput.value;
    hallInput.innerHTML = '<option value="">হল নির্বাচন করুন</option>';

    if (institution && hallData[institution]) {
      hallInput.disabled = false;
      hallData[institution].forEach((hall) => {
        const option = document.createElement("option");
        option.value = hall;
        option.textContent = hall;
        hallInput.appendChild(option);
      });
    } else {
      hallInput.disabled = true;
      hallInput.innerHTML =
        '<option value="">প্রথমে প্রতিষ্ঠান নির্বাচন করুন</option>';
    }
  });

  // Update total price when quantity changes
  quantityInput.addEventListener("input", () => {
    updateOrderSummary();
  });

  // Auto-fill customer data when contact number is entered
  contactNumberInput.addEventListener("blur", async () => {
    const contactNumber = contactNumberInput.value.trim();

    if (contactNumber.length === 11 && contactNumber.startsWith("01")) {
      try {
        const response = await fetch(
          `${API_URL}/api/customer/${contactNumber}`
        );
        const data = await response.json();

        if (data.exists && data.customer) {
          // Auto-fill the form
          nameInput.value = data.customer.name;

          // Parse institution and hall from stored hall value (format: "RU - হল নাম")
          const hallParts = data.customer.hall.split(" - ");
          if (hallParts.length === 2) {
            institutionInput.value = hallParts[0];
            // Trigger institution change to populate halls
            institutionInput.dispatchEvent(new Event("change"));
            // Set hall value after halls are populated
            setTimeout(() => {
              hallInput.value = hallParts[1];
            }, 50);
          }

          roomInput.value = data.customer.room;

          showMessage(
            "Welcome back! Your information has been auto-filled. You can edit any field if needed.",
            "success"
          );
        } else {
          // Clear the form
          nameInput.value = "";
          institutionInput.value = "";
          hallInput.value = "";
          hallInput.disabled = true;
          hallInput.innerHTML =
            '<option value="">প্রথমে প্রতিষ্ঠান নির্বাচন করুন</option>';
          roomInput.value = "";
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
      }
    }
  });

  // Handle form submission
  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate dates based on duration type
    let dates = [];
    if (currentDurationType === "single") {
      dates = [dateInput.value];
    } else if (currentDurationType === "custom") {
      if (selectedDates.size === 0) {
        showMessage("দয়া করে অন্তত একটি তারিখ নির্বাচন করুন", "error");
        return;
      }
      dates = Array.from(selectedDates).sort();
    } else {
      // Preset durations (3, 7, 10, 30 days)
      const startDate = new Date(startDateInput.value);
      const days = parseInt(currentDurationType);
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        dates.push(date.toISOString().split("T")[0]);
      }
    }

    // Get form data
    const institution = institutionInput.value;
    const hall = hallInput.value;
    const formData = {
      contactNumber: contactNumberInput.value.trim(),
      name: nameInput.value.trim(),
      hall: `${institution} - ${hall}`,
      room: roomInput.value.trim(),
      quantity: parseInt(quantityInput.value),
      dates: dates,
      orderType: currentDurationType === "single" ? "single" : "multi",
    };

    // Validate phone number
    if (!formData.contactNumber.match(/^01[0-9]{9}$/)) {
      showMessage("সঠিক ১১ ডিজিটের ফোন নম্বর দিন (০১ দিয়ে শুরু)", "error");
      return;
    }

    // Disable submit button
    const submitBtn = orderForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = "<span>প্রসেসিং...</span>";

    try {
      const response = await fetch(`${API_URL}/api/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to confirmation page
        window.location.href = `/confirmation?orderId=${
          data.orderIds ? data.orderIds[0] : data.orderId
        }`;
      } else {
        showMessage(
          data.error || "অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
          "error"
        );
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    } catch (error) {
      console.error("Error placing order:", error);
      showMessage("নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ চেক করুন।", "error");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  // Show message helper
  function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = "block";

    // Auto-hide success messages after 5 seconds
    if (type === "success") {
      setTimeout(() => {
        formMessage.style.display = "none";
      }, 5000);
    }
  }

  // Fetch and display notice
  fetchNotice();
});

// Initialize duration type selection
function initializeDurationOptions() {
  const durationOptions = document.querySelectorAll(
    'input[name="durationType"]'
  );
  const singleDateGroup = document.getElementById("singleDateGroup");
  const startDateGroup = document.getElementById("startDateGroup");
  const customDatesGroup = document.getElementById("customDatesGroup");

  durationOptions.forEach((option) => {
    option.addEventListener("change", (e) => {
      // Update active state
      document
        .querySelectorAll(".duration-option")
        .forEach((opt) => opt.classList.remove("active"));
      e.target.closest(".duration-option").classList.add("active");

      // Update current duration type
      currentDurationType = e.target.value;

      // Show/hide appropriate date input
      if (currentDurationType === "single") {
        singleDateGroup.style.display = "block";
        startDateGroup.style.display = "none";
        customDatesGroup.style.display = "none";
        document.getElementById("date").required = true;
        document.getElementById("startDate").required = false;
      } else if (currentDurationType === "custom") {
        singleDateGroup.style.display = "none";
        startDateGroup.style.display = "none";
        customDatesGroup.style.display = "block";
        document.getElementById("date").required = false;
        document.getElementById("startDate").required = false;

        // Auto-open date picker modal when custom is selected
        setTimeout(() => {
          const modal = document.getElementById("datePickerModal");
          if (modal) {
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
          }
        }, 100);
      } else {
        // Preset durations (3, 7, 10, 30)
        singleDateGroup.style.display = "none";
        startDateGroup.style.display = "block";
        customDatesGroup.style.display = "none";
        document.getElementById("date").required = false;
        document.getElementById("startDate").required = true;
        document.getElementById("startDate").value = new Date()
          .toISOString()
          .split("T")[0];
      }

      updateOrderSummary();
    });
  });
}

// Initialize custom date picker calendar
function initializeCustomDatePicker() {
  const pickerContainer = document.getElementById("customDatePicker");
  const modal = document.getElementById("datePickerModal");
  const trigger = document.getElementById("datePickerTrigger");
  const closeBtn = document.getElementById("datePickerClose");
  const overlay = document.getElementById("datePickerOverlay");
  const doneBtn = document.getElementById("datePickerDone");
  const clearBtn = document.getElementById("datePickerClear");

  // Open modal
  trigger.addEventListener("click", () => {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  });

  // Close modal functions
  const closeModal = () => {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  };

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);

  doneBtn.addEventListener("click", () => {
    updateOrderSummary();
    closeModal();
  });

  clearBtn.addEventListener("click", () => {
    selectedDates.clear();
    document.querySelectorAll(".date-cell.selected").forEach((cell) => {
      cell.classList.remove("selected");
    });
    updateOrderSummary();
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create calendar for next 60 days
  const daysToShow = 60;

  // Add day headers
  const dayHeaders = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
  dayHeaders.forEach((day) => {
    const header = document.createElement("div");
    header.className = "date-cell header";
    header.textContent = day;
    pickerContainer.appendChild(header);
  });

  // Calculate starting day offset
  const firstDate = new Date(today);
  const startDayOfWeek = firstDate.getDay();

  // Add empty cells for offset
  for (let i = 0; i < startDayOfWeek; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "date-cell disabled";
    pickerContainer.appendChild(emptyCell);
  }

  // Add date cells
  for (let i = 0; i < daysToShow; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split("T")[0];

    const cell = document.createElement("div");
    cell.className = "date-cell";
    cell.textContent = date.getDate();
    cell.dataset.date = dateString;

    if (i === 0) {
      cell.classList.add("today");
    }

    cell.addEventListener("click", () => {
      if (selectedDates.has(dateString)) {
        selectedDates.delete(dateString);
        cell.classList.remove("selected");
      } else {
        selectedDates.add(dateString);
        cell.classList.add("selected");
      }
      updateOrderSummary();
    });

    pickerContainer.appendChild(cell);
  }
}

// Update order summary display
function updateOrderSummary() {
  const quantity = parseInt(document.getElementById("quantity").value) || 1;
  let totalDays = 1;

  if (currentDurationType === "single") {
    totalDays = 1;
  } else if (currentDurationType === "custom") {
    totalDays = selectedDates.size;
    document.getElementById("selectedDatesCount").textContent = totalDays;
  } else {
    totalDays = parseInt(currentDurationType);
  }

  const totalPrice = quantity * totalDays * 30;

  document.getElementById("summaryQuantity").textContent = `${quantity} পিস`;
  document.getElementById("summaryDays").textContent = `${totalDays} দিন`;
  document.getElementById("totalPrice").textContent = `${totalPrice} টাকা`;
}

async function fetchNotice() {
  try {
    const response = await fetch(`${API_URL}/api/notice`);
    const data = await response.json();

    if (data.notice && data.notice.trim() !== "") {
      document.getElementById("noticeBannerText").textContent = data.notice;
      document.getElementById("noticeBanner").style.display = "block";
    }
  } catch (error) {
    console.error("Error fetching notice:", error);
  }
}
