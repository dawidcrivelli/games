// silnik — wspólne dla: ciuchcia, zniwa
// wymaga z gry: S, camSnap, hud, lookA
'use strict';

// --- wspolne
function nextCam() { S.cam = (S.cam + 1) % 3; lookA.yaw = lookA.pitch = 0; camSnap = S.cam === 2; hud(); }
