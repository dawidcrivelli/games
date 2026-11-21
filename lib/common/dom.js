// DOM: $(id) → element; tap(id, fn) — kliknięcie / dotknięcie przycisku (bez domyślnej akcji).
'use strict';
const $ = id => document.getElementById(id);
const tap = (id, fn) => $(id).addEventListener('click', e => { e.preventDefault(); fn(); });
