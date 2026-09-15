import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Générateur PDF fail-safe pour KKD Music.
 * Résout définitivement le problème de blocage :
 * - Timeout strict de 3.5 secondes sur html2canvas
 * - Fallback vectoriel instantané jsPDF en cas de timeout ou d'erreur CORS d'image
 * - Support direct d'impression fenêtre (print preview)
 */
export async function downloadContractPdf(element, filename = 'Contrat_KKD_Music.pdf', fallbackData = null) {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // 1. Tenter la capture html2canvas avec timeout strict
  try {
    if (element) {
      const canvasPromise = html2canvas(element, {
        scale: 1.8,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 2500,
        removeContainer: true,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('HTML2Canvas capture timeout (3500ms)')), 3500)
      );

      const canvas = await Promise.race([canvasPromise, timeoutPromise]);

      if (canvas && canvas.width > 0 && canvas.height > 0) {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;

        while (heightLeft > 5) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pageHeight;
        }

        pdf.save(cleanFilename);
        return { success: true, method: 'canvas' };
      }
    }
  } catch (err) {
    console.warn('[PDF] HTML2Canvas failed or timed out, activating instant vector PDF fallback:', err?.message || err);
  }

  // 2. Fallback Vectoriel Direct jsPDF (instantané, < 100ms, ne bloque JAMAIS)
  try {
    generateDirectVectorPdf(cleanFilename, fallbackData);
    return { success: true, method: 'vector_fallback' };
  } catch (vectorErr) {
    console.error('[PDF] Vector fallback also failed, falling back to print dialog:', vectorErr);
    // 3. Ultime recours : impression directe du navigateur
    window.print();
    return { success: true, method: 'browser_print' };
  }
}

/**
 * Générateur de secours vectoriel ultra-rapide (pur jsPDF, aucune dépendance DOM ni image externe)
 */
