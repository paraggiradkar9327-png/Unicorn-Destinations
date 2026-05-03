import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ghjmeiwvcamfnzrlppsf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cg8XK8wEtaEkvNydO4lQ3w_LUBzLIUI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let globalDays = [];

// ==============================
// LOAD & RENDER ITINERARY
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

  globalDays = data.content;
  renderItinerary(data.content, container);
}

function renderItinerary(days, container) {
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

    // ── Videos shown on page but NOT in PDF ──────────────────
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
        ${dateHTML}
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
}

// ==============================
// PDF GENERATION
// ==============================
async function generatePDF() {
  const btn = document.getElementById("downloadPdfBtn");
  btn.disabled = true;
  btn.textContent = "⏳ Generating PDF...";

  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const margin = 14;
  const contentW = pageW - margin * 2;
  let y = 0;

  const CRIMSON    = [178, 34, 34];
  const CRIMSON_DK = [139, 0, 0];
  const GOLD       = [201, 149, 74];
  const CREAM      = [250, 247, 242];
  const INK        = [28, 20, 16];
  const MUTED      = [154, 135, 120];
  const WHITE      = [255, 255, 255];
  const WARM       = [244, 236, 224];

  function addPage() { doc.addPage(); y = margin; }
  function ensureSpace(needed) { if (y + needed > pageH - 20) addPage(); }
  function filledRect(x, ry, w, h, color) {
    doc.setFillColor(...color);
    doc.rect(x, ry, w, h, "F");
  }
  function wrappedText(text, x, maxW, lineH, color, size, style = "normal") {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach(line => { ensureSpace(lineH); doc.text(line, x, y); y += lineH; });
  }
  async function loadImageBase64(url) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch { return null; }
  }

  // ── Draw footer on current page ──────────────────────────────
  function drawFooter() {
    filledRect(0, pageH - 18, pageW, 18, INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GOLD);
    doc.text("Unicorn Destinations", pageW / 2, pageH - 11, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text("8857955359", margin, pageH - 5);
    doc.text("unicorndestinations@gmail.com", pageW / 2, pageH - 5, { align: "center" });
  }

  // ── Load logo ────────────────────────────────────────────────
  const logoData = await loadImageBase64("/assest/DESTINATION.png");

  // ════════════════════════════════════════════════════════════
  // COVER PAGE
  // ════════════════════════════════════════════════════════════
  filledRect(0, 0, pageW, pageH, CREAM);

  // Crimson header band
  filledRect(0, 0, pageW, 72, CRIMSON);
  filledRect(0, 70, pageW, 2.5, GOLD);

  // Logo
  if (logoData) {
    doc.addImage(logoData, "PNG", pageW / 2 - 18, 8, 36, 36);
  }

  // Brand name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text("UNICORN DESTINATIONS", pageW / 2, 56, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(255, 220, 180);
  doc.text("Your Journey, Our Expertise", pageW / 2, 65, { align: "center" });

  // Title box
  filledRect(margin, 84, contentW, 36, WHITE);
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.rect(margin, 84, contentW, 36, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...CRIMSON);
  doc.text("PERSONALISED TOUR ITINERARY", pageW / 2, 99, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(`${globalDays.length} Day${globalDays.length > 1 ? "s" : ""} · Curated Experience`, pageW / 2, 111, { align: "center" });

  // Days list on cover
  let coverY = 134;
  globalDays.forEach(day => {
    if (coverY > pageH - 30) return;
    const title = day.title && day.title.trim() ? day.title : `Day ${day.day}`;
    let dateStr = "";
    if (day.date) {
      dateStr = " · " + new Date(day.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric"
      });
    }
    filledRect(margin, coverY - 4, 22, 7, CRIMSON);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    doc.text(`DAY ${day.day}`, margin + 11, coverY + 0.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(title + dateStr, margin + 26, coverY + 0.5);
    coverY += 11;
  });

  drawFooter();

  // ════════════════════════════════════════════════════════════
  // DAY PAGES
  // ════════════════════════════════════════════════════════════
  for (const day of globalDays) {
    addPage();

    // Day header strip
    filledRect(0, 0, pageW, 22, CRIMSON);
    filledRect(pageW / 2, 0, pageW / 2, 22, CRIMSON_DK);

    // Logo small in header
    if (logoData) {
      doc.addImage(logoData, "PNG", pageW - margin - 10, 2, 10, 10);
    }

    // Day badge
    doc.setDrawColor(...WHITE);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, 6, 22, 9, 4, 4, "S");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);
    doc.text(`DAY ${day.day}`, margin + 11, 12, { align: "center" });

    // Day title
    const dayTitle = day.title && day.title.trim() ? day.title : `Day ${day.day}`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...WHITE);
    doc.text(dayTitle, margin + 26, 13);

    // Date
    if (day.date) {
      const formatted = new Date(day.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric"
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(255, 220, 180);
      doc.text(formatted, pageW - margin - 12, 13, { align: "right" });
    }

    // Gold underline
    filledRect(0, 22, pageW, 1.5, GOLD);
    y = 32;

    // Description
    if (day.desc) {
      ensureSpace(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text("DESCRIPTION", margin, y);
      y += 4;
      doc.setDrawColor(...WARM);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 5;
      wrappedText(day.desc, margin, contentW, 5.5, INK, 10);
      y += 5;
    }

    // Photos
    if (day.photos && day.photos.length > 0) {
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text("PHOTOS", margin, y);
      y += 4;
      doc.setDrawColor(...WARM);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 5;

      const photoW = (contentW - 8) / 3;
      const photoH = photoW * 0.75;
      const imageDataArr = await Promise.all(day.photos.map(url => loadImageBase64(url)));
      const rowCount = Math.ceil(day.photos.length / 3);

      for (let row = 0; row < rowCount; row++) {
        ensureSpace(photoH + 6);
        for (let col = 0; col < 3; col++) {
          const idx = row * 3 + col;
          if (idx >= day.photos.length) break;
          const x = margin + col * (photoW + 4);
          filledRect(x, y, photoW, photoH, WARM);
          doc.setDrawColor(...GOLD);
          doc.setLineWidth(0.4);
          doc.rect(x, y, photoW, photoH, "S");
          if (imageDataArr[idx]) {
            try {
              doc.addImage(imageDataArr[idx], "JPEG", x + 0.5, y + 0.5, photoW - 1, photoH - 1);
            } catch {
              doc.setFontSize(8);
              doc.setTextColor(...MUTED);
              doc.text("Photo", x + photoW / 2, y + photoH / 2, { align: "center" });
            }
          }
        }
        y += photoH + 5;
      }
    }

    drawFooter();
  }

  doc.save("Unicorn-Destinations-Itinerary.pdf");
  btn.disabled = false;
  btn.textContent = "📄 Download PDF";
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

loadItinerary();
document.getElementById("downloadPdfBtn").addEventListener("click", generatePDF);