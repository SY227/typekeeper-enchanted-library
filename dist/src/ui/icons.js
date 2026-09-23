const p={
 sound:'<path d="M4 10H8L13 6V22L8 18H4Z"/><path d="M17 9C20 12 20 16 17 19M20 5C26 10 26 18 20 23"/>',
 mute:'<path d="M4 10H8L13 6V22L8 18H4Z"/><path d="M18 10L25 18M25 10L18 18"/>',
 fullscreen:'<path d="M4 10V4H10M18 4H24V10M24 18V24H18M10 24H4V18"/>',
 pause:'<path d="M9 6V22M19 6V22" stroke-width="4"/>',
 arrow:'<path d="M5 14H23M16 7L23 14L16 21"/>',
 back:'<path d="M23 14H5M12 7L5 14L12 21"/>',
 book:'<path d="M14 7C10 4 5 4 3 5V23C7 21 11 22 14 24C17 22 21 21 25 23V5C21 4 18 4 14 7ZM14 7V24"/>',
 gear:'<path d="M11 3H17L18 7L22 8L25 12L22 16L23 20L19 24L15 22L11 24L6 21L7 17L3 14L5 9L9 8Z"/><circle cx="14" cy="14" r="4"/>',
 trophy:'<path d="M8 4H20V12C20 20 8 20 8 12ZM8 7H3V11C3 15 7 16 10 16M20 7H25V11C25 15 21 16 18 16M14 18V23M8 25H20"/>',
 close:'<path d="M7 7L21 21M7 21L21 7"/>',
 quill:'<path d="M5 25L18 8M9 21C4 7 18 1 25 3C24 14 18 21 9 21ZM11 13L14 15M15 8L18 10"/>'
};
export function icon(name){return `<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[name]||p.book}</svg>`;}
export const ornament='<div class="ornament" aria-hidden="true"><span></span><b>◆</b><span></span></div>';
