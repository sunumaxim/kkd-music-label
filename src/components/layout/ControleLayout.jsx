import React from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO_URL = 'https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png';

/**
 * Layout isolé pour le sous-domaine controle.kkdmusic.com
 * Aucune navigation vers l'app principale — uniquement le contrôle d'accès.
 */
export default function ControleLayout() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/30 bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="KKD" className="h-8 w-auto" />
            <div className="flex items-center gap-1.5 pl-2.5 border-l border-border/40">
              <ShieldCheck size={16} className="text-primary" />
              <span className="font-heading font-bold text-sm">Contrôle d'accès</span>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden sm:block max-w-[180px] truncate">{user.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => base44.auth.logout('/login')}
                className="text-muted-foreground hover:text-foreground text-xs gap-1"
              >
                <LogOut size={13} /> Quitter
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}