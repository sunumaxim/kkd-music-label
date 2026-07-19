import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email } = await req.json().catch(() => ({}));

    const [broadcasts, releases, videos, events, news] = await Promise.all([
      base44.asServiceRole.entities.Broadcast.list('-updated_date', 200),
      base44.asServiceRole.entities.Release.list('-updated_date', 200),
      base44.asServiceRole.entities.Video.list('-updated_date', 200),
      base44.asServiceRole.entities.Event.list('-updated_date', 200),
      base44.asServiceRole.entities.News.list('-updated_date', 200),
    ]);

    const entries = [];
    const addComments = (items, type, titleFn) => {
      for (const it of items) {
        for (const c of (it.comments || [])) {
          entries.push({
            author: c.author || 'Anonyme',
            user_email: c.user_email || '',
            text: c.text,
            date: c.date,
            entity_type: type,
            entity_id: it.id,
            entity_title: titleFn(it),
          });
        }
      }
    };

    addComments(broadcasts, 'broadcast', (it) => it.title || 'Direct');
    addComments(releases, 'release', (it) => `${it.title}${it.artist_name ? ' — ' + it.artist_name : ''}`);
    addComments(videos, 'video', (it) => `${it.title}${it.artist_name ? ' — ' + it.artist_name : ''}`);
    addComments(events, 'event', (it) => it.title || 'Événement');
    addComments(news, 'news', (it) => it.title || 'Article');

    // Classement par auteur (fallback email)
    const counts = new Map();
    for (const e of entries) {
      const key = e.author || e.user_email || 'Anonyme';
      const cur = counts.get(key) || { name: key, email: '', count: 0 };
      cur.count++;
      if (!cur.email && e.user_email) cur.email = e.user_email;
      counts.set(key, cur);
    }
    const leaderboard = [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const myContributions = user_email
      ? entries
          .filter((e) => e.user_email && e.user_email.toLowerCase() === String(user_email).toLowerCase())
          .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
          .slice(0, 50)
      : [];

    return Response.json({ leaderboard, myContributions, total: entries.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});