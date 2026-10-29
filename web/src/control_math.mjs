// HIGHFLY C0-H: camera-relative directional controls for the diagnostic renderer.
// Right on the joystick ALWAYS means the camera's screen right.
// Horizontal drag follows the finger (opposite yaw sign to the original C0-G).
// No dependency on earlier HIGHFLY/Fury code.
export function cameraBasis(yaw) {
  const c=Math.cos(yaw), s=Math.sin(yaw);
  return {right:{x:-c,z:s},forward:{x:s,z:c}};
}
export function controlWorldVector(ix,iy,yaw) {
  const {right,forward}=cameraBasis(yaw);
  return {x:ix*right.x+iy*forward.x,z:ix*right.z+iy*forward.z};
}
export function yawAfterDrag(yaw,pointerDeltaX,sensitivity=0.006) {
  return yaw-pointerDeltaX*sensitivity;
}
