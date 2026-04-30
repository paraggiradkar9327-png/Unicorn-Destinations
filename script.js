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
// CREATE PHOTO SLOT UI
// ==============================
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
        <button type="button" class="photo-remove-btn" style="display:none;" title="Remove photo">✕</button>
      </div>
    </label>
  `;

  // Preview on file select
  const input = wrapper.querySelector(".photo-input");
  const previewImg = wrapper.querySelector(".photo-preview-img");
  const emptyState = wrapper.querySelector(".photo-slot-empty");
  const removeBtn = wrapper.querySelector(".photo-remove-btn");

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.style.display = "block";
        emptyState.style.display = "none";
        removeBtn.style.display = "flex";
      };
      reader.readAsDataURL(file);
    }
  });

  removeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    input.value = "";
    previewImg.src = "";
    previewImg.style.display = "none";
    emptyState.style.display = "flex";
    removeBtn.style.display = "none";
  });

  return wrapper;
}


// ==============================
// CREATE VIDEO SLOT UI
// ==============================
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
        <button type="button" class="video-remove-btn" style="display:none;" title="Remove video">✕</button>
        <span class="video-filename" style="display:none;"></span>
      </div>
    </label>
  `;

  const input = wrapper.querySelector(".video-input");
  const previewEl = wrapper.querySelector(".video-preview-el");
  const emptyState = wrapper.querySelector(".video-slot-empty");
  const removeBtn = wrapper.querySelector(".video-remove-btn");
  const filenameEl = wrapper.querySelector(".video-filename");

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      previewEl.src = url;
      previewEl.style.display = "block";
      emptyState.style.display = "none";
      removeBtn.style.display = "flex";
      filenameEl.textContent = file.name.length > 28 ? file.name.slice(0, 25) + "…" : file.name;
      filenameEl.style.display = "block";
    }
  });

  removeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    input.value = "";
    previewEl.src = "";
    previewEl.style.display = "none";
    emptyState.style.display = "flex";
    removeBtn.style.display = "none";
    filenameEl.style.display = "none";
  });

  return wrapper;
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

      // Header
      const header = document.createElement("h3");
      header.textContent = "Day";
      dayBlock.appendChild(header);

      // Description label + textarea
      const descLabel = document.createElement("label");
      descLabel.textContent = "Description:";
      dayBlock.appendChild(descLabel);

      const textarea = document.createElement("textarea");
      textarea.className = "desc";
      dayBlock.appendChild(textarea);

      // Photos section
      const photosLabel = document.createElement("label");
      photosLabel.textContent = "Photos (up to 3):";
      dayBlock.appendChild(photosLabel);

      const photosGrid = document.createElement("div");
      photosGrid.className = "photo-upload-grid";
      for (let i = 1; i <= 3; i++) {
        photosGrid.appendChild(createPhotoSlot(i));
      }
      dayBlock.appendChild(photosGrid);

      // Video section
      const videoLabel = document.createElement("label");
      videoLabel.textContent = "Video (1 clip):";
      dayBlock.appendChild(videoLabel);

      const videoWrapper = document.createElement("div");
      videoWrapper.className = "video-upload-wrapper";
      videoWrapper.appendChild(createVideoSlot());
      dayBlock.appendChild(videoWrapper);

      daysContainer.appendChild(dayBlock);
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector(".submitBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="btn-icon">⏳</span><span>Uploading…</span>`;

      const days = [];

      for (const [index, block] of [...document.querySelectorAll(".dayBlock")].entries()) {
        const desc = block.querySelector(".desc").value;

        // Collect up to 3 photos
        const photoInputs = block.querySelectorAll(".photo-input");
        const photos = [];
        for (const input of photoInputs) {
          if (input.files[0]) {
            const url = await uploadFile("Photos", input.files[0]);
            if (url) photos.push(url);
          }
        }

        // Collect 1 video
        const videoInput = block.querySelector(".video-input");
        const videos = [];
        if (videoInput && videoInput.files[0]) {
          const url = await uploadFile("Videos", videoInput.files[0]);
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
// RENDER FUNCTION
// ==============================
function renderItinerary(days, container) {
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

    const hasmedia = photosHTML || videosHTML;

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