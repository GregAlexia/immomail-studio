import type { Metadata } from "next";
import Link from "next/link";
import { Archivo, Source_Serif_4 } from "next/font/google";
import "./vente.css";

/* Les deux polices de la maison AgenIA : Archivo pour les titres, Source Serif
   pour le texte courant et les italiques d'emphase. Déclarées ici et non dans
   le layout racine : elles n'habillent que cette page, l'application garde
   Geist. */
const archivo = Archivo({ subsets: ["latin"], variable: "--ag-police-titre", display: "swap" });
const serif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--ag-police-corps",
  display: "swap",
});

const TITRE = "Keo — les automatisations qui tiennent une agence immobilière";
const DESCRIPTION =
  "Keo trie les emails des portails, répond en moins d'une minute, rappelle les visites, " +
  "édite les quittances et surveille les échéances de mandat. Démonstration ouverte, sans compte.";

export const metadata: Metadata = {
  title: TITRE,
  description: DESCRIPTION,
  openGraph: { title: TITRE, description: DESCRIPTION, locale: "fr_FR", type: "website" },
};

const WHATSAPP =
  "https://wa.me/33651748133?text=" +
  encodeURIComponent("Bonjour, je vous écris depuis la page de présentation de Keo.");
const MAIL = "mailto:contact@agenia.pro?subject=" + encodeURIComponent("Keo — demande d'information");

/** Les onze automatisations, telles qu'elles tournent dans la démonstration. */
const TOURNE = [
  "Tri des emails de portails",
  "Réponse instantanée 24/7",
  "Fiche contact créée sans ressaisie",
  "Prise de rendez-vous en ligne",
  "Confirmations et rappels de visite",
  "Quittances de loyer en PDF",
  "Alertes d'expiration de mandat",
  "Rappels DPE et diagnostics",
  "Newsletter acheteurs segmentée",
  "Demandes d'avis Google",
  "Demandes de parrainage",
];

const OUBLIS = [
  {
    num: "01",
    titre: "Entre le portail et le rappel",
    probleme:
      "Les demandes de SeLoger, Leboncoin, Bien'ici et du formulaire arrivent dans la même boîte que les factures et les pièces de dossier. Celle qu'on rappelle trois heures plus tard a déjà appelé l'agence d'en face.",
    reponse:
      "Keo lit chaque email, distingue une vraie demande d'un suivi de visite, d'un envoi de pièces ou d'un spam, crée le lead qualifié, le route au bon négociateur, ouvre la fiche contact et envoie l'accusé de réception horodaté.",
    label: "8 emails bruts",
    chiffre: "5 leads",
  },
  {
    num: "02",
    titre: "Entre le rendez-vous et la visite",
    probleme:
      "Un créneau calé le lundi pour le samedi tient à un seul fil : que le client s'en souvienne. Le lapin ne coûte pas une visite, il coûte le déplacement, le créneau et le vendeur qui attendait.",
    reponse:
      "Le créneau se réserve en ligne et se bloque aussitôt. La confirmation part à la réservation, le rappel la veille, puis deux heures avant. Aucun de ces envois ne dépend de quelqu'un qui y pense.",
    label: "Rappels J-1 · H-2",
    chiffre: "2 envois",
  },
  {
    num: "03",
    titre: "Entre la signature et l'échéance",
    probleme:
      "Un mandat expire, un DPE arrive à terme, une quittance est due. Rien de tout cela ne remonte : ça se voit le jour où le propriétaire a déjà signé ailleurs.",
    reponse:
      "Le mandat alerte trente jours avant et la relance propriétaire part avec. Les diagnostics passent en orange puis en rouge. Les quittances sont générées au jour d'échéance, en PDF, prêtes à envoyer.",
    label: "Mandat · DPE · bail",
    chiffre: "J-30",
  },
];

