import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';

export const TICKET_THEMES = [
  {
    value: 'classic',
    label: 'Classic KKD',
    desc: 'Rouge & Or vibrant',
    accentColor: '#E53935',
    swatch: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
    badgeCls: 'bg-red-600 text-white',
    borderCls: 'border-red-500/30',
  },
  {
    value: 'gold',
    label: 'Gold Prestige',
    desc: 'Doré impérial & VIP',
    accentColor: '#D4AF37',
    swatch: 'linear-gradient(135deg, #D4AF37 0%, #856214 100%)',
    badgeCls: 'bg-amber-600 text-white',
    borderCls: 'border-amber-500/40',
  },
  {
    value: 'emerald',
    label: 'Émeraude NIA',
    desc: 'Vert profond & Croissance africaine',
    accentColor: '#10B981',
    swatch: 'linear-gradient(135deg, #059669 0%, #064E3B 100%)',
    badgeCls: 'bg-emerald-700 text-white',
    borderCls: 'border-emerald-500/30',
  },
  {
    value: 'royal',
    label: 'Royal Purple',
    desc: 'Violet scène & Festival',
    accentColor: '#8B5CF6',
    swatch: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
    badgeCls: 'bg-purple-700 text-white',
    borderCls: 'border-purple-500/30',
  },
  {
    value: 'ocean',
    label: 'Bleu Océan',
    desc: 'Bleu atlantique & Sérénité',
    accentColor: '#0EA5E9',
    swatch: 'linear-gradient(135deg, #0284C7 0%, #075985 100%)',
    badgeCls: 'bg-sky-600 text-white',
    borderCls: 'border-sky-500/30',
  },
  {
    value: 'midnight',
    label: 'Midnight Black',
    desc: 'Noir sobre & Titane',
    accentColor: '#1F2937',
    swatch: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
    badgeCls: 'bg-zinc-800 text-white',
    borderCls: 'border-zinc-700/40',
  },
];

export const TICKET_CATEGORIES = [
  { id: 'standard', name: 'Pass Standard', priceMult: 1, badge: 'Standard', color: 'bg-primary/10 text-primary border-primary/20' },
  { id: 'vip', name: 'Pass VIP', priceMult: 2.5, badge: 'VIP Privilège', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
  { id: 'vvip', name: 'Pass VVIP / Backstage', priceMult: 4, badge: 'VVIP & Loge', color: 'bg-purple-500/15 text-purple-700 border-purple-500/30' },
  { id: 'carre_or', name: 'Carré Or', priceMult: 3, badge: 'Carré Or', color: 'bg-yellow-500/20 text-yellow-800 border-yellow-500/40' },
  { id: 'early_bird', name: 'Pass Early Bird', priceMult: 0.8, badge: 'Prévente', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30' },
  { id: 'festival', name: 'Pass Festival Complet', priceMult: 3.5, badge: 'Full Pass', color: 'bg-blue-500/15 text-blue-700 border-blue-500/30' },
];

export default function TicketThemePicker({ value, onChange }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Sparkles size={13} className="text-primary" /> Thème graphique & design du billet
        </Label>
        <span className="text-[11px] text-muted-foreground font-mono">
          {TICKET_THEMES.find(t => t.value === value)?.label || 'Classic KKD'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {TICKET_THEMES.map((t) => {
          const isSelected = value === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onChange(t.value)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all p-2.5 flex flex-col justify-between h-20 text-left ${
                isSelected
                  ? 'border-primary shadow-md ring-2 ring-primary/20 scale-[1.02]'
                  : 'border-border/60 hover:border-primary/40 bg-card'
              }`}
            >
              {/* Color Preview Pill */}
              <div
                className="w-full h-5 rounded-md shadow-xs flex items-center justify-end px-1"
                style={{ background: t.swatch }}
              >
                {isSelected && (
                  <span className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow-xs">
                    <Check size={9} className="text-zinc-900 stroke-[3]" />
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-foreground leading-tight truncate">{t.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{t.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Le style choisi sera appliqué aux billets PDF, au pass mobile et aux QR codes scannés à l'entrée.
      </p>
    </div>
  );
}
