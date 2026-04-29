// script.js

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// 🔑 Supabase setup
const SUPABASE_URL = "https://ghjmeiwvcamfnzrlppsf.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_cg8XK8wEtaEkvNydO4lQ3w_LUBzLIUI"; // paste your publishable key here
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


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


document.addEventListener("DOMContentLoaded", () => {
  const addDayBtn = document.getElementById("addDayBtn");
  const daysContainer = document.getElementById("daysContainer");
  const form = document.getElementById("itineraryForm");

  // Add new day blocks dynamically
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

  // Submit handler
  if (form) {
   form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const days = [];

  for (const [index, block] of [...document.querySelectorAll(".dayBlock")].entries()) {
    const desc = block.querySelector(".desc").value;

    const photoFiles = Array.from(block.querySelector(".photos").files);
    const videoFiles = Array.from(block.querySelector(".videos").files);

    // Upload photos
   // Upload photos
const photos = [];
for (const file of photoFiles) {
  const url = await uploadFile("Photos", file);
  if (url) photos.push(url);
}

// Upload videos
const videos = [];
for (const file of videoFiles) {
  const url = await uploadFile("Videos", file);
  if (url) videos.push(url);
}


    days.push({ day: index + 1, desc, photos, videos });
  }

  sessionStorage.setItem("itineraryData", JSON.stringify(days));
  window.location.href = "client.html";
});

  }

  // Client page rendering
  const clientContent = document.getElementById("clientContent");
  if (clientContent) {
    const data = JSON.parse(sessionStorage.getItem("itineraryData")) || [];

    data.forEach(day => {
      const div = document.createElement("div");
      div.className = "itineraryDay";
      div.innerHTML = `<h2>Day ${day.day}</h2><p>${day.desc}</p>`;

      day.photos.forEach(photo => {
        const img = document.createElement("img");
        img.src = photo; // Supabase public URL
        div.appendChild(img);
      });

      day.videos.forEach(video => {
        const vid = document.createElement("video");
        vid.src = video; // Supabase public URL
        vid.controls = true;
        vid.width = 600;
        div.appendChild(vid);
      });

      clientContent.appendChild(div);
    });
  }
});
