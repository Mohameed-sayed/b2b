import React from 'react';
import { CheckCheck, Hash, Mail, MessageCircle, MessageSquare, Siren } from 'lucide-react';
import { NotificationApp, ScenarioBlock } from '../../types/game';

/**
 * Renders a question scenario as the thing it describes: phone notifications,
 * a WhatsApp or Slack thread, an alert banner, or plain story text.
 * Uses structured `blocks` when a question has them; otherwise parses the plain `scenario` text.
 */

type Notification = Extract<ScenarioBlock, { type: 'notification' }>;
type Chat = Extract<ScenarioBlock, { type: 'chat' }>;

const ME = /^(tutor|instructor|you|me)$/i;
const TIME = /\b(\d{1,2}:\d{2}\s?[AP]M)\b/i;
const PRIORITY_EMOJI = /^(\p{Extended_Pictographic}️?)\s*/u;
const QUOTED = /^['"“‘]([\s\S]+?)['"”’]$/;
const SPEAKER = /^([A-Z][A-Za-z]{1,19}(?: [A-Za-z]{1,19})?):\s+([\s\S]+)$/;
const EMOJI_PRIORITY: Record<string, Notification['priority']> = { '🔴': 'high', '🔥': 'high', '🟠': 'medium', '🟡': 'low' };

const clean = (s: string) =>
  s.replace(/\\n/g, '\n').replace(/â€™/g, "'").replace(/â€”/g, '—').replace(/�/g, '—');

const guessApp = (source: string): NotificationApp => {
  const s = source.toLowerCase();
  if (s.includes('whatsapp')) return 'whatsapp';
  if (s.includes('mail')) return 'mail';
  if (s.includes('sms') || s.includes('text')) return 'sms';
  return 'slack';
};

const guessSender = (sentence: string) =>
  sentence.match(/(?:the |a |your |an )?((?:[\w2]+ ){0,2}(?:mentor|coordinator|operations?|manager|lead|supervisor|teacher|parent|principal|admin))/i)?.[1]?.trim() || 'New message';

/** Best-effort conversion of plain scenario text into blocks (also used by the admin "convert" button). */
export function parseScenario(scenario: string, questionType?: string): ScenarioBlock[] {
  const raw = clean(scenario).split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const chatApp = questionType === 'slack-scenario' ? 'slack' : 'whatsapp';
  const blocks: ScenarioBlock[] = [];

  raw.forEach((b, i) => {
    const alert = b.match(/^🚨\s*([^:\n]+):\s*([\s\S]*)$/);
    if (alert) return blocks.push({ type: 'alert', label: alert[1].trim(), text: alert[2].trim() });

    const pri = b.match(PRIORITY_EMOJI);
    if (pri) {
      const m = b.slice(pri[0].length).match(/^(.+?):\s*(['"“‘][\s\S]+['"”’])$/);
      const q = m && m[2].match(QUOTED);
      if (m && q) {
        return blocks.push({ type: 'notification', app: guessApp(m[1]), sender: m[1].trim(), text: q[1].trim(), priority: EMOJI_PRIORITY[pri[1]] });
      }
    }

    const speaker = b.match(SPEAKER);
    if (speaker && !/^(note|scenario|question|reminder)$/i.test(speaker[1])) {
      const from = /^operations?$/i.test(speaker[1]) ? 'Operations' : speaker[1];
      return blocks.push({ type: 'chat', app: chatApp, from, side: ME.test(from) ? 'me' : 'them', text: speaker[2].trim() });
    }

    // "...the coordinator pings you:\n'quoted message'"
    const inline = b.match(/^([\s\S]*?)\n\s*(['"“‘][\s\S]+['"”’])$/);
    const iq = inline && inline[2].match(QUOTED);
    if (inline && iq && /:\s*$/.test(inline[1])) {
      blocks.push({ type: 'story', text: inline[1].replace(/:\s*$/, '.').trim() });
      return blocks.push({ type: 'notification', app: 'slack', sender: guessSender(inline[1]), text: iq[1].trim() });
    }

    if (i === raw.length - 1 && raw.length > 1 && /\?\s*$/.test(b)) return blocks.push({ type: 'prompt', text: b });
    blocks.push({ type: 'story', text: b });
  });
  return blocks;
}

/** Plain-text version of blocks, kept in `question.scenario` as a fallback. */
export function blocksToText(blocks: ScenarioBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'alert': return `🚨 ${b.label}: ${b.text}`;
        case 'notification': return `${b.sender}: ${b.text}`;
        case 'chat': return `${b.from}: ${b.text}`;
        default: return b.text;
      }
    })
    .join('\n\n');
}

const PRIORITY_COLOR = { high: 'bg-red-500', medium: 'bg-orange-500', low: 'bg-yellow-400' };

const APPS: Record<NotificationApp, { name: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  slack: { name: 'Slack', color: 'bg-[#4A154B]', Icon: Hash },
  whatsapp: { name: 'WhatsApp', color: 'bg-[#25D366]', Icon: MessageCircle },
  mail: { name: 'Mail', color: 'bg-[#0A84FF]', Icon: Mail },
  sms: { name: 'Messages', color: 'bg-[#34C759]', Icon: MessageSquare },
};

const AGO = ['now', '1m ago', '3m ago', '5m ago', '8m ago'];

const Notifications: React.FC<{ items: Notification[]; clock?: string }> = ({ items, clock }) => (
  <div className="rounded-[2rem] p-4 md:p-6 bg-gradient-to-b from-brand-dark via-[#26407f] to-brand-primary shadow-2xl">
    {clock && <div className="text-center text-white/90 text-5xl md:text-6xl font-light tracking-tight pt-2 pb-5">{clock.replace(/\s?[AP]M/i, '')}</div>}
    <div className="space-y-2.5">
      {items.map((n, i) => {
        const app = APPS[n.app] || APPS.slack;
        return (
          <div
            key={i}
            className="motion-safe:animate-slide-up relative flex gap-3 rounded-2xl bg-white/90 backdrop-blur-md p-3 md:p-4 shadow-lg"
            style={{ animationDelay: `${i * 450}ms`, animationFillMode: 'both' }}
          >
            {n.priority && <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${PRIORITY_COLOR[n.priority]}`} />}
            <div className={`w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-xl flex items-center justify-center text-white ${app.color}`}>
              <app.Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3 text-xs text-slate-500">
                <span className="font-bold text-slate-700 truncate">{app.name} · {n.sender}</span>
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

const stamp = (i: number) => `10:${String(12 + i).padStart(2, '0')}`;

const SlackThread: React.FC<{ items: Chat[] }> = ({ items }) => (
  <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
    <div className="bg-[#4A154B] px-5 py-3 flex items-center gap-2 text-white">
      <Hash className="w-4 h-4 opacity-70" />
      <span className="font-extrabold">b2b-support</span>
    </div>
    <div className="p-4 md:p-6 space-y-4 max-h-[50vh] overflow-y-auto">
      {items.map((m, i) => {
        const me = m.side === 'me';
        return (
          <div key={i} className="flex gap-3">
            <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-black text-white ${me ? 'bg-[#1264A3]' : 'bg-[#2EB67D]'}`}>
              {(me ? 'Y' : m.from[0] || '?').toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-black text-slate-900">{me ? 'You' : m.from}</span>
                <span className="text-xs text-slate-500">{stamp(i)} AM</span>
              </div>
              <p dir="auto" className="text-slate-800 text-base md:text-lg leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const WhatsAppThread: React.FC<{ items: Chat[] }> = ({ items }) => {
  const title = items.find((m) => m.side === 'them')?.from || 'Mentor';
  return (
    <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-[#efeae2] max-w-2xl mx-auto w-full">
      <div className="bg-[#008069] px-4 py-3 flex items-center gap-3 text-white">
        <div className="w-10 h-10 rounded-full bg-white/90 text-[#008069] flex items-center justify-center font-black">{title[0]}</div>
        <div className="leading-tight">
          <div className="font-bold">{title}</div>
          <div className="text-xs text-emerald-100">online</div>
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-2.5 max-h-[50vh] overflow-y-auto">
        {items.map((m, i) => {
          const me = m.side === 'me';
          return (
            <div key={i} className={`max-w-[85%] w-fit rounded-2xl px-3.5 py-2 shadow-sm ${me ? 'ml-auto bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
              <p dir="auto" className="text-slate-900 text-base md:text-lg leading-snug whitespace-pre-wrap break-words">{m.text}</p>
              <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500 mt-0.5">
                {stamp(i)}
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
  blocks?: ScenarioBlock[];
  type?: string;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, blocks: given, type }) => {
  const blocks = given ? given : parseScenario(scenario, type);

  // group consecutive chat (same app) / notification blocks into one device
  const out: React.ReactNode[] = [];
  for (let i = 0; i < blocks.length; ) {
    const b = blocks[i];
    if (b.type === 'chat' || b.type === 'notification') {
      let j = i;
      while (j < blocks.length && blocks[j].type === b.type && (b.type !== 'chat' || (blocks[j] as Chat).app === b.app)) j++;
      const run = blocks.slice(i, j);
      if (b.type === 'chat') {
        out.push(b.app === 'slack' ? <SlackThread key={i} items={run as Chat[]} /> : <WhatsAppThread key={i} items={run as Chat[]} />);
      } else {
        const items = run as Notification[];
        const prev = blocks[i - 1];
        const clock = items[0].clock || (prev && 'text' in prev ? prev.text.match(TIME)?.[1] : undefined);
        out.push(<Notifications key={i} items={items} clock={clock} />);
      }
      i = j;
      continue;
    }
    if (b.type === 'alert') {
      out.push(
        <div key={i} className="flex gap-3 rounded-2xl bg-orange-50 border-2 border-brand-accent p-4 md:p-5 text-brand-dark">
          <Siren className="w-6 h-6 shrink-0 text-brand-accent mt-0.5" />
          <div>
            <div className="font-black text-brand-accent">{b.label}</div>
            <p dir="auto" className="mt-1 text-base md:text-lg leading-relaxed font-medium whitespace-pre-wrap">{b.text}</p>
          </div>
        </div>
      );
    } else if (b.type === 'prompt') {
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
