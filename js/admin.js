import { createClient } from "@supabase/supabase-js";

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
// ADMIN FORM
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  const addDayBtn = document.getElementById("addDayBtn");
  const daysContainer = document.getElementById("daysContainer");
  const form = document.getElementById("itineraryForm");

  const params = new URLSearchParams(window.location.search);
  const editId = params.get("edit");

  // ── Helper: create full day block ───────────────────────────
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
      setTimeout(updateClearBtn, 0);
    });
  }

  // ── Pre-fill if editing ──────────────────────────────────────
  if (editId) {
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

        const dateEl = block.querySelector(".day-date");
        if (dateEl && day.date) dateEl.value = day.date;

        const titleEl = block.querySelector(".day-title");
        if (titleEl && day.title) titleEl.value = day.title;

        const descEl = block.querySelector(".desc");
        if (descEl && day.desc) descEl.value = day.desc;

        if (day.photos && day.photos.length > 0) {
          const slots = block.querySelectorAll(".photo-upload-slot");
          day.photos.forEach((url, i) => {
            if (!slots[i]) return;
            const img = slots[i].querySelector(".photo-preview-img");
            const empty = slots[i].querySelector(".photo-slot-empty");
            const removeBtn = slots[i].querySelector(".photo-remove-btn");
            slots[i].dataset.existingUrl = url;
            img.src = url;
            img.style.display = "block";
            empty.style.display = "none";
            removeBtn.style.display = "flex";
            removeBtn.addEventListener("click", () => { delete slots[i].dataset.existingUrl; });
          });
        }

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
            removeBtn.addEventListener("click", () => { delete videoSlot.dataset.existingUrl; });
          }
        }
      }
      setTimeout(updateClearBtn, 0);
    }
  }

  // ── Clear All button ─────────────────────────────────────────
  const clearBtn = document.getElementById("clearAllBtn");

  function checkIfAnyFieldFilled() {
    const blocks = document.querySelectorAll(".dayBlock");
    for (const block of blocks) {
      if (block.querySelector(".day-date")?.value) return true;
      if (block.querySelector(".day-title")?.value.trim()) return true;
      if (block.querySelector(".desc")?.value.trim()) return true;
      if ([...block.querySelectorAll(".photo-input")].some(i => i.files[0])) return true;
      if ([...block.querySelectorAll(".photo-upload-slot")].some(s => s.dataset.existingUrl)) return true;
      if (block.querySelector(".video-upload-slot")?.dataset.existingUrl) return true;
      if (block.querySelector(".video-input")?.files[0]) return true;
    }
    return false;
  }

  function updateClearBtn() {
    if (!clearBtn) return;
    const active = checkIfAnyFieldFilled();
    clearBtn.disabled = !active;
    clearBtn.classList.toggle("clear-btn-active", active);
  }

  form?.addEventListener("input", updateClearBtn);
  form?.addEventListener("change", updateClearBtn);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      document.querySelectorAll(".dayBlock").forEach(block => {
        const dateEl = block.querySelector(".day-date");
        const titleEl = block.querySelector(".day-title");
        const descEl = block.querySelector(".desc");
        if (dateEl) dateEl.value = "";
        if (titleEl) titleEl.value = "";
        if (descEl) descEl.value = "";

        block.querySelectorAll(".photo-upload-slot").forEach(slot => {
          const input = slot.querySelector(".photo-input");
          const img = slot.querySelector(".photo-preview-img");
          const empty = slot.querySelector(".photo-slot-empty");
          const removeBtn = slot.querySelector(".photo-remove-btn");
          if (input) input.value = "";
          if (img) { img.src = ""; img.style.display = "none"; }
          if (empty) empty.style.display = "flex";
          if (removeBtn) removeBtn.style.display = "none";
          delete slot.dataset.existingUrl;
        });

        const videoSlot = block.querySelector(".video-upload-slot");
        if (videoSlot) {
          const input = videoSlot.querySelector(".video-input");
          const videoEl = videoSlot.querySelector(".video-preview-el");
          const empty = videoSlot.querySelector(".video-slot-empty");
          const removeBtn = videoSlot.querySelector(".video-remove-btn");
          const filename = videoSlot.querySelector(".video-filename");
          if (input) input.value = "";
          if (videoEl) { videoEl.src = ""; videoEl.style.display = "none"; }
          if (empty) empty.style.display = "flex";
          if (removeBtn) removeBtn.style.display = "none";
          if (filename) filename.style.display = "none";
          delete videoSlot.dataset.existingUrl;
        }
      });
      updateClearBtn();
    });
  }

  updateClearBtn();

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
        const { error } = await supabase
          .from("itineraries")
          .update({ content: days })
          .eq("id", editId);

        if (error) {
          console.error("Update error:", error);
          alert("Failed to update itinerary.");
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span class="btn-icon">✈</span><span>Update Itinerary</span>`;
          return;
        }
        itineraryId = editId;
      } else {
        itineraryId = await saveItinerary(days);
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span class="btn-icon">✈</span><span>${editId ? "Update" : "Generate"} Itinerary</span>`;

      if (itineraryId) {
        // Redirect to client.html (admin view with edit + share buttons)
        window.location.href = `/client.html?id=${itineraryId}`;
      } else {
        alert("Failed to save itinerary. Please try again.");
      }
    });
  }
});


// ==============================
// DAY NUMBER OBSERVER
// ==============================
const _container = document.getElementById("daysContainer");
if (_container) {
  const _observer = new MutationObserver(() => {
    document.querySelectorAll(".dayBlock").forEach((block, i) => {
      const h3 = block.querySelector("h3");
      if (h3) h3.textContent = `Day ${i + 1}`;
    });
  });
  _observer.observe(_container, { childList: true });
}