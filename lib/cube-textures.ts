import * as THREE from 'three';

/* Canvas texture helpers — ported from the original Three.js calendar.
   Emojis (muscle icons, badges) only render in color via the 2D canvas API,
   which is why faces are textured rather than drawn with troika text. */

function hexStr(hex: number): string {
  return `rgb(${(hex >> 16) & 0xff},${(hex >> 8) & 0xff},${hex & 0xff})`;
}

function hexBright(hex: number, amt: number): string {
  return `rgb(${Math.min(255, ((hex >> 16) & 0xff) + amt)},${Math.min(255, ((hex >> 8) & 0xff) + amt)},${Math.min(255, (hex & 0xff) + amt)})`;
}

function wcagLin(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function hexLum(hex: number, bright = 0): number {
  const r = Math.min(255, ((hex >> 16) & 0xff) + bright);
  const g = Math.min(255, ((hex >> 8) & 0xff) + bright);
  const b = Math.min(255, (hex & 0xff) + bright);
  return 0.2126 * wcagLin(r) + 0.7152 * wcagLin(g) + 0.0722 * wcagLin(b);
}

function autoText(hex: number, bright = 0): string {
  return hexLum(hex, bright) > 0.179 ? '#1a1a1a' : '#f0f0f0';
}

export function hexToInt(css: string): number {
  return parseInt(css.replace('#', ''), 16);
}

export function makeTopTex(
  day: number,
  extraLabel: string | null,
  hexColor: number,
  isToday: boolean,
): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d')!;
  if (isToday) {
    const grd = ctx.createRadialGradient(128, 128, 20, 128, 128, 170);
    grd.addColorStop(0, '#ffe066');
    grd.addColorStop(1, '#c8760a');
    ctx.fillStyle = grd;
  } else {
    ctx.fillStyle = hexBright(hexColor, 28);
  }
  ctx.fillRect(0, 0, 256, 256);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textCol = isToday ? '#1a1a1a' : autoText(hexColor, 28);
  const shadowCol = textCol === '#1a1a1a' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.55)';
  ctx.shadowColor = shadowCol;
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = textCol;
  ctx.font = extraLabel ? 'bold 118px system-ui,Arial,sans-serif' : 'bold 150px system-ui,Arial,sans-serif';
  ctx.fillText(String(day), 128, extraLabel ? 95 : 128);
  if (extraLabel) {
    ctx.shadowBlur = 4;
    ctx.font = 'bold 66px system-ui,Arial,sans-serif';
    ctx.fillStyle = textCol === '#1a1a1a' ? 'rgba(30,80,180,0.9)' : 'rgba(160,220,255,0.96)';
    ctx.fillText(extraLabel, 128, 190);
  }
  return new THREE.CanvasTexture(cv);
}

export function makeFrontTex(
  mainIcon: string,
  badgeStr: string,
  hexColor: number,
): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 256;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = hexStr(hexColor);
  ctx.fillRect(0, 0, 256, 256);
  if (mainIcon) {
    const hasBadge = badgeStr.length > 0;
    ctx.font = `${hasBadge ? 138 : 172}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mainIcon, 128, hasBadge ? 112 : 128);
  }
  if (badgeStr) {
    const badgeCol = autoText(hexColor, 0);
    ctx.font = 'bold 44px system-ui,Arial,sans-serif';
    ctx.fillStyle = badgeCol;
    ctx.shadowColor = badgeCol === '#1a1a1a' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 5;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(badgeStr, 128, 252);
  }
  return new THREE.CanvasTexture(cv);
}
