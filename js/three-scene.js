/* ── Three.js scene ── */
const scene    = new THREE.Scene();
scene.background = new THREE.Color(0x0e0e0e);
scene.fog        = new THREE.Fog(0x0e0e0e, 40, 75);

const camera   = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const dir   = new THREE.DirectionalLight(0xffffff, 1.1); dir.position.set(6,14,8); scene.add(dir);
const fillL = new THREE.PointLight(0x3355ff, 0.3, 60); fillL.position.set(-12,4,-12); scene.add(fillL);

/* ── Camera control ── */
const target = new THREE.Vector3(0,0,0);
let camTheta=0.35, camPhi=0.72, camRadius=24;
const PAN_LIMIT = 14;
let gridCentroid = new THREE.Vector3(0,0,0);
let targetInitialized = false;

function clampTarget() {
  target.x = Math.max(gridCentroid.x-PAN_LIMIT, Math.min(gridCentroid.x+PAN_LIMIT, target.x));
  target.z = Math.max(gridCentroid.z-PAN_LIMIT, Math.min(gridCentroid.z+PAN_LIMIT, target.z));
}
function applyCam() {
  const sT=Math.sin(camTheta), cT=Math.cos(camTheta), sP=Math.sin(camPhi), cP=Math.cos(camPhi);
  camera.position.set(target.x+camRadius*sT*sP, target.y+camRadius*cP, target.z+camRadius*cT*sP);
  camera.lookAt(target);
}
applyCam();
function doPan(dx, dy) {
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0); right.y=0; right.normalize();
  const upXZ  = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1); upXZ.y=0;  upXZ.normalize();
  const s = camRadius*0.001;
  target.addScaledVector(right, -dx*s); target.addScaledVector(upXZ, dy*s);
  clampTarget(); applyCam();
}
function doOrbit(dx, dy) {
  camTheta -= dx*0.006;
  camPhi    = Math.max(0.12, Math.min(1.35, camPhi - dy*0.006));
  applyCam();
}

/* ── Grid builder ── */
const GAP=2.0, SIZE=1.35;

/* Canvas texture helpers */
function _hexStr(hex) { return `rgb(${(hex>>16)&0xff},${(hex>>8)&0xff},${hex&0xff})`; }
function _hexBright(hex, amt) {
  return `rgb(${Math.min(255,((hex>>16)&0xff)+amt)},${Math.min(255,((hex>>8)&0xff)+amt)},${Math.min(255,(hex&0xff)+amt)})`;
}
function _wcagLin(v) { const c=v/255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
function _hexLum(hex, bright=0) {
  const r=Math.min(255,((hex>>16)&0xff)+bright), g=Math.min(255,((hex>>8)&0xff)+bright), b=Math.min(255,(hex&0xff)+bright);
  return 0.2126*_wcagLin(r) + 0.7152*_wcagLin(g) + 0.0722*_wcagLin(b);
}
function _autoText(hex, bright=0) { return _hexLum(hex, bright) > 0.179 ? "#1a1a1a" : "#f0f0f0"; }

function makeTopTex(day, extraLabel, hexColor, isToday) {
  const cv = document.createElement("canvas"); cv.width=256; cv.height=256;
  const ctx = cv.getContext("2d");
  if (isToday) {
    const grd = ctx.createRadialGradient(128,128,20,128,128,170);
    grd.addColorStop(0,"#ffe066"); grd.addColorStop(1,"#c8760a");
    ctx.fillStyle = grd;
  } else {
    ctx.fillStyle = _hexBright(hexColor, 28);
  }
  ctx.fillRect(0,0,256,256);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  const textCol   = isToday ? "#1a1a1a" : _autoText(hexColor, 28);
  const shadowCol = textCol==="#1a1a1a" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.55)";
  ctx.shadowColor=shadowCol; ctx.shadowBlur=8; ctx.shadowOffsetX=1; ctx.shadowOffsetY=1;
  ctx.fillStyle = textCol;
  ctx.font = extraLabel ? "bold 118px system-ui,Arial,sans-serif" : "bold 150px system-ui,Arial,sans-serif";
  ctx.fillText(String(day), 128, extraLabel ? 95 : 128);
  if (extraLabel) {
    ctx.shadowBlur=4;
    ctx.font = "bold 66px system-ui,Arial,sans-serif";
    ctx.fillStyle = textCol==="#1a1a1a" ? "rgba(30,80,180,0.9)" : "rgba(160,220,255,0.96)";
    ctx.fillText(extraLabel, 128, 190);
  }
  return new THREE.CanvasTexture(cv);
}

