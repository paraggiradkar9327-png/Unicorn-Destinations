import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ghjmeiwvcamfnzrlppsf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cg8XK8wEtaEkvNydO4lQ3w_LUBzLIUI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ══════════════════════════════════════════
// LOAD ITINERARY
// ══════════════════════════════════════════
async function loadItinerary() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const main = document.getElementById("previewContent");

  if (!id) {
    main.innerHTML = `<p style="text-align:center;padding:80px 20px;color:var(--muted);font-size:13px;letter-spacing:1px;">No itinerary ID found in the URL.</p>`;
    return;
  }

  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    main.innerHTML = `<p style="text-align:center;padding:80px 20px;color:var(--muted);font-size:13px;letter-spacing:1px;">Could not load itinerary. Please check the link.</p>`;
    return;
  }

  renderStats(data.content);
  renderDays(data.content);
  setupPdfButton(data);
}

// ══════════════════════════════════════════
// RENDER STATS STRIP (dynamic from data)
// ══════════════════════════════════════════
function renderStats(days) {
  const grid = document.getElementById("statsGrid");
  if (!grid) return;

  const totalDays = days.length;

  // Count unique destinations from location fields
  const destinations = new Set(
    days.map(d => d.location || "").filter(Boolean)
  );
  const destCount = destinations.size || "–";

  // Count total photos
  const totalPhotos = days.reduce((sum, d) => sum + (d.photos ? d.photos.length : 0), 0);

  // Count total videos
  const totalVideos = days.reduce((sum, d) => sum + (d.videos ? d.videos.length : 0), 0);

  const stats = [
    { icon: "🌍", value: totalDays, label: "Days of Travel" },
    { icon: "📍", value: destCount || "–", label: "Destinations" },
    { icon: "📸", value: totalPhotos || "–", label: "Memories" },
    { icon: "🎬", value: totalVideos || "–", label: "Video Clips" },
  ];

  grid.innerHTML = stats.map(s => `
    <div class="highlight-item">
      <span class="highlight-icon">${s.icon}</span>
      <div class="highlight-value">${s.value}</div>
      <div class="highlight-label">${s.label}</div>
    </div>
  `).join("");
}

// ══════════════════════════════════════════
// RENDER DAY CARDS
// ══════════════════════════════════════════
function renderDays(days) {
  const list = document.getElementById("daysList");
  if (!list) return;
  list.innerHTML = "";

  days.forEach((day, index) => {
    const isLast = index === days.length - 1;
    const dayNumPadded = String(day.day).padStart(2, "0");
    const dayTitle = day.title && day.title.trim() !== "" ? day.title : `Day ${day.day}`;
    const locationLabel = day.location || dayTitle;

    // Date badge
    let dateHTML = "";
    if (day.date) {
      const formatted = new Date(day.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric"
      });
      dateHTML = `<div class="day-date-inline">📅 ${formatted}</div>`;
    }

    // Tags (from day.tags array or empty)
    let tagsHTML = "";
    if (day.tags && day.tags.length > 0) {
      tagsHTML = `<div class="day-tags">${day.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>`;
    }

    // Photos
    let photosHTML = "";
    if (day.photos && day.photos.length > 0) {
      const slots = day.photos.map(p => `
        <div class="photo-slot">
          <img src="${p}" alt="Day ${day.day} photo" loading="lazy">
        </div>`).join("");
      photosHTML = `
        <p class="media-label">Photos</p>
        <div class="photos-grid">${slots}</div>`;
    }

    // Videos — wrapped in no-print div
    let videosHTML = "";
    if (day.videos && day.videos.length > 0) {
      const slots = day.videos.map((v, i) => `
        <div class="video-slot">
          <video src="${v}" controls preload="metadata"></video>
          <div class="play-btn"><div class="play-icon"></div></div>
          <span class="video-caption">Clip ${i + 1}</span>
        </div>`).join("");
      videosHTML = `
        <div class="video-section no-print">
          <p class="media-label video-label">Videos</p>
          <div class="video-grid">${slots}</div>
        </div>`;
    }

    const hasMedia = photosHTML || videosHTML;

    const card = document.createElement("div");
    card.className = "day-card";

    card.innerHTML = `
      <div class="day-number-col">
        <div class="day-num">
          <span class="day-num-label">Day</span>
          <span class="day-num-value">${dayNumPadded}</span>
        </div>
        ${!isLast ? '<div class="day-connector"></div>' : ""}
      </div>
      <div class="day-body">
        <div class="day-location">
          <span class="location-dot"></span>
          <span class="location-name">${locationLabel}</span>
        </div>
        ${dateHTML}
    
        <p class="day-desc">${day.desc || ""}</p>
        ${tagsHTML}
        ${hasMedia ? '<div class="day-divider"></div>' : ""}
        ${photosHTML}
        ${videosHTML}
      </div>
    `;

    list.appendChild(card);
  });

  // Scroll-reveal for day cards
  observeCards();

  // Also re-run global fade-up observer
  if (typeof window.reObserveFadeUps === "function") {
    window.reObserveFadeUps();
  }
}

// ══════════════════════════════════════════
// SCROLL REVEAL FOR DAY CARDS
// ══════════════════════════════════════════
function observeCards() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll(".day-card").forEach((card, i) => {
    card.style.transitionDelay = (i * 0.08) + "s";
    observer.observe(card);
  });
}

// ══════════════════════════════════════════
// PDF DOWNLOAD — hides videos, prints, restores
// ══════════════════════════════════════════
function setupPdfButton(data) {
  const btn = document.getElementById("downloadPdfBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    btn.disabled = true;
    btn.innerHTML = `<span class="btn-icon">↓</span> Preparing PDF…`;

    // Hide all video sections before print
    const videoSections = document.querySelectorAll(".video-section");
    videoSections.forEach(el => el.style.display = "none");

    // Small delay to allow DOM to update, then print
    setTimeout(() => {
      window.print();

      // Restore after print dialog closes
      videoSections.forEach(el => el.style.display = "");
      btn.disabled = false;
      btn.innerHTML = `<span class="btn-icon">↓</span> Download Your Itinerary PDF`;
    }, 200);
  });
}

// ── Run ─────────────────────────────────
loadItinerary();