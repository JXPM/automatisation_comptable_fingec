import { Link } from "react-router-dom";
import LegalLayout from "../../components/LegalLayout";

export default function TermsPage() {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation" updated="22 juin 2026" current="/cgu">
      <p>
        Les présentes CGU régissent l'utilisation de l'application <strong>app.fingec.fr</strong>
        {" "}(l'« Application »), éditée par <strong>Fingec</strong> (l'« Éditeur »). L'accès à l'Application vaut
        acceptation des présentes.
      </p>

      <h2>1. Objet</h2>
      <p>
        L'Application est un espace de travail interne au cabinet Fingec destiné à : (i) l'automatisation de la
        préparation d'écritures comptables à partir de fichiers e-commerce (TikTok/Shopify), et (ii) la gestion
        et la relance des clients du cabinet.
      </p>

      <h2>2. Accès et comptes</h2>
      <ul>
        <li>
          L'accès est <strong>réservé</strong> aux collaborateurs et administrateurs habilités du cabinet. Il n'y
          a pas d'inscription libre : les comptes sont créés par un administrateur, qui envoie une invitation par
          e-mail.
        </li>
        <li>
          L'utilisateur est responsable de la <strong>confidentialité de ses identifiants</strong> et de toute
          action réalisée depuis son compte. Tout usage suspect doit être signalé sans délai à un administrateur.
        </li>
        <li>
          Les accès sont cloisonnés par rôle (user/admin) et par attribution : un comptable n'accède qu'aux
          clients qui lui sont attribués.
        </li>
      </ul>

      <h2>3. Utilisation conforme</h2>
      <p>
        L'utilisateur s'engage à : utiliser l'Application dans le seul cadre de ses missions ; ne pas tenter de
        contourner les mesures de sécurité ; ne pas importer de contenu illicite ou de fichiers malveillants ; ne
        traiter que des données qu'il est autorisé à traiter.
      </p>

      <h2>4. Données et confidentialité</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{" "}
        <Link to="/confidentialite">politique de confidentialité</Link>. L'utilisateur est tenu au{" "}
        <strong>secret professionnel</strong> et à la confidentialité des données clients auxquelles il accède.
      </p>

      <h2>5. Disponibilité et maintenance</h2>
      <p>
        L'Éditeur s'efforce d'assurer la disponibilité de l'Application mais ne garantit pas un accès
        ininterrompu. Des interruptions pour maintenance ou cas de force majeure peuvent survenir.
      </p>

      <h2>6. Propriété intellectuelle</h2>
      <p>
        L'Application, son code, sa charte et ses contenus sont la propriété de l'Éditeur. Aucune licence n'est
        concédée au-delà du droit d'utilisation dans le cadre des missions.
      </p>

      <h2>7. Responsabilité</h2>
      <p>
        L'Application est un outil d'aide à la préparation comptable : les résultats produits (calculs de TVA,
        détection d'anomalies, score de fiabilité) doivent faire l'objet d'un <strong>contrôle humain</strong> par
        un professionnel avant tout usage comptable ou fiscal. L'Éditeur ne saurait être tenu responsable d'une
        exploitation des résultats sans vérification.
      </p>

      <h2>8. Évolution des CGU</h2>
      <p>
        Les présentes CGU peuvent être modifiées. La version applicable est celle en vigueur à la date
        d'utilisation.
      </p>

      <h2>9. Droit applicable</h2>
      <p>Droit français. Tout litige relève des tribunaux français compétents.</p>
    </LegalLayout>
  );
}
