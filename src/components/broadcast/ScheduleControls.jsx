import React from 'react';
import { Calendar, Clock, Check } from 'lucide-react';

export default function ScheduleControls({ scheduled_date, status, onChange, onSchedule }) {
  const value = scheduled_date
    ? new Date(new Date(scheduled_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : '';

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 space-y-3">
      <h3 className="font-heading font-bold text-sm flex items-center gap-2">
        <Calendar size={16} className="text-primary" /> Programmation
      </h3>
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Clock size={11} /> Date & heure du direct
        </label>
        <input
          type="datetime-local"
          value={value}
          onChange={e => onChange({ scheduled_date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>
      {status === 'programme' && scheduled_date && (
        <p className="text-xs text-green-500 flex items-center gap-1.5"><Check size={12} /> Direct programmé.</p>
      )}
      <button
        onClick={onSchedule}
        disabled={!scheduled_date}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/40 text-primary text-sm font-medium disabled:opacity-40"
      >
        <Calendar size={14} /> Programmer ce direct
      </button>
    </div>
  );
}