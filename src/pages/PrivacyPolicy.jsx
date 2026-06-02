import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Retour à l'accueil
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield size={18} className="text-primary" />
          </div>
          <div>
            <span className="text-xs font-mono text-primary tracking-widest uppercase">Légal</span>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">Politique de confidentialité</h1>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-10 font-mono">Dernière mise à jour : 1er juin 2026</p>

        <div className="prose prose-invert prose-sm md:prose-base max-w-none
          prose-headings:font-display prose-headings:font-bold
          prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
          prose-p:leading-relaxed prose-p:text-foreground/85
          prose-li:my-1 prose-ul:my-3
          prose-strong:text-foreground
        ">
          <h2>1. Responsable du traitement</h2>
          <p>
            KKD Music est responsable du traitement de vos données personnelles collectées via l'application mobile et le site web KKD Music.
          </p>

          <h2>2. Données collectées</h2>
          <p>Nous collectons les données suivantes :</p>
          <ul>
            <li><strong>Données d'inscription</strong> : adresse e-mail, nom complet, rôle (artiste / label / fan).</li>
            <li><strong>Données de navigation</strong> : pages visitées, clics, temps passé (analytics anonymes).</li>
            <li><strong>Contenu soumis</strong> : demandes de services, publications musicales, commentaires.</li>
            <li><strong>Fichiers uploadés</strong> : photos de couverture, EPK, fichiers audio/vidéo.</li>
          </ul>

          <h2>3. Finalités du traitement</h2>
          <p>Vos données sont utilisées pour :</p>
          <ul>
            <li>Gérer votre compte et authentification.</li>
            <li>Traiter vos demandes de services (distribution, promotion, collaboration).</li>
            <li>Vous envoyer des notifications et newsletters (avec votre consentement).</li>
            <li>Améliorer l'expérience utilisateur via des analyses statistiques.</li>
            <li>Respecter nos obligations légales.</li>
          </ul>

          <h2>4. Base légale</h2>
          <p>
            Le traitement est fondé sur votre consentement (inscription, commentaires, newsletter) et sur l'exécution d'un contrat (demandes de services).
          </p>

          <h2>5. Partage des données</h2>
          <p>
            Nous ne vendons ni ne louons vos données à des tiers. Elles peuvent être partagées avec des prestataires techniques (hébergement, e-mail) dans le strict cadre de leurs missions, sous contrat de traitement de données.
          </p>

          <h2>6. Durée de conservation</h2>
          <p>
            Vos données sont conservées pendant la durée de votre compte actif, puis archivées 12 mois avant suppression définitive. Les données de facturation sont conservées 10 ans conformément à la législation.
          </p>

          <h2>7. Vos droits</h2>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul>
            <li>Droit d'accès à vos données.</li>
            <li>Droit de rectification.</li>
            <li>Droit à l'effacement (« droit à l'oubli »).</li>
            <li>Droit à la portabilité.</li>
            <li>Droit d'opposition au traitement.</li>
          </ul>
          <p>Pour exercer vos droits, contactez-nous à : <strong>contact@kkdmusic.com</strong></p>

          <h2>8. Cookies</h2>
          <p>
            L'application utilise des cookies techniques nécessaires à son bon fonctionnement (session, authentification). Aucun cookie publicitaire n'est utilisé sans consentement explicite.
          </p>

          <h2>9. Sécurité</h2>
          <p>
            Vos données sont stockées sur des serveurs sécurisés (chiffrement HTTPS, accès restreint). Nous appliquons des mesures techniques et organisationnelles pour prévenir tout accès non autorisé.
          </p>

          <h2>10. Contact</h2>
          <p>
            Pour toute question relative à la confidentialité de vos données :<br />
            <strong>KKD Music</strong> — contact@kkdmusic.com
          </p>
        </div>
      </div>
    </div>
  );
}