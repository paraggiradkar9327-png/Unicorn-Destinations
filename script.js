import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔑 Supabase setup
const SUPABASE_URL = "https://ghjmeiwvcamfnzrlppsf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cg8XK8wEtaEkvNydO4lQ3w_LUBzLIUI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ==============================
// FILE UPLOAD
// ==============================
async function uploadFile(bucket, file) {
  const filePath = `${Date.now()}_${file.name}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  console.log("File uploaded:", data.publicUrl);
  return data.publicUrl;
}


// ==============================
// SAVE ITINERARY
// ==============================
async function saveItinerary(days) {
  try {
    const { data, error } = await supabase
      .from("itineraries")
      .insert([{ content: days }])
      .select();

    if (error) {
      console.error("Supabase insert error:", error);
      return null;
    }
    return data[0].id;
  } catch (err) {
    console.error("Unexpected Supabase error:", err);
    return null;
  }
}


// ==============================
// ADMIN FORM (index/admin page)
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const addDayBtn = document.getElementById("addDayBtn");
  const daysContainer = document.getElementById("daysContainer");
  const form = document.getElementById("itineraryForm");

  if (addDayBtn) {
    addDayBtn.addEventListener("click", () => {
      const dayBlock = document.createElement("div");
      dayBlock.className = "dayBlock";
      dayBlock.innerHTML = `
        <h3>Day</h3>
        <label>Description:</label><br>
        <textarea class="desc"></textarea><br><br>
        <label>Photos:</label><br>
        <input type="file" class="photos" multiple accept="image/*"><br><br>
        <label>Videos:</label><br>
        <input type="file" class="videos" multiple accept="video/*"><br>
      `;
      daysContainer.appendChild(dayBlock);
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const days = [];

      for (const [index, block] of [...document.querySelectorAll(".dayBlock")].entries()) {
        const desc = block.querySelector(".desc").value;
        const photoFiles = Array.from(block.querySelector(".photos").files);
        const videoFiles = Array.from(block.querySelector(".videos").files);

        const photos = [];
        for (const file of photoFiles) {
          const url = await uploadFile("Photos", file);
          if (url) photos.push(url);
        }

        const videos = [];
        for (const file of videoFiles) {
          const url = await uploadFile("Videos", file);
          if (url) videos.push(url);
        }

        days.push({ day: index + 1, desc, photos, videos });
      }

      const itineraryId = await saveItinerary(days);

      if (itineraryId) {
        window.location.href = `client.html?id=${itineraryId}`;
      } else {
        sessionStorage.setItem("itineraryData", JSON.stringify(days));
        window.location.href = "client.html";
      }
    });
  }
});


// ==============================
// LOAD ITINERARY (client page)
// ==============================
async function loadItinerary() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const container = document.getElementById("clientContent");

  if (!id) {
    const stored = sessionStorage.getItem("itineraryData");
    if (!stored) {
      container.innerHTML = "<p style='text-align:center;padding:40px;color:#999;'>No itinerary found.</p>";
      return;
    }
    renderItinerary(JSON.parse(stored), container);
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
// RENDER FUNCTION  ← ONLY CHANGE
// ==============================
function renderItinerary(days, container) {
  // Keep the section label if it exists, clear only the day cards
  const sectionLabel = container.querySelector(".section-label");
  container.innerHTML = "";
  if (sectionLabel) container.appendChild(sectionLabel);

  days.forEach(day => {

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
        <div class="video-grid">${slots}</div>`;
    }

    // ── Show divider only if there is any media ────────
    const hasmedia = photosHTML || videosHTML;

    // ── Assemble the full card ─────────────────────────
    const div = document.createElement("div");
    div.className = "itineraryDay";
    div.innerHTML = `
      <div class="day-header">
        <span class="day-badge">Day ${day.day}</span>
        <h2>Day ${day.day}</h2>
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
}


// Run only on client page
if (document.getElementById("clientContent")) {
  loadItinerary();
}