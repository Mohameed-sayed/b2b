const fs = require('fs');

function fixLine(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/const content = msg.replace\(\/\^\(Mentor\|Tutor\):\\s\*\/\, ''\).*?;/g, 
    "const content = msg.replace(/^(Mentor|Tutor):\\s*/, '').replace(/\\\\n/g, '\\n').replace(/â€”/g, '—').replace(/â€™/g, \"'\").replace(/\\uFFFD/g, '—');"
  );
  // Also catch the one where it ended up commented out:
  content = content.replace(/const content = msg.replace\(\/\^\(Mentor\|Tutor\):\\s\*\/\, ''\).*?\n/g, 
    "const content = msg.replace(/^(Mentor|Tutor):\\s*/, '').replace(/\\\\n/g, '\\n').replace(/â€”/g, '—').replace(/â€™/g, \"'\").replace(/\\uFFFD/g, '—');\n"
  );
  fs.writeFileSync(filepath, content, 'utf8');
}

fixLine('client/src/components/participant/ParticipantQuestion.tsx');
fixLine('client/src/components/facilitator/QuestionView.tsx');
