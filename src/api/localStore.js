// KKD Music — Autonomous Local Database & Base44 Adapter
// Permet un fonctionnement complet, réactif et persistant sans dépendance serveur Base44 pour le moment.

const STORAGE_KEY = 'kkd_music_local_db_v2';
const AUTH_KEY = 'kkd_music_current_user_v2';

// ── SEED DATA COMPLET & RÉALISTE ──
const SEED_DATA = {
  Artist: [
    {
      id: 'art_sidy_diop',
      name: 'Sidy Diop',
      slug: 'sidy-diop',
      bio: 'Prodige du Mbalax moderne et de la pop sénégalaise, Sidy Diop fusionne rythmes traditionnels sabar et arrangements urbains contemporains. Artiste phare du label KKD Music.',
      photo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
      country: 'Sénégal',
      city: 'Dakar',
      genre: 'Mbalax Pop',
      is_verified: true,
      is_gold_label: true,
      followers_count: 284500,
      monthly_listeners: 142000,
      total_sales_count: 3450,
      wave_number: '+221775432109',
      payout_phone: '+221775432109',
      instagram_url: 'https://instagram.com/sidydiop',
      youtube_url: 'https://youtube.com',
      order: 1,
      created_date: '2026-01-10T10:00:00.000Z'
    },
    {
      id: 'art_wally_seck',
      name: 'Wally B. Seck',
      slug: 'wally-b-seck',
      bio: 'Le Golden Boy de la musique sénégalaise. Leader du groupe Raam Daan, il remplit les plus grandes salles d\'Afrique et d\'Europe avec son Afro-Mbalax électrisant.',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      banner_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
      country: 'Sénégal',
      city: 'Dakar',
      genre: 'Afro-Mbalax',
      is_verified: true,
      is_gold_label: true,
      followers_count: 490000,
      monthly_listeners: 310000,
      total_sales_count: 5200,
      wave_number: '+221778901234',
      payout_phone: '+221778901234',
      order: 2,
      created_date: '2026-01-11T10:00:00.000Z'
    },
    {
      id: 'art_viviane',
      name: 'Viviane Chidid',
      slug: 'viviane-chidid',
      bio: 'Reine incontestée du Mbalax et pionnière de la pop urbaine ouest-africaine. Plus de deux décennies de succès et d\'influence internationale.',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      banner_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80',
      country: 'Sénégal',
      city: 'Dakar',
      genre: 'Mbalax Pop',
      is_verified: true,
      is_gold_label: true,
      followers_count: 410000,
      monthly_listeners: 240000,
      total_sales_count: 4100,
      wave_number: '+221771122334',
      order: 3,
      created_date: '2026-01-12T10:00:00.000Z'
    },
    {
      id: 'art_dip',
      name: 'Dip Doundou Guiss',
      slug: 'dip-doundou-guiss',
      bio: 'Voix poétique et percutante du Rap Galsen. Maître des rimes en wolof et des productions trap avant-gardistes, il compte parmi les rappeurs les plus écoutés du continent.',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      banner_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1600&q=80',
      country: 'Sénégal',
      city: 'Dakar',
      genre: 'Rap Galsen',
      is_verified: true,
      followers_count: 320000,
      monthly_listeners: 190000,
      total_sales_count: 2800,
      order: 4,
      created_date: '2026-01-13T10:00:00.000Z'
    },
    {
      id: 'art_didi_b',
      name: 'Didi B',
      slug: 'didi-b',
      bio: 'Pilier du Rap Ivoire et figure de proue du mouvement Shado Chris. Des hits certifiés et une domination sans partage des charts francophones.',
      photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
      banner_url: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80',
      country: 'Côte d\'Ivoire',
      city: 'Abidjan',
      genre: 'Rap Ivoire',
      is_verified: true,
      is_gold_label: true,
      followers_count: 510000,
      monthly_listeners: 390000,
      total_sales_count: 6100,
      order: 5,
      created_date: '2026-01-14T10:00:00.000Z'
    },
    {
      id: 'art_fatoumata',
      name: 'Fatoumata Diawara',
      slug: 'fatoumata-diawara',
      bio: 'Auteure-compositrice-interprète malienne, virtuose de la guitare acoustique et ambassadrice de la culture mandingue sur les scènes des plus grands festivals mondiaux.',
      photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      banner_url: 'https://images.unsplash.com/photo-1469488865564-c2de10f69f96?auto=format&fit=crop&w=1600&q=80',
      country: 'Mali',
      city: 'Bamako',
      genre: 'Afro-Folk',
      is_verified: true,
      followers_count: 220000,
      monthly_listeners: 180000,
      total_sales_count: 1900,
      order: 6,
      created_date: '2026-01-15T10:00:00.000Z'
    }
  ],

  Release: [
    {
      id: 'rel_amour_verite',
      title: 'Amour & Vérité',
      slug: 'amour-et-verite',
      artist_name: 'Sidy Diop',
      artist_id: 'art_sidy_diop',
      cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      release_type: 'single',
      release_date: '2026-02-14',
      description: 'Le nouveau single événement de Sidy Diop. Une déclaration d\'amour portée par des percussions sabar puissantes et des cuivres éclatants. Vente directe exclusive sur KKD Music.',
      audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      is_featured: true,
      is_for_sale: true,
      price: 1000, // 1 000 FCFA
      preview_start: 35,
      preview_duration: 30,
      likes_count: 3240,
      plays_count: 58900,
      sales_count: 894,
      genre: 'Mbalax Pop',
      lyrics: "Xol bi dafa séd guinaw bima la guissé\nYaye sama wërsëg, yaye sama beug-beug\nKKD Music, li moy l'originalité...",
      tracks: [
        {
          title: 'Amour & Vérité (Version Studio Master)',
          audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          duration: '3:45'
        }
      ],
      created_date: '2026-02-14T08:00:00.000Z'
    },
    {
      id: 'rel_dakar_renaissance',
      title: 'Dakar Renaissance',
      slug: 'dakar-renaissance',
      artist_name: 'Wally B. Seck',
      artist_id: 'art_wally_seck',
      cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      release_type: 'album',
      release_date: '2026-01-20',
      description: 'L\'album magistral de Wally B. Seck : 8 titres explorant la symbiose entre les racines sénégalaises et les sonorités Afrobeats internationales.',
      audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      is_featured: true,
      is_for_sale: true,
      price: 5000, // 5 000 FCFA
      preview_start: 20,
      preview_duration: 30,
      likes_count: 6890,
      plays_count: 142000,
      sales_count: 1540,
      genre: 'Afro-Mbalax',
      tracks: [
        { title: '1. Ndakarou By Night', audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: '4:12' },
        { title: '2. Teranga Fever', audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: '3:50' },
        { title: '3. Sama Guéw', audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: '4:35' },
        { title: '4. Renaissance feat. Viviane', audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: '4:05' }
      ],
      created_date: '2026-01-20T12:00:00.000Z'
    },
    {
      id: 'rel_sunu_gaal',
      title: 'Sunu Gaal (Voix d\'Afrique)',
      slug: 'sunu-gaal-voix-afrique',
      artist_name: 'Viviane Chidid',
      artist_id: 'art_viviane',
      cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      release_type: 'single',
      release_date: '2026-02-01',
      description: 'Hymne d\'espoir et de fierté pour la jeunesse africaine. Une production grandiloquente qui transporte dès les premières notes.',
      audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      is_featured: true,
      is_for_sale: true,
      price: 1000,
      preview_start: 15,
      preview_duration: 30,
      likes_count: 4120,
      plays_count: 73000,
      sales_count: 980,
      genre: 'Mbalax Pop',
      tracks: [
        { title: 'Sunu Gaal (Original)', audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: '4:10' }
      ],
      created_date: '2026-02-01T09:00:00.000Z'
    },
    {
      id: 'rel_lelu_ep',
      title: 'L\'Élu (Galsen Chronicles)',
      slug: 'lelu-galsen-chronicles',
      artist_name: 'Dip Doundou Guiss',
      artist_id: 'art_dip',
      cover_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
      release_type: 'ep',
      release_date: '2026-02-28',
      description: 'EP 5 titres brut et sans concession. Dip dépeint la réalité dakaroise avec une virtuosité lyrique inégalée.',
      audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      is_featured: true,
      is_for_sale: true,
      price: 3500,
      preview_start: 10,
      preview_duration: 30,
      likes_count: 5310,
      plays_count: 96000,
      sales_count: 1220,
      genre: 'Rap Galsen',
      tracks: [
        { title: '1. Galsen Way', audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: '3:15' },
        { title: '2. Yakaar', audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: '3:40' },
        { title: '3. Medina', audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: '4:02' }
      ],
      created_date: '2026-02-28T14:00:00.000Z'
    },
    {
      id: 'rel_mojo_trone',
      title: 'Mojo Trône II : Abidjan Bangers',
      slug: 'mojo-trone-abidjan-bangers',
      artist_name: 'Didi B',
      artist_id: 'art_didi_b',
      cover_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
      release_type: 'album',
      release_date: '2026-01-05',
      description: 'Le triomphe du Rap Ivoire. Didi B réunit les plus grands producteurs pour un projet incontournable.',
      audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      is_featured: false,
      is_for_sale: true,
      price: 4000,
      preview_start: 30,
      preview_duration: 30,
      likes_count: 8200,
      plays_count: 185000,
      sales_count: 2410,
      genre: 'Rap Ivoire',
      tracks: [
        { title: '1. Intro Tala', audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: '2:45' },
        { title: '2. Abidjan Boss', audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', duration: '3:30' }
      ],
      created_date: '2026-01-05T10:00:00.000Z'
    }
  ],

  Event: [
    {
      id: 'ev_kkd_fest_2026',
      title: 'KKD Music Festival Dakar 2026',
      slug: 'kkd-fest-dakar-2026',
      artist_name: 'Sidy Diop, Wally Seck, Viviane Chidid, Didi B',
      event_date: '2026-11-15T19:00:00.000Z',
      location: 'Esplanade du Grand Théâtre National',
      city: 'Dakar',
      country: 'Sénégal',
      description: 'Le plus grand rassemblement musical de l\'Afrique de l\'Ouest. 10 000 spectateurs, scènes géantes et retransmission live.',
      cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
      is_featured: true,
      price_standard: 5000,
      price_vip: 15000,
      price_vvip: 35000,
      available_tickets: 850,
      organizer_email: 'label@kkdmusic.com',
      status: 'actif',
      created_date: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'ev_sidy_live_cices',
      title: 'Grand Concert Live Sidy Diop & Le Suba Tel',
      slug: 'sidy-diop-live-cices',
      artist_name: 'Sidy Diop',
      event_date: '2026-10-24T20:30:00.000Z',
      location: 'CICES Salle de l\'Unité',
      city: 'Dakar',
      country: 'Sénégal',
      description: '3 heures de live non-stop pour célébrer le nouveau single Amour & Vérité avec ses fans.',
      cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      is_featured: true,
      price_standard: 3000,
      price_vip: 10000,
      price_vvip: 25000,
      available_tickets: 420,
      organizer_email: 'sidy@kkdmusic.com',
      status: 'actif',
      created_date: '2026-02-10T10:00:00.000Z'
    }
  ],

  Ticket: [
    {
      id: 'tkt_demo_01',
      ticket_number: 'KKD-TKT-2026-88129',
      event_id: 'ev_kkd_fest_2026',
      event_title: 'KKD Music Festival Dakar 2026',
      artist_name: 'Sidy Diop, Wally Seck, Viviane Chidid, Didi B',
      user_email: 'fan@kkdmusic.com',
      user_name: 'Moussa Ndiaye',
      ticket_type: 'vip',
      price: 15000,
      currency: 'XOF',
      status: 'paid',
      is_checked_in: false,
      security_hash: 'A849F98129BC',
      created_date: '2026-03-01T11:20:00.000Z'
    }
  ],

  Purchase: [
    {
      id: 'purch_sidy_01',
      user_email: 'fan@kkdmusic.com',
      item_type: 'release',
      item_id: 'rel_amour_verite',
      item_title: 'Amour & Vérité',
      artist_name: 'Sidy Diop',
      amount: 1000,
      currency: 'XOF',
      status: 'paid',
      description: 'Achat direct single KKD Music — Audio Haute Résolution & Licence d\'écoute',
      created_date: '2026-03-02T14:10:00.000Z'
    },
    {
      id: 'purch_wally_02',
      user_email: 'fan@kkdmusic.com',
      item_type: 'release',
      item_id: 'rel_dakar_renaissance',
      item_title: 'Dakar Renaissance',
      artist_name: 'Wally B. Seck',
      amount: 5000,
      currency: 'XOF',
      status: 'paid',
      description: 'Achat direct album complet 8 pistes',
      created_date: '2026-03-03T16:45:00.000Z'
    }
  ],

  WavePayment: [
    {
      id: 'wave_pay_01',
      user_email: 'fan@kkdmusic.com',
      artist_name: 'Sidy Diop',
      item_id: 'rel_amour_verite',
      item_title: 'Amour & Vérité',
      amount: 1000,
      currency: 'XOF',
      reference: 'WAVE-SN-994821',
      wave_launch_url: 'https://pay.wave.com/m/M_p123456789/c/sn/',
      status: 'valide',
      created_date: '2026-03-02T14:08:00.000Z'
    }
  ],

  MusicLicense: [
    {
      id: 'lic_sync_01',
      license_number: 'KKD-LIC-20260301-8A19',
      certificate_number: 'KKD-CERT-20260301-9X42',
      artist_id: 'art_sidy_diop',
      artist_name: 'Sidy Diop',
      release_id: 'rel_amour_verite',
      release_title: 'Amour & Vérité',
      license_type: 'double',
      status: 'genere',
      signatory_name: 'Abdoulaye Sylla',
      signatory_role: 'Directeur Général KKD Music',
      pdf_data: {
        isrc: 'SN-KKD-26-89421',
        work_title: 'Amour & Vérité',
        artist_name: 'Sidy Diop',
        artist_verified: true,
        artist_genre: 'Mbalax Pop',
        artist_nationality: 'Sénégalaise',
        release_type: 'single',
        release_date: '2026-02-14',
        originality_hash: '9F88A12903C4B8912E4A9182390DFEA192348A9CBE123490AB',
        signatory_name: 'Abdoulaye Sylla',
        signatory_role: 'Directeur Général KKD Music'
      },
      created_date: '2026-03-01T10:00:00.000Z'
    }
  ],

  PartnerPublication: [
    {
      id: 'pub_sidy_new',
      partner_email: 'sidy@kkdmusic.com',
      artist_name: 'Sidy Diop',
      title: 'Amour & Vérité (Remix Acoustic)',
      type: 'single',
      status: 'publie',
      is_for_sale: true,
      price: 1000,
      description: 'Version acoustique intimiste enregistrée aux Studios KKD Dakar.',
      cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      audio_file_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      created_date: '2026-03-04T12:00:00.000Z'
    }
  ],

  ArtistAccessRequest: [
    {
      id: 'aar_sidy',
      user_email: 'sidy@kkdmusic.com',
      artist_name: 'Sidy Diop',
      artist_id: 'art_sidy_diop',
      status: 'approuve',
      notes: 'Compte artiste vérifié KKD Music',
      created_date: '2026-01-10T10:00:00.000Z'
    },
    {
      id: 'aar_label',
      user_email: 'label@kkdmusic.com',
      artist_name: 'KKD Music Label',
      status: 'approuve',
      notes: 'Label officiel KKD Music',
      created_date: '2026-01-10T10:00:00.000Z'
    }
  ],

  ArtistInvite: [
    {
      id: 'inv_sidy',
      email: 'sidy@kkdmusic.com',
      artist_name: 'Sidy Diop',
      artist_id: 'art_sidy_diop',
      status: 'actif',
      invite_type: 'artiste',
      label_name: 'KKD Music Records',
      created_date: '2026-01-10T10:00:00.000Z'
    },
    {
      id: 'inv_label_sidy',
      email: 'label@kkdmusic.com',
      artist_name: 'Sidy Diop',
      artist_id: 'art_sidy_diop',
      status: 'actif',
      invite_type: 'label',
      label_name: 'KKD Music Records',
      created_date: '2026-01-10T10:00:00.000Z'
    },
    {
      id: 'inv_label_wally',
      email: 'label@kkdmusic.com',
      artist_name: 'Wally B. Seck',
      artist_id: 'art_wally_seck',
      status: 'actif',
      invite_type: 'label',
      label_name: 'KKD Music Records',
      created_date: '2026-01-11T10:00:00.000Z'
    }
  ],

  Video: [
    {
      id: 'vid_sidy_01',
      title: 'Sidy Diop - Amour & Vérité (Clip Officiel HD)',
      artist_name: 'Sidy Diop',
      thumbnail_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      views_count: 145000,
      publish_date: '2026-02-15',
      created_date: '2026-02-15T12:00:00.000Z'
    },
    {
      id: 'vid_wally_02',
      title: 'Wally B. Seck - Ndakarou By Night (Live)',
      artist_name: 'Wally B. Seck',
      thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      views_count: 280000,
      publish_date: '2026-01-22',
      created_date: '2026-01-22T14:00:00.000Z'
    }
  ],

  News: [
    {
      id: 'news_01',
      title: 'KKD Music lance la vente directe : les artistes africains touchent désormais 90% de leurs revenus',
      slug: 'kkd-lance-vente-directe-90-pourcent-artistes',
      summary: 'Plus besoin d\'attendre des millions de streams Spotify pour vivre de son art. Grâce à Wave et Orange Money, les artistes vendent directement à leur communauté.',
      content: 'Une révolution pour l\'industrie musicale africaine : KKD Music inaugure sa marketplace D2C (Direct-to-Consumer) qui permet aux créateurs de fixer eux-mêmes leurs prix en Franc CFA, d\'octroyer des licences officielles de synchronisation et de vendre leurs billets de concert sans intermédiaire.',
      cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      author: 'Rédaction KKD Music',
      is_published: true,
      published_at: '2026-03-01T08:00:00.000Z',
      created_date: '2026-03-01T08:00:00.000Z'
    },
    {
      id: 'news_02',
      title: 'Sidy Diop bat tous les records avec son single "Amour & Vérité"',
      slug: 'sidy-diop-record-amour-et-verite',
      summary: 'Plus de 800 achats en moins de 48 heures via Wave et cartes bancaires sur la plateforme KKD Music.',
      content: 'Le chanteur sénégalais prouve la puissance du modèle de vente directe. Les mélomanes achètent le morceau en qualité studio master et reçoivent instantanément leur certificat d\'authenticité.',
      cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      author: 'Fatou Sow',
      is_published: true,
      published_at: '2026-02-18T10:00:00.000Z',
      created_date: '2026-02-18T10:00:00.000Z'
    }
  ],

  ServiceRequest: [
    {
      id: 'req_distrib_01',
      artist_name: 'Moussa Traoré',
      email: 'moussa@traore.sn',
      phone: '+221776543210',
      request_type: 'distribution',
      title: 'Album "Terroir Mandingue" - Demande de distribution physique & streaming',
      details: 'Souhaite confier la distribution numérique mondiale et la diffusion vinyle/CD au label KKD Music.',
      status: 'en_cours',
      created_date: '2026-03-02T10:00:00.000Z'
    }
  ],

  StudioProvider: [
    {
      id: 'std_01',
      name: 'Studios KKD Almadies',
      city: 'Dakar',
      address: 'Route des Almadies, Dakar',
      services: ['Enregistrement Pro', 'Mixage Atmos', 'Mastering D2C', 'Tournage Clip 4K'],
      hourly_rate: 25000,
      currency: 'XOF',
      photo_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
      created_date: '2026-01-01T00:00:00.000Z'
    }
  ],

  Playlist: [
    {
      id: 'ply_afro_hits',
      title: 'Top Ventes KKD - Afro Gold',
      description: 'Les plus grands succès africains indépendants du moment.',
      cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      is_curated: true,
      tracks: [
        { release_id: 'rel_amour_verite', title: 'Amour & Vérité', artist_name: 'Sidy Diop' },
        { release_id: 'rel_dakar_renaissance', title: 'Dakar Renaissance', artist_name: 'Wally B. Seck' }
      ],
      created_date: '2026-01-01T00:00:00.000Z'
    }
  ],

  User: [
    {
      id: 'usr_admin_01',
      email: 'admin@kkdmusic.com',
      full_name: 'Abdoulaye Sylla',
      role: 'admin',
      account_type: 'admin',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      description: 'Super Administrateur Principal KKD Music — Accès total à la plateforme',
      created_date: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'usr_admin_owner',
      email: 'storesmaxim@gmail.com',
      full_name: 'Propriétaire / Super Admin',
      role: 'admin',
      account_type: 'admin',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      description: 'Super Administrateur KKD Music — Accès total global',
      created_date: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'usr_label_01',
      email: 'label@kkdmusic.com',
      full_name: 'KKD Music Records (Label)',
      role: 'partner',
      account_type: 'label',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      description: 'Label de Production Partenaire — Gestion de catalogue et sorties',
      created_date: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'usr_artist_01',
      email: 'sidy@kkdmusic.com',
      full_name: 'Sidy Diop',
      role: 'partner',
      account_type: 'artist',
      artist_name: 'Sidy Diop',
      artist_id: 'art_sidy_diop',
      wave_number: '+221775432109',
      payout_phone: '+221775432109',
      avatar_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80',
      description: 'Artiste Indépendant Vérifié',
      created_date: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'usr_fan_01',
      email: 'fan@kkdmusic.com',
      full_name: 'Moussa Ndiaye',
      role: 'user',
      account_type: 'user',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      description: 'Auditeur & Acheteur',
      created_date: '2026-01-01T00:00:00.000Z'
    }
  ]
};

// ── COMPTES PRÉCONFIGURÉS POUR DÉMONSTRATION & UTILISATION RAPIDE ──
export const PRESET_USERS = {
  admin: {
    id: 'usr_admin_01',
    email: 'admin@kkdmusic.com',
    full_name: 'Abdoulaye Sylla (Super Admin)',
    role: 'admin',
    account_type: 'admin',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    description: 'Administrateur Principal KKD Music — Gestion globale de la plateforme, validation et finances.'
  },
  label: {
    id: 'usr_label_01',
    email: 'label@kkdmusic.com',
    full_name: 'KKD Music Records (Label)',
    role: 'partner',
    account_type: 'label',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    description: 'Directeur Artistique & Production — Gestion du catalogue, signatures et licences.'
  },
  artist: {
    id: 'usr_artist_01',
    email: 'sidy@kkdmusic.com',
    full_name: 'Sidy Diop (Artiste Indépendant)',
    role: 'partner',
    account_type: 'artist',
    artist_name: 'Sidy Diop',
    artist_id: 'art_sidy_diop',
    wave_number: '+221775432109',
    payout_phone: '+221775432109',
    avatar_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=200&q=80',
    description: 'Artiste Indépendant — Vente de musique, licences de synchronisation et billetterie.'
  },
  fan: {
    id: 'usr_fan_01',
    email: 'fan@kkdmusic.com',
    full_name: 'Moussa Ndiaye (Acheteur / Fan)',
    role: 'user',
    account_type: 'user',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    description: 'Mélomane & Acheteur — Écoute, achat direct de singles et de billets de concerts.'
  }
};

class LocalStorageEngine {
  constructor() {
    this.subscribers = new Set();
    this.initDb();
  }

  initDb() {
    if (typeof window === 'undefined') return;
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    } else {
      try {
        const db = JSON.parse(existing);
        let changed = false;
        if (!db.User || !Array.isArray(db.User) || db.User.length === 0) {
          db.User = JSON.parse(JSON.stringify(SEED_DATA.User));
          changed = true;
        } else {
          // Make sure root admin exists
          const hasOwner = db.User.some(u => u.email?.toLowerCase() === 'storesmaxim@gmail.com');
          if (!hasOwner) {
            db.User.push({
              id: 'usr_admin_owner',
              email: 'storesmaxim@gmail.com',
              full_name: 'Propriétaire / Super Admin',
              role: 'admin',
              account_type: 'admin',
              avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
              description: 'Super Administrateur KKD Music — Accès total global',
              created_date: '2026-01-01T00:00:00.000Z'
            });
            changed = true;
          }
        }
        if (changed) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
        }
      } catch (e) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      }
    }
    // Set default user if none
    const curUser = localStorage.getItem(AUTH_KEY);
    if (!curUser) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(PRESET_USERS.admin));
    }
  }

  getDb() {
    if (typeof window === 'undefined') return JSON.parse(JSON.stringify(SEED_DATA));
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : JSON.parse(JSON.stringify(SEED_DATA));
    } catch {
      return JSON.parse(JSON.stringify(SEED_DATA));
    }
  }

  saveDb(db) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      this.notify();
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  subscribe(fn) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  notify() {
    for (const sub of this.subscribers) {
      try { sub(); } catch (_) {}
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kkd:db_updated'));
    }
  }

  // ── ENTITY OPERATIONS ──
  getTable(entityName) {
    const db = this.getDb();
    if (!db[entityName]) {
      db[entityName] = [];
      this.saveDb(db);
    }
    return db[entityName] || [];
  }

  sortItems(items, sort) {
    if (!sort) return items;
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    return [...items].sort((a, b) => {
      const valA = a[field];
      const valB = b[field];
      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return desc ? valB - valA : valA - valB;
      }
      return desc ? String(valB).localeCompare(String(valA)) : String(valA).localeCompare(String(valB));
    });
  }

  async list(entityName, sort, limit) {
    let items = this.getTable(entityName);
    if (sort) items = this.sortItems(items, sort);
    if (limit && limit > 0) items = items.slice(0, limit);
    return JSON.parse(JSON.stringify(items));
  }

  async filter(entityName, query = {}, sort, limit) {
    let items = this.getTable(entityName);
    items = items.filter(item => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] !== val) return false;
      }
      return true;
    });
    if (sort) items = this.sortItems(items, sort);
    if (limit && limit > 0) items = items.slice(0, limit);
    return JSON.parse(JSON.stringify(items));
  }

  async get(entityName, id) {
    const items = this.getTable(entityName);
    const item = items.find(i => i.id === id);
    if (!item) throw new Error(`${entityName} with id ${id} not found`);
    return JSON.parse(JSON.stringify(item));
  }

  async create(entityName, data) {
    const db = this.getDb();
    if (!db[entityName]) db[entityName] = [];
    const newId = data.id || `${entityName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newItem = {
      ...data,
      id: newId,
      created_date: data.created_date || new Date().toISOString()
    };
    db[entityName].unshift(newItem);
    this.saveDb(db);
    return JSON.parse(JSON.stringify(newItem));
  }

  async update(entityName, id, updates) {
    const db = this.getDb();
    if (!db[entityName]) db[entityName] = [];
    const idx = db[entityName].findIndex(i => i.id === id);
    if (idx === -1) {
      // If not found, create it
      return this.create(entityName, { ...updates, id });
    }
    db[entityName][idx] = { ...db[entityName][idx], ...updates, updated_date: new Date().toISOString() };
    this.saveDb(db);
    return JSON.parse(JSON.stringify(db[entityName][idx]));
  }

  async delete(entityName, id) {
    const db = this.getDb();
    if (!db[entityName]) return true;
    db[entityName] = db[entityName].filter(i => i.id !== id);
    this.saveDb(db);
    return true;
  }

  async bulkCreate(entityName, items) {
    const created = [];
    for (const item of items) {
      created.push(await this.create(entityName, item));
    }
    return created;
  }

  async bulkUpdate(entityName, items) {
    const updated = [];
    for (const item of items) {
      if (item.id) updated.push(await this.update(entityName, item.id, item));
    }
    return updated;
  }

  async deleteMany(entityName, query = {}) {
    const db = this.getDb();
    if (!db[entityName]) return true;
    db[entityName] = db[entityName].filter(item => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] === val) return false;
      }
      return true;
    });
    this.saveDb(db);
    return true;
  }

  // ── AUTHENTICATION & USERS ──
  getCurrentUser() {
    if (typeof window === 'undefined') return PRESET_USERS.admin;
    try {
      const data = localStorage.getItem(AUTH_KEY);
      return data ? JSON.parse(data) : PRESET_USERS.admin;
    } catch {
      return PRESET_USERS.admin;
    }
  }

  setCurrentUser(user) {
    if (typeof window === 'undefined') return;
    if (!user) {
      localStorage.removeItem(AUTH_KEY);
    } else {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      // Also update/sync with User table
      try {
        const db = this.getDb();
        if (!db.User) db.User = [];
        const idx = db.User.findIndex(u => u.id === user.id || (u.email && u.email.toLowerCase() === user.email?.toLowerCase()));
        if (idx >= 0) {
          db.User[idx] = { ...db.User[idx], ...user };
        } else {
          db.User.push(user);
        }
        this.saveDb(db);
      } catch (e) {
        console.error('Failed to sync user into User table', e);
      }
    }
    this.notify();
  }

  getUserByEmail(email) {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    const db = this.getDb();
    if (!db.User) return null;
    return db.User.find(u => u.email && u.email.toLowerCase().trim() === normalized) || null;
  }

  upsertUser(userData) {
    if (!userData || !userData.email) return null;
    const normalized = userData.email.toLowerCase().trim();
    const db = this.getDb();
    if (!db.User) db.User = [];
    const idx = db.User.findIndex(u => (u.email && u.email.toLowerCase().trim() === normalized) || (userData.id && u.id === userData.id));
    let savedUser;
    if (idx >= 0) {
      db.User[idx] = { ...db.User[idx], ...userData };
      savedUser = db.User[idx];
    } else {
      savedUser = {
        id: userData.id || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        created_date: new Date().toISOString(),
        ...userData,
      };
      db.User.push(savedUser);
    }
    this.saveDb(db);
    // If current logged-in user is this user, update active session
    const current = this.getCurrentUser();
    if (current && current.email && current.email.toLowerCase().trim() === normalized) {
      this.setCurrentUser({ ...current, ...savedUser });
    }
    return savedUser;
  }

  listUsers() {
    const db = this.getDb();
    return db.User || [];
  }

  deleteUser(id) {
    const db = this.getDb();
    if (!db.User) return true;
    db.User = db.User.filter(u => u.id !== id && u.email !== id);
    this.saveDb(db);
    return true;
  }

  switchRole(roleKey) {
    const target = PRESET_USERS[roleKey] || PRESET_USERS.admin;
    this.setCurrentUser(target);
    return target;
  }
}

export const localDb = new LocalStorageEngine();

// Helper to create an entity API proxy
export function createEntityProxy(entityName) {
  return {
    list: (sort, limit) => localDb.list(entityName, sort, limit),
    filter: (query, sort, limit) => localDb.filter(entityName, query, sort, limit),
    get: (id) => localDb.get(entityName, id),
    create: (data) => localDb.create(entityName, data),
    update: (id, data) => localDb.update(entityName, id, data),
    delete: (id) => localDb.delete(entityName, id),
    bulkCreate: (items) => localDb.bulkCreate(entityName, items),
    bulkUpdate: (items) => localDb.bulkUpdate(entityName, items),
    deleteMany: (query) => localDb.deleteMany(entityName, query),
    subscribe: (cb) => localDb.subscribe(cb),
  };
}
