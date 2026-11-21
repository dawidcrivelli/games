'use strict';
function nextCam() { S.cam = (S.cam + 1) % 3; lookA.yaw = lookA.pitch = 0; camSnap = S.cam === 2; hud(); }
