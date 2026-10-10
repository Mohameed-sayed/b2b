import React from 'react';
import { CheckCheck, Hash, Mail, MessageCircle, MessageSquare, Siren } from 'lucide-react';

/**
 * Renders a question scenario as the thing it describes: phone notifications,
 * a WhatsApp or Slack thread, an alert banner, or plain story text.
 * Scenario text is split on blank lines and each block is classified by its shape.
 */

type Block =
  | { kind: 'chat'; speaker: string; text: string }
  | { kind: 'notification'; priority: string; source: string; text: string }
  | { kind: 'alert'; label: string; text: string }
  | { kind: 'story'; text: string }
  | { kind: 'prompt'; text: string };

const ME = /^(tutor|instructor|you|me)$/i;
const PRIORITY_EMOJI = /^(\p{Extended_Pictographic}️?)\s*/u;
const QUOTED = /^['"“‘]([\s\S]+?)['"”’]$/;
const SPEAKER = /^([A-Z][A-Za-z]{1,19}(?: [A-Za-z]{1,19})?):\s+([\s\S]+)$/;

const clean = (s: string) =>
  s.replace(/\\n/g, '\n').replace(/â€™/g, "'").replace(/â€”/g, '—').replace(/�/g, '—');

const guessSource = (sentence: string) =>
  sentence.match(/(?:the |a |your |an )?((?:[\w2]+ ){0,2}(?:mentor|coordinator|operations?|manager|lead|teacher|parent|principal|admin))/i)?.[1]?.trim() ||
  'New message';

function parse(scenario: string): Block[] {
  const raw = clean(scenario).split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const blocks: Block[] = [];

  raw.forEach((b, i) => {
    const alert = b.match(/^🚨\s*([^:\n]+):\s*([\s\S]*)$/);
    if (alert) return blocks.push({ kind: 'alert', label: alert[1].trim(), text: alert[2].trim() });

    const pri = b.match(PRIORITY_EMOJI);
    if (pri) {
      const rest = b.slice(pri[0].length);
      const m = rest.match(/^(.+?):\s*(['"“‘][\s\S]+['"”’])$/);
      const q = m && m[2].match(QUOTED);
      if (m && q) return blocks.push({ kind: 'notification', priority: pri[1], source: m[1].trim(), text: q[1].trim() });
    }

    const speaker = b.match(SPEAKER);
    if (speaker && !/^(note|scenario|question|reminder)$/i.test(speaker[1])) {
      return blocks.push({ kind: 'chat', speaker: speaker[1], text: speaker[2].trim() });
    }

    // "...the coordinator pings you:\n'quoted message'"
    const inline = b.match(/^([\s\S]*?)\n\s*(['"“‘][\s\S]+['"”’])$/);
    const iq = inline && inline[2].match(QUOTED);
    if (inline && iq && /:\s*$/.test(inline[1])) {
      blocks.push({ kind: 'story', text: inline[1].replace(/:\s*$/, '.').trim() });
      return blocks.push({ kind: 'notification', priority: '', source: guessSource(inline[1]), text: iq[1].trim() });
    }

    if (i === raw.length - 1 && raw.length > 1 && /\?\s*$/.test(b)) return blocks.push({ kind: 'prompt', text: b });
    blocks.push({ kind: 'story', text: b });
  });
  return blocks;
}

const PRIORITY_COLOR: Record<string, string> = {
  '🔴': 'bg-red-500', '🔥': 'bg-red-500', '🟠': 'bg-orange-500', '🟡': 'bg-yellow-400', '🟢': 'bg-emerald-500', '🔵': 'bg-blue-500',
};

function appFor(source: string) {
  const s = source.toLowerCase();
  if (s.includes('whatsapp')) return { name: 'WhatsApp', color: 'bg-[#25D366]', Icon: MessageCircle };
  if (s.includes('mail')) return { name: 'Mail', color: 'bg-[#0A84FF]', Icon: Mail };
  if (s.includes('sms') || s.includes('text')) return { name: 'Messages', color: 'bg-[#34C759]', Icon: MessageSquare };
  return { name: 'Slack', color: 'bg-[#4A154B]', Icon: Hash };
}

const label = (source: string, app: string) => {
  const rest = source.replace(new RegExp(app, 'i'), '').trim();
  return rest ? rest[0].toUpperCase() + rest.slice(1) : source;
};

const AGO = ['now', '1m ago', '3m ago', '5m ago', '8m ago'];

const Notifications: React.FC<{ items: Extract<Block, { kind: 'notification' }>[]; clock?: string }> = ({ items, clock }) => (
  <div className="rounded-[2rem] p-4 md:p-6 bg-gradient-to-b from-brand-dark via-[#26407f] to-brand-primary shadow-2xl">
    {clock && <div className="text-center text-white/90 text-5xl md:text-6xl font-light tracking-tight pt-2 pb-5">{clock.replace(/\s?[AP]M/i, '')}</div>}
    <div className="space-y-2.5">
      {items.map((n, i) => {
        const app = appFor(n.source);
        return (
          <div
            key={i}
            className="motion-safe:animate-slide-up relative flex gap-3 rounded-2xl bg-white/90 backdrop-blur-md p-3 md:p-4 shadow-lg"
            style={{ animationDelay: `${i * 450}ms`, animationFillMode: 'both' }}
          >
            {n.priority && <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${PRIORITY_COLOR[n.priority] || 'bg-slate-400'}`} />}
            <div className={`w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-xl flex items-center justify-center text-white ${app.color}`}>
              <app.Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3 text-xs text-slate-500">
                <span className="font-bold text-slate-700 truncate">{app.name} · {label(n.source, app.name)}</span>
                <span className="shrink-0">{AGO[Math.min(i, AGO.length - 1)]}</span>
              </div>
              <p dir="auto" className="mt-0.5 text-slate-900 text-base md:text-lg leading-snug whitespace-pre-wrap break-words">{n.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const Thread: React.FC<{ items: Extract<Block, { kind: 'chat' }>[]; slack: boolean }> = ({ items, slack }) => {
  const other = items.find((m) => !ME.test(m.speaker))?.speaker || 'Mentor';
  const title = /^operation$/i.test(other) ? 'Operations' : other;

  if (slack) {
    return (
      <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
        <div className="bg-[#4A154B] px-5 py-3 flex items-center gap-2 text-white">
          <Hash className="w-4 h-4 opacity-70" />
          <span className="font-extrabold">b2b-support</span>
        </div>
        <div className="p-4 md:p-6 space-y-4 max-h-[50vh] overflow-y-auto">
          {items.map((m, i) => {
            const me = ME.test(m.speaker);
            return (
              <div key={i} className="flex gap-3">
                <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-black text-white ${me ? 'bg-[#1264A3]' : 'bg-[#2EB67D]'}`}>
                  {(me ? 'Y' : m.speaker[0]).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-slate-900">{me ? 'You' : m.speaker}</span>
                    <span className="text-xs text-slate-500">10:{String(12 + i).padStart(2, '0')} AM</span>
                  </div>
                  <p dir="auto" className="text-slate-800 text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-[#efeae2] max-w-2xl mx-auto">
      <div className="bg-[#008069] px-4 py-3 flex items-center gap-3 text-white">
        <div className="w-10 h-10 rounded-full bg-white/90 text-[#008069] flex items-center justify-center font-black">{title[0]}</div>
        <div className="leading-tight">
          <div className="font-bold">{title}</div>
          <div className="text-xs text-emerald-100">online</div>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-2.5 max-h-[50vh] overflow-y-auto">
        {items.map((m, i) => {
          const me = ME.test(m.speaker);
          const time = `10:${String(12 + i).padStart(2, '0')}`;
          return (
            <div key={i} className={`max-w-[85%] w-fit rounded-2xl px-3.5 py-2 shadow-sm ${me ? 'ml-auto bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
              <p dir="auto" className="text-slate-900 text-base md:text-lg leading-snug whitespace-pre-wrap break-words">{m.text}</p>
              <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500 mt-0.5">
                {time}
                {me && <CheckCheck className="w-4 h-4 text-sky-500" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ScenarioCardProps {
  scenario: string;
  type?: string;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, type }) => {
  const blocks = parse(scenario);
  // group consecutive chat / notification blocks into one device
  const out: React.ReactNode[] = [];
  for (let i = 0; i < blocks.length; ) {
    const b = blocks[i];
    if (b.kind === 'chat' || b.kind === 'notification') {
      let j = i;
      while (j < blocks.length && blocks[j].kind === b.kind) j++;
      const run = blocks.slice(i, j);
      const prev = blocks[i - 1];
      const clock = prev && 'text' in prev ? prev.text.match(/\b(\d{1,2}:\d{2}\s?[AP]M)\b/i)?.[1] : undefined;
      out.push(b.kind === 'chat'
        ? <Thread key={i} items={run as Extract<Block, { kind: 'chat' }>[]} slack={type === 'slack-scenario'} />
        : <Notifications key={i} items={run as Extract<Block, { kind: 'notification' }>[]} clock={clock} />);
      i = j;
      continue;
    }
    if (b.kind === 'alert') {
      out.push(
        <div key={i} className="flex gap-3 rounded-2xl bg-orange-50 border-2 border-brand-accent p-4 md:p-5 text-brand-dark">
          <Siren className="w-6 h-6 shrink-0 text-brand-accent mt-0.5" />
          <div>
            <div className="font-black text-brand-accent">{b.label}</div>
            <p dir="auto" className="mt-1 text-base md:text-lg leading-relaxed font-medium whitespace-pre-wrap">{b.text}</p>
          </div>
        </div>
      );
    } else if (b.kind === 'prompt') {
      out.push(<p key={i} dir="auto" className="text-xl md:text-2xl font-black text-brand-dark leading-snug whitespace-pre-wrap">{b.text}</p>);
    } else {
      out.push(
        <p key={i} dir="auto" className="border-l-4 border-brand-primary pl-4 text-brand-dark text-lg md:text-xl font-medium leading-relaxed whitespace-pre-wrap">
          {b.text}
        </p>
      );
    }
    i++;
  }
  return <div className="space-y-5 mb-8">{out}</div>;
};
