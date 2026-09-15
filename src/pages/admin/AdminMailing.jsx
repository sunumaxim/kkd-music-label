import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Send, Users, UserCheck, Inbox, Music2, Eye, CheckCircle, AlertCircle,
  Loader2, Sparkles, Mail, FileText, Video, Calendar, Newspaper,
  Smartphone, Monitor, Copy, ExternalLink, History, Award, ShieldCheck,
  Radio, RefreshCw, Zap, Check, ChevronDown, ChevronUp, Palette,
  Bell, BellRing, Info, ShieldAlert
} from 'lucide-react';
import {
  EMAIL_THEMES,
  SIGNERS,
  CONTEXT_TYPES,
  buildEmailHtml,
  SITE_URL
} from '@/lib/emailTemplate';
import { authService } from '@/services/authService';
import { automationService, AUTOMATION_TYPES } from '@/services/automationService';
import { useToast } from '@/components/ui/use-toast';

const AUDIENCES = [
  { value: 'partners', label: 'Partenaires & Comptes Utilisateurs', icon: Users, desc: 'Utilisateurs rôle "user" enregistrés' },
  { value: 'artists', label: 'Artistes sous contrat KKD', icon: Music2, desc: 'Invitations et profils artistes actifs' },
  { value: 'requests', label: 'Demandeurs de services', icon: Inbox, desc: 'Auteurs de demandes de distribution' },
  { value: 'admins', label: 'Équipe administrative', icon: UserCheck, desc: 'Tous les administrateurs KKD' },
  { value: 'all', label: 'Toute la communauté KKD', icon: Users, desc: 'Diffusion globale à tous les contacts' },
  { value: 'custom', label: 'Adresses personnalisées', icon: Mail, desc: 'Saisir ou coller des emails manuellement' },
];

const CONTENT_TYPES = [
  { value: 'release', label: 'Sortie musicale', icon: Music2 },
  { value: 'video', label: 'Clip / Vidéo', icon: Video },
  { value: 'event', label: 'Événement & Billetterie', icon: Calendar },
  { value: 'news', label: 'Article / Actualité', icon: Newspaper },
];

// 5 Modèles stylés pré-configurés avec adaptation contextuelle
const PRESET_TEMPLATES = [
  {
    id: 'release',
    title: 'Sortie Single / EP / Album',
    icon: Music2,
    badge: 'NOUVELLE SORTIE OFFICIELLE',
    theme: 'prestige_dark',
    signer: 'abdoulaye',
    context_type: 'release',
    context_meta: {
      track_title: 'Kora Vibrations (Single Officiel)',
      artist_name: 'Amadou Diop feat. KKD All Stars',
      release_date: 'Vendredi 24 Octobre 2026',
      genre: 'Afro-fusion / Mbalax moderne',
      isrc: 'SN-KKD-26-00124',
      platforms: 'Mondial · 150+ plateformes (Spotify, Apple, etc.)'
    },
    context_notice: "Ce courriel officiel concerne la sortie, l'écoute et la diffusion publique de l'œuvre musicale indiquée. Il ne modifie en rien vos accords contractuels ou licences en cours.",
    subject: '🎵 NOUVELLE SORTIE : Titre du projet — KKD Music',
    headline: 'Découvrez la nouvelle sortie officielle de KKD Music',
    body: `Chers mélomanes et partenaires,\n\nKKD Music Label Group a le grand honneur de vous dévoiler sa toute nouvelle sortie officielle.\n\nCe projet fusionne des mélodies envoûtantes et une production soignée dans le respect de notre héritage artistique. Le titre est d'ores et déjà disponible en écoute intégrale sur l'ensemble des plateformes de streaming mondiales.\n\nNous vous invitons à l'écouter, à le partager et à l'ajouter à vos playlists préférées.\n\nExcellente écoute,`,
    cta_label: 'Écouter sur les plateformes',
    cta_url: 'https://kkdmusic.com',
  },
  {
    id: 'direction_note',
    title: 'Note Officielle de la Direction',
    icon: ShieldCheck,
    badge: 'NOTE DU GESTIONNAIRE PRINCIPAL',
    theme: 'noble_red',
    signer: 'abdoulaye',
    context_type: 'circular',
    context_meta: {
      circular_ref: 'CIR-KKD-DIR-2026-014',
      emitter: 'Abdoulaye Sylla, Gestionnaire Principal',
      target_group: 'Partenaires, Artistes sous contrat & Équipes du label',
      effective_scope: 'Immédiate — Exercice 2026/2027',
      urgency: 'Information réglementaire officielle'
    },
    context_notice: "Note administrative émise sous l'autorité du Gestionnaire Principal de KKD Music. Les directives et dispositions énoncées font autorité.",
    subject: '📜 Note officielle de la Direction des Opérations — KKD Music',
    headline: 'Communication officielle du Gestionnaire Principal',
    body: `Chers partenaires, artistes et collaborateurs du label,\n\nEn ma qualité de Gestionnaire Principal de KKD Music, je tiens à saluer l'engagement et le dynamisme de toute notre communauté musicale.\n\nNotre maison de disques continue de renforcer ses dispositifs de distribution, de certification des licences et de promotion internationale des artistes de notre catalogue. Notre priorité demeure la transparence et l'excellence pour chaque ayant droit.\n\nNous restons à votre entière disposition pour accompagner vos futurs projets et vous remercions de votre précieuse confiance.\n\nAvec nos salutations les plus distinguées,`,
    cta_label: 'Accéder à mon espace',
    cta_url: 'https://kkdmusic.com/mon-espace',
  },
  {
    id: 'b2b_invite',
    title: 'Invitation Partenaires & Nouveaux Labels',
    icon: Award,
    badge: 'OPPORTUNITÉ PARTENARIAT B2B',
    theme: 'gold_luxury',
    signer: 'abdoulaye',
    context_type: 'partnership',
    context_meta: {
      offer_name: 'Programme Label Partenaire & Distribution KKD',
      royalty_split: '90% versés directement au partenaire',
      territory: 'International (150+ plateformes de streaming)',
      services_included: 'Distribution DSP, ISRC/UPC, Licences SODAV/SACEM',
      deadline: 'Adhésions ouvertes — Sessions 2026'
    },
    context_notice: "Cette proposition de partenariat respecte le barème transparent de KKD Music (90% de rétrocession nette) pour un accompagnement d'excellence.",
    subject: '🌟 Rejoignez le réseau de distribution mondiale KKD Music',
    headline: 'Développez votre catalogue avec KKD Music Label Group',
    body: `Bonjour,\n\nLa Direction de KKD Music suit avec un vif intérêt la qualité de vos créations et le potentiel de votre catalogue.\n\nNous vous proposons un partenariat de distribution privilégié incluant :\n• Une distribution sur plus de 150 plateformes de streaming internationales\n• Une rétrocession garantie de 90% sur l'ensemble de vos royalties\n• Des contrats et certificats de licence électroniques sécurisés\n• Un accompagnement promotionnel personnalisé par notre équipe\n\nN'hésitez pas à nous contacter pour convenir d'un échange constructif.\n\nBien cordialement,`,
    cta_label: 'Proposer mon projet',
    cta_url: 'https://kkdmusic.com/partnership',
  },
  {
    id: 'event_ticket',
    title: 'Événement & Billetterie VIP',
    icon: Calendar,
    badge: 'ÉVÉNEMENT EXCLUSIF VIP',
    theme: 'prestige_dark',
    signer: 'abdoulaye',
    context_type: 'event',
    context_meta: {
      event_title: 'Grand Showcase VIP KKD Music 2026',
      event_date: 'Samedi 14 Novembre 2026 à 20h30',
      venue: 'Grand Théâtre National Doudou Ndiaye Rose',
      city: 'Dakar, Sénégal',
      access_type: 'Carré VIP, Carré Or & Pass Privilège (Nominatif)',
      doors_open: '19h00 (Contrôle électronique de billet QR)'
    },
    context_notice: "Ce courriel officiel constitue un avis de billetterie ou une invitation officielle. Tout accès sur place requiert la présentation du billet sécurisé officiel KKD Music.",
    subject: '🎟️ Showcase & Soirée Privée KKD Music — Réservations ouvertes',
    headline: 'Rejoignez-nous pour une soirée d\'exception',
    body: `Chers fidèles de KKD Music,\n\nNous avons le plaisir de vous convier à notre prochain grand rendez-vous scénique.\n\nUne expérience live immersive réunissant les figures majeures de notre label et nos talents émergents. Les places en Carré VIP et Privilège sont en quantité limitée pour garantir un accueil d'exception.\n\nRéservez votre billet sécurisé dès à présent sur notre billetterie officielle.\n\nAu plaisir de vous compter parmi nous,`,
    cta_label: 'Réserver mes places VIP',
    cta_url: 'https://kkdmusic.com/events',
  },
  {
    id: 'official_circular',
    title: 'Circulaire & Conformité Légale',
    icon: FileText,
    badge: 'CIRCULAIRE ADMINISTRATIVE',
    theme: 'official_white',
    signer: 'abdoulaye',
    context_type: 'contract',
    context_meta: {
      doc_title: 'Mise à niveau des Certificats de Licences & Scellés',
      doc_ref: 'KKD-CERT-SEC-2026',
      beneficiary: 'Ensemble des titulaires de droits au catalogue',
      effective_date: '1er Novembre 2026',
      royalties_rate: 'Rétrocession garantie à 90%',
      legal_status: 'Certifié sous scellé électronique infalsifiable'
    },
    context_notice: "Ce courriel officiel émane du secrétariat juridique de KKD Music et se rattache directement à l'exécution de l'accord contractuel visé ci-dessus.",
    subject: '🏛️ Notification administrative : Certification et Licences KKD Music',
    headline: 'Information réglementaire et conformité des droits',
    body: `Madame, Monsieur,\n\nLa Direction de KKD Music vous informe de la mise à niveau de ses outils de certification juridique pour tous les contrats et licences de distribution.\n\nChaque accord fait désormais l'objet d'un scellé électronique avec certificat d'authenticité horodaté, assurant la pleine protection de vos droits en Afrique et à l'international.\n\nPour consulter vos documents ou demander une vérification, rendez-vous sur votre espace sécurisé.\n\nRestant à votre entière écoute,`,
    cta_label: 'Consulter mes documents',
    cta_url: 'https://kkdmusic.com/mon-espace',
  }
];

