import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ghjmeiwvcamfnzrlppsf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cg8XK8wEtaEkvNydO4lQ3w_LUBzLIUI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==============================
// LOAD ITINERARY
// ==============================
async function loadItinerary() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const container = document.getElementById("clientContent");

  if (!id) {
    container.innerHTML = "<p style='text-align:center;padding:40px;color:#999;'>No itinerary found.</p>";
    return;
  }

  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    container.innerHTML = "<p style='text-align:center;padding:40px;color:#999;'>Error loading itinerary.</p>";
    return;
  }

  renderItinerary(data.content, container, id);
}

// ==============================
// RENDER ITINERARY
// ==============================
function renderItinerary(days, container, id) {
  const sectionLabel = container.querySelector(".section-label");
  container.innerHTML = "";
  if (sectionLabel) container.appendChild(sectionLabel);

  days.forEach(day => {
    let dateHTML = "";
    if (day.date) {
      const formatted = new Date(day.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric"
      });
      dateHTML = `<span class="day-date-badge">📅 ${formatted}</span>`;
    }

    let photosHTML = "";
    if (day.photos && day.photos.length > 0) {
      const slots = day.photos.map(p => `
        <div class="photo-slot">
          <img src="${p}" alt="Day ${day.day} photo">
        </div>`).join("");
      photosHTML = `<p class="media-label">Photos</p><div class="photos-grid">${slots}</div>`;
    }

    let videosHTML = "";
    if (day.videos && day.videos.length > 0) {
      const slots = day.videos.map((v, i) => `
        <div class="video-slot">
          <video src="${v}" controls></video>
          <div class="play-btn"><div class="play-icon"></div></div>
          <span class="video-caption">Clip ${i + 1}</span>
        </div>`).join("");
      videosHTML = `
        <p class="media-label">Videos</p>
        <div class="video-grid" style="display:flex; justify-content:center;">${slots}</div>`;
    }

    const hasMedia = photosHTML || videosHTML;

    const div = document.createElement("div");
    div.className = "itineraryDay";
    div.innerHTML = `
      <div class="day-header">
        <span class="day-badge">Day ${day.day}</span>
        <h2>${day.title && day.title.trim() !== "" ? day.title : `Day ${day.day}`}</h2>
      </div>
      <div class="day-body">
        <p>${day.desc}</p>
        ${hasMedia ? '<div class="day-divider"></div>' : ""}
        ${photosHTML}
        ${videosHTML}
      </div>
    `;
    container.appendChild(div);
  });

  // ── Admin action buttons ─────────────────────────────────
  const actions = document.createElement("div");
  actions.className = "client-actions";
  actions.innerHTML = `
    <a href="/admin.html?edit=${id}" class="edit-itinerary-btn">✏️ Edit Itinerary</a>
    <button type="button" class="share-itinerary-btn" id="shareBtn">🔗 Share with Client</button>
  `;
  container.appendChild(actions);

  // Share button → show modal with preview link
  document.getElementById("shareBtn").addEventListener("click", () => {
    const previewUrl = `${window.location.origin}/preview.html?id=${id}`;
    showShareModal(previewUrl);
  });
}

// ==============================
// SHARE MODAL
// ==============================
function showShareModal(url) {
  document.getElementById("shareModal")?.remove();

  const modal = document.createElement("div");
  modal.id = "shareModal";
  modal.innerHTML = `
    <div class="link-modal-backdrop"></div>
    <div class="link-modal-box">
      <div class="link-modal-icon">🔗</div>
      <h2 class="link-modal-title">Share Itinerary</h2>
      <p class="link-modal-sub">Copy the link below and send it to your client. They'll see their personalised itinerary.</p>

      <div class="link-copy-row">
        <input id="shareLinkInput" class="link-input" type="text" value="${url}" readonly>
        <button type="button" id="copyShareLinkBtn" class="copy-btn">
          <span class="copy-icon">📋</span>
          <span class="copy-label">Copy</span>
        </button>
      </div>

      <div id="shareCopySuccess" class="copy-success" style="display:none;">
        ✅ Link copied to clipboard!
      </div>

      <div class="link-modal-actions">
        <a href="${url}" target="_blank" class="preview-btn">
          <span>👁</span> Preview Client Page
        </a>
        <button type="button" class="close-modal-btn" id="closeShareModalBtn">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("copyShareLinkBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(url).then(() => {
      document.getElementById("shareCopySuccess").style.display = "block";
      document.getElementById("copyShareLinkBtn").innerHTML = `<span class="copy-icon">✅</span><span class="copy-label">Copied!</span>`;
      setTimeout(() => {
        document.getElementById("shareCopySuccess").style.display = "none";
        document.getElementById("copyShareLinkBtn").innerHTML = `<span class="copy-icon">📋</span><span class="copy-label">Copy</span>`;
      }, 3000);
    });
  });

  document.getElementById("shareLinkInput").addEventListener("click", function () {
    this.select();
  });

  document.getElementById("closeShareModalBtn").addEventListener("click", () => modal.remove());
  modal.querySelector(".link-modal-backdrop").addEventListener("click", () => modal.remove());
}

// ── Run ──────────────────────────────────────────────────────
loadItinerary();