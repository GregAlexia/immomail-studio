import Link from "next/link";
import { Archivo, Source_Serif_4 } from "next/font/google";
import {
  detailDeLOffre,
  formaterDate,
  formaterPrix,
  nomDeLOffre,
  offresPubliees,
  pointsDeLOffre,
  prixAffiche,
  reductionActive,
  type Offre,
} from "@/lib/db/offres";
import { actionDemanderRappel } from "./actions";
import type { ContenuVente } from "./contenu";
import "./vente.css";

/* Les deux polices de la charte éditoriale Agenia (`charte-agenia.css`,
   margeresto-ia/webapp) : Archivo pour les titres, Source Serif pour le texte
   courant et les italiques d'emphase — la même charte que margeo.vercel.app
   et prospeo.agenia.pro affichent réellement. Déclarées ici et non dans le
   layout racine : elles n'habillent que cette page, l'application garde
   Geist. */
const archivo = Archivo({ subsets: ["latin"], variable: "--ag-police-titre", display: "swap" });
const serif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--ag-police-corps",
  display: "swap",
});

/**
 * Les offres, ou rien.
 *
 * Une page de vente ne doit pas renvoyer une erreur parce que Postgres a
 * hoqueté : sans tarifs, elle reste entièrement lisible et renvoie vers un
 * échange. C'est exactement ce qu'elle faisait avant qu'ils existent.
 */
async function offresOuRien(): Promise<Offre[]> {
  try {
    return await offresPubliees();
  } catch {
    return [];
  }
}

/**
 * Le rendu, commun aux deux langues.
 *
 * Tout le texte vient de `contenu` : dupliquer ce composant par langue le
 * ferait diverger dès la première retouche, et une section corrigée d'un côté
 * seulement est pire que pas de version anglaise du tout.
 */
