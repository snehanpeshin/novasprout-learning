export default function MasteryLearningApproach() {
  return <section className="ns-section ns-mastery" aria-labelledby="mastery-title">
    <div className="ns-section-heading"><p className="ns-eyebrow">The learning approach</p><h2 id="mastery-title">Understanding grows through practice and correction.</h2><p>Inspired by Benjamin Bloom’s mastery-learning research: find the gap, work on it, and check what the learner can do independently.</p></div>
    <ol className="ns-mastery-cycle">
      <li><strong>Find the starting point</strong><p>Begin with a small prerequisite question and an attempt.</p></li>
      <li><strong>Teach one useful idea</strong><p>Use a clear explanation, a worked example, and a targeted hint.</p></li>
      <li><strong>Repair and check</strong><p>Correct missed quiz answers. Fresh questions help distinguish understanding from remembering an answer.</p></li>
      <li><strong>Return and remember</strong><p>Save the lesson, revisit it tomorrow without notes, and bring persistent gaps to a human tutor.</p></li>
    </ol>
    <details><summary>How Bloom’s 2 Sigma Problem informs our design</summary><p>Bloom’s 1984 paper reported an average advantage of about two standard deviations for tutoring combined with formative checks and corrective work in the studies described. That historical result is not a measured NovaSprout outcome or a guarantee for every learner.</p><p>We use it as a design challenge. First-try answers, corrections, and later independent performance are different signals. NovaSprout has not demonstrated a two-sigma gain; that would require a controlled evaluation of unaided learning and retention.</p><p><a href="https://gwern.net/doc/psychology/1984-bloom.pdf" target="_blank" rel="noreferrer">Read Bloom’s original paper (1984)</a> · <a href="https://doi.org/10.1073/pnas.2422633122" target="_blank" rel="noreferrer">Read research on AI tutoring safeguards (2025)</a></p></details>
  </section>;
}
