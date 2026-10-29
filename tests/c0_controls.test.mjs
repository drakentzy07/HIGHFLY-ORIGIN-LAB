import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraBasis,controlWorldVector,yawAfterDrag} from '../web/src/control_math.mjs';

const EPS=1e-10;
function dot(a,b){return a.x*b.x+a.z*b.z;}
test('right input moves to CAMERA RIGHT, not mirror-left, for all quadrants',()=>{
  for(const yaw of [0,Math.PI/4,Math.PI/2,Math.PI,-1.2,2.6]){
    const basis=cameraBasis(yaw);
    const right=controlWorldVector(1,0,yaw),left=controlWorldVector(-1,0,yaw);
    const forward=controlWorldVector(0,1,yaw),back=controlWorldVector(0,-1,yaw);
    assert.ok(dot(right,basis.right)>.999999,'right, yaw '+yaw);
    assert.ok(dot(left,basis.right)<-.999999,'left, yaw '+yaw);
    assert.ok(dot(forward,basis.forward)>.999999,'forward, yaw '+yaw);
    assert.ok(dot(back,basis.forward)<-.999999,'back, yaw '+yaw);
    assert.ok(Math.abs(dot(right,forward))<EPS,'orthogonal, yaw '+yaw);
    assert.ok(Math.abs(dot(basis.right,basis.forward))<EPS);
  }
});
test('forward-right diagonal moves forward and to right without speed boost',()=>{
  for(const yaw of [-1.3,0,0.7,2]){
    const d=controlWorldVector(Math.SQRT1_2,Math.SQRT1_2,yaw);
    const b=cameraBasis(yaw);
    assert.ok(dot(d,b.right)>0.7);
    assert.ok(dot(d,b.forward)>0.7);
    assert.ok(Math.abs(Math.hypot(d.x,d.z)-1)<EPS);
  }
});
test('drag to right decreases yaw so the scenery follows the finger',()=>{
  assert.ok(yawAfterDrag(1,100)<1);
  assert.ok(yawAfterDrag(1,-100)>1);
  assert.equal(yawAfterDrag(1,0),1);
});