const ETAPES = [
  {
    num: "01",
    titre: "Vos demandes arrivent triées",
    texte:
      "Vous n'ouvrez plus des emails, vous ouvrez des fiches. Qualifiées, attribuées, déjà répondues — même celles tombées un dimanche à 22 h 40.",
  },
  {
    num: "02",
    titre: "Vos visites se calent seules",
    texte:
      "Le client choisit son créneau sur une page de réservation. Confirmation, rappel la veille, rappel deux heures avant : rien à déclencher.",
  },
  {
    num: "03",
    titre: "Vos échéances se signalent",
    texte:
      "Quittances éditées, mandats en alerte à trente jours, diagnostics suivis. Vous arrêtez de tenir le calendrier dans votre tête.",
  },
];

const CARTES = [
  {
    titre: "Tri et qualification des leads",
    texte:
      "Chaque email de portail est lu, classé et transformé en lead qualifié, routé au négociateur qui suit le bien. Le spam est écarté, un suivi de visite reste un suivi de visite.",
    label: "8 emails triés",
    valeur: "5 leads",
  },
  {
    titre: "Réponse instantanée",
    texte:
      "L'accusé de réception part à la seconde où le lead existe, personnalisé sur le bien demandé, à toute heure. C'est souvent la seule réponse que le prospect aura reçue ce soir-là.",
    label: "Reçu 22 h 40",
    valeur: "Répondu 22 h 40",
  },
  {
    titre: "Rendez-vous et rappels",
    texte:
      "Page de réservation publique, créneau bloqué à la volée, confirmation immédiate, puis rappels la veille et deux heures avant, par SMS et par email.",
    label: "Créneau réservé",
    valeur: "Confirmé",
  },
  {
    titre: "Quittances de loyer",
    texte:
      "Au jour d'échéance, la quittance du mois est générée en PDF — un vrai document, pas un aperçu — et l'email d'accompagnement part avec.",
    label: "Échéance du mois",
    valeur: "PDF",
  },
  {
    titre: "Mandats et conformité",
    texte:
      "Les mandats alertent trente jours avant terme, avec la relance propriétaire. Les diagnostics, le PNO et les baux passent d'« à venir » à « imminent » puis à « dépassé ».",
    label: "Mandat MA-14",
    valeur: "J-30",
  },
  {
    titre: "Après la signature",
    texte:
      "Newsletter segmentée aux acheteurs dont le projet correspond, demande d'avis Google deux jours après la signature avec relance à cinq, demande de parrainage à trente.",
    label: "Signature + 2 j",
    valeur: "Avis",
  },
];

const JALONS = [
  {
    etat: "Dans la démonstration",
    ton: "vif" as const,
    intro: "Tout fonctionne, ouvert, sans compte.",
    points: [
      "Les onze automatisations",
      "Quittances en PDF réels",
      "Aperçus fidèles des SMS et des emails",
      "Journal horodaté de chaque exécution",
      "Import et export de vos données en Excel",
    ],
  },
  {
    etat: "À l'installation",
    ton: "tiede" as const,
    intro: "Ce qui se branche sur vos outils, chez vous.",
    points: [
      "L'envoi réel des SMS et des emails",
      "Votre boîte mail et vos portails",
      "Votre agenda",
      "Votre fiche Google pour les avis",
    ],
  },
  {
    etat: "Priorisé avec vous",
    ton: "froid" as const,
    intro: "L'ordre dépend de ce que vous demandez.",
    points: [
      "Comptes et droits par négociateur",
      "Connexion à un CRM existant",
      "Vue consolidée multi-agences",
      "Application mobile",
    ],
  },
];

