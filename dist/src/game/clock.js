/** Fixed simulation steps with bounded catch-up; presentation is interpolated independently. */
export class FixedClock {
  constructor(step = 1/60) { this.step=step;this.accumulator=0;this.last=null; }
  reset() { this.accumulator=0;this.last=null; }
  advance(now, update, active=true) {
    if(this.last===null){this.last=now;return 0;}
    const elapsed=Math.min(.1,Math.max(0,(now-this.last)/1000));this.last=now;
    if(!active){this.accumulator=0;return 1;}
    this.accumulator+=elapsed;
    while(this.accumulator>=this.step){update(this.step);this.accumulator-=this.step;}
    return this.accumulator/this.step;
  }
}
