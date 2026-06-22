import { Link } from "react-router-dom";
import LegalLayout from "../../components/LegalLayout";

export default function LegalNoticePage() {
  return (
    <LegalLayout title="Mentions légales" updated="22 juin 2026" current="/mentions-legales">
      <p>
        Conformément aux articles 6-III et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
        l'économie numérique (LCEN), les présentes mentions légales sont portées à la connaissance des
        utilisateurs du site <strong>app.fingec.fr</strong>.
      </p>

      <h2>1. Éditeur du site</h2>
      <ul>
        <li><strong>Raison sociale</strong> : Fingec</li>
        <li><strong>Forme juridique</strong> : EURL (SARL à associé unique)</li>
        <li><strong>Capital social</strong> : 1 000 €</li>
        <li><strong>Siège social</strong> : 6 rue Frédéric Chopin, 67118 Geispolsheim, France</li>
        <li><strong>SIREN</strong> : 808 015 994 — <strong>SIRET</strong> (siège) : 808 015 994 00037</li>
        <li><strong>RCS</strong> : 808 015 994 R.C.S. Strasbourg</li>
        <li><strong>N° de TVA intracommunautaire</strong> : FR49808015994</li>
        <li><strong>Inscription à l'Ordre des experts-comptables</strong> : conseil régional d'Alsace</li>
        <li><strong>Téléphone</strong> : +33 (0)9 83 00 08 43</li>
        <li><strong>Adresse e-mail</strong> : <a href="mailto:expert@fingec.fr">expert@fingec.fr</a></li>
      </ul>

      <h2>2. Directeur de la publication</h2>
      <p>Ohouo N'Katta, gérant de la société Fingec.</p>

      <h2>3. Hébergement</h2>
      <p>Le site et l'application sont hébergés sur un serveur privé virtuel (VPS) fourni par :</p>
      <ul>
        <li><strong>Hébergeur</strong> : Hostinger International Ltd</li>
        <li><strong>Adresse</strong> : 61 Lordou Vironos Street, 6023 Larnaca, Chypre</li>
        <li><strong>Site</strong> : <a href="https://www.hostinger.fr" target="_blank" rel="noreferrer">https://www.hostinger.fr</a></li>
        <li><strong>Localisation des données</strong> : centre de données situé à <strong>Paris, France (Union européenne)</strong>.</li>
      </ul>
      <p>
        Le frontend et certains services peuvent s'appuyer sur des prestataires complémentaires : voir la liste
        détaillée dans la <Link to="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        L'ensemble des éléments composant le site (structure, textes, logo « Fingec », charte graphique, code
        source) est protégé par le droit de la propriété intellectuelle et reste la propriété exclusive de
        l'éditeur, sauf mention contraire. Toute reproduction, représentation ou exploitation, totale ou
        partielle, sans autorisation écrite préalable est interdite.
      </p>

      <h2>5. Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{" "}
        <Link to="/confidentialite">politique de confidentialité</Link>. Conformément au RGPD et à la loi
        « Informatique et Libertés », vous disposez de droits d'accès, de rectification, d'effacement, de
        limitation, d'opposition et de portabilité, exerçables à l'adresse :{" "}
        <a href="mailto:expert@fingec.fr">expert@fingec.fr</a>.
      </p>

      <h2>6. Cookies</h2>
      <p>
        L'application n'utilise pas de cookies publicitaires ni de traceurs tiers à des fins de profilage. Voir
        la section « Cookies et traceurs » de la{" "}
        <Link to="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>7. Responsabilité</h2>
      <p>
        L'éditeur s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées, sans garantie
        d'absence d'erreurs. L'accès au service peut être interrompu pour maintenance ou cas de force majeure.
      </p>

      <h2>8. Droit applicable</h2>
      <p>
        Les présentes mentions sont régies par le droit français. Tout litige relève de la compétence des
        tribunaux français.
      </p>
    </LegalLayout>
  );
}
