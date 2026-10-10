import React from 'react';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { ScenarioBlock } from '../../types/game';
import { ScenarioCard, blocksToText, parseScenario } from '../common/ScenarioCard';

interface BlockEditorProps {
  scenario: string;
  blocks?: ScenarioBlock[];
  questionType: string;
  onChange: (blocks: ScenarioBlock[] | undefined, scenario: string) => void;
}

const input = 'w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-brand-dark focus:border-brand-accent focus:outline-none';
const label = 'block text-[11px] font-bold text-brand-secondary mb-1';

const NEW_BLOCKS: { name: string; make: () => ScenarioBlock }[] = [
  { name: 'Story text', make: () => ({ type: 'story', text: '' }) },
  { name: 'Notification', make: () => ({ type: 'notification', app: 'slack', sender: 'Mentor', text: '', priority: 'high' }) },
  { name: 'WhatsApp message', make: () => ({ type: 'chat', app: 'whatsapp', from: 'Mentor', side: 'them', text: '' }) },
  { name: 'Slack message', make: () => ({ type: 'chat', app: 'slack', from: 'Mentor', side: 'them', text: '' }) },
  { name: 'Alert banner', make: () => ({ type: 'alert', label: 'BREAKING UPDATE', text: '' }) },
  { name: 'Question line', make: () => ({ type: 'prompt', text: '' }) },
];

const TITLES: Record<ScenarioBlock['type'], string> = {
  story: 'Story text',
  notification: 'Notification',
  chat: 'Chat message',
  alert: 'Alert banner',
  prompt: 'Question line',
};

export const BlockEditor: React.FC<BlockEditorProps> = ({ scenario, blocks, questionType, onChange }) => {
  const commit = (next: ScenarioBlock[]) => onChange(next, blocksToText(next));
  const patch = (i: number, p: Partial<ScenarioBlock>) =>
    commit((blocks || []).map((b, j) => (j === i ? ({ ...b, ...p } as ScenarioBlock) : b)));
  const move = (i: number, d: number) => {
    const next = [...(blocks || [])];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  if (!blocks) {
    return (
      <div className="space-y-2">
        <textarea
          rows={4}
          value={scenario}
          onChange={(e) => onChange(undefined, e.target.value)}
          className="w-full rounded-xl bg-brand-light border border-slate-300 p-3.5 text-sm text-brand-dark font-medium leading-relaxed focus:border-brand-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={() => commit(parseScenario(scenario, questionType))}
          className="text-sm font-bold text-brand-primary hover:underline"
        >
          Split into blocks (notifications, chats, alerts)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {blocks.map((b, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-brand-light p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-brand-dark">{TITLES[b.type]}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30" title="Move up"><ArrowUp className="w-4 h-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30" title="Move down"><ArrowDown className="w-4 h-4" /></button>
              <button type="button" onClick={() => commit(blocks.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-red-100 text-red-600" title="Delete block"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>

          {b.type === 'notification' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <span className={label}>App</span>
                <select className={input} value={b.app} onChange={(e) => patch(i, { app: e.target.value as typeof b.app })}>
                  <option value="slack">Slack</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="mail">Mail</option>
                  <option value="sms">Messages</option>
                </select>
              </div>
              <div>
                <span className={label}>Sender</span>
                <input className={input} value={b.sender} onChange={(e) => patch(i, { sender: e.target.value })} />
              </div>
              <div>
                <span className={label}>Urgency</span>
                <select className={input} value={b.priority || ''} onChange={(e) => patch(i, { priority: (e.target.value || undefined) as typeof b.priority })}>
                  <option value="">None</option>
                  <option value="high">High (red)</option>
                  <option value="medium">Medium (orange)</option>
                  <option value="low">Low (yellow)</option>
                </select>
              </div>
              <div>
                <span className={label}>Lock-screen clock (first one)</span>
                <input className={input} placeholder="10:15 AM" value={b.clock || ''} onChange={(e) => patch(i, { clock: e.target.value || undefined })} />
              </div>
            </div>
          )}

          {b.type === 'chat' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <span className={label}>App</span>
                <select className={input} value={b.app} onChange={(e) => patch(i, { app: e.target.value as typeof b.app })}>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="slack">Slack</option>
                </select>
              </div>
              <div>
                <span className={label}>From</span>
                <input className={input} value={b.from} onChange={(e) => patch(i, { from: e.target.value })} />
              </div>
              <div>
                <span className={label}>Side</span>
                <select className={input} value={b.side} onChange={(e) => patch(i, { side: e.target.value as typeof b.side })}>
                  <option value="them">Them (left)</option>
                  <option value="me">You (right)</option>
                </select>
              </div>
            </div>
          )}

          {b.type === 'alert' && (
            <div>
              <span className={label}>Heading</span>
              <input className={input} value={b.label} onChange={(e) => patch(i, { label: e.target.value })} />
            </div>
          )}

          <div>
            <span className={label}>{b.type === 'notification' || b.type === 'chat' ? 'Message' : 'Text'}</span>
            <textarea rows={2} className={input} value={b.text} onChange={(e) => patch(i, { text: e.target.value })} />
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        {NEW_BLOCKS.map((n) => (
          <button
            key={n.name}
            type="button"
            onClick={() => commit([...blocks, n.make()])}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:border-brand-primary hover:text-brand-primary"
          >
            + {n.name}
          </button>
        ))}
      </div>

      <div>
        <span className={label}>Preview</span>
        <div className="rounded-2xl border border-dashed border-slate-300 p-4 bg-white">
          <ScenarioCard scenario={scenario} blocks={blocks} type={questionType} />
        </div>
      </div>
    </div>
  );
};
