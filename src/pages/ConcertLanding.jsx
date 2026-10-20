import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { resolveEntityBySlug } from '@/lib/resolveEntity';
import TicketPurchase from '@/components/events/TicketPurchase';
import PageMeta from '@/components/shared/PageMeta';
import { QrCode, ScanLine, Ticket, ShieldCheck, MapPin, Calendar, Clock, ArrowLeft } from 'lucide-react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Bebas+Neue&display=swap');
.cl{--gold:#e8b84a;--gold2:#b8862b;--ink:#0a0a0a;--card:#141414;--txt:#f4efe6;--mut:#a9a39a;background:var(--ink);color:var(--txt);font-family:Montserrat,Arial,sans-serif;line-height:1.6;overflow-x:hidden;min-height:100vh}
.cl *{box-sizing:border-box}
.cl h1,.cl h2,.cl .bebas{font-family:'Bebas Neue',Impact,sans-serif;letter-spacing:.04em;font-weight:400}
.cl section{padding:72px 6vw;position:relative}
.cl .wrap{max-width:1050px;margin:0 auto}
.cl .tag{color:var(--gold);letter-spacing:.35em;font-size:.75rem;font-weight:600;text-transform:uppercase}
.cl h2{font-size:clamp(2.2rem,6vw,3.6rem);line-height:1.05;margin:8px 0 28px}
.cl .gold{background:linear-gradient(90deg,var(--gold),#fff3c4,var(--gold2));-webkit-background-clip:text;background-clip:text;color:transparent}
.cl .hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;background:radial-gradient(ellipse at 20% 0%,rgba(232,184,74,.28),transparent 55%),#050505;overflow:hidden}
.cl .hero::before{content:"";position:absolute;inset:0;background:var(--hero) center/cover no-repeat;opacity:.28}
.cl .hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,5,5,.2),#0a0a0a 96%)}
.cl .hero .wrap{position:relative;z-index:2}
.cl .presents{display:flex;align-items:center;gap:14px;justify-content:center;color:var(--gold);letter-spacing:.4em;font-size:.8rem;font-weight:600}
.cl .presents::before,.cl .presents::after{content:"";width:60px;height:1px;background:var(--gold)}
.cl .hero h1{font-size:clamp(3rem,13vw,9rem);line-height:.9;margin:18px 0 6px}
.cl .hero h1 small{display:block;font-size:.42em;font-style:italic;transform:skew(-8deg)}
.cl .sub{letter-spacing:.5em;font-weight:600;margin-bottom:34px}
.cl .meta{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:38px}
.cl .pill{border:1px solid rgba(232,184,74,.5);background:rgba(20,20,20,.7);backdrop-filter:blur(6px);padding:10px 20px;border-radius:50px;font-size:.9rem;display:inline-flex;gap:8px;align-items:center}
.cl .btn{display:inline-block;padding:15px 34px;border-radius:50px;font-weight:800;letter-spacing:.08em;text-decoration:none;text-transform:uppercase;font-size:.85rem;transition:transform .25s}
.cl .btn:hover{transform:translateY(-3px) scale(1.03)}
.cl .btn-gold{background:linear-gradient(120deg,var(--gold),var(--gold2));color:#111;box-shadow:0 8px 30px rgba(232,184,74,.35)}
.cl .btn-line{border:2px solid var(--gold);color:var(--gold)}
.cl .ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.cl .count{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;max-width:700px;margin:0 auto}
.cl .box{background:linear-gradient(160deg,#1b1b1b,#0e0e0e);border:1px solid rgba(232,184,74,.35);border-radius:18px;padding:18px 6px;text-align:center}
.cl .box b{display:block;font-family:'Bebas Neue',Impact,sans-serif;font-weight:400;font-size:clamp(2.4rem,9vw,4.6rem);line-height:1;color:var(--gold);font-variant-numeric:tabular-nums}
.cl .box span{font-size:.65rem;letter-spacing:.25em;color:var(--mut);text-transform:uppercase}
.cl .grid2{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
.cl .photo{border-radius:22px;aspect-ratio:4/5;background:var(--bio) center/cover,linear-gradient(135deg,#222,#0c0c0c);border:1px solid rgba(232,184,74,.35);box-shadow:0 0 0 8px rgba(232,184,74,.06),0 30px 60px rgba(0,0,0,.6)}
.cl .about p{color:#d6d0c6;margin-bottom:14px;white-space:pre-line}
.cl .info{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.cl .card{background:var(--card);border:1px solid #262626;border-radius:20px;padding:28px 22px;text-align:center;transition:.3s}
.cl .card:hover{border-color:var(--gold);transform:translateY(-6px)}
.cl .card h3{color:var(--gold);letter-spacing:.2em;font-size:.75rem;text-transform:uppercase;margin:8px 0 6px}
.cl .card p{font-size:1.1rem;font-weight:600}
.cl .tix{display:grid;grid-template-columns:1fr 1fr;gap:22px;max-width:860px;margin:0 auto;align-items:start}
.cl .t{border-radius:24px;padding:32px 24px;text-align:center;background:var(--card);border:1px solid #2a2a2a;position:relative}
.cl .t.hot{border:2px solid var(--gold);background:linear-gradient(160deg,#1d1710,#0f0f0f);box-shadow:0 0 50px rgba(232,184,74,.18)}
.cl .t.hot::before{content:"MEILLEUR PRIX";position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--gold);color:#111;font-size:.65rem;font-weight:800;letter-spacing:.15em;padding:4px 14px;border-radius:20px}
.cl .t h3{letter-spacing:.3em;font-size:.8rem;color:var(--mut)}
.cl .price{font-family:'Bebas Neue',Impact,sans-serif;font-size:4.4rem;line-height:1.1;color:var(--gold)}
.cl .price small{font-size:1.3rem;color:var(--txt)}
.cl .t p.d{color:var(--mut);margin:8px 0 18px;font-size:.9rem}
.cl .buy{text-align:left;color:#111}
.cl .access{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:8px}
.cl .step{background:var(--card);border:1px solid #262626;border-radius:20px;padding:24px 20px}
.cl .step svg{color:var(--gold);margin-bottom:10px}
.cl .step h3{font-weight:800;margin-bottom:6px}
.cl .step p{color:var(--mut);font-size:.9rem}
.cl .mine{margin-top:26px;border:1px solid rgba(232,184,74,.5);background:rgba(232,184,74,.08);border-radius:20px;padding:20px;display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.cl .back{position:absolute;top:16px;left:16px;z-index:5;color:var(--txt);font-size:.8rem;display:inline-flex;gap:6px;align-items:center;text-decoration:none;background:rgba(20,20,20,.7);padding:8px 14px;border-radius:50px;border:1px solid #333}
.cl footer{text-align:center;padding:40px 6vw;border-top:1px solid #1d1d1d;color:var(--mut);font-size:.8rem}
.cl footer b{color:var(--gold)}
@media(max-width:760px){.cl .grid2,.cl .tix,.cl .info,.cl .access{grid-template-columns:1fr}.cl .count{gap:8px}.cl section{padding:56px 5vw}.cl .photo{aspect-ratio:1}}
`;

const pad = (n) => String(n).padStart(2, '0');

function useCountdown(target) {
  const [left, setLeft] = useState(() => (target ? new Date(target).getTime() - Date.now() : 0));
  useEffect(() => {
    if (!target) return;
    const tick = () => setLeft(new Date(target).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return left;
}

const fmtF = (n) => Number(n || 0).toLocaleString('fr-FR');

export default function ConcertLanding() {
  const { slug } = useParams();
  const { data: event, isLoading } = useQuery({
    queryKey: ['concert-landing', slug],
    queryFn: () => resolveEntityBySlug('Event', slug, 'title'),
  });
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me(), retry: false });
  const { data: artist } = useQuery({
    queryKey: ['concert-artist', event?.artist_id, event?.artist_name],
    queryFn: async () => {
      if (event.artist_id) {
        const r = await base44.entities.Artist.filter({ id: event.artist_id });
        if (r[0]) return r[0];
      }
      const r = await base44.entities.Artist.filter({ name: event.artist_name });
      return r[0] || null;
    },
    enabled: !!event,
  });
  const { data: myTickets = [] } = useQuery({
    queryKey: ['concert-my-tickets', me?.email, event?.id],
    queryFn: () => base44.entities.Ticket.filter({ event_id: event.id, buyer_email: me.email }),
    enabled: !!me?.email && !!event?.id,
  });

  const left = useCountdown(event?.event_date);

  if (isLoading) {
    return <div className="cl"><style>{CSS}</style><div style={{ padding: 80, textAlign: 'center' }}>Chargement…</div></div>;
  }
  if (!event) {
    return (
      <div className="cl"><style>{CSS}</style>
        <div style={{ padding: 80, textAlign: 'center' }}>
          <p>Concert introuvable.</p>
          <Link to="/evenements" className="btn btn-line" style={{ marginTop: 20 }}>Voir les événements</Link>
        </div>
      </div>
    );
  }

  const cats = event.ticket_categories || [];
  const online = cats.find((c) => c.channel === 'online');
  const door = cats.find((c) => c.channel === 'door');
  const d = new Date(event.event_date);
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const timeStr = `${pad(d.getUTCHours())}h${pad(d.getUTCMinutes())}`;
  const started = left <= 0;
  const s = Math.max(0, Math.floor(left / 1000));
  const validTickets = myTickets.filter((t) => t.status === 'valide');
  const pendingTickets = myTickets.filter((t) => t.status === 'en_attente');
  const isStaff = me && (me.role === 'admin' || me.email === event.organizer_email || (event.managers || []).includes(me.email));
  const remaining = event.ticket_capacity > 0 ? Math.max(0, event.ticket_capacity - (event.tickets_sold || 0)) : null;
  const photo = artist?.photo_url || event.image_url;
  const heroImg = event.image_url || artist?.cover_url || artist?.photo_url;
  const [first, ...rest] = (event.artist_name || event.title).trim().split(' ');

  return (
    <div className="cl" style={{ '--hero': heroImg ? `url(${heroImg})` : 'none', '--bio': photo ? `url(${photo})` : 'none' }}>
      <style>{CSS}</style>
      <PageMeta title={`${event.title} — ${dateStr}`} description={event.description} image={heroImg} />

      <header className="hero">
        <Link to="/evenements" className="back"><ArrowLeft size={14} /> KKD Music</Link>
        <div className="wrap">
          <div className="presents">KKD MUSIC PRÉSENTE</div>
          <h1 className="bebas"><small className="gold">{first.toUpperCase()}</small><span className="gold">{rest.join(' ').toUpperCase()}</span></h1>
          <div className="sub">EN CONCERT</div>
          <div className="meta">
            <div className="pill"><Calendar size={15} /> {dateStr}</div>
            <div className="pill"><Clock size={15} /> {timeStr}</div>
            <div className="pill"><MapPin size={15} /> {event.location}</div>
          </div>
          <div className="ctas">
            <a className="btn btn-gold" href="#billets">Réserver ma place</a>
            <a className="btn btn-line" href="#artiste">Découvrir l’artiste</a>
          </div>
        </div>
      </header>

      <section>
        <div className="wrap" style={{ textAlign: 'center' }}>
          <div className="tag">Le grand jour approche</div>
          <h2>Compte à <span className="gold">rebours</span></h2>
          {started ? (
            <p className="gold bebas" style={{ fontSize: '2rem' }}>🔥 C’est ce soir ! Le concert a commencé 🔥</p>
          ) : (
            <div className="count">
              <div className="box"><b>{pad(Math.floor(s / 86400))}</b><span>Jours</span></div>
              <div className="box"><b>{pad(Math.floor((s % 86400) / 3600))}</b><span>Heures</span></div>
              <div className="box"><b>{pad(Math.floor((s % 3600) / 60))}</b><span>Minutes</span></div>
              <div className="box"><b>{pad(s % 60)}</b><span>Secondes</span></div>
            </div>
          )}
        </div>
      </section>

      <section id="artiste">
        <div className="wrap grid2">
          <div className="photo" role="img" aria-label={`Portrait de ${event.artist_name}`} />
          <div className="about">
            <div className="tag">L’artiste</div>
            <h2><span className="gold">{event.artist_name}</span></h2>
            {artist?.biography && <p>{artist.biography}</p>}
            {artist?.genre && <p>Univers : {artist.genre}</p>}
            <p><b className="gold">Label : {(artist?.label || 'KKD Music').trim()}</b></p>
            {artist?.slug && <Link to={`/artistes/${artist.slug}`} className="btn btn-line" style={{ marginTop: 8 }}>Voir le profil</Link>}
          </div>
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="tag">Informations pratiques</div>
          <h2>L’<span className="gold">événement</span></h2>
          <div className="info">
            <div className="card"><Calendar color="#e8b84a" /><h3>Date</h3><p>{dateStr}</p></div>
            <div className="card"><MapPin color="#e8b84a" /><h3>Lieu</h3><p>{event.location}</p></div>
            <div className="card"><Clock color="#e8b84a" /><h3>Heure</h3><p>{timeStr}</p></div>
          </div>
        </div>
      </section>

      <section id="billets">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <div className="tag">Billetterie</div>
          <h2>Vos <span className="gold">tickets</span></h2>
          {remaining !== null && <p style={{ color: 'var(--mut)', marginBottom: 20 }}>{remaining} place{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''}</p>}
          <div className="tix">
            <div className="t hot">
              <h3>{(online?.name || 'PRÉVENTE').toUpperCase()}</h3>
              <div className="price">{fmtF(online?.price ?? event.ticket_price)} <small>Fcfa</small></div>
              <p className="d">{online?.description || 'Tarif réduit, à réserver à l’avance'}</p>
              <div className="buy"><TicketPurchase event={event} /></div>
            </div>
            {door && (
              <div className="t">
                <h3>{door.name.toUpperCase()}</h3>
                <div className="price">{fmtF(door.price)} <small>Fcfa</small></div>
                <p className="d">{door.description || 'Tarif le soir même, à l’entrée'}</p>
                <p className="d">Paiement et remise du billet QR directement au guichet.</p>
              </div>
            )}
          </div>

          {me && (validTickets.length > 0 || pendingTickets.length > 0) && (
            <div className="mine">
              <div style={{ textAlign: 'left' }}>
                <b>{validTickets.length > 0 ? `Vous avez ${validTickets.length} billet${validTickets.length > 1 ? 's' : ''} validé${validTickets.length > 1 ? 's' : ''} 🎟️` : 'Paiement en cours de validation'}</b>
                <div style={{ color: 'var(--mut)', fontSize: '.85rem' }}>Présentez le QR code à l’entrée.</div>
              </div>
              <Link to="/mes-billets" className="btn btn-gold">Mon billet</Link>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="wrap">
          <div className="tag">Accès au concert</div>
          <h2>Comment <span className="gold">entrer</span></h2>
          <div className="access">
            <div className="step"><Ticket /><h3>1. Achetez</h3><p>Payez par carte ou Wave. Votre billet est validé puis disponible dans « Mes billets ».</p></div>
            <div className="step"><QrCode /><h3>2. Gardez votre QR</h3><p>Chaque billet a un QR code unique et sécurisé, impossible à falsifier ou à réutiliser.</p></div>
            <div className="step"><ScanLine /><h3>3. Scannez à l’entrée</h3><p>Les contrôleurs scannent votre QR : entrée validée en une seconde, historique entrées/sorties tracé.</p></div>
          </div>
          {isStaff && (
            <div className="mine">
              <div style={{ textAlign: 'left' }}><b><ShieldCheck size={16} style={{ display: 'inline', marginRight: 6 }} />Espace contrôleur</b><div style={{ color: 'var(--mut)', fontSize: '.85rem' }}>Scanner les billets et suivre les entrées en direct.</div></div>
              <Link to="/controle-acces" className="btn btn-gold">Ouvrir le contrôle d’accès</Link>
            </div>
          )}
        </div>
      </section>

      <footer><b>KKD MUSIC</b> · {event.title} · {dateStr} · {event.city || event.location}</footer>
    </div>
  );
}
