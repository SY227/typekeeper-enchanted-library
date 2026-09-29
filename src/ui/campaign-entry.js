/** Read-only entry choices. A new attempt never means resetting lifetime progress.
 * Call with validated LocalStore data; this module has no writes or randomness.
 */
export function campaignEntryState(progress={}, checkpoint=null, recordedAttempt=false){
 const hasProgress=Boolean(checkpoint)||Number(progress.unlocked)>1||Object.keys(progress.stages||{}).length>0||recordedAttempt===true;
 return Object.freeze({
  hasProgress,
  canContinue:Boolean(checkpoint),
  showRestart:Boolean(checkpoint),
  primaryLabel:checkpoint?'Continue':hasProgress?'Start from Chapter 1':'Play',
  primaryAction:checkpoint?'continue':hasProgress?'new-confirm':'start',
 });
}
