import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';
import { slugify } from '@/lib/slugify';

export default function EntityForm({ fields, initialData, onSave, onCancel, title, onDirtyChange }) {
  const [data, setData] = useState(() => initialData || {});
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { data: artists = [] } = useQuery({
    queryKey: ['entityform-artists'],
    queryFn: () => base44.entities.Artist.list('name', 500),
  });

  // Reset form when initialData changes (switching between edit targets)
  useEffect(() => {
    setData(initialData || {});
    setIsDirty(false);
  }, [initialData]);

  const handleChange = (key, value) => {
    setData(prev => ({ ...prev, [key]: value }));
    if (!isDirty) {
      setIsDirty(true);
      onDirtyChange?.(true);
    }
  };

  const handleFileUpload = async (key, file) => {
    const result = await base44.integrations.Core.UploadFile({ file });
    handleChange(key, result.file_url);
  };

  const handlePrivateUpload = async (key, file) => {
    const result = await base44.integrations.Core.UploadPrivateFile({ file });
    handleChange(key, result.file_uri);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Auto-generate slug from title/name if not explicitly set
    const dataToSave = { ...data };
    if (!dataToSave.slug) {
      const nameVal = dataToSave.title || dataToSave.name;
      if (nameVal) dataToSave.slug = slugify(nameVal);
    }
    await onSave(dataToSave);
    setIsDirty(false);
    onDirtyChange?.(false);
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-lg">{title}</h2>
        {onCancel && (
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <Label className="text-sm font-medium mb-1.5 block">{field.label}</Label>
            
            {field.type === 'text' && (
              <Input
                value={data[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}

            {field.type === 'textarea' && (
              <Textarea
                value={data[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={4}
              />
            )}

            {field.type === 'date' && (
              <Input
                type="date"
                value={data[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            )}

            {field.type === 'datetime' && (
              <Input
                type="datetime-local"
                value={data[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
              />
            )}

            {field.type === 'number' && (
              <Input
                type="number"
                value={data[field.key] || ''}
                onChange={(e) => handleChange(field.key, parseFloat(e.target.value))}
              />
            )}

            {field.type === 'select' && (
              <Select
                value={data[field.key] || ''}
                onValueChange={(v) => handleChange(field.key, v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder || 'Sélectionner...'} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === 'boolean' && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={!!data[field.key]}
                  onCheckedChange={(v) => handleChange(field.key, v)}
                />
                <span className="text-sm text-muted-foreground">{field.placeholder}</span>
              </div>
            )}

            {field.type === 'file' && (
              <div className="space-y-2">
                {data[field.key] && (
                  <img src={data[field.key]} alt="" className="w-20 h-20 rounded-lg object-cover" />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files[0]) handleFileUpload(field.key, e.target.files[0]);
                  }}
                />
              </div>
            )}

            {field.type === 'audiofile' && (
              <div className="space-y-2">
                {data[field.key] && (
                  <audio src={data[field.key]} controls className="w-full" />
                )}
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    if (e.target.files[0]) handleFileUpload(field.key, e.target.files[0]);
                  }}
                />
                <p className="text-xs text-muted-foreground">{field.placeholder || 'Fichier audio public, écoutable gratuitement sur KKD.'}</p>
              </div>
            )}

            {field.type === 'privatefile' && (
              <div className="space-y-2">
                {data[field.key] && (
                  field.isVideo ? (
                    <video src={data[field.key]} controls className="w-full max-h-40 rounded-lg bg-black" />
                  ) : (
                    <audio src={data[field.key]} controls className="w-full" />
                  )
                )}
                <Input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => {
                    if (e.target.files[0]) handlePrivateUpload(field.key, e.target.files[0]);
                  }}
                />
                <p className="text-xs text-muted-foreground">{field.placeholder} · Stockage privé, accessible uniquement après achat.</p>
              </div>
            )}

            {field.type === 'artist' && (
              <select
                value={data[field.key] || ''}
                onChange={(e) => {
                  const a = artists.find((x) => x.id === e.target.value);
                  setData((prev) => ({ ...prev, [field.key]: e.target.value, artist_name: a?.name || prev.artist_name || '' }));
                  if (!isDirty) { setIsDirty(true); onDirtyChange?.(true); }
                }}
                required={field.required}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— Sélectionner un artiste —</option>
                {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}

            {field.type === 'url' && (
              <Input
                type="url"
                value={data[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder || 'https://...'}
              />
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/80">
            {saving ? 'Enregistrement...' : initialData?.id ? 'Modifier' : 'Ajouter'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
          )}
        </div>
      </form>
    </div>
  );
}