const LOCAL_STORAGE_HISTORY_KEY = 'kkd_mailing_history_v2';

export default function AdminMailing() {
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState({
    subject: '🎵 NOUVEAU SINGLE : Titre du projet — KKD Music',
    headline: 'Découvrez la nouvelle sortie officielle de KKD Music',
    body: `Chers mélomanes et partenaires,\n\nKKD Music Label Group a le grand honneur de vous dévoiler sa toute nouvelle sortie officielle.\n\nCe titre est désormais disponible sur toutes vos plateformes de streaming.\n\nNous vous invitons à l'écouter et à le partager avec vos proches.\n\nExcellente écoute,`,
    cta_label: 'Écouter sur les plateformes',
    cta_url: 'https://kkdmusic.com',
    audience: 'partners',
    custom_emails: '',
    image_url: '',
    theme: 'prestige_dark',
    badge_label: 'COMMUNICATION OFFICIELLE',
    signer_id: 'abdoulaye',
    show_streaming: true,
    streaming_spotify: '',
    streaming_apple: '',
    streaming_youtube: '',
    streaming_audiomack: '',
    streaming_deezer: '',
    streaming_boomplay: '',
    test_email: '',
    // Contexte officiel & anti-ambiguïté
    context_type: 'release',
    enable_context_card: true,
    context_meta: {
      track_title: 'Kora Vibrations (Single Officiel)',
      artist_name: 'Amadou Diop & KKD All Stars',
      release_date: 'Vendredi 24 Octobre 2026',
      genre: 'Afro-fusion / Mbalax moderne',
      isrc: 'SN-KKD-26-00124',
      platforms: 'Mondial · 150+ plateformes (Spotify, Apple, YouTube...)'
    },
    context_notice: "Ce courriel officiel concerne la sortie, l'écoute et la diffusion publique de l'œuvre musicale indiquée. Il ne modifie en rien vos accords contractuels ou licences en cours.",
    // Renforcement notifications push
    send_push: true,
    push_title: '🎵 NOUVELLE SORTIE : KKD Music',
    push_message: 'Découvrez la nouvelle sortie officielle sur l\'ensemble des plateformes de streaming mondiales.',
  });

  const [contentType, setContentType] = useState('');
  const [selectedContent, setSelectedContent] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile' | 'code' | 'push'
  const [sending, setSending] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [result, setResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiTone, setAiTone] = useState('institutionnel'); // 'institutionnel' | 'chaleureux' | 'commercial' | 'vip'
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'content' | 'templates' | 'history' | 'automations'
  const [history, setHistory] = useState([]);
  const [automationRunning, setAutomationRunning] = useState(false);
  const [automationLogs, setAutomationLogs] = useState(() => automationService.getLogs());
  const [copySuccess, setCopySuccess] = useState(false);
  const [advancedStreamingOpen, setAdvancedStreamingOpen] = useState(false);
  const [contextCardOpen, setContextCardOpen] = useState(true);
  const [pushSectionOpen, setPushSectionOpen] = useState(true);

  // Charger l'utilisateur courant pour initialiser le test_email
  useEffect(() => {
    authService.me().then(user => {
      if (user) {
        setCurrentUser(user);
        setForm(prev => ({
          ...prev,
          test_email: prev.test_email || user.email || 'storesmaxim@gmail.com'
        }));
      }
    }).catch(() => {});

    // Charger l'historique local
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const updateMetaField = (fieldKey, value) => {
    setForm(prev => ({
      ...prev,
      context_meta: {
        ...(prev.context_meta || {}),
        [fieldKey]: value,
      }
    }));
  };

  // Compter les audiences
  const { data: usersCount = 0 } = useQuery({
    queryKey: ['count-users'],
    queryFn: async () => {
      const list = await base44.entities.User.list();
      return list?.length || 0;
    }
  });

  const { data: artistsCount = 0 } = useQuery({
    queryKey: ['count-artists'],
    queryFn: async () => {
      const list = await base44.entities.ArtistInvite.filter({ status: 'actif' });
      return list?.length || 0;
    }
  });

  const { data: requestsCount = 0 } = useQuery({
    queryKey: ['count-requests'],
    queryFn: async () => {
      const list = await base44.entities.ServiceRequest.list();
      return list?.length || 0;
    }
  });

  // Fetch content pour la sélection
  const { data: contentList = [] } = useQuery({
    queryKey: ['mailing-content', contentType],
    queryFn: async () => {
      if (!contentType) return [];
      if (contentType === 'release') return base44.entities.Release.list('-release_date', 30);
      if (contentType === 'video') return base44.entities.Video.list('-publish_date', 30);
      if (contentType === 'event') return base44.entities.Event.list('-event_date', 20);
      if (contentType === 'news') return base44.entities.News.filter({ is_published: true });
      return [];
    },
    enabled: !!contentType,
  });

  // Pré-remplir à partir d'un contenu de la plateforme avec métadonnées contextuelles complètes
  const handleSelectContent = (item) => {
    setSelectedContent(item);
    if (contentType === 'release') {
      update('subject', `🎵 Sortie officielle : ${item.title} — ${item.artist_name || 'KKD Music'}`);
      update('headline', `${item.title} est enfin disponible !`);
      update('badge_label', 'NOUVELLE SORTIE OFFICIELLE');
      update('body', `Chers partenaires et auditeurs,\n\nNous sommes ravis d'annoncer la sortie officielle du morceau « ${item.title} » par ${item.artist_name || 'l\'artiste'}.\n\n${item.description || 'Un morceau puissant qui saura captiver vos sens.'}\n\nÉcoutez le morceau dès à présent sur toutes les plateformes de streaming.`);
      update('image_url', item.cover_url || '');
      update('cta_label', 'Écouter maintenant');
      update('cta_url', item.spotify_url || item.apple_music_url || item.youtube_url || item.audiomack_url || SITE_URL);
      update('show_streaming', true);
      update('streaming_spotify', item.spotify_url || '');
      update('streaming_apple', item.apple_music_url || '');
      update('streaming_youtube', item.youtube_url || '');
      update('streaming_audiomack', item.audiomack_url || '');
      update('streaming_deezer', item.deezer_url || '');
      update('streaming_boomplay', item.boomplay_url || '');
      setAdvancedStreamingOpen(true);
      // Synchronisation du contexte officiel
      update('context_type', 'release');
      update('enable_context_card', true);
      update('context_meta', {
        track_title: item.title || '',
        artist_name: item.artist_name || 'Artiste KKD Music',
        release_date: item.release_date ? new Date(item.release_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sortie immédiate',
        genre: item.genre || 'Afro-fusion / Musique Urbaine',
        isrc: item.isrc || 'SN-KKD-26-REC01',
        platforms: 'Mondial · 150+ plateformes (Spotify, Apple, YouTube...)'
      });
      update('context_notice', "Ce courriel officiel concerne la sortie, l'écoute et la diffusion publique de l'œuvre musicale indiquée. Il ne modifie en rien vos accords contractuels ou licences en cours.");
      update('push_title', `🎵 Sortie officielle : ${item.title}`);
      update('push_message', `« ${item.title} » par ${item.artist_name || 'KKD Music'} est maintenant disponible en streaming mondial.`);
    } else if (contentType === 'video') {
      update('subject', `🎬 Nouveau clip officiel : ${item.title}${item.artist_name ? ` · ${item.artist_name}` : ''}`);
      update('headline', `Visionnez le clip officiel « ${item.title} »`);
      update('badge_label', 'CLIP OFFICIEL KKD');
      update('body', `Chers passionnés de musique,\n\nLe tout nouveau clip officiel « ${item.title} » de ${item.artist_name || 'notre artiste'} est disponible en haute définition sur notre chaîne YouTube officielle.\n\n${item.description || 'Plongez dans l\'univers visuel exceptionnel créé pour ce titre.'}`);
      const yt = item.youtube_url || '';
      update('cta_label', 'Regarder le clip en HD');
      update('cta_url', yt || 'https://youtube.com/@kkdmusic');
      const ytId = yt.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?\s]+)/)?.[1];
      if (ytId) update('image_url', `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`);
      else update('image_url', item.thumbnail_url || '');
      // Contexte officiel vidéo
      update('context_type', 'video');
      update('enable_context_card', true);
      update('context_meta', {
        clip_title: item.title || '',
        artist_name: item.artist_name || 'Artiste KKD',
        director: item.director || 'KKD Visuals Production',
        format: '4K Ultra HD — YouTube Officiel',
        release_date: item.publish_date ? new Date(item.publish_date).toLocaleDateString('fr-FR') : 'Disponible en ligne'
      });
      update('context_notice', "Diffusion officielle du clip vidéo officiel de KKD Music Label Group.");
      update('push_title', `🎬 Nouveau clip : ${item.title}`);
      update('push_message', `Visionnez dès maintenant le clip officiel en qualité 4K.`);
    } else if (contentType === 'event') {
      const d = item.event_date ? new Date(item.event_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
      update('subject', `🎟️ Événement officiel KKD : ${item.title}`);
      update('headline', item.title);
      update('badge_label', 'ÉVÉNEMENT EN DIRECT');
      update('body', `Nous avons l'honneur de vous inviter à l'événement musical exceptionnel « ${item.title} ».\n\n📅 Date : ${d || 'Prochainement'}\n📍 Lieu : ${item.location || 'Dakar'}${item.city ? `, ${item.city}` : ''}\n\n${item.description || 'Une soirée prestigieuse avec les artistes phares de KKD Music.'}\n\nLes réservations et pass VIP sont ouverts dès maintenant.`);
      update('image_url', item.image_url || '');
      update('cta_label', 'Réserver mon billet VIP');
      update('cta_url', item.ticket_url || `${SITE_URL}/events`);
      // Contexte officiel événement
      update('context_type', 'event');
      update('enable_context_card', true);
      update('context_meta', {
        event_title: item.title || '',
        event_date: d || 'Date à confirmer',
        venue: item.location || 'Grand Théâtre National',
        city: item.city || 'Dakar, Sénégal',
        access_type: item.ticket_price ? `Pass VIP & Billetterie (${item.ticket_price} FCFA)` : 'Carré VIP & Entrée officielle',
        doors_open: '19h00 (Contrôle électronique de billet QR)'
      });
      update('context_notice', "Ce courriel officiel constitue un avis de billetterie ou une invitation officielle. Tout accès sur place requiert la présentation du billet sécurisé officiel KKD Music.");
      update('push_title', `🎟️ Événement : ${item.title}`);
      update('push_message', `Les pass et réservations VIP sont ouverts pour l'événement « ${item.title} ».`);
    } else if (contentType === 'news') {
      update('subject', `📰 Actualité officielle : ${item.title}`);
      update('headline', item.title);
      update('badge_label', 'ACTUALITÉ & PRESSE');
      update('body', item.excerpt || item.content?.slice(0, 400) || '');
      update('image_url', item.image_url || '');
      update('cta_label', 'Lire l\'article complet');
      update('cta_url', `${SITE_URL}/actualites`);
      update('context_type', 'news');
      update('enable_context_card', true);
      update('context_meta', {
        press_ref: `COMM-KKD-${Date.now().toString().slice(-4)}`,
        topic: item.title || 'Actualité officielle',
        author: 'Direction de la Communication KKD Music',
        date: new Date().toLocaleDateString('fr-FR')
      });
      update('context_notice', "Communiqué officiel d'information diffusé par la Direction de KKD Music.");
      update('push_title', `📰 Actualité : ${item.title}`);
      update('push_message', `Consultez le communiqué officiel de la Direction de KKD Music.`);
    }
  };

  // Charger un modèle pré-enregistré avec adaptation contextuelle
  const applyPreset = (preset) => {
    update('subject', preset.subject);
    update('headline', preset.headline);
    update('body', preset.body);
    update('cta_label', preset.cta_label);
    update('cta_url', preset.cta_url);
    update('theme', preset.theme);
    update('badge_label', preset.badge);
    update('signer_id', preset.signer);
    if (preset.context_type) {
      update('context_type', preset.context_type);
      update('enable_context_card', true);
      update('context_meta', preset.context_meta || {});
      update('context_notice', preset.context_notice || '');
    }
    update('push_title', preset.subject);
    update('push_message', preset.headline);
    setActiveTab('compose');
  };

  // Liens streaming compilés
  const streamingLinks = useMemo(() => {
    if (!form.show_streaming) return [];
    const list = [];
    if (form.streaming_spotify) list.push({ platform: 'spotify', url: form.streaming_spotify });
    if (form.streaming_apple) list.push({ platform: 'apple', url: form.streaming_apple });
    if (form.streaming_youtube) list.push({ platform: 'youtube', url: form.streaming_youtube });
    if (form.streaming_audiomack) list.push({ platform: 'audiomack', url: form.streaming_audiomack });
    if (form.streaming_deezer) list.push({ platform: 'deezer', url: form.streaming_deezer });
    if (form.streaming_boomplay) list.push({ platform: 'boomplay', url: form.streaming_boomplay });
    return list;
  }, [
    form.show_streaming,
    form.streaming_spotify,
    form.streaming_apple,
    form.streaming_youtube,
    form.streaming_audiomack,
    form.streaming_deezer,
    form.streaming_boomplay
  ]);

  // Signataire sélectionné
  const currentSigner = SIGNERS[form.signer_id] || SIGNERS.abdoulaye;

  // Code HTML calculé pour l'email avec injection de la fiche contextuelle officielle
  const generatedHtml = useMemo(() => {
    return buildEmailHtml({
      subject: form.subject || 'KKD Music Communication',
      preheader: form.headline || form.subject,
      headline: form.headline,
      body: form.body,
      cta: form.cta_label ? { label: form.cta_label, url: form.cta_url || SITE_URL } : null,
      image_url: form.image_url || null,
      theme: form.theme,
      badge_label: form.badge_label,
      signer_id: form.signer_id,
      custom_signer: currentSigner,
      streaming_links: streamingLinks,
      show_signature: true,
      context_type: form.enable_context_card ? form.context_type : null,
      context_meta: form.enable_context_card ? form.context_meta : null,
      context_notice: form.enable_context_card ? form.context_notice : null,
    });
  }, [form, currentSigner, streamingLinks]);

  // Génération par l'IA avec style et signature Abdoulaye Sylla
  const generateWithAI = async () => {
    if (!form.headline) return;
    setAiLoading(true);

    const tonePrompts = {
      institutionnel: "Ton solennel, prestigieux, diplomatique, rédigé avec l'autorité bienveillante d'Abdoulaye Sylla, Gestionnaire Principal de KKD Music.",
      chaleureux: "Ton dynamique, chaleureux, passionné par la musique africaine, célébrant la créativité des artistes et fédérant la communauté KKD.",
      commercial: "Ton convaincant, axé sur les opportunités business de distribution (90% de royalties), la visibilité internationale et l'accompagnement d'excellence.",
      vip: "Ton luxueux, exclusif, invitant à une expérience VIP privilégiée avec une formulation soignée."
    };

    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es Abdoulaye Sylla, Gestionnaire Principal de KKD Music Label Group (Dakar et international).
Rédige le corps d'un email officiel et stylé pour la communauté KKD.
Titre du message : "${form.headline}"
Sujet actuel : "${form.subject}"
${selectedContent ? `Élément promu : ${JSON.stringify({ type: contentType, title: selectedContent.title || selectedContent.name, artist: selectedContent.artist_name || '' })}` : ''}
Consigne de ton : ${tonePrompts[aiTone] || tonePrompts.institutionnel}
Règles :
- Longueur : 3 à 4 paragraphes percutants et fluides
- En français impeccable, élégant et soigné
- Pas de code HTML, pas de balises, texte brut avec sauts de lignes naturels
- Termine par une formule de salutation professionnelle adaptée à Abdoulaye Sylla`,
        response_json_schema: {
          type: 'object',
          properties: { body: { type: 'string' } }
        }
      });
      if (res?.body) update('body', res.body);
    } catch (err) {
      console.error("Erreur génération IA mailing:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Exécution du moteur d'automatisations contextuelles (relances événements + nouvelles sorties + push)
  const handleRunAutomations = async () => {
    setAutomationRunning(true);
    try {
      const res = await automationService.executeAllAutomations();
      setAutomationLogs(automationService.getLogs());
      toast({
        title: 'Moteur d\'automatisations exécuté',
        description: `${res.executed_count} relances et diffusions contextuelles ont été traitées avec succès.`,
      });
    } catch (err) {
      toast({
        title: 'Erreur d\'automatisation',
        description: err?.message || 'Erreur lors du traitement.',
        variant: 'destructive',
      });
    } finally {
      setAutomationRunning(false);
    }
  };

  // Envoi réel (Campagne globale ou audience ciblée)
  const handleSend = async (isTest = false) => {
    if (!form.subject || !form.headline || !form.body) return;

    if (isTest) {
      setTestSending(true);
    } else {
      setSending(true);
    }
    setResult(null);

    const payload = {
      subject: form.subject,
      headline: form.headline,
      body: form.body,
      cta: form.cta_label ? { label: form.cta_label, url: form.cta_url || SITE_URL } : null,
      audience: isTest ? 'custom' : form.audience,
      image_url: form.image_url || null,
      custom_emails: isTest ? (form.test_email || currentUser?.email || 'storesmaxim@gmail.com') : (form.audience === 'custom' ? form.custom_emails : null),
      theme: form.theme,
      badge_label: form.badge_label,
      signer_id: form.signer_id,
      sender: currentSigner,
      streaming_links: streamingLinks,
      is_test: isTest,
      test_email: isTest ? (form.test_email || currentUser?.email) : null,
      // Contexte officiel & anti-ambiguïté
      context_type: form.enable_context_card ? form.context_type : null,
      context_meta: form.enable_context_card ? form.context_meta : null,
      context_notice: form.enable_context_card ? form.context_notice : null,
      // Force d'action sur les notifications push
      send_push: isTest ? false : form.send_push,
      push_title: form.push_title || form.subject,
      push_message: form.push_message || form.headline,
    };

    try {
      const res = await base44.functions.invoke('sendMailingCampaign', payload);
      const data = res?.data || res;
      setResult(data);

      // Ajouter à l'historique local
      const newEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        subject: form.subject,
        headline: form.headline,
        body: form.body,
        cta_label: form.cta_label,
        cta_url: form.cta_url,
        image_url: form.image_url,
        audience: isTest ? `Test → ${payload.custom_emails}` : form.audience,
        theme: form.theme,
        signer_name: currentSigner.name,
        sent_count: data?.sent || 1,
        sent_pushes: data?.sent_pushes || 0,
        context_type: form.context_type,
        is_test: isTest,
        success: data?.success !== false,
      };

      const updatedHistory = [newEntry, ...history.slice(0, 29)];
      setHistory(updatedHistory);
      try {
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updatedHistory));
      } catch {
        // ignore
      }
    } catch (err) {
      setResult({ success: false, error: err?.message || 'Erreur lors de l\'envoi' });
    } finally {
      setSending(false);
      setTestSending(false);
    }
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(generatedHtml);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const handleOpenRawWindow = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(generatedHtml);
      win.document.close();
    }
  };

  const selectedAudienceObj = AUDIENCES.find(a => a.value === form.audience);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      
      {/* Header prestige avec statut Abdoulaye Sylla */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-stone-950 via-[#1c0f0a] to-stone-950 border border-primary/20 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/30 tracking-wide uppercase">
                <ShieldCheck size={13} /> Direction Générale KKD Music
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Award size={13} /> Gestionnaire Principal : Abdoulaye Sylla
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-stone-100 tracking-tight">
              Studio de Mailing & Communication VIP
            </h1>
            <p className="text-sm text-stone-400 max-w-2xl">
              Diffusez des communications officielles, annonces de sorties et invitations partenaires avec un rendu haute couture signé par la Direction.
            </p>
          </div>

          {/* Quick Stat Pill */}
          <div className="flex items-center gap-3 bg-stone-900/80 border border-stone-800 rounded-xl p-3 px-4 shrink-0 shadow-inner">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-base">
              AS
            </div>
            <div className="text-xs">
              <p className="font-bold text-stone-200">Abdoulaye Sylla</p>
              <p className="text-stone-400">Gestionnaire Principal Actif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'alerte statut envoi */}
      {result && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
          result.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-3">
            {result.success ? <CheckCircle size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
            <div>
              <p className="text-sm font-bold">
                {result.success
                  ? (result.is_test
                      ? `✅ Email de test envoyé avec succès à : ${form.test_email}`
                      : `✅ Campagne diffusée avec succès : ${result.sent} email(s) acheminé(s)${result.sent_pushes ? ` & ${result.sent_pushes} notification(s) push transmises avec succès` : ''} !`)
                  : `❌ Erreur d'envoi : ${result.error || 'Vérifiez la configuration.'}`}
              </p>
              {result.success && !result.is_test && (
                <p className="text-xs opacity-80 mt-0.5">
                  La communication et les alertes push ont été enregistrées avec succès dans votre journal de bord officiel.
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="text-xs h-7">
            Fermer
          </Button>
        </div>
      )}

      {/* Navigation principale par onglets */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-900/60 border border-stone-800 rounded-xl">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'compose' ? 'bg-primary text-white shadow-md' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText size={15} /> Composer
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'templates' ? 'bg-primary text-white shadow-md' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles size={15} /> Modèles Stylés ({PRESET_TEMPLATES.length})
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'content' ? 'bg-primary text-white shadow-md' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Music2 size={15} /> Contenu Plateforme
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history' ? 'bg-primary text-white shadow-md' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <History size={15} /> Journal ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('automations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'automations' ? 'bg-amber-600 text-white shadow-md' : 'text-amber-400/90 hover:text-amber-300'
            }`}
          >
            <Zap size={15} /> Automatisations & Relances
          </button>
        </div>

        {/* Bouton de test rapide */}
        <div className="flex items-center gap-2">
          <Input
            value={form.test_email}
            onChange={e => update('test_email', e.target.value)}
            placeholder="Email de test..."
            className="h-8 text-xs w-52 bg-stone-900 border-stone-700"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSend(true)}
            disabled={testSending || !form.headline || !form.body}
            className="h-8 text-xs gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 shrink-0"
          >
            {testSending ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {testSending ? 'Envoi test...' : 'M\'envoyer un test'}
          </Button>
        </div>
      </div>

      {/* Onglet : Modèles stylés */}
      {activeTab === 'templates' && (
        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
              <Sparkles size={16} className="text-primary" /> Modèles Haute Couture pré-rédigés
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Sélectionnez un modèle structuré avec le style visuel, les arguments et la signature officielle d'Abdoulaye Sylla.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {PRESET_TEMPLATES.map(preset => {
              const Icon = preset.icon;
              const themeInfo = EMAIL_THEMES[preset.theme];
              return (
                <div
                  key={preset.id}
                  className="group relative bg-stone-900/90 border border-stone-800 hover:border-primary/50 rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-xl"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                        {themeInfo?.label || preset.theme}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-stone-200 group-hover:text-primary transition-colors">
                        {preset.title}
                      </h4>
                      <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                        {preset.headline}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-stone-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-stone-500 font-mono">Signé : Abdoulaye Sylla</span>
                    <Button
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="text-xs h-7 px-3 gap-1 bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/30"
                    >
                      Appliquer ce modèle
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Onglet : Contenu plateforme */}
      {activeTab === 'content' && (
        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
              <Music2 size={16} className="text-primary" /> Promouvoir un contenu existant du label
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Sélectionnez une sortie musicale, un clip vidéo ou un événement pour générer un email complet avec pochette, streaming et liens automatiques.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CONTENT_TYPES.map(ct => {
              const Icon = ct.icon;
              return (
                <button
                  key={ct.value}
                  onClick={() => { setContentType(ct.value); setSelectedContent(null); }}
                  className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all ${
                    contentType === ct.value
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-stone-800 bg-stone-900/60 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <Icon size={20} />
                  {ct.label}
                </button>
              );
            })}
          </div>

          {contentType && (
            <div className="pt-3 border-t border-stone-800">
              <p className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-2">
                Sélectionner l'élément à mettre en avant :
              </p>
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {contentList.length === 0 ? (
                  <p className="text-xs text-stone-500 italic py-4 text-center">Aucun élément disponible dans cette catégorie.</p>
                ) : contentList.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleSelectContent(item);
                      setActiveTab('compose');
                    }}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-xl border text-left text-sm transition-all ${
                      selectedContent?.id === item.id
                        ? 'border-primary bg-primary/15'
                        : 'border-stone-800 bg-stone-900/70 hover:border-stone-700'
                    }`}
                  >
                    {(item.cover_url || item.image_url || item.thumbnail_url) ? (
                      <img
                        src={item.cover_url || item.image_url || item.thumbnail_url}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover border border-stone-700 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center shrink-0">
                        <Music2 size={20} className="text-stone-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-stone-200 truncate">{item.title || item.name}</p>
                      {item.artist_name && <p className="text-xs text-stone-400 truncate mt-0.5">Artiste : {item.artist_name}</p>}
                      {item.release_date && <p className="text-[11px] text-stone-500 mt-0.5 font-mono">Date : {item.release_date}</p>}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-xs font-bold text-primary px-3 py-1 rounded-lg bg-primary/10 border border-primary/20">
                        Choisir & Pré-remplir →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Onglet : Journal & Historique */}
      {activeTab === 'history' && (
        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <History size={16} className="text-primary" /> Journal des Campagnes Envoyées
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Retrouvez l'historique complet des envois réalisés par la Direction et réutilisez un message en 1 clic.
              </p>
            </div>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
                }}
                className="text-xs text-stone-500 hover:text-red-400"
              >
                Effacer le journal
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-stone-800 rounded-xl">
              <Mail size={32} className="mx-auto text-stone-600 mb-2" />
              <p className="text-sm text-stone-400 font-medium">Aucune campagne envoyée pour le moment.</p>
              <p className="text-xs text-stone-500 mt-1">Vos futurs envois apparaîtront automatiquement ici.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(item => (
                <div
                  key={item.id}
                  className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        item.is_test ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {item.is_test ? 'Email Test' : 'Diffusion Officielle'}
                      </span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {new Date(item.date).toLocaleString('fr-FR')}
                      </span>
                      <span className="text-[11px] text-primary font-bold">
                        • {item.signer_name || 'Abdoulaye Sylla'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-stone-200 truncate">{item.subject}</h4>
                    <p className="text-xs text-stone-400 line-clamp-1">{item.headline}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          subject: item.subject,
                          headline: item.headline,
                          body: item.body,
                          cta_label: item.cta_label || '',
                          cta_url: item.cta_url || '',
                          image_url: item.image_url || '',
                          theme: item.theme || 'prestige_dark',
                        }));
                        setActiveTab('compose');
                      }}
                      className="text-xs h-8 border-stone-700 hover:border-primary text-stone-300 hover:text-white"
                    >
                      <RefreshCw size={13} className="mr-1.5" /> Réutiliser ce message
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglet : Automatisations & Relances Contextuelles */}
      {activeTab === 'automations' && (
        <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
            <div>
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <Zap size={18} className="text-amber-400" /> Moteur d'Automatisations & Relances Contextuelles
              </h3>
              <p className="text-xs text-stone-400 mt-1 max-w-2xl">
                Surveillance continue des échéances d'événements, des sorties musicales et des actions prioritaires avec déclenchement automatique d'emails contextualisés et de notifications push ciblées.
              </p>
            </div>

            <Button
              onClick={handleRunAutomations}
              disabled={automationRunning}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold gap-2 text-xs shrink-0"
            >
              {automationRunning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {automationRunning ? 'Traitement en cours…' : 'Exécuter le scan & Déclencher'}
            </Button>
          </div>

          {/* Grille des règles d'automatisation actives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(AUTOMATION_TYPES).map((rule) => (
              <div
                key={rule.id}
                className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${rule.color}`}>
                      {rule.badge}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Actif · Automatisé
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-stone-200">{rule.title}</h4>
                  <p className="text-xs text-stone-400 leading-relaxed">{rule.desc}</p>
                </div>

                <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 font-mono">
                  <span>Canaux : Email + Web Push</span>
                  <span className="text-amber-400/90">Signé Abdoulaye Sylla</span>
                </div>
              </div>
            ))}
          </div>

          {/* Journal des exécutions du moteur */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 flex items-center gap-2">
              <History size={14} /> Journal des Relances & Alertes Exécutées
            </h4>

            {automationLogs.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-stone-800 rounded-xl text-stone-500 text-xs">
                Aucune exécution enregistrée. Cliquez sur « Exécuter le scan & Déclencher » pour tester les relances.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 font-mono text-xs">
                {automationLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-stone-300 font-bold">{log.action}</p>
                      <p className="text-[11px] text-stone-500">
                        {log.count} action(s) traitée(s) · {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-bold">✓ Succès</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onglet : Composer (avec Aperçu en direct) */}
      {activeTab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Colonne de composition (7 colonnes sur grand écran) */}
          <div className="lg:col-span-6 space-y-6">

            {/* 1. Sélection du Signataire Officiel */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={14} className="text-primary" /> Signataire officiel de l'envoi
                </Label>
                <span className="text-[11px] text-amber-400 font-semibold">Abdoulaye Sylla par défaut</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.values(SIGNERS).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update('signer_id', s.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      form.signer_id === s.id
                        ? 'border-primary bg-primary/10 text-stone-100 shadow-sm'
                        : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      form.signer_id === s.id ? 'bg-primary text-white' : 'bg-stone-800 text-stone-400'
                    }`}>
                      {s.avatarText || s.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-200 truncate">{s.name}</p>
                      <p className="text-[10.5px] text-stone-400 truncate">{s.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Thème Graphique de l'email */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 space-y-3">
              <Label className="text-xs font-mono text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                <Palette size={14} className="text-primary" /> Thème Graphique & Ambiance
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.values(EMAIL_THEMES).map(th => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => update('theme', th.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      form.theme === th.id
                        ? 'border-primary ring-1 ring-primary bg-stone-950 text-white shadow-md'
                        : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: th.ctaBg }} />
                      <span className="text-xs font-bold text-stone-200 truncate">{th.label}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 line-clamp-1">{th.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Destinataires */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={14} className="text-primary" /> Destinataires ciblés
                </Label>
                <span className="text-[11px] text-stone-400 font-mono">
                  {form.audience === 'partners' && `~${usersCount} comptes`}
                  {form.audience === 'artists' && `~${artistsCount} artistes`}
                  {form.audience === 'requests' && `~${requestsCount} demandeurs`}
                  {form.audience === 'all' && `~${usersCount + artistsCount} membres`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {AUDIENCES.map(a => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => update('audience', a.value)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        form.audience === a.value
                          ? 'border-primary bg-primary/10 text-stone-100 shadow-sm'
                          : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <Icon size={16} className={`mt-0.5 shrink-0 ${form.audience === a.value ? 'text-primary' : 'text-stone-500'}`} />
                      <div className="min-w-0">
                        <p className={`text-xs font-bold ${form.audience === a.value ? 'text-stone-200' : 'text-stone-300'}`}>
                          {a.label}
                        </p>
                        <p className="text-[10.5px] text-stone-400 mt-0.5 line-clamp-1">{a.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {form.audience === 'custom' && (
                <div className="pt-2">
                  <Label className="text-xs text-stone-400 mb-1.5 block">Adresses emails ciblées (séparées par des virgules ou retours à la ligne)</Label>
                  <Textarea
                    value={form.custom_emails}
                    onChange={e => update('custom_emails', e.target.value)}
                    placeholder="contact1@gmail.com, label@artiste.com"
                    rows={3}
                    className="bg-stone-950 border-stone-700 text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* 4. Contenu du message */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-stone-400 mb-1.5 block">Badge d'en-tête</Label>
                  <Input
                    value={form.badge_label}
                    onChange={e => update('badge_label', e.target.value)}
                    placeholder="COMMUNICATION OFFICIELLE"
                    className="bg-stone-950 border-stone-700 text-xs uppercase"
                  />
                </div>
                <div>
                  <Label className="text-xs text-stone-400 mb-1.5 block">Sujet de l'email (Boîte de réception) *</Label>
                  <Input
                    value={form.subject}
                    onChange={e => update('subject', e.target.value)}
                    placeholder="Objet visible dans la boîte mail..."
                    className="bg-stone-950 border-stone-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-stone-400 mb-1.5 block">Grand titre de l'annonce (Headline) *</Label>
                <Input
                  value={form.headline}
                  onChange={e => update('headline', e.target.value)}
                  placeholder="Titre accrocheur visible au sommet du corps de l'email..."
                  className="bg-stone-950 border-stone-700 text-xs font-semibold"
                />
              </div>

              {/* Illustration */}
              <div>
                <Label className="text-xs text-stone-400 mb-1.5 block">Pochette ou Image d'illustration (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.image_url}
                    onChange={e => update('image_url', e.target.value)}
                    placeholder="https://... (URL de l'image ou pochette)"
                    className="bg-stone-950 border-stone-700 text-xs flex-1"
                  />
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover border border-stone-700 shrink-0"
                      onError={e => e.target.style.display = 'none'}
                    />
                  )}
                </div>
              </div>

              {/* Corps + Assistant IA Abdoulaye Sylla */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="text-xs text-stone-400">Corps du message (Texte libre) *</Label>
                  
                  {/* Sélecteur de ton IA */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={aiTone}
                      onChange={e => setAiTone(e.target.value)}
                      className="h-7 text-[11px] bg-stone-950 border border-stone-700 text-stone-300 rounded px-2"
                    >
                      <option value="institutionnel">Ton : Institutionnel (Sylla)</option>
                      <option value="chaleureux">Ton : Chaleureux & Festif</option>
                      <option value="commercial">Ton : Commercial (90%)</option>
                      <option value="vip">Ton : VIP & Prestige</option>
                    </select>

                    <Button
                      type="button"
                      size="sm"
                      onClick={generateWithAI}
                      disabled={!form.headline || aiLoading}
                      className="h-7 text-xs gap-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-white border border-primary/30"
                    >
                      {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      {aiLoading ? 'Rédaction...' : 'Rédiger avec IA'}
                    </Button>
                  </div>
                </div>

                <Textarea
                  value={form.body}
                  onChange={e => update('body', e.target.value)}
                  placeholder="Rédigez votre message ici ou utilisez l'assistant IA d'Abdoulaye Sylla..."
                  rows={8}
                  className="bg-stone-950 border-stone-700 text-xs leading-relaxed font-sans"
                />
              </div>

              {/* Accordéon Plateformes de streaming */}
              <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-950/40">
                <button
                  type="button"
                  onClick={() => setAdvancedStreamingOpen(!advancedStreamingOpen)}
                  className="w-full flex items-center justify-between p-3 text-xs font-bold text-stone-300 hover:bg-stone-800/40 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Radio size={14} className="text-primary" />
                    Badges Plateformes Streaming ({streamingLinks.length} active{streamingLinks.length > 1 ? 's' : ''})
                  </span>
                  {advancedStreamingOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                {advancedStreamingOpen && (
                  <div className="p-3 pt-1 space-y-3 border-t border-stone-800/60 bg-stone-950/80">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-stone-400">Insérez les liens pour afficher de superbes badges cliquables dans l'email :</p>
                      <button
                        type="button"
                        onClick={() => update('show_streaming', !form.show_streaming)}
                        className={`text-[11px] px-2 py-0.5 rounded font-bold ${form.show_streaming ? 'bg-emerald-500/20 text-emerald-400' : 'bg-stone-800 text-stone-400'}`}
                      >
                        {form.show_streaming ? 'Activé' : 'Désactivé'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <Label className="text-[11px] text-stone-400 mb-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#1DB954]" /> Lien Spotify
                        </Label>
                        <Input
                          value={form.streaming_spotify}
                          onChange={e => update('streaming_spotify', e.target.value)}
                          placeholder="https://open.spotify.com/track/..."
                          className="bg-stone-900 border-stone-700 text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-stone-400 mb-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#FA243C]" /> Lien Apple Music
                        </Label>
                        <Input
                          value={form.streaming_apple}
                          onChange={e => update('streaming_apple', e.target.value)}
                          placeholder="https://music.apple.com/..."
                          className="bg-stone-900 border-stone-700 text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-stone-400 mb-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#FF0000]" /> Lien YouTube Music
                        </Label>
                        <Input
                          value={form.streaming_youtube}
                          onChange={e => update('streaming_youtube', e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="bg-stone-900 border-stone-700 text-xs h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-stone-400 mb-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#FFA200]" /> Lien Audiomack
                        </Label>
                        <Input
                          value={form.streaming_audiomack}
                          onChange={e => update('streaming_audiomack', e.target.value)}
                          placeholder="https://audiomack.com/..."
                          className="bg-stone-900 border-stone-700 text-xs h-8"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton d'action principal CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <Label className="text-xs text-stone-400 mb-1.5 block">Texte du Bouton CTA</Label>
                  <Input
                    value={form.cta_label}
                    onChange={e => update('cta_label', e.target.value)}
                    placeholder="ex: Écouter maintenant / Découvrir"
                    className="bg-stone-950 border-stone-700 text-xs font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs text-stone-400 mb-1.5 block">Lien du Bouton (URL)</Label>
                  <Input
                    value={form.cta_url}
                    onChange={e => update('cta_url', e.target.value)}
                    placeholder="https://kkdmusic.com/..."
                    className="bg-stone-950 border-stone-700 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 5. Contexte Officiel, Titre & Événement (Anti-Ambiguïté) */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-mono text-stone-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <ShieldCheck size={15} className="text-primary" /> 5. Fiche Contextuelle Officielle (Anti-Ambiguïté)
                  </Label>
                  <p className="text-[11px] text-stone-400">
                    Adapte le courriel au titre, au contexte et aux événements pour éliminer tout risque d'incompréhension.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => update('enable_context_card', !form.enable_context_card)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors ${
                    form.enable_context_card ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-stone-800 text-stone-400 border border-stone-700'
                  }`}
                >
                  {form.enable_context_card ? 'Fiche Activée' : 'Désactivée'}
                </button>
              </div>

              {form.enable_context_card && (
                <div className="space-y-4 pt-1 border-t border-stone-800/80">
                  {/* Sélecteur de type de contexte */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-stone-400 font-semibold block">Sélectionnez la nature du contexte :</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(CONTEXT_TYPES).map(([typeKey, cfg]) => {
                        const isSelected = form.context_type === typeKey;
                        return (
                          <button
                            key={typeKey}
                            type="button"
                            onClick={() => {
                              update('context_type', typeKey);
                              const defaultMeta = {};
                              cfg.fields.forEach(f => {
                                defaultMeta[f.key] = form.context_meta?.[f.key] || '';
                              });
                              if (typeKey === 'release' && !defaultMeta.track_title) {
                                defaultMeta.track_title = form.headline || 'Titre du morceau';
                                defaultMeta.artist_name = currentSigner.name ? 'Artiste KKD Music' : '';
                              } else if (typeKey === 'event' && !defaultMeta.event_title) {
                                defaultMeta.event_title = form.headline || 'Showcase Officiel KKD';
                              } else if (typeKey === 'circular' && !defaultMeta.emitter) {
                                defaultMeta.emitter = `${currentSigner.name}, ${currentSigner.role}`;
                              }
                              update('context_meta', defaultMeta);
                              if (cfg.defaultNotice) update('context_notice', cfg.defaultNotice);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-primary ring-1 ring-primary/60 bg-primary/10 text-white shadow'
                                : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                            }`}
                          >
                            <span className="text-sm mb-1">{cfg.badge.split(' ')[0]}</span>
                            <p className="text-xs font-bold text-stone-200 truncate">{cfg.title}</p>
                            <p className="text-[9.5px] text-stone-400 truncate mt-0.5">{cfg.subtitle}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Champs dynamiques selon le contexte sélectionné */}
                  {CONTEXT_TYPES[form.context_type] && (
                    <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between pb-1 border-b border-stone-800/80">
                        <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                          <Info size={13} className="text-primary" />
                          Métadonnées : {CONTEXT_TYPES[form.context_type].title}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-primary/15 text-primary">
                          {CONTEXT_TYPES[form.context_type].badge}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {CONTEXT_TYPES[form.context_type].fields.map((f) => (
                          <div key={f.key}>
                            <Label className="text-[11px] text-stone-400 mb-1 block">{f.label}</Label>
                            <Input
                              value={form.context_meta?.[f.key] || ''}
                              onChange={(e) => updateMetaField(f.key, e.target.value)}
                              placeholder={f.label}
                              className="bg-stone-900 border-stone-700 text-xs h-8"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Notice anti-ambiguïté */}
                      <div className="pt-2 border-t border-stone-800/60">
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-[11px] text-amber-400/90 flex items-center gap-1">
                            <ShieldAlert size={12} /> Notice de portée & Clarté juridique (Anti-Incompréhension)
                          </Label>
                          {CONTEXT_TYPES[form.context_type]?.defaultNotice && (
                            <button
                              type="button"
                              onClick={() => update('context_notice', CONTEXT_TYPES[form.context_type].defaultNotice)}
                              className="text-[10px] text-stone-400 hover:text-stone-200 underline"
                            >
                              Notice standard
                            </button>
                          )}
                        </div>
                        <Textarea
                          value={form.context_notice || ''}
                          onChange={(e) => update('context_notice', e.target.value)}
                          placeholder="Clause d'interprétation officielle affichée au bas de la fiche contextuelle..."
                          rows={2}
                          className="bg-stone-900 border-stone-700 text-xs font-mono text-stone-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 6. Renforcement & Force d'Action sur les Notifications Push */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-mono text-stone-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <BellRing size={15} className="text-amber-400" /> 6. Force d'Action : Notifications Push
                  </Label>
                  <p className="text-[11px] text-stone-400">
                    Déclenche une notification Push In-App et mobile en temps réel pour démultiplier l'impact du courriel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => update('send_push', !form.send_push)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors ${
                    form.send_push ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-stone-800 text-stone-400 border border-stone-700'
                  }`}
                >
                  {form.send_push ? '🔔 Push Activé' : 'Push Désactivé'}
                </button>
              </div>

              {form.send_push && (
                <div className="space-y-3 pt-1 border-t border-stone-800/80">
                  <div className="grid grid-cols-1 gap-2.5">
                    <div>
                      <Label className="text-[11px] text-stone-400 mb-1 block">Titre de la Notification Push *</Label>
                      <Input
                        value={form.push_title || ''}
                        onChange={(e) => update('push_title', e.target.value)}
                        placeholder={form.subject || "Titre de l'alerte push..."}
                        className="bg-stone-950 border-stone-700 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-stone-400 mb-1 block">Message d'impact Push (visible sur l'écran d'accueil) *</Label>
                      <Textarea
                        value={form.push_message || ''}
                        onChange={(e) => update('push_message', e.target.value)}
                        placeholder={form.headline || "Synthèse percutante du message invitant à l'action immédiate..."}
                        rows={2}
                        className="bg-stone-950 border-stone-700 text-xs"
                      />
                    </div>
                  </div>

                  {/* Simulateur instantané de bannière Push */}
                  <div className="bg-stone-950/80 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span className="flex items-center gap-1.5 font-bold text-amber-400">
                        <Smartphone size={13} /> Simulation Notification Écran Mobile / Bureau
                      </span>
                      <span className="font-mono text-[10px] text-stone-500">À l'instant</span>
                    </div>

                    <div className="bg-stone-900 border border-stone-800 rounded-lg p-3 flex items-start gap-3 shadow-lg">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-700 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md">
                        K
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[11px] font-bold text-stone-200 truncate">
                            KKD MUSIC · {currentSigner.name.toUpperCase()}
                          </p>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-bold uppercase">
                            Push VIP
                          </span>
                        </div>
                        <p className="text-xs font-extrabold text-white truncate mt-0.5">
                          {form.push_title || form.subject || 'Avis Officiel KKD Music'}
                        </p>
                        <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5">
                          {form.push_message || form.headline || 'Consultez la communication officielle émise par la Direction.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Boutons d'action finaux */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSend(true)}
                disabled={testSending || !form.headline || !form.body}
                className="text-xs gap-1.5 border-stone-700 text-amber-400 hover:bg-amber-500/10"
              >
                {testSending ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
                Test vers {form.test_email || 'mon email'}
              </Button>

              <Button
                type="button"
                onClick={() => handleSend(false)}
                disabled={sending || !form.subject || !form.headline || !form.body}
                className="text-xs gap-2 flex-1 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {sending ? 'Diffusion en cours…' : `Lancer la campagne (${selectedAudienceObj?.label || 'Tous'})`}
              </Button>
            </div>

          </div>

          {/* Colonne de visualisation en direct (6 colonnes sur grand écran) */}
          <div className="lg:col-span-6 sticky top-6 space-y-4">
            
            {/* Barre de contrôle du simulateur d'aperçu */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <Eye size={14} className="text-primary" /> Simulateur Email
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-400">
                  {EMAIL_THEMES[form.theme]?.label}
                </span>
              </div>

              {/* Boutons Desktop / Mobile / Code / Push */}
              <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded text-xs transition-all ${
                    previewDevice === 'desktop' ? 'bg-stone-800 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Vue Ordinateur (Desktop)"
                >
                  <Monitor size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded text-xs transition-all ${
                    previewDevice === 'mobile' ? 'bg-stone-800 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Vue Smartphone (Mobile)"
                >
                  <Smartphone size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('code')}
                  className={`p-1.5 rounded text-xs transition-all ${
                    previewDevice === 'code' ? 'bg-stone-800 text-white shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Afficher le Code HTML"
                >
                  <FileText size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('push')}
                  className={`p-1.5 rounded text-xs transition-all flex items-center gap-1 ${
                    previewDevice === 'push' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow' : 'text-stone-400 hover:text-stone-200'
                  }`}
                  title="Simulateur Push Notification Direct"
                >
                  <BellRing size={15} />
                </button>
              </div>

              {/* Actions copier / ouvrir */}
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyHtml}
                  className="h-7 text-xs text-stone-400 hover:text-stone-100 gap-1 px-2"
                >
                  {copySuccess ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  {copySuccess ? 'Copié !' : 'Copier HTML'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleOpenRawWindow}
                  className="h-7 text-xs text-stone-400 hover:text-stone-100 p-1 px-2"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <ExternalLink size={13} />
                </Button>
              </div>
            </div>

            {/* En-tête réaliste de client email ou notification */}
            {previewDevice !== 'push' ? (
              <div className="bg-stone-900/90 border border-stone-800 rounded-t-2xl p-3 px-4 text-xs space-y-1">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="font-semibold text-stone-300">De : <strong className="text-white">{currentSigner.name} · KKD Music</strong> &lt;contact@kkdmusic.com&gt;</span>
                  <span className="font-mono text-[10px]">Aujourd'hui</span>
                </div>
                <div className="text-stone-400 truncate">
                  <span>À : </span><span className="text-stone-300">{selectedAudienceObj?.label || 'Destinataires sélectionnés'}</span>
                </div>
                <div className="text-stone-200 font-bold truncate pt-0.5">
                  Objet : {form.subject || '(Sans objet)'}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-stone-950 via-[#18110b] to-stone-950 border border-amber-500/30 rounded-t-2xl p-3 px-4 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellRing size={14} className="text-amber-400" />
                  <span className="font-bold text-stone-200">Simulation Push Notifications (Écran de verrouillage & In-App)</span>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                  Multi-plateformes
                </span>
              </div>
            )}

            {/* Fenêtre de prévisualisation */}
            <div className="flex justify-center bg-stone-950/80 p-2 md:p-4 rounded-b-2xl border-x border-b border-stone-800 overflow-hidden min-h-[580px]">
              {previewDevice === 'code' ? (
                <div className="w-full max-h-[560px] overflow-y-auto p-4 bg-stone-950 rounded-xl font-mono text-[11px] text-emerald-400/90 leading-relaxed border border-stone-800 select-all">
                  <pre>{generatedHtml}</pre>
                </div>
              ) : previewDevice === 'push' ? (
                <div className="w-full max-w-[400px] bg-stone-900 border border-stone-800 rounded-3xl p-4 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                  {/* Fond smartphone */}
                  <div className="space-y-4">
                    {/* Barre de statut smartphone */}
                    <div className="flex items-center justify-between text-[11px] text-stone-400 px-2 pt-1 font-semibold">
                      <span>09:41</span>
                      <div className="w-20 h-4 bg-stone-950 rounded-full mx-auto" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px]">5G</span>
                        <div className="w-4 h-2 border border-stone-400 rounded-sm p-0.5 flex items-center">
                          <div className="w-2 h-full bg-stone-300 rounded-2xs" />
                        </div>
                      </div>
                    </div>

                    {/* Date sur écran de verrouillage */}
                    <div className="text-center pt-4 pb-2 space-y-1">
                      <p className="text-[11px] text-stone-400 uppercase tracking-widest font-mono">
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      <h2 className="text-4xl font-light text-stone-100 tracking-tight font-sans">09:41</h2>
                    </div>

                    {/* Notification Push VIP */}
                    <div className="bg-stone-950/85 backdrop-blur-md border border-stone-700/60 rounded-2xl p-3.5 shadow-2xl space-y-2.5 animate-in slide-in-from-top-3 duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center text-white text-[10px] font-black shadow">
                            K
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-stone-200">KKD MUSIC</p>
                            <p className="text-[9px] text-amber-400 font-semibold uppercase">Direction · Abdoulaye Sylla</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-stone-500 font-mono">Maintenant</span>
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white">
                          {form.push_title || form.subject || 'Avis Officiel KKD Music'}
                        </p>
                        <p className="text-[11px] text-stone-300 leading-snug">
                          {form.push_message || form.headline || 'Consultez la communication officielle émise par la Direction.'}
                        </p>
                      </div>

                      {form.enable_context_card && form.context_type && (
                        <div className="pt-1.5 border-t border-stone-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-primary font-semibold flex items-center gap-1">
                            <ShieldCheck size={11} /> Contexte certifié : {CONTEXT_TYPES[form.context_type]?.title}
                          </span>
                          <span className="text-stone-400 font-mono">Ref. KKD-2026</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          className="w-full py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold text-center hover:bg-primary/90 transition-colors shadow-sm"
                        >
                          Consulter l'annonce
                        </button>
                        <button
                          type="button"
                          className="w-full py-1.5 rounded-lg bg-stone-800 text-stone-300 text-[11px] font-semibold text-center hover:bg-stone-700 transition-colors"
                        >
                          Plus tard
                        </button>
                      </div>
                    </div>

                    {/* Simulation Notification Centre In-App */}
                    <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-3 space-y-1.5">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                        <Bell size={11} className="text-primary" /> Rendu dans le Centre In-App (Cloche)
                      </p>
                      <div className="p-2 rounded-lg bg-stone-900 border border-stone-800/80 text-[11px] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                            ANNONCE DIRECTION
                          </span>
                          <span className="text-[9.5px] text-stone-500">Aujourd'hui</span>
                        </div>
                        <p className="font-bold text-stone-200">{form.push_title || form.subject}</p>
                        <p className="text-[10px] text-stone-400">{form.push_message || form.headline}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 text-center">
                    <p className="text-[10px] text-stone-500">
                      Impact direct : notification native + alerte in-app sur tous les comptes des destinataires ciblés.
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`transition-all duration-300 shadow-2xl rounded-xl overflow-hidden border border-stone-800 bg-white ${
                    previewDevice === 'mobile' ? 'w-[375px] max-w-full' : 'w-full max-w-[620px]'
                  }`}
                >
                  <iframe
                    title="Live Email Preview"
                    srcDoc={generatedHtml}
                    className="w-full h-[600px] border-0"
                    sandbox="allow-same-origin allow-popups"
                  />
                </div>
              )}
            </div>

            <p className="text-[11px] text-stone-500 text-center">
              ✓ Rendu 100% conforme aux spécifications HTML email (compatibilité garantie iPhone, Android, Gmail, Outlook).
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
