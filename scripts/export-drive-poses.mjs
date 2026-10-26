import {writeFileSync} from 'node:fs';
import {drivePose} from '../src/rotary-drive.ts';
import {springCycle} from '../src/process-cycle.ts';
// Shared runtime equations, sampled at 8 fps for the labelled Blender fallback films.
const frames=[1,2].map(step=>({step,frames:Array.from({length:48},(_,i)=>({t:i/8,form:springCycle(step,i/8).form,drives:Array.from({length:8},(_,axis)=>{const p=drivePose(axis,step,i/8);return [p.theta,p.travel,p.linkAngle];})}))}));
writeFileSync(new URL('./drive-preview-poses.json',import.meta.url),JSON.stringify(frames));