export async function Vente({
  contenu: c,
  envoye,
  erreur,
}: {
  contenu: ContenuVente;
  envoye?: string;
  erreur?: string;
}) {
  const offres = await offresOuRien();
  // Le bandeau annonce la plus forte réduction en cours, pas la première venue.
  const promotion = offres
    .filter(reductionActive)
    .sort((a, b) => b.reductionPct - a.reductionPct)[0];
  const retourRappel = envoye
    ? c.rappel.messages.envoye
    : erreur === "nom" || erreur === "email"
      ? c.rappel.messages[erreur]
      : null;

  return (
    /* `lang` sur le conteneur et non sur `<html>` : le layout racine sert toute
       l'application en français, et une page ne peut pas le changer. L'attribut
       vaut pour tout son sous-arbre — c'est ce que lisent les synthèses vocales
       et les moteurs. */
    <div className={`ag ${archivo.variable} ${serif.variable}`} lang={c.langue}>
      {promotion && (
        <div className="ag-promo">
          <p>
            <strong>{c.tarifs.banniereEtiquette}</strong> —{" "}
            {c.tarifs.banniere(
              promotion.reductionPct,
              nomDeLOffre(promotion, c.langue),
              promotion.finOffre ? formaterDate(promotion.finOffre, c.locale) : null
            )}
          </p>
        </div>
      )}

      <header className="ag-entete ag-sombre">
        <div className="ag-contenu ag-entete__interieur">
          <div className="ag-marque">
            Keo<span>{c.edite}</span>
          </div>
          <nav className="ag-nav">
            <a href="#methode">{c.nav.methode}</a>
            <a href="#plateforme">{c.nav.plateforme}</a>
            <a href="#sansfiltre">{c.nav.sansFiltre}</a>
            {offres.length > 0 && <a href="#tarifs">{c.nav.tarifs}</a>}
            <a href="#questions">{c.nav.questions}</a>
          </nav>
          <div className="ag-entete__fin">
            {/* Bascule de langue, jamais de redirection automatique : le
                visiteur choisit, et son choix tient. */}
            <Link className="ag-langue" href={c.bascule.href} hrefLang={c.bascule.href === "/presentation" ? "fr" : "en"} title={c.bascule.titre}>
              {c.bascule.libelle}
            </Link>
            <Link className="ag-btn ag-btn--primaire" href="/">
              {c.nav.demo}
            </Link>
          </div>
        </div>
      </header>

      {/* Accroche : reprise de la maquette d'écran de prospeo.agenia.pro —
          mêmes classes `ag-hp__*`, même bandeau sombre. Le mot qui tourne est
          en CSS pur (`ag-hp__defile`, @keyframes dans vente.css) : un lecteur
          d'écran ne lit que le premier, via `ag-sr`, le défilement animé lui
          étant caché. Aucune valeur de l'écran d'exemple n'est attribuée à un
          client — la légende le précise. */}
      <section className="ag-sombre ag-hp">
        <div className="ag-contenu ag-hp__grille">
          <div>
            <span className="ag-hp__pastille">{c.hero.pastille}</span>
            <h1 className="ag-hp__titre">
              <span className="ag-hp__titre-doux">{c.hero.titreAvant} </span>
              <span className="ag-hp__mot">
                <span className="ag-sr">{c.hero.mots[0]}</span>
                <span className="ag-hp__defile" aria-hidden>
                  {[...c.hero.mots, c.hero.mots[0]].map((m, i) => (
                    <span key={`${m}-${i}`}>{m}</span>
                  ))}
                </span>
              </span>
            </h1>
            <p className="ag-hp__sous">
              <strong>{c.hero.sousTitreFort}</strong>
              {c.hero.sousTitre}
            </p>
            <div className="ag-hp__actions">
              <Link className="ag-btn ag-btn--primaire ag-btn--grand" href="/">
                {c.hero.ctaDemo}
              </Link>
              <a className="ag-btn ag-btn--fantome ag-btn--grand" href={c.whatsapp} target="_blank" rel="noopener">
                {c.hero.ctaQuestion}
              </a>
            </div>
            <ul className="ag-hero__rassurance ag-hp__rassurance">
              {c.hero.rassurance.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>

          {/* L'écran d'exemple : des figures, pas des images. */}
          <figure className="ag-hp__ecran">
            <div className="ag-hp__rangee">
              <div className="ag-hp__carte">
                <div className="ag-hp__tete">
                  <span className="ag-hp__icone" aria-hidden>✉</span>
                  <span className="ag-hp__puce">{c.hero.ecran.carte1.puce}</span>
                </div>
                <p className={`ag-hp__valeur ag-hp__valeur--${c.hero.ecran.carte1.ton}`}>{c.hero.ecran.carte1.valeur}</p>
                <p className="ag-hp__etiquette">{c.hero.ecran.carte1.etiquette}</p>
                <p className="ag-hp__detail">{c.hero.ecran.carte1.detail}</p>
              </div>
              <div className="ag-hp__carte">
                <div className="ag-hp__tete">
                  <span className="ag-hp__icone" aria-hidden>⏰</span>
                  <span className="ag-hp__puce">{c.hero.ecran.carte2.puce}</span>
                </div>
                <p className={`ag-hp__valeur ag-hp__valeur--${c.hero.ecran.carte2.ton}`}>{c.hero.ecran.carte2.valeur}</p>
                <p className="ag-hp__etiquette">{c.hero.ecran.carte2.etiquette}</p>
                <p className="ag-hp__detail">{c.hero.ecran.carte2.detail}</p>
              </div>
            </div>
            <div className="ag-hp__liaison" aria-hidden />
            <div className="ag-hp__carte ag-hp__carte--large">
              <div className="ag-hp__tete">
                <span className="ag-hp__titre-carte">
                  <span className="ag-hp__icone" aria-hidden>↗</span>
                  {c.hero.ecran.file.titre}
                </span>
                <span className="ag-hp__puce">{c.hero.ecran.file.puce}</span>
              </div>
              <ul className="ag-hp__plats">
                {c.hero.ecran.file.lignes.map((l) => (
                  <li key={l.nom}>
                    <span>
                      <span className={`ag-hp__point ag-hp__point--${l.ton}`} aria-hidden />
                      {l.nom}
                    </span>
                    <strong>{l.valeur}</strong>
                  </li>
                ))}
              </ul>
              <p className="ag-hp__pied">
                <span>{c.hero.ecran.file.piedEtiquette}</span>
                <strong>{c.hero.ecran.file.piedValeur}</strong>
              </p>
            </div>
            <figcaption className="ag-hp__legende">{c.hero.ecran.legende}</figcaption>
          </figure>
        </div>
      </section>

      <div className="ag-bande">
        <div className="ag-contenu">
          <p className="ag-bande__label">{c.bande.label}</p>
          <ul className="ag-bande__liste">
            {c.bande.items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>

      <section className="ag-section">
        <div className="ag-contenu">
          <ul className="ag-stats">
            {c.stats.map((s) => (
              <li key={s.libelle}>
                <strong>{s.valeur}</strong>
                <b>{s.libelle}</b>
                <span>{s.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ag-section ag-section--alt" id="methode">
        <div className="ag-contenu">
          <TeteCentre {...c.methode} />
          <div className="ag-fuites">
            {c.methode.oublis.map((o) => (
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
          <TeteCentre {...c.pratique} />
          <ul className="ag-etapes">
            {c.pratique.etapes.map((e) => (
              <li className="ag-etape" key={e.num}>
                <span className="ag-etape__num">{e.num}</span>
                <h3>{e.titre}</h3>
                <p>{e.texte}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ag-section">
        <div className="ag-contenu">
          <TeteCentre surtitre={c.avantApres.surtitre} titre={c.avantApres.titre} sous={c.avantApres.sous} />
          <table className="ag-avant-apres">
            <thead>
              <tr>
                <th scope="col">{c.avantApres.colonneSujet}</th>
                <th scope="col">{c.avantApres.colonneAvant}</th>
                <th scope="col">{c.avantApres.colonneApres}</th>
              </tr>
            </thead>
            <tbody>
              {c.avantApres.lignes.map((l) => (
                <tr key={l.sujet}>
                  <th scope="row">{l.sujet}</th>
                  <td data-colonne={c.avantApres.colonneAvant}>{l.avant}</td>
                  <td data-colonne={c.avantApres.colonneApres}>{l.apres}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ag-section ag-section--alt" id="plateforme">
        <div className="ag-contenu">
          <TeteCentre {...c.plateforme} />
          <div className="ag-cartes">
            {c.plateforme.cartes.map((carte) => (
              <article className="ag-carte" key={carte.titre}>
                <h3>{carte.titre}</h3>
                <p>{carte.texte}</p>
                <div className="ag-carte__apercu">
                  <span>{carte.label}</span>
                  <strong>{carte.valeur}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ag-section" id="sansfiltre">
        <div className="ag-contenu">
          <TeteCentre {...c.sansFiltre} />
          <div className="ag-jalons">
            {c.sansFiltre.jalons.map((j) => (
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
          <span className="ag-surtitre">{c.origine.surtitre}</span>
          <blockquote className="ag-citation">{c.origine.citation}</blockquote>
          {c.origine.paragraphes.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
          <p className="ag-signature">{c.origine.signature}</p>
        </div>
      </section>

      <section className="ag-section">
        <div className="ag-contenu">
          <TeteCentre {...c.verifier} />
          <div className="ag-grille-3">
            {c.verifier.engagements.map((e) => (
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

      {offres.length > 0 && (
        <section className="ag-section ag-section--alt" id="tarifs">
          <div className="ag-contenu">
            <TeteCentre {...c.tarifs} />
            <div className="ag-offres">
              {offres.map((offre) => (
                <CarteOffre key={offre.id} offre={offre} contenu={c} />
              ))}
            </div>
            <p className="ag-mention">{c.tarifs.mention}</p>
          </div>
        </section>
      )}

      <section className="ag-section" id="questions">
        <div className="ag-contenu ag-faq">
          <span className="ag-surtitre">{c.questions.surtitre}</span>
          <h2 className="ag-titre">{c.questions.titre}</h2>
          <div className="ag-faq__liste">
            {c.questions.items.map((q) => (
              <details className="ag-faq__item" key={q.q}>
                <summary>{q.q}</summary>
                <p>{q.r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="ag-section ag-section--alt" id="rappel">
        <div className="ag-contenu ag-etroit">
          <span className="ag-surtitre">{c.rappel.surtitre}</span>
          <h2 className="ag-titre">{c.rappel.titre}</h2>
          <p className="ag-sous">{c.rappel.sous}</p>

          {retourRappel && (
            <p className={envoye ? "ag-retour ag-retour--ok" : "ag-retour ag-retour--erreur"}>
              {retourRappel}
            </p>
          )}

          <form action={actionDemanderRappel} className="ag-form">
            {/* Dit à l'action sur quelle page revenir. La valeur est reconnue
                dans une liste fermée avant d'être réutilisée (`cheminDeRetour`) :
                une redirection bâtie sur une entrée libre est une redirection
                ouverte. */}
            <input type="hidden" name="retour" value={c.chemin} />
            <label>
              <span>{c.rappel.champs.nom}</span>
              <input name="nom" required maxLength={80} autoComplete="name" />
            </label>
            <label>
              <span>{c.rappel.champs.agence}</span>
              <input name="agence" maxLength={120} autoComplete="organization" />
            </label>
            <label>
              <span>{c.rappel.champs.email}</span>
              <input name="email" type="email" required maxLength={180} autoComplete="email" />
            </label>
            <label>
              <span>{c.rappel.champs.telephone}</span>
              <input name="telephone" maxLength={40} autoComplete="tel" />
            </label>

            {/* Piège à robots : caché à l'écran, laissé vide par un visiteur. */}
            <p className="ag-form__piege" aria-hidden="true">
              <label>
                <span>{c.rappel.champs.piege}</span>
                <input name="site" tabIndex={-1} autoComplete="off" />
              </label>
            </p>

            <button className="ag-btn ag-btn--primaire ag-btn--grand" type="submit">
              {c.rappel.bouton}
            </button>
          </form>

          <p className="ag-mention ag-mention--gauche">
            {c.rappel.mention[0]}
            <a href={c.mail} className="ag-lien">
              contact@agenia.pro
            </a>
            {c.rappel.mention[1]}
          </p>
        </div>
      </section>

      <section className="ag-appel">
        <div className="ag-contenu">
          <div className="ag-appel__interieur">
            <div>
              <span className="ag-surtitre">{c.appel.surtitre}</span>
              <h2>{c.appel.titre}</h2>
              <p>{c.appel.texte}</p>
              <ul className="ag-appel__points">
                {c.appel.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="ag-appel__actions">
              <Link className="ag-btn ag-btn--primaire ag-btn--grand" href="/">
                {c.appel.ctaDemo}
              </Link>
              <a
                className="ag-btn ag-btn--fantome ag-btn--grand"
                href={c.whatsapp}
                target="_blank"
                rel="noopener"
              >
                {c.appel.ctaWhatsapp}
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="ag-pied">
        <div className="ag-contenu">
          <div className="ag-pied__grille">
            <div>
              <h4>{c.pied.produit}</h4>
              <ul>
                <li><a href="#plateforme">{c.pied.liens.plateforme}</a></li>
                <li><a href="#methode">{c.pied.liens.methode}</a></li>
                <li><a href="#sansfiltre">{c.pied.liens.sansFiltre}</a></li>
                {offres.length > 0 && <li><a href="#tarifs">{c.pied.liens.tarifs}</a></li>}
                <li><a href="#questions">{c.pied.liens.questions}</a></li>
                <li><a href="#rappel">{c.pied.liens.rappel}</a></li>
                <li><Link href="/">{c.pied.liens.demo}</Link></li>
              </ul>
            </div>
            <div>
              <h4>{c.pied.maison}</h4>
              <ul>
                <li><a href="https://www.agenia.pro" target="_blank" rel="noopener">AgenIA</a></li>
                <li><a href={c.mail}>contact@agenia.pro</a></li>
                <li><a href="tel:+33651748133">+33 6 51 74 81 33</a></li>
                <li><a href={c.whatsapp} target="_blank" rel="noopener">WhatsApp</a></li>
                <li><Link href={c.bascule.href}>{c.bascule.libelle}</Link></li>
              </ul>
            </div>
            <div>
              <h4>{c.pied.aPropos}</h4>
              <p className="ag-pied__mention">{c.pied.mentions[0]}</p>
              <p className="ag-pied__mention">{c.pied.mentions[1]}</p>
            </div>
          </div>
          <p className="ag-pied__bas">© {new Date().getFullYear()} AgenIA — Keo.</p>
        </div>
      </footer>
    </div>
  );
}

function TeteCentre({ surtitre, titre, sous }: { surtitre: string; titre: string; sous: string }) {
  return (
    <div className="ag-tete--centre">
      <span className="ag-surtitre">{surtitre}</span>
      <h2 className="ag-titre">{titre}</h2>
      <p className="ag-sous">{sous}</p>
    </div>
  );
}

function CarteOffre({ offre, contenu: c }: { offre: Offre; contenu: ContenuVente }) {
  const prix = prixAffiche(offre);
  const points = pointsDeLOffre(offre, c.langue);
  const detail = detailDeLOffre(offre, c.langue);

  return (
    <article className={`ag-offre${offre.miseEnAvant ? " ag-offre--principale" : ""}`}>
      <div className="ag-offre__tete">
        <h3>{nomDeLOffre(offre, c.langue)}</h3>
        <p className="ag-offre__prix">
          {/* Le prix barré n'apparaît que pendant la réduction : hors offre, il
              n'y a rien à barrer et l'afficher serait un faux rabais. */}
          {prix.barreCentimes !== null && (
            <span className="ag-prix-barre">{formaterPrix(prix.barreCentimes, c.locale)}</span>
          )}
          {formaterPrix(prix.centimes, c.locale)}
        </p>
      </div>
      {detail && <p className="ag-offre__detail">{detail}</p>}
      {prix.reductionPct > 0 && (
        <p className="ag-offre__promo">
          {c.tarifs.reduction(
            prix.reductionPct,
            prix.finOffre ? formaterDate(prix.finOffre, c.locale) : null
          )}
        </p>
      )}
      {points.length > 0 && (
        <ul className="ag-liste">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
      <a className="ag-btn ag-btn--primaire" href="#rappel">
        {c.tarifs.cta}
      </a>
    </article>
  );
}
