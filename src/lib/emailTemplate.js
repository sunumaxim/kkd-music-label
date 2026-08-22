/**
 * KKD Music — Email HTML Template Generator
 * Usage: import { buildEmailHtml } from '@/lib/emailTemplate';
 */

const LOGO_URL = "https://media.base44.com/images/public/user_695179b6b73caf48a00876c2/77512c866_file_00000000154471f49577836863a10da3.png";
const PRIMARY = "#E50000";
const BG = "#0a0a0a";
const CARD = "#111111";
const BORDER = "#222222";
const TEXT = "#ffffff";
const MUTED = "#999999";
const SITE_URL = "https://kkdmusic.com";

/**
 * @param {{ subject: string, preheader?: string, headline: string, body: string, cta?: { label: string, url: string }, extra?: string }} opts
 */
export function buildEmailHtml({ subject, preheader = '', headline, body, cta, extra = '' }) {
  const ctaBlock = cta ? `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 32px auto 0;">
      <tr>
        <td style="border-radius:6px; background:${PRIMARY};">
          <a href="${cta.url}" style="display:inline-block; padding:14px 32px; font-family:'Helvetica Neue',Arial,sans-serif; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; letter-spacing:0.5px; border-radius:6px;">${cta.label}</a>
        </td>
      </tr>
    </table>
  ` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; background:${BG}; font-family:'Helvetica Neue',Arial,sans-serif; }
    .wrapper { background:${BG}; padding:40px 16px; }
    .card { background:${CARD}; border:1px solid ${BORDER}; border-radius:12px; max-width:600px; margin:0 auto; overflow:hidden; }
    .header { background:${BG}; border-bottom:1px solid ${BORDER}; padding:28px 40px; text-align:center; }
    .header img { height:40px; width:auto; }
    .red-bar { height:3px; background:linear-gradient(90deg,${PRIMARY},#ff4444); }
    .content { padding:40px 40px 32px; }
    .headline { font-size:24px; font-weight:800; color:${TEXT}; margin:0 0 20px; line-height:1.3; letter-spacing:-0.3px; }
    .body-text { font-size:15px; color:#cccccc; line-height:1.7; margin:0 0 16px; }
    .divider { height:1px; background:${BORDER}; margin:28px 0; }
    .badge { display:inline-block; background:${PRIMARY}20; border:1px solid ${PRIMARY}40; border-radius:20px; padding:4px 14px; font-size:12px; font-weight:700; color:${PRIMARY}; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:20px; }
    .footer { background:#0d0d0d; border-top:1px solid ${BORDER}; padding:28px 40px; text-align:center; }
    .footer p { margin:4px 0; font-size:12px; color:${MUTED}; }
    .footer a { color:${PRIMARY}; text-decoration:none; }
    .social-links { margin:16px 0 8px; }
    .social-links a { display:inline-block; margin:0 8px; font-size:12px; color:${MUTED}; text-decoration:none; }
    .social-links a:hover { color:${PRIMARY}; }
    @media (max-width:600px) {
      .content, .header, .footer { padding-left:24px !important; padding-right:24px !important; }
      .headline { font-size:20px !important; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}&nbsp;&zwnj;&nbsp;</div>` : ''}
  <div class="wrapper">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <img src="${LOGO_URL}" alt="KKD Music" />
      </div>
      <div class="red-bar"></div>

      <!-- Content -->
      <div class="content">
        ${headline ? `<h1 class="headline">${headline}</h1>` : ''}
        <div class="body-text">${body}</div>
        ${ctaBlock}
        ${extra ? `<div class="divider"></div>${extra}` : ''}
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="social-links">
          <a href="${SITE_URL}">Site web</a>
          <a href="https://instagram.com/kkdmusic">Instagram</a>
          <a href="https://youtube.com/@kkdmusic">YouTube</a>
          <a href="https://open.spotify.com">Spotify</a>
        </div>
        <div class="divider" style="margin:16px 0;"></div>
        <p style="font-size:13px; color:#dddddd; font-weight:700; margin-bottom:8px;">KKD Music</p>
        <p>Maison de disques indépendante · Distribution & Promotion · Dakar, Sénégal</p>
        <p style="margin-top:12px;"><a href="${SITE_URL}/mon-espace">Gérer mes préférences</a> · <a href="${SITE_URL}">Visiter le site</a></p>
        <p style="margin-top:8px;">© ${new Date().getFullYear()} KKD Music. Tous droits réservés.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}