import React from 'react';
import { Check } from 'lucide-react';
import { Label } from '@/components/ui/label';

const THEMES = [
  { value: 'classic', label: 'Classic', swatch: 'linear-gradient(135deg, #E53935 0%, #8A1C1C 100%)' },
  { value: 'gold', label: 'Gold', swatch: 'linear-gradient(135deg, #D4AF37 0%, #8A6D1C 100%)' },
  { value: 'emerald', label: 'Emerald', swatch: 'linear-gradient(135deg, #1F8A5C 0%, #0D4D2E 100%)' },
  { value: 'royal', label: 'Royal', swatch: 'linear-gradient(135deg, #7C3AED 0%, #3D1B7A 100%)' },
  { value: 'ocean', label: 'Ocean', swatch: 'linear-gradient(135deg, #0EA5E9 0%, #0B4A7A 100%)' },
];

export default function TicketThemePicker({ value, onChange }) {
  return (
    <div className="space-y-2">
      <Label>Thème de design des billets</Label>
      <div className="grid grid-cols-5 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square flex items-end p-1.5 ${
              value === t.value ? 'border-primary scale-105 shadow-lg' : 'border-border/50 hover:border-primary/40'
            }`}
            style={{ background: t.swatch }}
            title={t.label}
          >
            <span className="text-[9px] font-bold text-white uppercase tracking-wide drop-shadow">{t.label}</span>
            {value === t.value && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <Check size={10} className="text-primary" />
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">Personnalisez l'apparence des billets PDF générés pour cet événement.</p>
    </div>
  );
}