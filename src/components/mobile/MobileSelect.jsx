import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Check } from 'lucide-react';

/**
 * MobileSelect — renders a Radix Select on desktop and a native bottom-sheet Drawer on mobile.
 * Props match the pattern: value, onValueChange, options [{value, label}], placeholder, triggerClassName
 */
export default function MobileSelect({ value, onValueChange, options = [], placeholder = 'Choisir...', triggerClassName = '' }) {
  const [open, setOpen] = useState(false);
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  const selected = options.find(o => o.value === value);

  const handleSelect = (val) => {
    onValueChange(val);
    setOpen(false);
  };

  if (!isMobile) {
    // Desktop: standard select element styled consistently
    return (
      <select
        value={value || ''}
        onChange={e => onValueChange(e.target.value)}
        className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${triggerClassName}`}
      >
        {!value && <option value="" disabled>{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm text-left ${!selected ? 'text-muted-foreground' : ''} ${triggerClassName}`}
      >
        {selected ? selected.label : placeholder}
        <span className="text-muted-foreground text-xs">▾</span>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader className="pb-0">
            <DrawerTitle className="text-base font-heading">{placeholder}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 pt-2 space-y-1">
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => handleSelect(o.value)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium hover:bg-secondary active:bg-secondary/80 transition-colors"
              >
                <span>{o.label}</span>
                {value === o.value && <Check size={16} className="text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}