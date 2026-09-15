import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText, Award, Loader2, Download, Send,
  ShieldCheck, Calendar, Search, Plus, Mail, Eye, Share2, FolderArchive, Layers
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { documentArchiveService, DOCUMENT_TYPES } from '@/services/documentArchiveService';
import DocumentModalViewer from '@/components/documents/DocumentModalViewer';
import { downloadContractPdf } from '@/lib/contractPdf';

export default function AdminLicenses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('repertoire'); // 'repertoire' | 'licenses' | 'new_doc'
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sendingDocId, setSendingDocId] = useState(null);

  // 1. Tous les documents du Répertoire Permanent
  const { data: archivedDocs = [], isLoading: loadingDocs, refetch: refetchDocs } = useQuery({
    queryKey: ['admin-archived-documents'],
    queryFn: () => documentArchiveService.listDocuments(),
  });

  // 2. Licences spécifiques (MusicLicense)
  const { data: licenses = [], isLoading: loadingLicenses } = useQuery({
    queryKey: ['admin-licenses'],
    queryFn: () => base44.entities.MusicLicense.list('-created_date', 200),
  });

  // 3. Artistes (pour générateur)
  const { data: artists = [] } = useQuery({
    queryKey: ['admin-artists-for-licenses'],
    queryFn: () => base44.entities.Artist.list('name', 200),
  });

  // Filtrage du répertoire
  const filteredDocs = archivedDocs.filter(d => {
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    const matchSearch = !search ||
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.recipient_email?.toLowerCase().includes(search.toLowerCase()) ||
      d.doc_number?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Re-consulter un document (ouvre la vue haute fidélité avec la date originale)
  const handleConsultDoc = (doc) => {
    setSelectedDoc(doc);
    setModalOpen(true);
  };

  // Déclencher l'envoi d'un document existant vers le destinataire
  const handleTriggerSend = async (doc) => {
    if (!doc.recipient_email) {
      toast({
        title: 'Email manquant',
        description: "Ce document n'a pas d'adresse email associée.",
        variant: 'destructive',
      });
      return;
    }

    setSendingDocId(doc.id);
    try {
      const res = await documentArchiveService.sendExistingDocument(doc.id, {
        target_email: doc.recipient_email
      });
      toast({
        title: 'Envoi déclenché avec succès',
        description: `Email et notification push transmis à ${res.recipient}. Date d'origine ${new Date(res.issued_at).toLocaleDateString('fr-FR')} préservée.`,
      });
      refetchDocs();
    } catch (e) {
      toast({
        title: "Échec de l'envoi",
        description: e?.message || "Erreur lors du déclenchement.",
        variant: 'destructive',
      });
    } finally {
      setSendingDocId(null);
    }
  };

  // Télécharger le document en PDF sans blocage
  const handleDownloadDoc = async (doc) => {
    try {
      const content = doc.content_data || {};
      const res = await downloadContractPdf(null, `${doc.doc_number}_${doc.title}`, {
        title: doc.title,
        doc_number: doc.doc_number,
        issued_at: doc.issued_at,
        recipient_name: doc.recipient_name,
        signer_name: 'Direction du Label',
        signer_role: 'Maison de Disques & Distribution',
        issuer_entity: content.issuer_entity || doc.issuer_entity || 'KKD MUSIC',
        has_studio_partner: !!content.has_studio_partner,
        studio_name: content.studio_name || '',
        studio_role: content.studio_role || '',
        studio_location: content.studio_location || 'Tambacounda, Sénégal',
      });
      toast({
        title: 'PDF téléchargé',
        description: `Document ${doc.doc_number} exporté avec succès.`,
      });
    } catch {
      toast({ title: 'Erreur', description: "Impossible d'exporter le PDF", variant: 'destructive' });
    }
  };

  // Copier le lien sécurisé
  const handleCopyLink = (doc) => {
    const url = documentArchiveService.getShareUrl(doc.id);
    navigator.clipboard.writeText(url);
    toast({ title: 'Lien copié', description: 'Lien de consultation sécurisé copié.' });
  };

  return (
    <div className="space-y-6">
      {/* ── EN-TÊTE PRINCIPAL DE LA PAGE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#8B1515]/10 border border-[#8B1515]/20 text-[#8B1515] flex items-center justify-center">
              <FolderArchive size={22} />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-extrabold tracking-tight">
                Répertoire & Coffre-Fort des Documents
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Consultation et reconsultation permanente sans altération de date · Déclenchement d'envois et notifications push
              </p>
            </div>
          </div>
        </div>

        {/* Bouton de création directe */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setActiveTab('new_doc')}
            className="gap-2 bg-[#8B1515] hover:bg-[#701010] text-white"
          >
            <Plus size={16} /> Générer un nouveau document
          </Button>
        </div>
      </div>

      {/* ── STATISTIQUES GLOBALES DU RÉPERTOIRE ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border/50 rounded-xl p-3.5">
          <p className="text-xs text-muted-foreground font-semibold">Total Documents Archivés</p>
          <p className="font-heading text-2xl font-black mt-1">{archivedDocs.length}</p>
          <p className="text-[10px] text-emerald-500 mt-0.5 font-medium">Conservation immuable garantie</p>
        </div>

        <div className="bg-card border border-emerald-500/20 rounded-xl p-3.5">
          <p className="text-xs text-emerald-600 font-semibold">Contrats Artistes & Labels</p>
          <p className="font-heading text-2xl font-black text-emerald-600 mt-1">
            {archivedDocs.filter(d => d.type.startsWith('contrat')).length}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Avec cachet Abdoulaye Sylla</p>
        </div>

        <div className="bg-card border border-blue-500/20 rounded-xl p-3.5">
          <p className="text-xs text-blue-600 font-semibold">Licences & Certificats</p>
          <p className="font-heading text-2xl font-black text-blue-600 mt-1">
            {archivedDocs.filter(d => d.type.includes('licence') || d.type.includes('certificat')).length}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Scellés SHA-256 cryptographiques</p>
        </div>

        <div className="bg-card border border-purple-500/20 rounded-xl p-3.5">
          <p className="text-xs text-purple-600 font-semibold">Envois & Relances Déclenchés</p>
          <p className="font-heading text-2xl font-black text-purple-600 mt-1">
            {archivedDocs.reduce((acc, d) => acc + (d.sent_count || 0), 0)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Couplés aux push notifications</p>
        </div>
      </div>

      {/* ── ONGLETS DE NAVIGATION DE LA SECTION ── */}
      <div className="flex border-b border-border/40 gap-2">
        <button
          onClick={() => setActiveTab('repertoire')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'repertoire'
              ? 'border-[#8B1515] text-[#8B1515]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderArchive size={16} /> Répertoire des Documents ({filteredDocs.length})
        </button>

        <button
          onClick={() => setActiveTab('licenses')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'licenses'
              ? 'border-[#8B1515] text-[#8B1515]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers size={16} /> Flux des Licences Streaming ({licenses.length})
        </button>

        <button
          onClick={() => setActiveTab('new_doc')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'new_doc'
              ? 'border-[#8B1515] text-[#8B1515]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Plus size={16} /> Nouveau Document & Archivage
        </button>
      </div>

      {/* ── CONTENU DE L'ONGLET 1 : RÉPERTOIRE PERMANENT ── */}
      {activeTab === 'repertoire' && (
        <div className="space-y-4">
          {/* Filtres de recherche */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par référence, artiste, contrat, bénéficiaire ou email..."
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les documents</SelectItem>
                <SelectItem value="contrat_artiste">Contrats d'Artiste</SelectItem>
                <SelectItem value="contrat_label">Contrats de Label</SelectItem>
                <SelectItem value="licence_distribution">Licences de distribution</SelectItem>
                <SelectItem value="certificat_authenticite">Certificats d'authenticité</SelectItem>
                <SelectItem value="attestation_droits">Attestations de droits</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des documents du répertoire */}
          {loadingDocs ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-[#8B1515]" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/40 rounded-2xl p-6 bg-card/40">
              <FolderArchive size={40} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm font-semibold">Aucun document ne correspond à votre filtre</p>
              <p className="text-xs text-muted-foreground mt-1">
                Générez un contrat ou synchronisez un nouvel accord pour l'archiver dans le répertoire.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredDocs.map((doc) => {
                const typeCfg = DOCUMENT_TYPES[doc.type] || DOCUMENT_TYPES.contrat_artiste;
                const formattedDate = new Date(doc.issued_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={doc.id}
                    className="bg-card border border-border/50 hover:border-border rounded-xl p-4 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Colonne d'informations */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border/60">
                        {doc.type.includes('certificat') ? (
                          <Award size={20} className="text-[#8B1515]" />
                        ) : (
                          <FileText size={20} className="text-[#8B1515]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${typeCfg.color}`}>
                            {typeCfg.badge}
                          </span>
                          <span className="text-xs font-mono font-bold text-foreground">
                            {doc.doc_number}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                            <Calendar size={11} /> Émis le : <strong className="text-foreground">{formattedDate}</strong> (immuable)
                          </span>
                        </div>

                        <h3 className="font-heading font-bold text-sm text-foreground truncate">
                          {doc.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                          <span>Bénéficiaire : <strong className="text-foreground">{doc.recipient_name}</strong></span>
                          {doc.recipient_email && (
                            <span className="flex items-center gap-1">
                              <Mail size={11} /> {doc.recipient_email}
                            </span>
                          )}
                          <span className="text-emerald-600 font-medium text-[11px]">
                            ✓ Cachet Abdoulaye Sylla
                          </span>
                          {doc.sent_count > 0 && (
                            <span className="text-purple-600 font-medium text-[11px]">
                              • Expédié {doc.sent_count} fois
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConsultDoc(doc)}
                        className="gap-1.5 text-xs h-8"
                        title="Re-consulter le document exact sans modification de date"
                      >
                        <Eye size={13} /> Re-consulter
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadDoc(doc)}
                        className="gap-1.5 text-xs h-8"
                        title="Télécharger le fichier PDF certifié"
                      >
                        <Download size={13} /> PDF
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(doc)}
                        className="text-xs h-8 px-2.5"
                        title="Copier le lien sécurisé"
                      >
                        <Share2 size={13} />
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleTriggerSend(doc)}
                        disabled={sendingDocId === doc.id}
                        className="gap-1.5 text-xs h-8 bg-[#8B1515] hover:bg-[#701010] text-white"
                        title="Déclencher l'envoi immédiat (email + notification push) sans modifier la date"
                      >
                        {sendingDocId === doc.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Send size={13} />
                        )}
                        {sendingDocId === doc.id ? 'Expédition…' : "Déclencher l'envoi"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CONTENU DE L'ONGLET 2 : FLUX DES LICENCES ── */}
      {activeTab === 'licenses' && (
        <div className="space-y-4">
          <div className="p-3 bg-muted/40 border border-border/40 rounded-xl text-xs text-muted-foreground flex items-center justify-between">
            <span>Flux temps réel des licences générées automatiquement lors des achats ou distributions.</span>
            <span className="font-mono">{licenses.length} enregistrements</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {licenses.map(lic => (
              <div key={lic.id} className="bg-card border border-border/50 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-foreground text-sm">{lic.release_title || lic.video_title || lic.artist_name}</p>
                  <p className="text-muted-foreground">
                    {lic.artist_name} · N° {lic.license_number || lic.certificate_number || lic.id} · Destinataire : {lic.sent_to_email || lic.buyer_email || 'Non renseigné'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`/document/${lic.id}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                      <Eye size={12} /> Consulter
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTENU DE L'ONGLET 3 : NOUVEAU DOCUMENT & ARCHIVAGE DIRECT ── */}
      {activeTab === 'new_doc' && (
        <NewDocumentForm
          artists={artists}
          onSuccess={(newDoc) => {
            refetchDocs();
            setActiveTab('repertoire');
            toast({
              title: 'Document archivé avec succès',
              description: `Réf : ${newDoc.doc_number}. Date immuable scellée dans le coffre-fort.`,
            });
            handleConsultDoc(newDoc);
          }}
        />
      )}

      {/* Modal de re-consultation sécurisée */}
      {selectedDoc && (
        <DocumentModalViewer
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          doc={selectedDoc}
          onSendSuccess={() => refetchDocs()}
        />
      )}
    </div>
  );
}

/**
 * Formulaire de génération et d'archivage permanent d'un nouveau document
 */
function NewDocumentForm({ artists, onSuccess }) {
  const { toast } = useToast();
  const [docType, setDocType] = useState('contrat_artiste');
  const [issuerEntity, setIssuerEntity] = useState('KKD MUSIC');
  const [artistName, setArtistName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [contractDurationMonths, setContractDurationMonths] = useState('24');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Signature partenaire / studio optionnelle
  const [hasStudioPartner, setHasStudioPartner] = useState(false);
  const [studioName, setStudioName] = useState('');
  const [studioRole, setStudioRole] = useState("Studio d'enregistrement & Mixage");
  const [studioLocation, setStudioLocation] = useState('Tambacounda, Sénégal');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!artistName.trim()) {
      toast({ title: 'Nom manquant', description: "Veuillez préciser le nom de l'artiste ou du bénéficiaire.", variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const now = new Date();
      const typeLabel = DOCUMENT_TYPES[docType]?.label || 'Document';
      const endDate = new Date(now.getTime() + parseInt(contractDurationMonths, 10) * 30 * 24 * 3600 * 1000);

      const newDoc = await documentArchiveService.archiveDocument({
        type: docType,
        title: `${typeLabel} — ${artistName} ${workTitle ? `(${workTitle})` : ''}`.trim(),
        recipient_name: artistName,
        recipient_email: recipientEmail,
        issued_at: now.toISOString(), // Scellé immuable
        status: 'actif',
        signer_name: 'Direction du Label',
        signer_role: 'Maison de Disques & Distribution',
        content_data: {
          issuer_entity: issuerEntity,
          artist_name: artistName,
          email: recipientEmail,
          work_title: workTitle,
          contract_start: now.toISOString().split('T')[0],
          contract_end: endDate.toISOString().split('T')[0],
          notes: notes || 'Acte officiel de distribution certifié.',
          royalty_split: '90% Artiste / 10% KKD Music',
          has_studio_partner: hasStudioPartner && !!studioName.trim(),
          studio_name: studioName.trim(),
          studio_role: studioRole.trim(),
          studio_location: studioLocation.trim() || 'Tambacounda, Sénégal',
        }
      });

      onSuccess(newDoc);
    } catch (e) {
      toast({ title: 'Erreur', description: e?.message || "Impossible d'archiver le document.", variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-6 max-w-2xl mx-auto shadow-xs">
      <div className="mb-5 pb-3 border-b border-border/40">
        <h2 className="font-heading font-bold text-lg">Générer & Archiver un Acte Juridique</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Le document sera généré avec son numéro de référence, sa date immuable et le cachet officiel scellé (Tambacounda, Sénégal).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Type de document juridique</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contrat_artiste">Contrat d'Artiste & Distribution Numérique</SelectItem>
                <SelectItem value="contrat_label">Contrat de Partenariat Label</SelectItem>
                <SelectItem value="licence_distribution">Licence de Commercialisation Master</SelectItem>
                <SelectItem value="certificat_authenticite">Certificat d'Authenticité & Empreinte Numérique</SelectItem>
                <SelectItem value="attestation_droits">Attestation de Déclaration de Droits d'Auteur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Entité émettrice officielle</Label>
            <Select value={issuerEntity} onValueChange={setIssuerEntity}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KKD MUSIC">KKD MUSIC</SelectItem>
                <SelectItem value="KKD LABEL ENTERTAINMENT">KKD LABEL ENTERTAINMENT</SelectItem>
                <SelectItem value="KKD DISTRIBUTION">KKD DISTRIBUTION</SelectItem>
                <SelectItem value="KKD GROUP">KKD GROUP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Nom de l'Artiste ou Entité Bénéficiaire *</Label>
            <Input
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Ex: Amadou & The Band"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label className="text-xs">Email du Bénéficiaire</Label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="artiste@example.com"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Titre de l'Œuvre (ou Catalogue concerné)</Label>
          <Input
            value={workTitle}
            onChange={(e) => setWorkTitle(e.target.value)}
            placeholder="Ex: Teranga Deluxe Album"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Durée contractuelle</Label>
            <Select value={contractDurationMonths} onValueChange={setContractDurationMonths}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 mois (1 an)</SelectItem>
                <SelectItem value="24">24 mois (2 ans - Standard)</SelectItem>
                <SelectItem value="36">36 mois (3 ans)</SelectItem>
                <SelectItem value="60">60 mois (5 ans)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Signataire du Label</Label>
            <Input
              value="Direction du Label · Tambacounda, Sénégal"
              disabled
              className="mt-1 bg-muted/50 cursor-not-allowed font-medium text-xs"
            />
          </div>
        </div>

        {/* Section optionnelle : Studio / Enregistreur Partenaire */}
        <div className="p-3 bg-muted/30 border border-border/50 rounded-xl space-y-3">
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={hasStudioPartner}
              onChange={(e) => setHasStudioPartner(e.target.checked)}
              className="rounded text-[#8B1515] focus:ring-[#8B1515]"
            />
            <span>Ajouter une signature Studio / Enregistreur Partenaire (Optionnel)</span>
          </label>

          {hasStudioPartner && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <Label className="text-[11px]">Nom du Studio / Enregistreur</Label>
                <Input
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="Ex: Studio Sahel Sound"
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px]">Rôle technique</Label>
                <Input
                  value={studioRole}
                  onChange={(e) => setStudioRole(e.target.value)}
                  placeholder="Studio Enregistrement & Mix"
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px]">Localisation</Label>
                <Input
                  value={studioLocation}
                  onChange={(e) => setStudioLocation(e.target.value)}
                  placeholder="Tambacounda, Sénégal"
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs">Clauses Particulières & Notes</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Clé 90/10, distribution internationale garantie..."
            className="mt-1"
          />
        </div>

        <div className="pt-3 flex justify-end gap-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#8B1515] hover:bg-[#701010] text-white gap-2"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            {saving ? 'Archivage en cours…' : 'Archiver & Visualiser le Document'}
          </Button>
        </div>
      </form>
    </div>
  );
}
