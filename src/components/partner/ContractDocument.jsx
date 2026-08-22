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
 * Document de contrat KKD Music — rendu A4 pour capture PDF.
 * Largeur fixe 794px (~ A4 @ 96dpi).
 */
export default function ContractDocument({ invite }) {
  const isLabel = invite?.invite_type === 'label_partenaire';
  const partyName = invite?.artist_name || '______________________';
  const contractKind = isLabel ? 'CONTRAT DE PARTENARIAT LABEL' : "CONTRAT D'ARTISTE KKD MUSIC";
  const partyRole = isLabel ? 'le Label Partenaire' : "l'Artiste";

  return (
    <div style={{ width: '794px', background: '#ffffff', color: '#111', fontFamily: 'Inter, sans-serif', padding: '56px 64px', boxSizing: 'border-box' }}>
      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #ff0a0a', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src={LOGO_URL} alt="KKD Music" crossOrigin="anonymous" style={{ height: '64px', width: 'auto' }} />
          <div>
            <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>KKD MUSIC</div>
            <div style={{ fontSize: '10px', color: '#666', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Label Indépendant</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '10px', color: '#666', lineHeight: 1.5 }}>
          <div style={{ fontWeight: 600, color: '#111' }}>Réf : KKD-{(invite?.id || 'XXXX').slice(-6).toUpperCase()}</div>
          <div>Émis le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <div>kkdmusic.com</div>
          <div>Missira, Tambacounda, Sénégal</div>
        </div>
      </div>

      {/* ── Titre ── */}
      <div style={{ textAlign: 'center', margin: '32px 0 8px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{contractKind}</h1>
        <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>Plateforme de distribution et gestion artistique</p>
      </div>

      {/* ── Entreprises ── */}
      <div style={{ margin: '24px 0', fontSize: '12px', lineHeight: 1.7 }}>
        <p style={{ marginBottom: '8px' }}>
          <strong>ENTRE :</strong> KKD MUSIC, plateforme de distribution musicale
          numérique accessible à l'adresse <strong>kkdmusic.com</strong>, ci-après « KKD Music »,
        </p>
        <p style={{ marginBottom: '8px' }}>
          <strong>ET :</strong> {partyRole} <strong>{partyName}</strong>,
          {invite?.email ? ` agissant pour le compte de l'adresse email ${invite.email},` : ''} ci-après « {partyRole === 'le Label Partenaire' ? 'le Label' : "l'Artiste"} ».
        </p>
      </div>

      {/* ── Articles ── */}
      <div style={{ fontSize: '11.5px', lineHeight: 1.7, color: '#222' }}>
        <Article num="1" title="Objet du contrat">
          KKD Music assure la distribution numérique, la promotion et la gestion des œuvres de {partyRole === 'le Label Partenaire' ? 'des artistes du Label' : "l'Artiste"} exclusivement sur la plateforme <strong>kkdmusic.com</strong>. La diffusion des sorties musicales sur d'autres plateformes musicales (Spotify, Apple Music, YouTube Music, Audiomack, Deezer, etc.) n'est pas incluse automatiquement : elle nécessite une demande préalable adressée à KKD Music et est soumise à des critères spécifiques définis par l'équipe. {partyRole === 'le Label Partenaire' ? 'Le Label' : "L'Artiste"} souhaitant une distribution multi-plateformes doit contacter KKD Music afin d'en convenir les conditions.
        </Article>

        <Article num="2" title="Durée">
          Le présent contrat est conclu pour une durée déterminée, du <strong>{fmt(invite?.contract_start)}</strong> au <strong>{fmt(invite?.contract_end)}</strong>. À l'échéance, il pourra être renouvelé par avenant signé des deux parties.
        </Article>

        <Article num="3" title="Engagements de KKD Music">
          Mise à disposition d'un espace partenaire dédié (tableau de bord), diffusion des sorties sur la plateforme, outils de promotion, génération de supports marketing, suivi des performances (écoutes, likes, ventes) et accompagnement artistique par les équipes KKD Music.
        </Article>

        <Article num="4" title={`Engagements de ${partyRole === 'le Label Partenaire' ? 'du Label' : "de l'Artiste"}`}>
          Fournir des œuvres originales dont {partyRole === 'le Label Partenaire' ? 'le Label' : "l'Artiste"} détient les droits, respecter la charte KKD Music, communiquer les metadata (pochette obligatoire, liens de streaming, fichiers audio/vidéo), et garantir l'authenticité des contenus publiés.
        </Article>

        <Article num="5" title="Rémunération et droits">
          Les revenus générés (ventes de contenus payants, billetterie d'événements) sont répartis selon les conditions définies dans l'espace partenaire. Les paiements sont traités via les partenaires agréés par KKD Music (Wave, Orange Money). Aucune extraction ou téléchargement non autorisé des contenus protégés n'est autorisé.
        </Article>

        <Article num="6" title="Confidentialité et propriété">
          Chaque partie s'engage à préserver la confidentialité des informations échangées. Les contenus publiés demeurent la propriété de {partyRole === 'le Label Partenaire' ? 'des artistes du Label' : "l'Artiste"} ; KKD Music dispose d'une licence de diffusion sur la durée du contrat.
        </Article>

        <Article num="7" title="Résiliation">
          Le contrat peut être résilié par l'une ou l'autre partie en cas de manquement grave, après notification écrite. Les contrats résiliés ou expirés sont archivés dans l'espace partenaire.
        </Article>
      </div>

      {/* ── Contact ── */}
      <div style={{ marginTop: '28px', padding: '16px 20px', border: '1.5px solid #ff0a0a', borderRadius: '10px', background: '#fff7f7' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff0a0a', marginBottom: '8px' }}>Contact KKD Music</div>
        <div style={{ fontSize: '11px', lineHeight: 1.7, color: '#333' }}>
          {CONTACT_EMAILS.map((e) => (
            <div key={e}>✉ {e}</div>
          ))}
          <div style={{ marginTop: '4px' }}>Site web : kkdmusic.com · Réseaux : @kkdmusic</div>
        </div>
      </div>

      {/* ── Signatures ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', gap: '32px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '40px' }}>Pour KKD Music</div>
          <img src={SIGNATURE_URL} alt="Signature" crossOrigin="anonymous" style={{ height: '70px', width: 'auto', marginBottom: '8px' }} />
          <div style={{ fontSize: '12px', fontWeight: 700 }}>Madou Kane</div>
          <div style={{ fontSize: '10px', color: '#666' }}>PDG — Président Directeur Général</div>
          <div style={{ fontSize: '10px', color: '#666' }}>KKD Music</div>
          <div style={{ fontSize: '10px', color: '#666' }}>Missira, Tambacounda, Sénégal</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '40px' }}>{`Pour ${partyRole === 'le Label Partenaire' ? 'le Label' : "l'Artiste"}`}</div>
          <div style={{ height: '70px', borderBottom: '1px solid #999' }} />
          <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '8px' }}>{partyName}</div>
          <div style={{ fontSize: '10px', color: '#666' }}>{invite?.email || 'Date & signature'}</div>
        </div>
      </div>

      <div style={{ marginTop: '36px', paddingTop: '12px', borderTop: '1px solid #eee', fontSize: '9px', color: '#999', textAlign: 'center' }}>
        KKD Music · kkdmusic.com · Document généré automatiquement — {new Date().toLocaleString('fr-FR')}
      </div>
    </div>
  );
}

function Article({ num, title, children }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#111' }}>Article {num} — {title}</div>
      <p style={{ marginTop: '3px', textAlign: 'justify' }}>{children}</p>
    </div>
  );
}