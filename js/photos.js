/* ── Photo system ── */
let dayPhotos    = [];
let galleryIndex = 0;

function getPhotoPublicUrl(path) {
  return `${SUPA_URL}/storage/v1/object/public/gym-photos/${path}`;
}

async function loadDayPhotos(year, month, day) {
  try {
    const res = await fetchWithTimeout(
      `${SUPA_URL}/rest/v1/gym_photos?year=eq.${year}&month=eq.${month}&day=eq.${day}&order=created_at.asc`,
      { headers: { "apikey": SUPA_KEY, "Authorization": "Bearer "+SUPA_KEY } }
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) { console.warn("loadDayPhotos:", e); return []; }
}

async function uploadPhoto(file, year, month, day) {
  const ext  = (file.name||"photo").split(".").pop().replace(/[^a-z0-9]/gi,"") || "jpg";
  const path = `${year}/${month}/${day}/${Date.now()}.${ext}`;
  const upRes = await fetchWithTimeout(
    `${SUPA_URL}/storage/v1/object/gym-photos/${path}`,
    { method:"POST", headers:{ "apikey":SUPA_KEY, "Authorization":"Bearer "+SUPA_KEY, "Content-Type":file.type||"image/jpeg" }, body:file }, 60000
  );
  if (!upRes.ok) { const t = await upRes.text(); throw new Error("Storage: "+t); }
  await supa.rpc("gym_save_photo", { p_year:year, p_month:month, p_day:day, p_path:path });
  return path;
}

async function handlePhotoInput(e) {
  const file = e.target.files[0];
  if (!file || !dayPopup._day) return;
  e.target.value = "";
  const spinner = document.createElement("div");
  spinner.className = "photo-uploading"; spinner.textContent = "⏳";
  const grid  = document.getElementById("photoGrid");
  const label = document.getElementById("photoAddLabel");
  grid.insertBefore(spinner, label);
  try {
    setSyncStatus("⏳ Subiendo foto…");
    const path = await uploadPhoto(file, curYear, curMonth+1, dayPopup._day);
    setSyncStatus("✅ Foto guardada");
    const dk = String(dayPopup._day);
    monthCache.photo_counts[dk] = (monthCache.photo_counts[dk]||0) + 1;
    dayPhotos = await loadDayPhotos(curYear, curMonth+1, dayPopup._day);
    renderPhotoGrid();
    buildGrid();
    showMsg("📸 Foto guardada","#ffcc44");
  } catch (err) {
    setSyncStatus("❌ "+err.message);
    showMsg("Error al subir foto","#ff6b6b");
  } finally { spinner.remove(); }
}

function renderPhotoGrid() {
  const grid  = document.getElementById("photoGrid");
  const label = document.getElementById("photoAddLabel");
  Array.from(grid.children).forEach(c => { if (c !== label) c.remove(); });
  dayPhotos.forEach((photo, idx) => {
    const img      = document.createElement("img");
    img.className  = "photo-thumb";
    img.src        = getPhotoPublicUrl(photo.storage_path);
    img.loading    = "lazy";
    img.alt        = `Foto ${idx+1}`;
    img.addEventListener("click", () => openGallery(idx));
    img.addEventListener("touchstart", e => { e.stopPropagation(); }, { passive:true });
    grid.insertBefore(img, label);
  });
  const badge = document.getElementById("photoCountBadge");
  if (badge) badge.textContent = dayPhotos.length ? `(${dayPhotos.length})` : "";
}

function openGallery(startIndex) {
  galleryIndex = startIndex;
  document.getElementById("galleryModal").classList.add("open");
  showGalleryPhoto();
}

function showGalleryPhoto() {
  const photo = dayPhotos[galleryIndex];
  if (!photo) return;
  const img  = document.getElementById("galleryImg");
  const spin = document.getElementById("gallerySpinner");
  img.style.display  = "none"; spin.style.display = "block";
  img.onload = () => { spin.style.display="none"; img.style.display="block"; };
  img.src = getPhotoPublicUrl(photo.storage_path);
  document.getElementById("galleryCounter").textContent = `${galleryIndex+1}/${dayPhotos.length}`;
  document.getElementById("galleryCaption").textContent = photo.caption || "";
  document.getElementById("galleryPrev").disabled = galleryIndex === 0;
  document.getElementById("galleryNext").disabled = galleryIndex === dayPhotos.length-1;
}

async function deleteCurrentPhoto() {
  const photo = dayPhotos[galleryIndex];
  if (!photo) return;
  if (!confirm("¿Borrar esta foto?")) return;
  try {
    const path = await supa.rpc("gym_delete_photo", { p_id: photo.id });
    await fetchWithTimeout(`${SUPA_URL}/storage/v1/object/gym-photos/${path}`,
      { method:"DELETE", headers:{"apikey":SUPA_KEY,"Authorization":"Bearer "+SUPA_KEY} });
    const dk = String(dayPopup._day);
    monthCache.photo_counts[dk] = Math.max(0, (monthCache.photo_counts[dk]||1)-1);
    if (!monthCache.photo_counts[dk]) delete monthCache.photo_counts[dk];
    dayPhotos.splice(galleryIndex, 1);
    if (dayPhotos.length === 0) {
      document.getElementById("galleryModal").classList.remove("open");
      renderPhotoGrid(); buildGrid(); showMsg("Foto borrada"); return;
    }
    galleryIndex = Math.min(galleryIndex, dayPhotos.length-1);
    renderPhotoGrid(); buildGrid(); showGalleryPhoto(); showMsg("Foto borrada");
  } catch (e) { showMsg("Error al borrar","#ff6b6b"); console.error(e); }
}

/* Listeners */
document.getElementById("galleryClose").addEventListener("click", () => document.getElementById("galleryModal").classList.remove("open"));
document.getElementById("galleryPrev").addEventListener("click", () => { if (galleryIndex>0){ galleryIndex--; showGalleryPhoto(); }});
document.getElementById("galleryNext").addEventListener("click", () => { if (galleryIndex<dayPhotos.length-1){ galleryIndex++; showGalleryPhoto(); }});
document.getElementById("galleryDel").addEventListener("click", deleteCurrentPhoto);
document.getElementById("photoInput").addEventListener("change", handlePhotoInput);

let _galSwipeX = 0;
document.getElementById("galleryModal").addEventListener("touchstart", e => { _galSwipeX = e.touches[0].clientX; }, { passive:true });
document.getElementById("galleryModal").addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - _galSwipeX;
  if (Math.abs(dx) < 40) return;
  if (dx < 0 && galleryIndex < dayPhotos.length-1) { galleryIndex++; showGalleryPhoto(); }
  if (dx > 0 && galleryIndex > 0) { galleryIndex--; showGalleryPhoto(); }
}, { passive:true });
