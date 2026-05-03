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
    console.log("Returned data:", data); // ADD THIS
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
// SHOW GENERATED LINK MODAL
// ==============================
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

      <div id="copySuccess" class="copy-success" style="display:none;">
        ✅ Link copied to clipboard!
      </div>

      <div class="link-modal-actions">
        <a href="${url}" target="_blank" class="preview-btn">
          <span>👁</span> Preview Client Page
        </a>
        <button type="button" class="close-modal-btn" id="closeModalBtn">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

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

  document.getElementById("linkInput").addEventListener("click", function () {
    this.select();
  });

  document.getElementById("closeModalBtn").addEventListener("click", () => modal.remove());
  modal.querySelector(".link-modal-backdrop").addEventListener("click", () => modal.remove());
}


// ==============================
// ADMIN FORM (index.html)
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  const addDayBtn = document.getElementById("addDayBtn");
  const daysContainer = document.getElementById("daysContainer");
  const form = document.getElementById("itineraryForm");

  // ── Check if we're in edit mode ──────────────────────────────
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("edit");

  // ── Helper: create a full day block ─────────────────────────
  function createDayBlock() {
    const dayBlock = document.createElement("div");
    dayBlock.className = "dayBlock";

    const header = document.createElement("h3");
    header.textContent = "Day";
    dayBlock.appendChild(header);

    const dateLabel = document.createElement("label");
    dateLabel.textContent = "Date:";
    dayBlock.appendChild(dateLabel);

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.className = "day-date";
    dayBlock.appendChild(dateInput);

    const titleLabel = document.createElement("label");
    titleLabel.textContent = "Day Title:";
    dayBlock.appendChild(titleLabel);

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.className = "day-title";
    titleInput.placeholder = "e.g. Arrival & City Welcome";
    dayBlock.appendChild(titleInput);

    const descLabel = document.createElement("label");
    descLabel.textContent = "Description:";
    dayBlock.appendChild(descLabel);

    const textarea = document.createElement("textarea");
    textarea.className = "desc";
    dayBlock.appendChild(textarea);

    const photosLabel = document.createElement("label");
    photosLabel.textContent = "Photos (up to 3):";
    dayBlock.appendChild(photosLabel);

    const photosGrid = document.createElement("div");
    photosGrid.className = "photo-upload-grid";
    for (let i = 1; i <= 3; i++) {
      photosGrid.appendChild(createPhotoSlot(i));
    }
    dayBlock.appendChild(photosGrid);

    const videoLabel = document.createElement("label");
    videoLabel.textContent = "Video (1 clip):";
    dayBlock.appendChild(videoLabel);

    const videoWrapper = document.createElement("div");
    videoWrapper.className = "video-upload-wrapper";
    videoWrapper.appendChild(createVideoSlot());
    dayBlock.appendChild(videoWrapper);

    return dayBlock;
  }

  // ── Add Day button ───────────────────────────────────────────
  if (addDayBtn) {
    addDayBtn.addEventListener("click", () => {
      daysContainer.appendChild(createDayBlock());
    });
  }

  // ── Pre-fill if editing ──────────────────────────────────────
  if (editId) {
    // Change submit button label
    const submitBtn = form?.querySelector(".submitBtn span:last-child");
    if (submitBtn) submitBtn.textContent = "Update Itinerary";

    const { data, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("id", editId)
      .single();

    if (!error && data?.content) {
      for (const day of data.content) {
        const block = createDayBlock();
        daysContainer.appendChild(block);

        // Date
        const dateEl = block.querySelector(".day-date");
        if (dateEl && day.date) dateEl.value = day.date;

        // Title
        const titleEl = block.querySelector(".day-title");
        if (titleEl && day.title) titleEl.value = day.title;

        // Description
        const descEl = block.querySelector(".desc");
        if (descEl && day.desc) descEl.value = day.desc;

        // Existing photos — show previews with URLs
        if (day.photos && day.photos.length > 0) {
          const slots = block.querySelectorAll(".photo-upload-slot");
          day.photos.forEach((url, i) => {
            if (!slots[i]) return;
            const img = slots[i].querySelector(".photo-preview-img");
            const empty = slots[i].querySelector(".photo-slot-empty");
            const removeBtn = slots[i].querySelector(".photo-remove-btn");
            // Store existing URL on the slot for later use
            slots[i].dataset.existingUrl = url;
            img.src = url;
            img.style.display = "block";
            empty.style.display = "none";
            removeBtn.style.display = "flex";
            // Remove clears the existing URL too
            removeBtn.addEventListener("click", () => {
              delete slots[i].dataset.existingUrl;
            });
          });
        }

        // Existing video — show preview with URL
        if (day.videos && day.videos.length > 0) {
          const videoSlot = block.querySelector(".video-upload-slot");
          if (videoSlot) {
            const videoEl = videoSlot.querySelector(".video-preview-el");
            const empty = videoSlot.querySelector(".video-slot-empty");
            const removeBtn = videoSlot.querySelector(".video-remove-btn");
            const filenameEl = videoSlot.querySelector(".video-filename");
            videoSlot.dataset.existingUrl = day.videos[0];
            videoEl.src = day.videos[0];
            videoEl.style.display = "block";
            empty.style.display = "none";
            removeBtn.style.display = "flex";
            filenameEl.textContent = "Existing video";
            filenameEl.style.display = "block";
            removeBtn.addEventListener("click", () => {
              delete videoSlot.dataset.existingUrl;
            });
          }
        }
      }
    }
  }

  // ── Form submit ──────────────────────────────────────────────
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector(".submitBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="btn-icon">⏳</span><span>Uploading…</span>`;

      const days = [];

      for (const [index, block] of [...document.querySelectorAll(".dayBlock")].entries()) {
        const dateEl = block.querySelector(".day-date");
        const date = dateEl ? dateEl.value : "";
        const titleInputEl = block.querySelector(".day-title");
        const title = titleInputEl ? titleInputEl.value.trim() : "";
        const desc = block.querySelector(".desc")?.value || "";

        // Photos — use new upload if file selected, else keep existing URL
        const photoSlots = block.querySelectorAll(".photo-upload-slot");
        const photos = [];
        for (const slot of photoSlots) {
          const input = slot.querySelector(".photo-input");
          if (input?.files[0]) {
            const url = await uploadFile("Photos", input.files[0]);
            if (url) photos.push(url);
          } else if (slot.dataset.existingUrl) {
            photos.push(slot.dataset.existingUrl);
          }
        }

        // Video — use new upload if file selected, else keep existing URL
        const videoSlot = block.querySelector(".video-upload-slot");
        const videoInput = videoSlot?.querySelector(".video-input");
        const videos = [];
        if (videoInput?.files[0]) {
          const url = await uploadFile("Videos", videoInput.files[0]);
          if (url) videos.push(url);
        } else if (videoSlot?.dataset.existingUrl) {
          videos.push(videoSlot.dataset.existingUrl);
        }

        days.push({ day: index + 1, date, title, desc, photos, videos });
      }

      let itineraryId;

      if (editId) {
  const { data, error } = await supabase
    .from("itineraries")
    .update({ content: days })
    .eq("id", editId)
    .select(); // ADD .select() to confirm the update

  console.log("Updated data:", data); // ADD THIS
  console.log("Update error:", error); // ADD THIS

  if (error) {
    console.error("Update error:", error);
    alert("Failed to update itinerary.");
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span class="btn-icon">✈</span><span>Update Itinerary</span>`;
    return;
  }
  itineraryId = editId;
} else {
        // INSERT new record
        itineraryId = await saveItinerary(days);
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span class="btn-icon">✈</span><span>${editId ? 'Update' : 'Generate'} Itinerary</span>`;

     if (itineraryId) {
  console.log("itineraryId:", itineraryId); // ADD THIS
  const clientUrl = `./client.html?id=${itineraryId}`;
  console.log("clientUrl:", clientUrl); // ADD THIS
  showLinkModal(clientUrl);
} else {
        alert("Failed to save itinerary. Please try again.");
      }
    });
  }
});


// ==============================
// DAY NUMBER OBSERVER
// ==============================
// Keep h3 labels in sync with actual day order
const _container = document.getElementById('daysContainer');
if (_container) {
  const _observer = new MutationObserver(() => {
    document.querySelectorAll('.dayBlock').forEach((block, i) => {
      const h3 = block.querySelector('h3');
      if (h3) h3.textContent = `Day ${i + 1}`;
    });
  });
  _observer.observe(_container, { childList: true });
}