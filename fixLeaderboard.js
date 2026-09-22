const fs = require('fs');
let content = fs.readFileSync('client/src/components/facilitator/LeaderboardView.tsx', 'utf8');

// Podium 1st place
content = content.replace(/bg-gradient-to-b from-brand-accent\/20 via-slate-900 to-slate-950 border-2 border-amber-400/g, 'bg-brand-white border-2 border-amber-400');
content = content.replace(/text-slate-950/g, 'text-brand-dark');

// Podium 2nd place
content = content.replace(/bg-gradient-to-b from-slate-800\/80 via-slate-900 to-slate-950 border-2 border-slate-400/g, 'bg-brand-white border-2 border-slate-300');

// Podium 3rd place
content = content.replace(/bg-gradient-to-b from-orange-950\/60 via-slate-900 to-slate-950 border-2 border-orange-700/g, 'bg-brand-white border-2 border-orange-300');

// List divider
content = content.replace(/divide-slate-800\/60/g, 'divide-slate-200');

// First place team
content = content.replace(/bg-gradient-to-r from-purple-950\/40 via-slate-900 to-slate-950 border-purple-500/g, 'bg-brand-white border-brand-primary');

// Any remaining slate-900
content = content.replace(/slate-900/g, 'brand-white');
content = content.replace(/slate-950/g, 'brand-light');

fs.writeFileSync('client/src/components/facilitator/LeaderboardView.tsx', content, 'utf8');
