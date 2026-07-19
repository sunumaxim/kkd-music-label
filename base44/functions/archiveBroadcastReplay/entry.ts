import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const event = body.event || {};
    const data = body.data || {};
    const broadcastId = event.entity_id || data.id;

    if (!broadcastId) return Response.json({ skipped: true, reason: 'no id' });
    if (data.status !== 'termine') return Response.json({ skipped: true, reason: 'not termine' });

    // Idempotency: skip if a replay already exists for this broadcast
    const existing = await base44.asServiceRole.entities.Video.filter({ broadcast_id: broadcastId });
    if (existing && existing.length > 0) {
      return Response.json({ skipped: true, reason: 'replay already archived' });
    }

    // Determine the media source for the replay
    let youtube_url = '';
    let video_file_url = '';
    if (data.source_type === 'live_stream' && data.stream_url) {
      youtube_url = data.stream_url;
    } else if (data.source_video_url) {
      video_file_url = data.source_video_url;
    } else if (data.stream_url) {
      youtube_url = data.stream_url;
    } else {
      return Response.json({ skipped: true, reason: 'no media source' });
    }

    const today = new Date().toISOString().slice(0, 10);

    await base44.asServiceRole.entities.Video.create({
      title: `Replay — ${data.title || 'Direct'}`,
      artist_name: 'KKD Live',
      youtube_url,
      video_file_url,
      video_type: 'replay_live',
      broadcast_id: broadcastId,
      description: data.description || 'Replay du direct KKD Music.',
      publish_date: today,
      is_featured: false,
      views_count: 0,
    });

    return Response.json({ success: true, broadcast_id: broadcastId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});