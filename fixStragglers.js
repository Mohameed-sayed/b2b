const fs = require('fs');

function replaceFile(path, regexes) {
  let content = fs.readFileSync(path, 'utf8');
  let orig = content;
  regexes.forEach(([re, rep]) => {
    content = content.replace(re, rep);
  });
  if (orig !== content) fs.writeFileSync(path, content, 'utf8');
}

replaceFile('client/src/components/facilitator/AnswerRevealView.tsx', [
  [/bg-gradient-to-br from-emerald-950\/30 via-slate-900 to-slate-950/g, 'bg-green-50'],
  [/bg-gradient-to-b from-orange-950\/20 via-slate-900 to-slate-950/g, 'bg-brand-white']
]);

replaceFile('client/src/components/facilitator/EscapeRoomView.tsx', [
  [/bg-gradient-to-r from-red-600\/30 via-orange-600\/20 to-slate-900/g, 'bg-brand-white']
]);

replaceFile('client/src/components/facilitator/QuestionView.tsx', [
  [/text-slate-900/g, 'text-brand-dark']
]);

replaceFile('client/src/components/facilitator/ReflectionWallView.tsx', [
  [/text-slate-950/g, 'text-brand-white']
]);

replaceFile('client/src/components/participant/ParticipantLeaderboard.tsx', [
  [/bg-gradient-to-r from-brand-accent\/20 via-slate-900 to-slate-900/g, 'bg-brand-white'],
  [/text-slate-950/g, 'text-brand-white']
]);

replaceFile('client/src/components/participant/ParticipantQuestion.tsx', [
  [/text-slate-900/g, 'text-brand-dark']
]);
