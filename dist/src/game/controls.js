/** Digit shortcuts never collide with the alphabetic word buffer or browser shortcuts. */
export const SPELL_HOTKEYS=Object.freeze({Digit1:'fire',Numpad1:'fire',Digit2:'ice',Numpad2:'ice',Digit3:'slow',Numpad3:'slow',Digit4:'wind',Numpad4:'wind'});
export function powerForKey(event) {
  if(event.repeat||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||event.isComposing)return null;
  return SPELL_HOTKEYS[event.code]||({'1':'fire','2':'ice','3':'slow','4':'wind'}[event.key])||null;
}
