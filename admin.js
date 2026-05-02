// ================================================================
//  UNICORN DESTINATIONS — admin.js
//  Powers index.html (admin form)
// ================================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ─── Supabase setup ────────────────────────────────────────────
const SUPABASE_URL     = "https://ghjmeiwvcamfnzrlppsf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cg8XK8wEtaEkvNydO4lQ3w_LUBzLIUI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🔁 Set your Netlify URL here after deploying
const BASE_URL = "https://your-site-name.netlify.app";


// ================================================================
//  FILE UPLOAD
// ================================================================
async function uploadFile(bucket, file) {
  const filePath = `${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(bucket).upload(filePath, file);
  if (error) { console.error("Upload error:", error); return null; }
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}


// ================================================================
//  SAVE ITINERARY TO SUPABASE
// ================================================================
async function saveItinerary(days) {
  try {
    const { data, error } = await supabase
      .from("itineraries")
      .insert([{ content: days }])
      .select();
    if (error) { console.error("Supabase insert error:", error); return null; }
    return data[0].id;
  } catch (err) {
    console.error("Unexpected Supabase error:", err);
    return null;
  }
}


// ================================================================
//  BUILD PHOTO SLOT UI
// ================================================================
function createPhotoSlot(slotNumber) {
  const wrapper = document.createElement("div");
  wrapper.className = "photo-upload-slot";
  wrapper.dataset.slot = slotNumber;
  wrapper.innerHTML = `
    <label class="photo-slot-label">
      <input type="file" class="photo-input" accept="image/*" data-slot="${slotNumber}">
      <div class="photo-slot-preview">
        <div class="photo-slot-empty">
          <span class="slot-icon">📷</span>
          <span class="slot-text">Photo ${slotNumber}</span>
        </div>
        <img class="photo-preview-img" src="" alt="" style="display:none;">
        <button type="button" class="photo-remove-btn" style="display:none;" title="Remove">✕</button>
      </div>
    </label>`;

  const input     = wrapper.querySelector(".photo-input");
  const preview   = wrapper.querySelector(".photo-preview-img");
  const empty     = wrapper.querySelector(".photo-slot-empty");
  const removeBtn = wrapper.querySelector(".photo-remove-btn");

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = "block";
      empty.style.display = "none";
      removeBtn.style.display = "flex";
    };
    reader.readAsDataURL(file);
  });

  removeBtn.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    input.value = "";
    preview.src = "";
    preview.style.display = "none";
    empty.style.display = "flex";
    removeBtn.style.display = "none";
  });

  return wrapper;
}


// ================================================================
//  BUILD VIDEO SLOT UI
// ================================================================
function createVideoSlot() {
  const wrapper = document.createElement("div");
  wrapper.className = "video-upload-slot";
  wrapper.innerHTML = `
    <label class="video-slot-label">
      <input type="file" class="video-input" accept="video/*">
      <div class="video-slot-preview">
        <div class="video-slot-empty">
          <span class="slot-icon">🎬</span>
          <span class="slot-text">Upload Video</span>
          <span class="slot-subtext">MP4, MOV, AVI</span>
        </div>
        <video class="video-preview-el" style="display:none;" muted></video>
        <button type="button" class="video-remove-btn" style="display:none;" title="Remove">✕</button>
        <span class="video-filename" style="display:none;"></span>
      </div>
    </label>`;

  const input      = wrapper.querySelector(".video-input");
  const previewEl  = wrapper.querySelector(".video-preview-el");
  const empty      = wrapper.querySelector(".video-slot-empty");
  const removeBtn  = wrapper.querySelector(".video-remove-btn");
  const filenameEl = wrapper.querySelector(".video-filename");

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    previewEl.src = URL.createObjectURL(file);
    previewEl.style.display = "block";
    empty.style.display = "none";
    removeBtn.style.display = "flex";
    filenameEl.textContent = file.name.length > 28 ? file.name.slice(0, 25) + "…" : file.name;
    filenameEl.style.display = "block";
  });

  removeBtn.addEventListener("click", (e) => {
    e.preventDefault(); e.stopPropagation();
    input.value = "";
    previewEl.src = "";
    previewEl.style.display = "none";
    empty.style.display = "flex";
    removeBtn.style.display = "none";
    filenameEl.style.display = "none";
  });

  return wrapper;
}


// ================================================================
//  BUILD A FULL DAY BLOCK
// ================================================================
function createDayBlock() {
  const block = document.createElement("div");
  block.className = "dayBlock";

  // Header
  const h3 = document.createElement("h3");
  h3.textContent = "Day";
  block.appendChild(h3);

  // Date
  const dateLabel = document.createElement("label");
  dateLabel.textContent = "Date:";
  block.appendChild(dateLabel);
  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "day-date";
  block.appendChild(dateInput);

  // Description
  const descLabel = document.createElement("label");
  descLabel.textContent = "Description:";
  block.appendChild(descLabel);
  const textarea = document.createElement("textarea");
  textarea.className = "desc";
  block.appendChild(textarea);

  // Photos
  const photosLabel = document.createElement("label");
  photosLabel.textContent = "Photos (up to 3):";
  block.appendChild(photosLabel);
  const photosGrid = document.createElement("div");
  photosGrid.className = "photo-upload-grid";
  for (let i = 1; i <= 3; i++) photosGrid.appendChild(createPhotoSlot(i));
  block.appendChild(photosGrid);

  // Video
  const videoLabel = document.createElement("label");
  videoLabel.textContent = "Video (1 clip):";
  block.appendChild(videoLabel);
  const videoWrapper = document.createElement("div");
  videoWrapper.className = "video-upload-wrapper";
  videoWrapper.appendChild(createVideoSlot());
  block.appendChild(videoWrapper);

  return block;
}


// ================================================================
//  SHOW LINK MODAL
// ================================================================
function showLinkModal(url) {
  document.getElementById("linkModal")?.remove();

  const modal = document.createElement("div");
  modal.id = "linkModal";
  modal.innerHTML = `
    <div class="link-modal-backdrop"></div>
    <div class="link-modal-box">
      <div class="link-modal-icon">🎉</div>
      <h2 class="link-modal-title">Itinerary Ready!</h2>
      <p class="link-modal-sub">Copy the link below and send it to your client.</p>
      <div class="link-copy-row">
        <input id="linkInput" class="link-input" type="text" value="${url}" readonly>
        <button type="button" id="copyLinkBtn" class="copy-btn">
          <span class="copy-icon">📋</span>
          <span class="copy-label">Copy</span>
        </button>
      </div>
      <div id="copySuccess" class="copy-success" style="display:none;">✅ Link copied to clipboard!</div>
      <div class="link-modal-actions">
        <a href="${url}" target="_blank" class="preview-btn"><span>👁</span> Preview Client Page</a>
        <button type="button" class="close-modal-btn" id="closeModalBtn">Close</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById("linkInput").addEventListener("click", function () { this.select(); });

  document.getElementById("copyLinkBtn").addEventListener("click", () => {
    navigator.clipboard.writeText(url).then(() => {
      document.getElementById("copySuccess").style.display = "block";
      document.getElementById("copyLinkBtn").innerHTML = `<span class="copy-icon">✅</span><span class="copy-label">Copied!</span>`;
      setTimeout(() => {
        document.getElementById("copySuccess").style.display = "none";
        document.getElementById("copyLinkBtn").innerHTML = `<span class="copy-icon">📋</span><span class="copy-label">Copy</span>`;
      }, 3000);
    });
  });

  document.getElementById("closeModalBtn").addEventListener("click", () => modal.remove());
  modal.querySelector(".link-modal-backdrop").addEventListener("click", () => modal.remove());
}


