export function GeneratorPreview() {
  return (
    <section className="section-block">
      <div className="section-title">
        <p className="eyebrow">Resultat genere</p>
        <h2>Une fiche exploitable tout de suite</h2>
        <p>
          Le moteur genere une synthese claire, des notions a memoriser, puis des
          outils de revision active pour accelerer l&apos;apprentissage.
        </p>
      </div>

      <div className="preview-grid">
        <article className="result-card">
          <h3>Resume principal</h3>
          <p>
            Une synthese courte qui remet le chapitre en perspective sans noyer
            l&apos;etudiant dans les details secondaires.
          </p>
        </article>

        <article className="result-card">
          <h3>Points cles</h3>
          <p>
            Les notions essentielles sont extraites pour rendre la revision rapide
            et plus facile a retenir.
          </p>
        </article>

        <article className="result-card">
          <h3>Flashcards</h3>
          <p>
            Des questions-reponses courtes pour memoriser activement les concepts
            importants.
          </p>
        </article>

        <article className="result-card">
          <h3>Quiz</h3>
          <p>
            Un mini test final permet de verifier la comprehension et d&apos;ancrer
            les notions avant l&apos;examen.
          </p>
        </article>
      </div>
    </section>
  );
}