function makeFrontTex(mainIcon, badgeStr, hexColor) {
  const cv = document.createElement("canvas"); cv.width=256; cv.height=256;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = _hexStr(hexColor);
  ctx.fillRect(0,0,256,256);
  if (mainIcon) {
    const hasBadge = badgeStr && badgeStr.length > 0;
    ctx.font = `${hasBadge?138:172}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(mainIcon, 128, hasBadge ? 112 : 128);
  }
  if (badgeStr) {
    const badgeCol = _autoText(hexColor, 0);
    ctx.font = "bold 44px system-ui,Arial,sans-serif";
    ctx.fillStyle = badgeCol;
    ctx.shadowColor = badgeCol==="#1a1a1a" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.55)";
    ctx.shadowBlur=5;
    ctx.textAlign="center"; ctx.textBaseline="bottom";
    ctx.fillText(badgeStr, 128, 252);
  }
  return new THREE.CanvasTexture(cv);
}

function faceMat(tex, shininess) {
  return new THREE.MeshPhongMaterial({ map:tex, color:0xffffff, shininess, specular:0x333333 });
}

let cubes=[], labelObjs=[], edgesHelper=null;
const edgesMat    = new THREE.LineBasicMaterial({ color:0xff00cc, linewidth:2 });
const todayEdgeMat = new THREE.LineBasicMaterial({ color:0xffcc44, linewidth:2 });
let todayEdge = null;
function clearEdges() { if (edgesHelper) { scene.remove(edgesHelper); edgesHelper=null; } }
function highlightCube(cube) {
  clearEdges(); if (!cube) return;
  edgesHelper = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(SIZE*1.02, SIZE*1.02, SIZE*1.02)), edgesMat);
  edgesHelper.position.copy(cube.position); scene.add(edgesHelper);
}

function makeLabel(text, opts={}) {
  const cv = document.createElement("canvas"); cv.width=256; cv.height=128;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = opts.color || "rgba(255,255,255,0.75)";
  ctx.font      = (opts.bold?"bold ":"") + (opts.size||32) + "px Arial";
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(text, 128, 64);
  const mat = new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(cv), transparent:true, depthWrite:false });
  const sp  = new THREE.Sprite(mat); sp.scale.set(opts.sw||2.2, opts.sh||1.1, 1);
  return sp;
}

let hitMeshes = [];
function rebuildHitMeshes() {
  hitMeshes.forEach(m => scene.remove(m)); hitMeshes=[];
  const hitGeo = new THREE.BoxGeometry(SIZE*0.72, SIZE*0.72*2, SIZE*0.72);
  for (const cube of cubes) {
    const m = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible:false }));
    m.position.copy(cube.position); m.userData = cube.userData;
    scene.add(m); hitMeshes.push(m);
  }
}

function buildGrid() {
  cubes.forEach(c => {
    scene.remove(c);
    const mats = Array.isArray(c.material) ? c.material : [c.material];
    mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
  });
  labelObjs.forEach(s => scene.remove(s));
  clearEdges(); cubes=[]; labelObjs=[];

  const total    = daysInMonth(curYear, curMonth);
  const todayD   = (curMonth===today.getMonth() && curYear===today.getFullYear()) ? today.getDate() : -1;
  const firstDow = new Date(curYear, curMonth, 1).getDay();
  const weeks    = Math.ceil((total+firstDow)/7);
  const offX     = -(6*GAP)/2;
  const offZ     = -(weeks-1)*GAP/2;

  gridCentroid.set(offX+3*GAP, 0, offZ+(weeks-1)*GAP/2);
  if (!targetInitialized) {
    if (curMonth===today.getMonth() && curYear===today.getFullYear()) {
      const todayWeekRow = Math.floor((firstDow+todayD-1)/7);
      const headerZ = offZ - GAP*1.3;
      const todayZ  = offZ + todayWeekRow*GAP;
      target.set(offX+3*GAP, 0, (headerZ+todayZ)/2 + GAP*0.4);
    } else {
      target.copy(gridCentroid); target.y=0;
    }
    targetInitialized=true; applyCam();
  }

  DAYS_ES.forEach((name, i) => {
    const sp = makeLabel(name, { size:65, color:"rgba(255,255,255,0.8)", bold:true, sw:3.2, sh:1.5 });
    sp.position.set(offX+i*GAP, 1.9, offZ-GAP*1.3); scene.add(sp); labelObjs.push(sp);
  });
  for (let w=0; w<weeks; w++) {
    const sp = makeLabel("S"+(w+1), { size:51, color:"rgba(255,255,255,0.5)", sw:2.2, sh:1.1 });
    sp.position.set(offX-GAP*1.5, 1.4, offZ+w*GAP); scene.add(sp); labelObjs.push(sp);
  }

  for (let d=1; d<=total; d++) {
    const dow    = (firstDow+d-1)%7;
    const week   = Math.floor((firstDow+d-1)/7);
    const wknd   = dow===0||dow===6;
    const isPast = (curYear<today.getFullYear())
                || (curYear===today.getFullYear() && curMonth<today.getMonth())
                || (curYear===today.getFullYear() && curMonth===today.getMonth() && d<todayD);
    const isToday        = d===todayD;
    const state          = getDayState(d);
    const isDone         = state==="done"||state==="weekend_bonus";
    const isWeekendBonus = state==="weekend_bonus";
    const isMiss         = state==="miss";
    const isAutofail     = isPast && !isDone && !isMiss && !wknd;
    const muscle         = getDayMuscle(d);
    const mc             = muscle ? MUSCLE_COLORS[muscle] : null;

    let color;
    if      (isDone && mc)         color = mc.cube;
    else if (isWeekendBonus)       color = 0x1166ff;
    else if (isDone)               color = 0x22aa55;
    else if (isMiss||isAutofail)   color = 0xbb2222;
    else if (isToday)              color = 0xffaa22;
    else if (wknd)                 color = 0x1a1a2e;
    else                           color = 0x2a2a2a;

    const todayH   = isToday ? SIZE*1.3 : SIZE;
    const shiny    = isDone ? 90 : isToday ? 60 : 22;
    const photoCount = monthCache.photo_counts[String(d)];
    const setCount   = monthCache.set_counts[String(d)];

    const topTex = makeTopTex(d, isWeekendBonus ? "3×" : null, color, isToday);
    const topMat = faceMat(topTex, shiny);

    const mObj     = muscle && isDone ? MUSCLES.find(x => x.id===muscle) : null;
    const mainIcon = mObj ? mObj.icon : "";
    const badgeParts = [];
    if (photoCount) badgeParts.push("📷"+(photoCount>1?photoCount:""));
    if (setCount)   badgeParts.push("💪"+setCount);
    const frontTex = makeFrontTex(mainIcon, badgeParts.join("  "), color);
    const frontMat = faceMat(frontTex, shiny);

    const sideMat = new THREE.MeshPhongMaterial({ color, shininess:shiny });
    const geo  = new THREE.BoxGeometry(SIZE, todayH, SIZE);
    const cube = new THREE.Mesh(geo, [sideMat,sideMat,topMat,sideMat,frontMat,sideMat]);
    cube.position.set(offX+dow*GAP, isToday ? (todayH-SIZE)/2 : 0, offZ+week*GAP);
    cube.userData = { day:d, dow, week, state, isPast, isToday, isDone, isMiss, isAutofail, wknd, isWeekendBonus };
    scene.add(cube); cubes.push(cube);
  }

  if (todayEdge) { scene.remove(todayEdge); todayEdge=null; }
  const todayCube = cubes.find(c => c.userData.isToday);
  if (todayCube) {
    const h = todayCube.geometry.parameters.height;
    todayEdge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(SIZE*1.04, h*1.04, SIZE*1.04)), todayEdgeMat);
    todayEdge.position.copy(todayCube.position); scene.add(todayEdge);
  }

  rebuildHitMeshes();
  updateUI();
}

/* ── Raycaster ── */
const rc = new THREE.Raycaster();
const mv = new THREE.Vector2();
function doTap(x, y) {
  const rect = renderer.domElement.getBoundingClientRect();
  mv.x = ((x-rect.left)/rect.width)*2 - 1;
  mv.y = -((y-rect.top)/rect.height)*2 + 1;
  rc.setFromCamera(mv, camera);
  const hits = rc.intersectObjects(hitMeshes);
  if (hits.length > 0) {
    if (progressModal && progressModal.classList.contains("open")) closeProgressModal();
    const day  = hits[0].object.userData.day;
    const cube = cubes.find(c => c.userData.day===day);
    if (cube) openPopup(cube, x, y);
  } else {
    if (progressModal && progressModal.classList.contains("open")) closeProgressModal();
    if (dayPopup.classList.contains("open")) closePopup();
  }
}

/* ── Mode tag ── */
const modeTag = document.getElementById("modeTag");
function showMode(o) {
  modeTag.textContent = o ? "🔄 Órbita activa" : "✋ Paneo";
  modeTag.style.color = o ? "rgba(255,220,80,0.85)" : "rgba(255,255,255,0.22)";
}

/* ── Touch events ── */
let isDragging=false, isPinching=false;
let lastX=0, lastY=0, downX=0, downY=0, downTime=0, lastPinchDist=0;
let orbitHeld=false, lastTapTime=0, lastTapX=0, lastTapY=0;

renderer.domElement.addEventListener("touchstart", e => {
  e.preventDefault();
  if (e.touches.length===1) {
    const t=e.touches[0]; isDragging=true; isPinching=false;
    lastX=t.clientX; lastY=t.clientY; downX=t.clientX; downY=t.clientY; downTime=Date.now();
    const dt=downTime-lastTapTime, dd=Math.hypot(downX-lastTapX, downY-lastTapY);
    orbitHeld=(dt<280&&dd<45); if (orbitHeld) showMode(true);
  } else if (e.touches.length===2) {
    isDragging=false; isPinching=true;
    lastPinchDist=Math.hypot(e.touches[1].clientX-e.touches[0].clientX, e.touches[1].clientY-e.touches[0].clientY);
  }
}, { passive:false });

renderer.domElement.addEventListener("touchmove", e => {
  e.preventDefault();
  if (e.touches.length===1 && isDragging) {
    const t=e.touches[0], dx=t.clientX-lastX, dy=t.clientY-lastY;
    if (orbitHeld) doOrbit(dx,dy); else doPan(dx,dy);
    lastX=t.clientX; lastY=t.clientY;
  } else if (e.touches.length===2 && isPinching) {
    const d=Math.hypot(e.touches[1].clientX-e.touches[0].clientX, e.touches[1].clientY-e.touches[0].clientY);
    camRadius=Math.max(8, Math.min(55, camRadius*(lastPinchDist/d)));
    lastPinchDist=d; applyCam();
  }
}, { passive:false });

renderer.domElement.addEventListener("touchend", e => {
  if (orbitHeld && e.touches.length===0) { orbitHeld=false; showMode(false); }
  if (isDragging && e.touches.length===0) {
    const moved = Math.abs(downX-lastX)>8 || Math.abs(downY-lastY)>8;
    if (!moved && Date.now()-downTime<350) {
      doTap(downX, downY);
      lastTapTime=Date.now(); lastTapX=downX; lastTapY=downY;
    }
  }
  if (e.touches.length===0) { isDragging=false; isPinching=false; }
  else if (e.touches.length===1) { isPinching=false; isDragging=true; lastX=e.touches[0].clientX; lastY=e.touches[0].clientY; }
}, { passive:false });

/* ── Mouse events ── */
let mDown=false, mPrevX=0, mPrevY=0, mDownX=0, mDownY=0, mDownTime=0;
renderer.domElement.addEventListener("mousedown", e => {
  mDown=true; mPrevX=e.clientX; mPrevY=e.clientY; mDownX=e.clientX; mDownY=e.clientY; mDownTime=Date.now();
});
window.addEventListener("mouseup", e => {
  if (mDown) {
    const moved = Math.abs(e.clientX-mDownX)>4 || Math.abs(e.clientY-mDownY)>4;
    if (!moved && Date.now()-mDownTime<400) doTap(e.clientX, e.clientY);
  }
  mDown=false;
});
window.addEventListener("mousemove", e => {
  if (!mDown) return;
  const dx=e.clientX-mPrevX, dy=e.clientY-mPrevY;
  if (e.buttons===2||e.altKey) doOrbit(dx,dy); else doPan(dx,dy);
  mPrevX=e.clientX; mPrevY=e.clientY;
});
renderer.domElement.addEventListener("contextmenu", e => e.preventDefault());
renderer.domElement.addEventListener("wheel", e => {
  e.preventDefault();
  camRadius=Math.max(8, Math.min(55, camRadius*(e.deltaY>0?1.08:0.93)));
  applyCam();
}, { passive:false });

/* ── Render loop ── */
function animate() { requestAnimationFrame(animate); renderer.render(scene, camera); }
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
