import React from 'react';

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";
const SIGNATURE_URL = "https://media.base44.com/images/public/6a1cbc29f199c6e829efde07/dcbcb9b1a_InShot_20260722_181043759.jpg";

const CONTACT_EMAILS = [
  "contact@kkdmusic.com",
  "labelkkd@gmail.com",
  "africainrap90@gmail.com",
];

const fmt = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '____ / ____ / ______');

/**
 * Document de contrat KKD Music — rendu A4 pour capture et impression PDF.
 * Design officiel avec cadre noble, en-tête rougeâtre, texte juridique et cachet électronique.
 */
export default function ContractDocument({ invite }) {
  const isLabel = invite?.invite_type === 'label_partenaire';
  const partyName = invite?.artist_name || '______________________';
  const contractKind = isLabel ? 'CONTRAT DE PARTENARIAT LABEL' : "CONTRAT D'ARTISTE & DE DISTRIBUTION";
  const partyRole = isLabel ? 'le Label Partenaire' : "l'Artiste";

  return (
    <div style={{
      width: '794px',
      background: '#ffffff',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box',
      position: 'relative',
      padding: '16px',
    }}>
      {/* ── CADRE OFFICIEL DU DOCUMENT (Double bordure d'authenticité) ── */}
      <div style={{
        border: '2px solid #8B1515',
        padding: '3px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          border: '1px solid #D4AF37',
          padding: '24px 32px 32px 32px',
          boxSizing: 'border-box',
          position: 'relative',
        }}>

          {/* ── EN-TÊTE ROUGEÂTRE OFFICIEL ── */}
          <div style={{
            background: '#8B1515',
            color: '#ffffff',
            borderRadius: '4px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderBottom: '3px solid #D4AF37',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img
                src={LOGO_URL}
                alt="KKD Music"
                crossOrigin="anonymous"
                style={{ height: '48px', width: 'auto', background: '#ffffff', padding: '4px', borderRadius: '4px' }}
              />
              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.1 }}>KKD MUSIC</div>
                <div style={{ fontSize: '9px', color: '#FDE68A', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>Label Group · Maison de Disques</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#FEE2E2', lineHeight: 1.4 }}>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '11px', letterSpacing: '0.04em' }}>
                RÉF : KKD-{(invite?.id || 'XXXX').slice(-6).toUpperCase()}
              </div>
              <div>Émis le {fmt(invite?.created_date || invite?.contract_start || invite?.issued_at)}</div>
              <div style={{ color: '#FDE68A', fontWeight: 600 }}>Dakar, République du Sénégal</div>
            </div>
          </div>

          {/* ── ENCADRÉ JURIDIQUE (DROITS D'AUTEUR & AUTHENTICITÉ) ── */}
          <div style={{
            background: '#FFF5F5',
            border: '1px solid #FCA5A5',
            borderLeft: '4px solid #8B1515',
            padding: '10px 14px',
            marginBottom: '20px',
            borderRadius: '2px',
          }}>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#8B1515', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>
              Avis Juridique & Protection des Droits d'Auteur — Loi N° 2008-09
            </div>
            <div style={{ fontSize: '9px', color: '#475569', lineHeight: 1.45 }}>
              Le présent contrat confère un cadre légal conforme à la législation internationale sur la propriété littéraire et artistique. L'artiste demeure l'unique titulaire des droits moraux inaliénables sur ses œuvres. Toute reproduction, distribution ou exploitation commerciale s'exécute sous la garantie d'authenticité et de certification KKD Music.
            </div>
          </div>

          {/* ── TITRE SOLENNEL DU DOCUMENT ── */}
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <h1 style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#8B1515', margin: 0 }}>
              {contractKind}
            </h1>
            <p style={{ fontSize: '10.5px', color: '#64748B', marginTop: '3px', fontWeight: 500 }}>
              Cadre institutionnel de diffusion numérique, promotion et gestion artistique
            </p>
          </div>

          {/* ── DÉSIGNATION DES PARTIES ── */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            padding: '10px 14px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '10.5px',
            lineHeight: 1.6,
          }}>
            <div><strong>ENTRE LES SOUSSIGNÉS :</strong></div>
            <div style={{ marginTop: '3px' }}>
              <strong>1. KKD MUSIC</strong>, maison de disques et plateforme de distribution musicale accessible sur <strong>kkdmusic.com</strong>, représentée par sa Direction Générale, ci-après « KKD Music »,
            </div>
            <div style={{ marginTop: '3px' }}>
              <strong>2. {partyRole.toUpperCase()} : {partyName}</strong>
              {invite?.email ? ` (${invite.email})` : ''}, ci-après « {partyRole === 'le Label Partenaire' ? 'le Label' : "l'Artiste"} ».
            </div>
          </div>

          {/* ── ARTICLES DU CONTRAT ── */}
          <div style={{ fontSize: '10px', lineHeight: 1.6, color: '#1e293b' }}>
            <Article num="1" title="Objet du contrat & Distribution numérique">
              KKD Music assure la distribution, la commercialisation et la promotion des œuvres de {partyRole === 'le Label Partenaire' ? 'des artistes du Label' : "l'Artiste"} sur sa plateforme officielle <strong>kkdmusic.com</strong> et ses relais partenaires. La diffusion multi-plateformes (Spotify, Apple Music, YouTube Music, Audiomack, Deezer) est soumise aux standards de qualité et validation de l'équipe éditoriale.
            </Article>

            <Article num="2" title="Durée de validité & Reconduction">
              Le présent contrat est conclu pour une durée déterminée, du <strong>{fmt(invite?.contract_start)}</strong> au <strong>{fmt(invite?.contract_end)}</strong>. À son terme, il sera renouvelable par accord exprès ou avenant signé entre les parties.
            </Article>

            <Article num="3" title="Garantie d'originalité & Droits d'auteur">
              {partyRole === 'le Label Partenaire' ? 'Le Label' : "L'Artiste"} garantit être le légitime détenteur des droits d'auteur moraux et patrimoniaux sur les enregistrements masters déposés. {partyRole === 'le Label Partenaire' ? 'Le Label' : "L'Artiste"} garantit KKD Music contre toute action en contrefaçon, plagiat ou contestation de tiers.
            </Article>

            <Article num="4" title="Rémunération & Partage des redevances">
              Les revenus issus des ventes, streams payants et billetteries sont reversés selon la clé de répartition établie dans l'espace partenaire (90 % artiste / 10 % commission KKD Music). Les paiements sont sécurisés via les opérateurs agréés (Wave, Orange Money).
            </Article>

            <Article num="5" title="Confidentialité, Résiliation & Droit applicable">
              Tout manquement grave autorise la partie lésée à résilier le contrat après préavis écrit de 30 jours. Le présent accord est soumis à la législation sénégalaise relative à la propriété intellectuelle et aux tribunaux compétents de Dakar.
            </Article>
          </div>

          {/* ── SIGNATURES OFFICIELLES (AVEC CACHET ÉLECTRONIQUE DE MADOU KANE) ── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginTop: '28px',
            gap: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #E2E8F0',
          }}>
            {/* Colonne KKD Music avec cachet électronique et signature */}
            <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#8B1515', textTransform: 'uppercase', marginBottom: '8px' }}>
                Pour KKD Music (Direction des Opérations)
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <img
                  src={SIGNATURE_URL}
                  alt="Cachet & Signature Abdoulaye Sylla"
                  crossOrigin="anonymous"
                  style={{ height: '62px', width: 'auto', display: 'block' }}
                />
              </div>
              <div style={{ height: '1px', background: '#D4AF37', margin: '6px auto', width: '80%' }} />
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>Abdoulaye Sylla</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#8B1515' }}>Gestionnaire Principal · Direction des Opérations</div>
              <div style={{ fontSize: '8.5px', color: '#64748B' }}>KKD Music Label Group · Missira, Tambacounda & Dakar</div>
              <div style={{ fontSize: '8px', fontStyle: 'italic', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                ✓ Cachet électronique & signature officielle certifiée
              </div>
            </div>

            {/* Colonne Artiste */}
            <div style={{ flex: 1, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#8B1515', textTransform: 'uppercase', marginBottom: '8px' }}>
                Pour {partyRole === 'le Label Partenaire' ? 'le Label Partenaire' : "l'Artiste Ayant-Droit"}
              </div>
              <div style={{ height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '9.5px', fontStyle: 'italic' }}>
                « Lu, approuvé et certifié conforme »
              </div>
              <div style={{ height: '1px', background: '#CBD5E1', margin: '6px auto', width: '80%' }} />
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>{partyName}</div>
              <div style={{ fontSize: '9px', color: '#64748B' }}>{invite?.email || 'Signature & Date'}</div>
              <div style={{ fontSize: '8px', color: '#94A3B8', marginTop: '2px' }}>
                Fait à Dakar · Certifié le {fmt(invite?.created_date || invite?.contract_start || invite?.issued_at)}
              </div>
            </div>
          </div>

          {/* ── PIED DE PAGE DU CONTRAT ── */}
          <div style={{
            marginTop: '20px',
            paddingTop: '10px',
            borderTop: '1px solid #E2E8F0',
            fontSize: '8px',
            color: '#94A3B8',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>KKD Music · Plateforme de distribution certifiée · kkdmusic.com</div>
            <div>Réf : KKD-{(invite?.id || 'XXXX').slice(-6).toUpperCase()} — Date immuable : {fmt(invite?.created_date || invite?.contract_start || invite?.issued_at)}</div>
          </div>

        </div>
      </div>
    </div>
  );
}

function Article({ num, title, children }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#8B1515' }}>Article {num} — {title}</div>
      <p style={{ marginTop: '2px', textAlign: 'justify', color: '#334155' }}>{children}</p>
    </div>
  );
}
