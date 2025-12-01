// Homepage JavaScript
// Simple smooth scroll and animations

document.addEventListener("DOMContentLoaded", () => {
  // Animate elements on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Observe feature cards
  document.querySelectorAll(".feature-card, .step-card").forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = "all 0.6s ease-out";
    observer.observe(card);
  });

  // Mobile menu toggle (if needed in future)
  console.log("Mealky Way - Homepage loaded");

  // Fetch and display notice modal
  fetchNotice();
});

async function fetchNotice() {
  try {
    const response = await fetch("/api/notice");
    const data = await response.json();

    if (data.notice && data.notice.trim() !== "") {
      // Check if user has already seen the notice today
      const noticeShownToday = localStorage.getItem("noticeShownDate");
      const today = new Date().toDateString();

      if (noticeShownToday !== today) {
        // Show notice modal
        document.getElementById("noticeText").textContent = data.notice;
        showNoticeModal();

        // Mark notice as shown today
        localStorage.setItem("noticeShownDate", today);
      }
    }
  } catch (error) {
    console.error("Error fetching notice:", error);
  }
}

function showNoticeModal() {
  const modal = document.getElementById("noticeModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent scrolling

  // Close modal on button click
  document
    .getElementById("noticeModalButton")
    .addEventListener("click", closeNoticeModal);
  document
    .getElementById("noticeModalClose")
    .addEventListener("click", closeNoticeModal);
  document
    .getElementById("noticeModalOverlay")
    .addEventListener("click", closeNoticeModal);
}

function closeNoticeModal() {
  const modal = document.getElementById("noticeModal");
  modal.classList.remove("active");
  document.body.style.overflow = ""; // Restore scrolling
}
