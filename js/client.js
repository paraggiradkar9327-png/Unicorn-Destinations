import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔑 Supabase setup
const SUPABASE_URL = "https://ghjmeiwvcamfnzrlppsf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cg8XK8wEtaEkvNydO4lQ3w_LUBzLIUI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ==============================
// LOAD ITINERARY (client.html)
// ==============================
async function loadItinerary() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const container = document.getElementById("clientContent");

  if (!id) {
    // const stored = sessionStorage.getItem("itineraryData");
   
      container.innerHTML = "<p style='text-align:center;padding:40px;color:#999;'>No itinerary found.</p>";
      return;
    
    
  }

  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Fetch error:", error);
    container.innerHTML = "<p style='text-align:center;padding:40px;color:#999;'>Error loading itinerary.</p>";
    return;
  }

  renderItinerary(data.content, container);
}


// ==============================
// RENDER ITINERARY
// ==============================
function renderItinerary(days, container) {
  const sectionLabel = container.querySelector(".section-label");
  container.innerHTML = "";
  if (sectionLabel) container.appendChild(sectionLabel);

  days.forEach(day => {

    // ── Format date for display ────────────────────────
    let dateHTML = "";
    if (day.date) {
      const formatted = new Date(day.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric"
      });
      dateHTML = `<span class="day-date-badge">📅 ${formatted}</span>`;
    }

    // ── Build photos HTML ──────────────────────────────
    let photosHTML = "";
    if (day.photos && day.photos.length > 0) {
      const slots = day.photos
        .map(p => `
          <div class="photo-slot">
            <img src="${p}" alt="Day ${day.day} photo">
          </div>`)
        .join("");

      photosHTML = `
        <p class="media-label">Photos</p>
        <div class="photos-grid">${slots}</div>`;
    }

    // ── Build videos HTML ──────────────────────────────
    // Replace videosHTML assignment:
    let videosHTML = "";
    if (day.videos && day.videos.length > 0) {
      const slots = day.videos
        .map((v, i) => `
      <div class="video-slot">
        <video src="${v}" controls></video>
        <div class="play-btn"><div class="play-icon"></div></div>
        <span class="video-caption">Clip ${i + 1}</span>
      </div>`)
        .join("");

      videosHTML = `
  <p class="media-label">Videos</p>
  <div class="video-grid" style="display:flex; justify-content:center;">${slots}</div>`;
    }

    const hasmedia = photosHTML || videosHTML;

    const div = document.createElement("div");
    div.className = "itineraryDay";
    div.innerHTML = `
<div class="day-header">
  <span class="day-badge">Day ${day.day}</span>
  <h2>${day.title}</h2>
  ${dateHTML}
</div>
      <div class="day-body">
        <p>${day.desc}</p>
        ${hasmedia ? '<div class="day-divider"></div>' : ""}
        ${photosHTML}
        ${videosHTML}
      </div>
    `;

    container.appendChild(div);
  });
  const editBtn = document.createElement("div");
  editBtn.style.cssText = "text-align:center; margin-top: 32px; padding-bottom: 20px;";
  const itinId = new URLSearchParams(window.location.search).get('id');
editBtn.innerHTML = `
  <a href="./admin.html?edit=${itinId}" 
     class="edit-itinerary-btn">
    ✏️ Edit Itinerary
  </a>`;
  container.appendChild(editBtn);
}


// Run on client page load
loadItinerary();