function generateDirectVectorPdf(filename, data = {}) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const d = data || {};
  const issuerEntity = (d.issuer_entity || 'KKD MUSIC').toUpperCase();
  const title = d.title || "CONTRAT OFFICIEL DE DISTRIBUTION & EXPLOITATION";
  const docNumber = d.doc_number || "KKD-2025-OFFICIEL";
  const issuedDate = d.issued_at ? new Date(d.issued_at).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
  const recipient = d.recipient_name || d.artist_name || "L'Artiste / Partenaire Ayant-Droit";
  const hasStudioPartner = !!(d.has_studio_partner && d.studio_name);
  const studioName = d.studio_name || "";
  const studioRole = d.studio_role || "Studio d'enregistrement & Mixage";
  const studioLocation = d.studio_location || "Tambacounda, Sénégal";

  // Cadre double bordure (Bordeaux noble #8B1515 et Or #D4AF37)
  pdf.setDrawColor(139, 21, 21); // #8B1515
  pdf.setLineWidth(1.2);
  pdf.rect(8, 8, 194, 281);

  pdf.setDrawColor(212, 175, 55); // #D4AF37
  pdf.setLineWidth(0.5);
  pdf.rect(10, 10, 190, 277);

  // En-tête bordeaux rougeâtre (#8B1515)
  pdf.setFillColor(139, 21, 21);
  pdf.rect(10, 10, 190, 24, 'F');

  // Liseré or
  pdf.setFillColor(212, 175, 55);
  pdf.rect(10, 34, 190, 1.2, 'F');

  // Titre en-tête
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.text(issuerEntity, 16, 20);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text('Maison de Disques & Distribution Musicale · Tambacounda, Sénégal', 16, 26);

  // Réf & Date
  pdf.setFontSize(8);
  pdf.text(`Réf : ${docNumber}`, 190, 20, { align: 'right' });
  pdf.text(`Émis le : ${issuedDate}`, 190, 26, { align: 'right' });

  // Titre du Document
  pdf.setTextColor(139, 21, 21);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(title.toUpperCase(), 105, 44, { align: 'center' });

  // Encadré Juridique & Droits d'Auteur
  pdf.setFillColor(255, 245, 245);
  pdf.rect(14, 50, 182, 18, 'F');
  pdf.setDrawColor(252, 165, 165);
  pdf.setLineWidth(0.4);
  pdf.rect(14, 50, 182, 18);
  pdf.setFillColor(139, 21, 21);
  pdf.rect(14, 50, 2.5, 18, 'F');

  pdf.setTextColor(139, 21, 21);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text("CADRE LÉGAL & PROTECTION DES DROITS D'AUTEUR — LOI N° 2008-09", 19, 55);

  pdf.setTextColor(51, 65, 85);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text("L'artiste demeure l'unique titulaire des droits moraux et patrimoniaux sur ses créations.", 19, 60);
  pdf.text("Toute exploitation numérique s'exécute sous la garantie d'authenticité et de certification KKD Music.", 19, 64);

  // Parties soussignées
  const partyBoxHeight = hasStudioPartner ? 28 : 22;
  pdf.setFillColor(248, 250, 252);
  pdf.rect(14, 72, 182, partyBoxHeight, 'F');
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(14, 72, 182, partyBoxHeight);

  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('ENTRE LES SOUSSIGNÉS :', 18, 78);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(`1. ${issuerEntity}, intervenant en qualité d'éditeur et distributeur officiel, Tambacounda, Sénégal.`, 18, 84);
  pdf.text(`2. L'ARTISTE AYANT-DROIT : ${recipient}, ci-après « le Bénéficiaire ».`, 18, 90);
  if (hasStudioPartner) {
    pdf.text(`3. STUDIO PARTENAIRE : ${studioName.toUpperCase()} (${studioRole}, ${studioLocation}).`, 18, 96);
  }

  // Articles
  let y = hasStudioPartner ? 107 : 102;
  const articles = [
    {
      num: '1',
      title: 'Objet & Distribution Numérique',
      text: "KKD Music assure la diffusion, promotion et distribution des œuvres sur kkdmusic.com et auprès des plateformes mondiales partenaires (Spotify, Apple Music, YouTube, Deezer, TikTok) sous le standard officiel de qualité."
    },
    {
      num: '2',
      title: 'Durée du Contrat & Validité',
      text: `Le présent accord est conclu et certifié à compter du ${issuedDate}. Il conserve son plein effet pour la durée d'exploitation définie et reconductible d'accord-parties.`
    },
    {
      num: '3',
      title: "Garantie d'Originalité & Propriété Intellectuelle",
      text: "Le Cocontractant garantit être le créateur original et détenteur légitime des droits sur les œuvres musicales et enregistrements sonores déposés, exempts de toute contestation ou contrefaçon."
    },
    {
      num: '4',
      title: 'Rémunération & Clé de Répartition',
      text: "Les revenus générés par les streams, téléchargements et ventes sont versés à hauteur de 90% en faveur de l'Artiste/Label et 10% de frais de distribution KKD Music, avec règlement sécurisé par Wave ou virement direct."
    },
    {
      num: '5',
      title: 'Droit Applicable & Juridiction',
      text: "Le présent contrat est régi par les dispositions législatives sénégalaises régissant la propriété littéraire et artistique. Tout litige relève de la compétence expresse des tribunaux de Tambacounda, République du Sénégal."
    }
  ];

  articles.forEach(art => {
    pdf.setTextColor(139, 21, 21);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text(`Article ${art.num} — ${art.title}`, 14, y);
    y += 4.5;

    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const splitText = pdf.splitTextToSize(art.text, 182);
    pdf.text(splitText, 14, y);
    y += (splitText.length * 3.8) + 3.8;
  });

  // Bloc Signatures
  y = Math.max(y, 222);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.4);
  pdf.line(14, y, 196, y);
  y += 5;

  if (hasStudioPartner) {
    // 3 Colonnes
    const colWidth = 58;
    const gap = 4;

    // Col 1 : KKD Music
    const x1 = 14;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(x1, y, colWidth, 42, 'F');
    pdf.rect(x1, y, colWidth, 42);

    pdf.setTextColor(139, 21, 21);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text(`POUR ${issuerEntity}`, x1 + colWidth / 2, y + 6, { align: 'center' });

    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(0.6);
    pdf.circle(x1 + colWidth / 2, y + 18, 7.5);
    pdf.setFontSize(5.5);
    pdf.setTextColor(139, 21, 21);
    pdf.text('CACHET DU LABEL', x1 + colWidth / 2, y + 17.5, { align: 'center' });
    pdf.text('TAMBACOUNDA', x1 + colWidth / 2, y + 20, { align: 'center' });

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.text('Direction du Label', x1 + colWidth / 2, y + 31, { align: 'center' });

    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text('Tambacounda, Sénégal', x1 + colWidth / 2, y + 35, { align: 'center' });
    pdf.text('Cachet officiel scellé', x1 + colWidth / 2, y + 39, { align: 'center' });

    // Col 2 : Bénéficiaire
    const x2 = x1 + colWidth + gap;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(x2, y, colWidth, 42, 'F');
    pdf.rect(x2, y, colWidth, 42);

    pdf.setTextColor(139, 21, 21);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('POUR LE BÉNÉFICIAIRE', x2 + colWidth / 2, y + 6, { align: 'center' });

    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(6.5);
    pdf.text('« Lu, approuvé et conforme »', x2 + colWidth / 2, y + 18, { align: 'center' });

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    const splitRecipient = pdf.splitTextToSize(recipient, colWidth - 6);
    pdf.text(splitRecipient, x2 + colWidth / 2, y + 30, { align: 'center' });

    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text(`Fait à Tambacounda`, x2 + colWidth / 2, y + 38, { align: 'center' });

    // Col 3 : Studio Partenaire
    const x3 = x2 + colWidth + gap;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(x3, y, colWidth, 42, 'F');
    pdf.rect(x3, y, colWidth, 42);

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.text('POUR LE STUDIO PARTENAIRE', x3 + colWidth / 2, y + 6, { align: 'center' });

    pdf.setTextColor(5, 150, 105);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(6.5);
    pdf.text('« Visa technique certifié »', x3 + colWidth / 2, y + 18, { align: 'center' });

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    const splitStudio = pdf.splitTextToSize(studioName, colWidth - 6);
    pdf.text(splitStudio, x3 + colWidth / 2, y + 30, { align: 'center' });

    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text(studioLocation, x3 + colWidth / 2, y + 38, { align: 'center' });
  } else {
    // 2 Colonnes classiques
    // Colonne KKD Music
    pdf.setFillColor(248, 250, 252);
    pdf.rect(14, y, 88, 42, 'F');
    pdf.rect(14, y, 88, 42);

    pdf.setTextColor(139, 21, 21);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text(`POUR ${issuerEntity}`, 58, y + 6, { align: 'center' });

    pdf.setDrawColor(212, 175, 55);
    pdf.setLineWidth(0.8);
    pdf.circle(58, y + 18, 9);
    pdf.setFontSize(6.5);
    pdf.setTextColor(139, 21, 21);
    pdf.text('CACHET DU LABEL', 58, y + 17, { align: 'center' });
    pdf.text('TAMBACOUNDA', 58, y + 20, { align: 'center' });

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text('Direction du Label', 58, y + 31, { align: 'center' });

    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Maison de Disques & Distribution · Tambacounda', 58, y + 35, { align: 'center' });
    pdf.text('Signature numérique scellée', 58, y + 39, { align: 'center' });

    // Colonne Cocontractant
    pdf.setFillColor(248, 250, 252);
    pdf.rect(108, y, 88, 42, 'F');
    pdf.rect(108, y, 88, 42);

    pdf.setTextColor(139, 21, 21);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('POUR LE BÉNÉFICIAIRE AYANT-DROIT', 152, y + 6, { align: 'center' });

    pdf.setTextColor(148, 163, 184);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(8);
    pdf.text('« Lu, approuvé et certifié conforme »', 152, y + 18, { align: 'center' });

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text(recipient, 152, y + 31, { align: 'center' });

    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text(`Fait à Tambacounda · ${issuedDate}`, 152, y + 36, { align: 'center' });
  }

  // Pied de page
  pdf.setDrawColor(226, 232, 240);
  pdf.line(14, 278, 196, 278);
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('KKD Music · Plateforme Officielle de Distribution Musicale · kkdmusic.com', 14, 282);
  pdf.text(`Réf : ${docNumber} — Date immuable : ${issuedDate}`, 196, 282, { align: 'right' });

  pdf.save(filename);
}
