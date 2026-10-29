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

export const CAMERA_PITCH_MIN = -0.25; // look slightly upward
export const CAMERA_PITCH_MAX = 1.08; // look down, but avoid overhead camera
export function pitchAfterDrag(pitch, pointerDeltaY, sensitivity = 0.004) {
  // Swipe UP => look UP (camera moves below previous orbit elevation).
  return Math.max(CAMERA_PITCH_MIN,
    Math.min(CAMERA_PITCH_MAX, pitch + pointerDeltaY * sensitivity));
}
export function orbitCameraPosition(focus, yaw, pitch, distance = 15) {
  // True spherical orbit: pitch changes BOTH height and horizontal radius.
  const horizontal = Math.cos(pitch) * distance;
  return {
    x: focus.x - Math.sin(yaw) * horizontal,
    y: focus.y + Math.sin(pitch) * distance,
    z: focus.z - Math.cos(yaw) * horizontal,
  };
}
