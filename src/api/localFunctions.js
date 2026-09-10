// KKD Music — Client-side backend function dispatcher
import { localDb } from './localStore';

function genSuffix() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function ymd(d = new Date()) {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

export async function invokeLocalFunction(name, payload = {}) {
  const currentUser = localDb.getCurrentUser();

  switch (name) {
    case 'getMyPurchases': {
      const email = payload.user_email || currentUser?.email;
      if (!email) return { data: { purchases: [] } };

      const allPurchases = await localDb.filter('Purchase', { user_email: email, status: 'paid' });
      const releases = localDb.getTable('Release');
      const videos = localDb.getTable('Video');

      const result = allPurchases.map(p => {
        const item = p.item_type === 'video'
          ? videos.find(v => v.id === p.item_id)
          : releases.find(r => r.id === p.item_id);

        return {
          item_type: p.item_type || 'release',
          item_id: p.item_id,
          item_title: p.item_title || item?.title,
          artist_name: p.artist_name || item?.artist_name,
          cover_url: item?.cover_url || item?.thumbnail_url,
          audio_file_url: item?.audio_file_url || (item?.tracks && item.tracks[0]?.audio_file_url),
          protected_url: item?.protected_file_uri || item?.audio_file_url || (item?.tracks && item.tracks[0]?.audio_file_url) || null,
          external_url: item?.spotify_url || item?.youtube_url || null,
          is_video: p.item_type === 'video',
          amount: p.amount,
          currency: p.currency || 'XOF',
          created_date: p.created_date,
          tracks: item?.tracks || []
        };
      });

      return { data: { purchases: result }, purchases: result };
    }

    case 'generateMusicLicense': {
      const {
        release_id, video_id, artist_id, artist_name, work_title,
        license_type = 'double', signatory_name = 'Abdoulaye Sylla',
        signatory_role = 'Directeur Général KKD Music',
        recipient_email, buyer_email, usage_type
      } = payload;

      const licenseNumber = `KKD-LIC-${ymd()}-${genSuffix()}`;
      const certificateNumber = `KKD-CERT-${ymd()}-${genSuffix()}`;
      const year = new Date().getFullYear().toString().slice(-2);
      const isrc = `SN-KKD-${year}-${Math.floor(10000 + Math.random() * 90000)}`;
      const originalityHash = Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
      const verifiedEmail = recipient_email || buyer_email || currentUser?.email || '';

      const newLicense = await localDb.create('MusicLicense', {
        license_number: licenseNumber,
        certificate_number: certificateNumber,
        artist_id: artist_id || null,
        artist_name: artist_name || 'Artiste KKD',
        release_id: release_id || null,
        release_title: work_title || 'Titre Musical',
        video_id: video_id || null,
        video_title: work_title || null,
        license_type,
        status: 'genere',
        signatory_name,
        signatory_role,
        buyer_email: verifiedEmail,
        user_email: verifiedEmail,
        requested_by_email: verifiedEmail,
        usage_type: usage_type || 'Licence Officielle KKD Music',
        pdf_data: {
          isrc,
          work_title,
          artist_name,
          artist_verified: true,
          artist_genre: 'Musique Urbaine Africaine',
          artist_nationality: 'Africaine',
          release_type: 'single',
          release_date: new Date().toISOString().slice(0, 10),
          originality_hash: originalityHash,
          signatory_name,
          signatory_role,
          buyer_email: verifiedEmail,
          usage_type: usage_type || 'Licence Officielle KKD Music'
        }
      });

      return {
        data: {
          license: newLicense,
          license_number: licenseNumber,
          certificate_number: certificateNumber,
          isrc,
          originality_hash: originalityHash
        },
        license: newLicense
      };
    }

    case 'getLicenseDocument': {
      const { id, user_email } = payload;
      const email = user_email || currentUser?.email;
      const license = await localDb.get('MusicLicense', id).catch(() => null);
      if (!license) {
        return { data: { error: 'Document de licence introuvable' }, error: 'Document de licence introuvable' };
      }

      const isAdmin = currentUser?.role === 'admin' || email === 'storesmaxim@gmail.com' || email?.includes('admin');
      const isBuyer = email && (
        license.buyer_email === email ||
        license.user_email === email ||
        license.requested_by_email === email ||
        license.recipient_email === email
      );
      const isArtist = email && (
        license.artist_email === email ||
        currentUser?.artist_name === license.artist_name ||
        currentUser?.artist_id === license.artist_id
      );

      if (!isAdmin && !isBuyer && !isArtist) {
        return {
          data: {
            error: "Accès restreint et confidentiel : Seul l'acquéreur officiel, l'artiste titulaire des droits ou un administrateur KKD est autorisé à consulter et télécharger ce document.",
            is_unauthorized: true
          },
          error: "Accès restreint et confidentiel"
        };
      }

      return { data: { license }, license };
    }

    case 'incrementPlay': {
      const { item_id } = payload;
      if (item_id) {
        const releases = localDb.getTable('Release');
        const rel = releases.find(r => r.id === item_id);
        if (rel) {
          rel.plays_count = (rel.plays_count || 0) + 1;
          localDb.saveDb(localDb.getDb());
        }
      }
      return { success: true };
    }

    case 'getProtectedPreview': {
      const { item_type, item_id } = payload;
      let entity;
      if (item_type === 'release') {
        const items = await localDb.filter('Release', { id: item_id });
        entity = items[0];
      } else if (item_type === 'video') {
        const items = await localDb.filter('Video', { id: item_id });
        entity = items[0];
      }
      if (!entity) return { data: { error: 'Entity not found' } };

      // Architecture locale : on retourne l'URL audio directement (pas de trimming serveur)
      const audioUrl = entity.protected_file_uri
        || entity.audio_file_url
        || (entity.tracks && entity.tracks[0]?.audio_file_url)
        || (item_type === 'video' ? entity.video_file_url : null);

      if (!audioUrl) return { data: { error: 'No audio file' } };
      return { data: { audio_url: audioUrl, content_type: 'audio/mpeg' } };
    }

    case 'checkArtistDuplicate': {
      const { artist_name } = payload;
      const artists = localDb.getTable('Artist');
      const found = artists.some(a => a.name.toLowerCase() === (artist_name || '').toLowerCase().trim());
      return { data: { duplicate: found, is_duplicate: found } };
    }

    case 'extractLinkMetadata': {
      const { url } = payload;
      return {
        data: {
          title: 'Nouveau Single Extrait',
          artist_name: currentUser?.artist_name || 'Artiste',
          thumbnail_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
          platform: url?.includes('spotify') ? 'Spotify' : url?.includes('youtube') ? 'YouTube' : 'Autre'
        }
      };
    }

    case 'getTicketByNumber': {
      const { ticket_number } = payload;
      const tickets = localDb.getTable('Ticket');
      const t = tickets.find(x => x.ticket_number === ticket_number);
      return { data: { ticket: t || null }, ticket: t || null };
    }

    case 'checkInTicket': {
      const { ticket_number, ticket_id, action = 'checkin' } = payload;
      const tickets = localDb.getTable('Ticket');
      const t = tickets.find(x => x.ticket_number === ticket_number || x.id === ticket_id);
      if (!t) return { error: 'Billet introuvable', status: 'not_found' };

      t.is_checked_in = action === 'checkin';
      t.checked_in_at = action === 'checkin' ? new Date().toISOString() : null;
      localDb.saveDb(localDb.getDb());

      return { data: { success: true, ticket: t }, success: true, ticket: t };
    }

    case 'getEventTickets': {
      const { event_id } = payload;
      const tickets = await localDb.filter('Ticket', { event_id });
      return { data: { tickets }, tickets };
    }

    case 'createManualTicket': {
      const num = `KKD-TKT-${ymd()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTkt = await localDb.create('Ticket', {
        ...payload,
        ticket_number: num,
        status: 'paid',
        is_checked_in: false,
        security_hash: Math.random().toString(36).substring(2, 12).toUpperCase()
      });
      return { data: { ticket: newTkt }, ticket: newTkt };
    }

    case 'validateTicketPayment':
    case 'verifySquarePayment': {
      const { ticket_id } = payload;
      if (ticket_id) {
        await localDb.update('Ticket', ticket_id, { status: 'paid' });
      }
      return { data: { success: true }, success: true };
    }

    case 'redeemPurchase': {
      const { session_id } = payload;
      return { data: { success: true, session_id }, success: true };
    }

    case 'sendLicenseEmail':
    case 'sendMailingCampaign':
    case 'publishToInstagram':
    case 'publishToFacebook': {
      return { data: { success: true, message: 'Action simulée avec succès' }, success: true };
    }

    default:
      return { data: { success: true } };
  }
}