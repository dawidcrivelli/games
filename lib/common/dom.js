'use strict';
const $ = id => document.getElementById(id);
const tap = (id, fn) => $(id).addEventListener('click', e => { e.preventDefault(); fn(); });