const ENGAGEMENTS = [
  {
    titre: "Une démonstration sans compte",
    texte:
      "Le produit rempli de données réalistes, ouvert à tous. Jugez avant de nous parler, et sans laisser d'adresse.",
    lien: { texte: "Entrer dans la démonstration", href: "/" },
  },
  {
    titre: "Aucun envoi réel",
    texte:
      "Pendant la démonstration, aucun SMS ni email ne part vers un vrai destinataire. Les aperçus sont fidèles, les contacts sont fictifs.",
    lien: { texte: "Voir la boîte d'envoi", href: "/messages" },
  },
  {
    titre: "Jamais de doublon",
    texte:
      "Chaque automatisation est protégée par une clé d'exécution unique. Rejouer une date ne renvoie rien deux fois — un rappel envoyé en double coûte plus cher que pas de rappel du tout.",
    lien: { texte: "Voir le journal d'activité", href: "/journal" },
  },
  {
    titre: "Vos chiffres, pas les nôtres",
    texte:
      "Un classeur Excel décrit tout le jeu de données. Téléchargez-le, remplacez-le par votre stock de biens, et regardez les automatisations tourner dessus.",
    lien: { texte: "Ouvrir l'import / export", href: "/import" },
  },
  {
    titre: "Hébergement européen",
    texte:
      "Application et base de données hébergées en Europe. La démonstration ne contient aucune donnée personnelle réelle, et n'utilise aucun cookie de mesure d'audience.",
  },
  {
    titre: "Un interlocuteur, pas un standard",
    texte:
      "AgenIA est une petite maison française. Vous écrivez, quelqu'un qui connaît le produit vous répond — et c'est ce qui décide de l'ordre des chantiers.",
    lien: { texte: "Nous écrire", href: MAIL },
  },
];

const QUESTIONS = [
  {
    q: "Faut-il changer de logiciel métier ?",
    r: "Non. Keo travaille sur ce qui entre et ce qui sort — les emails de portails, les rendez-vous, les envois, les échéances. Vos outils existants restent en place ; ce qui se branche à l'installation, ce sont vos accès, pas votre organisation.",
  },
  {
    q: "Qu'est-ce qui part vraiment pendant la démonstration ?",
    r: "Rien. Aucun SMS ni email n'est envoyé à un destinataire réel : chaque envoi est déposé dans une boîte d'envoi où vous le lisez tel que le client le recevrait. Les quittances, elles, sont de vrais PDF téléchargeables.",
  },
  {
    q: "Comment les demandes sont-elles triées ?",
    r: "Par lecture du contenu de l'email : l'expéditeur, l'objet, la référence du bien citée. Un message de suivi après visite ou un envoi de pièces de dossier n'est pas transformé en lead, et le spam est écarté. Ce qui ne rentre dans aucune case reste visible : rien n'est jeté en silence.",
  },
  {
    q: "Et si une automatisation se trompe ?",
    r: "Chaque exécution laisse une ligne horodatée dans le journal d'activité, filtrable et consultable. Vous voyez ce qui s'est déclenché, quand, pour quel bien et pour quel contact — et vous reprenez la main dessus.",
  },
  {
    q: "Mes données sont-elles isolées ?",
    r: "Oui. Chaque espace de démonstration est indépendant : les biens, les contacts et même l'horloge d'un espace n'apparaissent dans aucun autre. Deux présentations peuvent tourner en même temps sans se gêner.",
  },
  {
    q: "Puis-je mettre mes propres biens dans la démonstration ?",
    r: "Oui, et c'est le meilleur test. La page Import / Export vous donne un classeur Excel pré-rempli : remplacez les lignes par votre stock, ré-importez, et les automatisations tournent sur vos références.",
  },
  {
    q: "Faut-il installer quelque chose ?",
    r: "Non. Keo s'ouvre dans un navigateur, sur ordinateur comme sur téléphone. Il n'y a rien à installer sur vos postes ni sur ceux de vos négociateurs.",
  },
  {
    q: "Combien ça coûte ?",
    r: "Le montant dépend de ce que vous branchez et du nombre de négociateurs. Regardez d'abord la démonstration : vous saurez ce que vous voulez, et nous vous dirons le prix en une phrase.",
  },
];

