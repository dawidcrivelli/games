// Kąty: wrap(a) → a w przedziale [-π, π] (różnica kierunków, skręcanie najkrótszą drogą).
'use strict';
const wrap = a => { while (a > Math.PI) a -= 2*Math.PI; while (a < -Math.PI) a += 2*Math.PI; return a; };
