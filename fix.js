const fs = require('fs');
const file = 'client/src/components/participant/ParticipantQuestion.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `            {/* Big YES / NO Verdict Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSelectOption('YES')}
                className="py-4 px-3 rounded-2xl bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-green-600 hover:to-emerald-600 active:scale-95 text-brand-dark font-black text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 border border-emerald-400/30 transition-all"
              >
                <ThumbsUp className="w-6 h-6" />
                <span>PROFESSIONAL</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOption('NO')}
                className="py-4 px-3 rounded-2xl bg-gradient-to-b from-rose-600 to-rose-700 hover:from-red-600 hover:to-rose-600 active:scale-95 text-brand-dark font-black text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 border border-rose-400/30 transition-all"
              >
                <ThumbsDown className="w-6 h-6" />
                <span>UNPROFESSIONAL</span>
              </button>
            </div>`;

const replacement = `            {/* Big YES / NO Verdict Buttons */}
            <div className={\`grid \${question.options.length <= 2 && question.options.some(o => o.id === 'YES' || o.id === 'NO') ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pt-2\`}>
              {question.options.map((opt) => {
                const isYes = opt.id === 'YES';
                const isNo = opt.id === 'NO';
                
                if (isYes || isNo) {
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt.id)}
                      className={\`py-4 px-3 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg border transition-all active:scale-95 text-brand-dark \${
                        isYes 
                          ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-green-600 hover:to-emerald-600 shadow-emerald-600/20 border-emerald-400/30' 
                          : 'bg-gradient-to-b from-rose-600 to-rose-700 hover:from-red-600 hover:to-rose-600 shadow-rose-600/20 border-rose-400/30'
                      }\`}
                    >
                      {isYes ? <ThumbsUp className="w-6 h-6" /> : <ThumbsDown className="w-6 h-6" />}
                      <span>{opt.text}</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className="p-3.5 rounded-2xl border-2 text-left transition-all active:scale-98 flex items-start gap-3 bg-brand-white border-slate-200 hover:bg-slate-50 text-slate-500"
                  >
                    <span className="w-8 h-8 rounded-xl font-black font-mono flex items-center justify-center shrink-0 text-xs shadow bg-slate-100">
                      {opt.id}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-brand-dark mt-1 leading-snug flex-1">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>`;

// Replace ignoring line endings
const startIdx = content.indexOf('            {/* Big YES / NO Verdict Buttons */}');
const endIdx = content.indexOf('            </div>', startIdx) + 18;
if (startIdx > -1 && endIdx > -1) {
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync(file, content);
  console.log('Fixed ParticipantQuestion.tsx');
} else {
  console.log('Could not find target');
}