// ================================================================
//  INIT — runs when DOM is ready
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
  const addDayBtn    = document.getElementById("addDayBtn");
  const daysContainer = document.getElementById("daysContainer");
  const form          = document.getElementById("itineraryForm");

  if (!addDayBtn || !daysContainer || !form) return; // not on admin page

  // ── Day number labels update automatically ──────────────
  const observer = new MutationObserver(() => {
    daysContainer.querySelectorAll(".dayBlock").forEach((block, i) => {
      const h3 = block.querySelector("h3");
      if (h3) h3.textContent = `Day ${i + 1}`;
    });
  });
  observer.observe(daysContainer, { childList: true });

  // ── Add Day button ──────────────────────────────────────
  addDayBtn.addEventListener("click", () => {
    daysContainer.appendChild(createDayBlock());
  });

  // ── Form submit ─────────────────────────────────────────
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector(".submitBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-icon">⏳</span><span>Uploading…</span>`;

    const days = [];

    for (const [index, block] of [...daysContainer.querySelectorAll(".dayBlock")].entries()) {
      const desc = block.querySelector(".desc").value.trim();
      const date = block.querySelector(".day-date")?.value || "";

      // Up to 3 photos
      const photos = [];
      for (const input of block.querySelectorAll(".photo-input")) {
        if (input.files[0]) {
          const url = await uploadFile("Photos", input.files[0]);
          if (url) photos.push(url);
        }
      }

      // 1 video
      const videos = [];
      const videoInput = block.querySelector(".video-input");
      if (videoInput?.files[0]) {
        const url = await uploadFile("Videos", videoInput.files[0]);
        if (url) videos.push(url);
      }

      days.push({ day: index + 1, date, desc, photos, videos });
    }

    const itineraryId = await saveItinerary(days);

    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span class="btn-icon">✈</span><span>Generate Itinerary</span>`;

    if (itineraryId) {
      const clientUrl = `https://69f5a0144130b3bdf1a5b69b--jolly-kataifi-513a74.netlify.app/`;
      showLinkModal(clientUrl);
    } else {
      alert("Failed to save itinerary. Please try again.");
    }
  });
});