export default function PageDeVente() {
  return (
    <div className={`ag ${archivo.variable} ${serif.variable}`}>
      <header className="ag-entete">
        <div className="ag-contenu ag-entete__interieur">
          <div className="ag-marque">
            Keo<span>par AgenIA</span>
          </div>
          <nav className="ag-nav">
            <a href="#methode">La méthode</a>
            <a href="#plateforme">Ce que ça fait</a>
            <a href="#sansfiltre">Sans filtre</a>
            <a href="#questions">Questions</a>
          </nav>
          <div className="ag-entete__fin">
            <Link className="ag-btn ag-btn--primaire" href="/">
              Voir la démonstration
            </Link>
          </div>
        </div>
      </header>

      <section className="ag-hero">
        <div className="ag-contenu ag-hero__grille">
          <div>
            <span className="ag-pastille">
              <span className="ag-pastille__point" />
              Démonstration ouverte
            </span>
            <h1 className="ag-hero__titre">
              Vos leads ne sont pas perdus.
              <br />
              <span className="ag-emphase">Ils sont arrivés trop tard.</span>
            </h1>
            <p className="ag-hero__lead">
              Une demande de portail rappelée trois heures plus tard a déjà appelé l&apos;agence
              suivante. Un rappel de visite oublié devient un créneau vide. Un mandat qui expire
              dans trente jours ne se signale nulle part.
            </p>
            <p className="ag-hero__lead">
              Aucun de ces oublis n&apos;apparaît sur un tableau de bord : ils se confondent avec le
              marché, la saison, ou <strong>« la semaine a été chargée »</strong>. C&apos;est
              exactement là que Keo travaille.
            </p>
            <div className="ag-hero__actions">
              <Link className="ag-btn ag-btn--primaire ag-btn--grand" href="/">
                Voir la démonstration
              </Link>
              <a className="ag-btn ag-btn--fantome ag-btn--grand" href={WHATSAPP} target="_blank" rel="noopener">
                Poser une question
              </a>
            </div>
            <p className="ag-hero__note">
              Sans compte · sans adresse email · données entièrement fictives
            </p>
          </div>

          <div className="ag-apercus">
            <div className="ag-apercu">
              <p className="ag-apercu__tete">
                Première réponse<span className="ag-apercu__note">au lead</span>
              </p>
              <p className="ag-apercu__valeur ag-ton-vert">&lt; 1 min</p>
              <p className="ag-apercu__legende">8 emails triés, 5 leads qualifiés, 5 réponses parties.</p>
            </div>
            <div className="ag-apercu">
              <p className="ag-apercu__tete">
                Mandat à terme<span className="ag-apercu__note">alerte</span>
              </p>
              <p className="ag-apercu__valeur ag-ton-ambre">J-30</p>
              <p className="ag-apercu__legende">Le propriétaire est relancé avant de regarder ailleurs.</p>
            </div>
            <div className="ag-apercu">
              <p className="ag-apercu__tete">
                Quittance de loyer<span className="ag-apercu__note">échéance</span>
              </p>
              <p className="ag-apercu__valeur">PDF</p>
              <p className="ag-apercu__legende">Éditée au jour dit, prête à envoyer.</p>
            </div>
            <div className="ag-apercu">
              <p className="ag-apercu__tete">
                Rappel de visite<span className="ag-apercu__note">avant</span>
              </p>
              <p className="ag-apercu__valeur">J-1 · H-2</p>
              <p className="ag-apercu__legende">Deux envois par visite, sans que personne y pense.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="ag-bande">
        <div className="ag-contenu">
          <p className="ag-bande__label">Onze automatisations, livrées ensemble</p>
          <ul className="ag-bande__liste">
            {TOURNE.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <section className="ag-section">
        <div className="ag-contenu">
          <ul className="ag-stats">
            <li>
              <strong>11</strong>
              <b>automatisations</b>
              <span>De la prise de rendez-vous en ligne au parrainage. Toutes visibles dans la démonstration.</span>
            </li>
            <li>
              <strong>0</strong>
              <b>ressaisie</b>
              <span>L&apos;email du portail devient un lead, une fiche contact et une réponse horodatée sans qu&apos;une ligne soit retapée.</span>
            </li>
            <li>
              <strong>24/7</strong>
              <b>de réponse</b>
              <span>Une demande reçue un dimanche à 22 h 40 reçoit son accusé de réception à 22 h 40.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="ag-section ag-section--alt" id="methode">
        <div className="ag-contenu">
          <div className="ag-tete--centre">
            <span className="ag-surtitre">La méthode</span>
            <h2 className="ag-titre">Les trois oublis qui ne se voient jamais</h2>
            <p className="ag-sous">
              Aucun des trois n&apos;apparaît dans un chiffre d&apos;affaires ni dans un tableau de
              bord. Ils ressemblent au marché, et c&apos;est pour ça que personne ne les corrige.
            </p>
          </div>
          <div className="ag-fuites">
            {OUBLIS.map((o) => (
              <article className="ag-fuite" key={o.num}>
                <p className="ag-fuite__num">{o.num}</p>
                <div>
                  <h3>{o.titre}</h3>
                  <p className="ag-fuite__probleme">{o.probleme}</p>
                  <p className="ag-fuite__reponse">{o.reponse}</p>
                </div>
                <div className="ag-fuite__chiffre">
                  <span>{o.label}</span>
                  <strong>{o.chiffre}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ag-section">
        <div className="ag-contenu">
          <div className="ag-tete--centre">
            <span className="ag-surtitre">En pratique</span>
            <h2 className="ag-titre">Ce qui change dans la semaine</h2>
            <p className="ag-sous">
              Le reste ne change pas : vos biens, vos méthodes, vos négociateurs. Ce sont les tâches
              que personne n&apos;a le temps de faire qui cessent d&apos;attendre quelqu&apos;un.
            </p>
          </div>
          <ul className="ag-etapes">
            {ETAPES.map((e) => (
              <li className="ag-etape" key={e.num}>
                <span className="ag-etape__num">{e.num}</span>
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ag-section ag-section--alt" id="plateforme">
        <div className="ag-contenu">
          <div className="ag-tete--centre">
            <span className="ag-surtitre">La plateforme</span>
            <h2 className="ag-titre">Ce que Keo fait, pendant que vous faites votre métier</h2>
            <p className="ag-sous">
              De la demande reçue à l&apos;avis Google obtenu, dans un seul endroit.
            </p>
          </div>
          <div className="ag-cartes">
            {CARTES.map((c) => (
              <article className="ag-carte" key={c.titre}>
                <h3>{c.titre}</h3>
                <p>{c.texte}</p>
                <div className="ag-carte__apercu">
                  <span>{c.label}</span>
                  <strong>{c.valeur}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ag-section" id="sansfiltre">
        <div className="ag-contenu">
          <div className="ag-tete--centre">
            <span className="ag-surtitre">Sans filtre</span>
            <h2 className="ag-titre">Ce qui tourne, et ce qui se branche</h2>
            <p className="ag-sous">
              La démonstration montre le produit entier, mais elle simule les envois. Voici
              honnêtement ce que vous pouvez voir aujourd&apos;hui, ce qui se connecte chez vous à
              l&apos;installation, et ce qui attend vos retours.
            </p>
          </div>
          <div className="ag-jalons">
            {JALONS.map((j) => (
              <article className="ag-jalon" key={j.etat}>
                <span className={`ag-jalon__etat ag-jalon__etat--${j.ton}`}>{j.etat}</span>
                <p className="ag-jalon__intro">{j.intro}</p>
                <ul className="ag-liste">
                  {j.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ag-section ag-section--alt">
        <div className="ag-contenu ag-origine">
          <span className="ag-surtitre">Pourquoi Keo</span>
          <blockquote className="ag-citation">
            « Une agence ne perd pas ses mandats sur le marché. Elle les perd entre deux tâches que
            personne n&apos;a eu le temps de faire. »
          </blockquote>
          <p>
            Un négociateur connaît son métier mieux que n&apos;importe quel logiciel. Ce qui lui
            manque, ce n&apos;est pas un conseil : c&apos;est le quart d&apos;heure qu&apos;il
            faudrait pour rappeler avant midi, relancer le propriétaire avant l&apos;échéance et
            demander l&apos;avis avant que le client ait oublié.
          </p>
          <p>
            Keo est né de ce constat. Les automatisations ne remplacent personne — elles occupent
            les moments où personne n&apos;est disponible : un dimanche soir, la veille d&apos;une
            visite, le jour d&apos;échéance d&apos;un loyer.
          </p>
          <p>
            C&apos;est pour ça que le moteur est protégé par une clé d&apos;exécution unique à
            chaque action : rejouer une date ne réexpédie rien. Un rappel envoyé deux fois abîme
            plus la relation qu&apos;un rappel oublié, et cette erreur-là ne se verrait pas de
            l&apos;intérieur.
          </p>
          <p className="ag-signature">L&apos;équipe Keo — édité par AgenIA, en France.</p>
        </div>
      </section>

      <section className="ag-section">
        <div className="ag-contenu">
          <div className="ag-tete--centre">
            <span className="ag-surtitre">Ce que vous pouvez vérifier</span>
            <h2 className="ag-titre">Nous ne vous montrerons pas d&apos;avis clients</h2>
            <p className="ag-sous">
              Le produit est jeune, et des témoignages que vous ne pouvez pas vérifier ne valent pas
              grand-chose. Voici six choses que vous pouvez contrôler vous-même, maintenant, sans
              nous croire sur parole.
            </p>
          </div>
          <div className="ag-grille-3">
            {ENGAGEMENTS.map((e) => (
              <div key={e.titre}>
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
                {e.lien ? (
                  e.lien.href.startsWith("/") ? (
                    <Link className="ag-lien" href={e.lien.href}>
                      {e.lien.texte} →
                    </Link>
                  ) : (
                    <a className="ag-lien" href={e.lien.href}>
                      {e.lien.texte} →
                    </a>
                  )
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ag-section ag-section--alt" id="questions">
        <div className="ag-contenu ag-faq">
          <span className="ag-surtitre">Questions fréquentes</span>
          <h2 className="ag-titre">Ce qu&apos;on nous demande avant la démonstration</h2>
          <div className="ag-faq__liste">
            {QUESTIONS.map((q) => (
              <details className="ag-faq__item" key={q.q}>
                <summary>{q.q}</summary>
                <p>{q.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="ag-appel">
        <div className="ag-contenu">
          <div className="ag-appel__interieur">
            <div>
              <span className="ag-surtitre">Démonstration ouverte</span>
              <h2>Voyez-le tourner avant qu&apos;on en parle.</h2>
              <p>
                Ouvrez la boîte de réception, triez les huit emails, avancez la date d&apos;une
                semaine. En deux minutes vous saurez si ça vous sert.
              </p>
              <ul className="ag-appel__points">
                <li>Sans compte ni adresse email</li>
                <li>Données entièrement fictives, aucun envoi réel</li>
                <li>Vos propres biens importables en un classeur Excel</li>
              </ul>
            </div>
            <div className="ag-appel__actions">
              <Link className="ag-btn ag-btn--primaire ag-btn--grand" href="/">
                Entrer dans la démonstration
              </Link>
              <a className="ag-btn ag-btn--fantome ag-btn--grand" href={WHATSAPP} target="_blank" rel="noopener">
                Nous écrire sur WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="ag-pied">
        <div className="ag-contenu">
          <div className="ag-pied__grille">
            <div>
              <h4>Le produit</h4>
              <ul>
                <li><a href="#plateforme">Ce que ça fait</a></li>
                <li><a href="#methode">La méthode</a></li>
                <li><a href="#sansfiltre">Sans filtre</a></li>
                <li><a href="#questions">Questions</a></li>
                <li><Link href="/">Démonstration</Link></li>
              </ul>
            </div>
            <div>
              <h4>La maison</h4>
              <ul>
                <li><a href="https://www.agenia.pro" target="_blank" rel="noopener">AgenIA</a></li>
                <li><a href={MAIL}>contact@agenia.pro</a></li>
                <li><a href="tel:+33651748133">+33 6 51 74 81 33</a></li>
                <li><a href={WHATSAPP} target="_blank" rel="noopener">WhatsApp</a></li>
              </ul>
            </div>
            <div>
              <h4>Keo</h4>
              <p className="ag-pied__mention">
                Automatisations métier pour agences immobilières indépendantes : tri des demandes de
                portails, réponse instantanée, rendez-vous et rappels de visite, quittances de
                loyer, échéances de mandat et de diagnostic.
              </p>
              <p className="ag-pied__mention">
                La démonstration en ligne ne contient aucune donnée personnelle réelle et
                n&apos;émet aucun envoi vers un destinataire réel.
              </p>
            </div>
          </div>
          <p className="ag-pied__bas">© {new Date().getFullYear()} AgenIA — Keo.</p>
        </div>
      </footer>
    </div>
  );
}
