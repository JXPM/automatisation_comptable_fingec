import LegalLayout from "../../components/LegalLayout";

export default function PrivacyPage() {
  return (
    <LegalLayout title="Politique de confidentialité" updated="22 juin 2026" current="/confidentialite">
      <p>
        La présente politique décrit la manière dont <strong>Fingec</strong> (« nous ») collecte et traite les
        données à caractère personnel dans le cadre de l'application <strong>app.fingec.fr</strong>, conformément
        au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée
        (« Informatique et Libertés »).
      </p>

      <h2>1. Responsable du traitement</h2>
      <ul>
        <li>
          <strong>Fingec</strong>, EURL au capital de 1 000 €, SIRET 808 015 994 00037, dont le siège est 6 rue
          Frédéric Chopin, 67118 Geispolsheim, représentée par son gérant Ohouo N'Katta. Tél. : +33 (0)9 83 00 08 43.
        </li>
        <li><strong>Contact RGPD</strong> : <a href="mailto:expert@fingec.fr">expert@fingec.fr</a></li>
        <li>
          <strong>Délégué à la protection des données (DPO)</strong> : non désigné. La désignation d'un DPO n'est
          pas obligatoire au regard de l'activité et de la taille de la structure (pas de suivi régulier et
          systématique à grande échelle, pas de traitement de données sensibles à grande échelle).
        </li>
      </ul>
      <blockquote>
        <strong>Qualification.</strong> Fingec agit en <strong>responsable de traitement autonome</strong>, tant
        pour les données de ses <strong>utilisateurs</strong> (collaborateurs) que pour celles des{" "}
        <strong>clients du cabinet</strong> traitées dans le cadre de sa mission comptable : Fingec en détermine
        les finalités et les moyens et est soumis à ses propres obligations légales.
      </blockquote>

      <h2>2. Données collectées, finalités et bases légales</h2>
      <h3>2.1 Comptes des utilisateurs de l'espace (comptables, administrateurs)</h3>
      <ul>
        <li>
          <strong>Données</strong> : adresse e-mail, nom complet, mot de passe (stocké uniquement sous forme de{" "}
          <strong>hash bcrypt</strong>), rôle (user/admin), statut du compte, date de création, jetons de
          réinitialisation (stockés uniquement en <strong>SHA-256</strong>).
        </li>
        <li><strong>Finalité</strong> : création et gestion des accès à l'espace de travail, authentification, sécurité.</li>
        <li>
          <strong>Base légale</strong> : exécution du contrat de travail/de prestation et{" "}
          <strong>intérêt légitime</strong> de l'éditeur à sécuriser l'accès à son outil.
        </li>
      </ul>
      <h3>2.2 Gestion des clients du cabinet et relances</h3>
      <ul>
        <li>
          <strong>Données</strong> : nom et adresse e-mail du contact client, statut de collecte des pièces, dates
          d'envoi, nombre et date des relances, historique des envois.
        </li>
        <li>
          <strong>Finalité</strong> : suivi de la collecte des pièces comptables et envoi des relances par e-mail
          dans le cadre de la mission comptable.
        </li>
        <li>
          <strong>Base légale</strong> : exécution de la mission comptable et/ou <strong>intérêt légitime</strong> à
          assurer le suivi des dossiers ; respect d'<strong>obligations légales</strong> comptables et fiscales.
        </li>
      </ul>
      <h3>2.3 Traitement des fichiers comptables (TikTok / Shopify → Quadra)</h3>
      <ul>
        <li>
          <strong>Données</strong> : fichiers de relevés de transactions e-commerce (dates, montants, TVA, frais).
          Les fichiers importés sont <strong>supprimés immédiatement après traitement</strong> ; seuls des{" "}
          <strong>fichiers de sortie agrégés</strong> (.xlsx) et des <strong>métadonnées techniques</strong> (nom
          de fichier, score de fiabilité, nombre de lignes) sont conservés.
        </li>
        <li><strong>Finalité</strong> : production d'écritures comptables prêtes à importer.</li>
        <li><strong>Base légale</strong> : exécution de la mission comptable / <strong>obligation légale</strong>.</li>
      </ul>

      <h2>3. Destinataires et sous-traitants</h2>
      <p>
        Les données sont accessibles aux <strong>collaborateurs habilités</strong> de Fingec, selon le principe du
        moindre privilège (un comptable n'accède qu'aux clients qui lui sont attribués).
      </p>
      <p>Nous faisons appel aux <strong>sous-traitants</strong> suivants :</p>
      <table>
        <thead>
          <tr><th>Sous-traitant</th><th>Rôle</th><th>Donnée concernée</th><th>Localisation</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Hostinger</strong></td>
            <td>Hébergement du serveur (VPS)</td>
            <td>Comptes, attributions, fichiers de sortie</td>
            <td>Paris, France (UE)</td>
          </tr>
          <tr>
            <td><strong>Google</strong> (Google Workspace / Sheets / Gmail)</td>
            <td>Stockage des données clients (Sheets) et envoi des e-mails (Gmail)</td>
            <td>Nom, e-mail, historique des relances</td>
            <td>UE + transferts hors UE encadrés</td>
          </tr>
        </tbody>
      </table>
      <p>
        Le composant d'automatisation <strong>n8n</strong> est <strong>auto-hébergé</strong> sur notre propre
        serveur et ne constitue pas un sous-traitant tiers.
      </p>
      <p>
        Nous ne <strong>vendons ni ne louons</strong> vos données. Aucune donnée n'est utilisée à des fins de
        profilage publicitaire.
      </p>

      <h2>4. Transferts hors Union européenne</h2>
      <p>
        Le recours à Google peut impliquer des transferts de données vers des pays tiers (notamment les
        États-Unis). Ces transferts sont encadrés par les <strong>clauses contractuelles types</strong> de la
        Commission européenne et l'adhésion du prestataire au <strong>Data Privacy Framework</strong>{" "}
        UE-États-Unis.
      </p>

      <h2>5. Durées de conservation</h2>
      <p>En synthèse :</p>
      <ul>
        <li><strong>Comptes utilisateurs</strong> : pendant la durée de la relation, puis suppression/anonymisation après désactivation.</li>
        <li><strong>Données clients et historique des relances</strong> : pendant la durée de la mission, puis archivage conformément aux obligations comptables.</li>
        <li><strong>Fichiers importés</strong> : supprimés immédiatement après traitement.</li>
        <li><strong>Fichiers de sortie</strong> : purgés automatiquement au-delà de 90 jours.</li>
        <li><strong>Journaux techniques</strong> : purgés automatiquement au-delà de 365 jours.</li>
      </ul>

      <h2>6. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles adaptées : chiffrement des échanges
        (HTTPS/TLS), hachage <strong>bcrypt</strong> des mots de passe, jetons d'accès <strong>JWT</strong> à
        durée limitée, jetons de réinitialisation à usage unique et expirants, accès à l'automatisation (n8n){" "}
        <strong>uniquement</strong> via un proxy authentifié, et cloisonnement des accès par rôle et par
        attribution client.
      </p>

      <h2>7. Vos droits</h2>
      <p>
        Vous disposez des droits d'<strong>accès</strong>, de <strong>rectification</strong>, d'
        <strong>effacement</strong>, de <strong>limitation</strong>, d'<strong>opposition</strong> et de{" "}
        <strong>portabilité</strong>, ainsi que du droit de définir des directives relatives au sort de vos
        données après votre décès.
      </p>
      <ul>
        <li>
          <strong>Pour les exercer</strong> : écrire à <a href="mailto:expert@fingec.fr">expert@fingec.fr</a>, en
          justifiant de votre identité si nécessaire. Nous répondons dans un délai d'<strong>un mois</strong>.
        </li>
        <li>
          <strong>Réclamation</strong> : vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong>{" "}
          (3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 —{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">www.cnil.fr</a>).
        </li>
      </ul>

      <h2>8. Cookies et traceurs</h2>
      <p>
        L'application utilise uniquement des éléments <strong>strictement nécessaires</strong> à son
        fonctionnement (par exemple le stockage local du jeton de session pour vous maintenir connecté). Elle{" "}
        <strong>n'utilise pas</strong> de cookies publicitaires, de mesure d'audience tierce ou de traceurs de
        profilage. Aucun consentement préalable n'est donc requis pour ces éléments essentiels.
      </p>

      <h2>9. Modifications</h2>
      <p>
        La présente politique peut être mise à jour. La date de dernière mise à jour figure en tête de document.
      </p>
    </LegalLayout>
  );
}
