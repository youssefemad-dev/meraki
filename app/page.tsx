'use client';

import { useCallback, useState } from 'react';
import LoadingState from '@/components/ui/LoadingState';
import RecommendationCard from '@/components/ui/RecommendationCard';
import type { InterpretedPreferencesType } from '@/lib/schemas/preferences';
import type { RecommendationScore } from '@/lib/recommendations/score';

const examples = [
  'I miss how close my sister and I used to be.',
  'I need a little hope after a long, uncertain week.',
  'A romance that feels honest, not overly perfect.'
];

export default function Home() {
  const [situation, setSituation] = useState('');
  const [interpretedPreferences, setInterpretedPreferences] = useState<InterpretedPreferencesType | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([]);
  const [loadingState, setLoadingState] = useState<'idle' | 'interpreting' | 'matching' | 'explaining' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isLoading = loadingState === 'interpreting' || loadingState === 'matching' || loadingState === 'explaining';
  const hasResults = loadingState === 'success' && recommendations.length > 0;

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!situation.trim() || isLoading) return;

    setLoadingState('interpreting');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation })
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        setLoadingState('error');
        setErrorMessage(typeof data.error === 'string' ? data.error : 'We couldn’t find your film. Please try again.');
        return;
      }

      setInterpretedPreferences(data.preferences);
      setRecommendations(data.recommendations);
      setLoadingState('success');
      window.setTimeout(() => document.getElementById('recommendations')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (error) {
      console.error('Discovery failed:', error);
      setLoadingState('error');
      setErrorMessage('Something interrupted the search. Please try again.');
    }
  }, [isLoading, situation]);

  const handleReset = useCallback(() => {
    setSituation('');
    setInterpretedPreferences(null);
    setRecommendations([]);
    setLoadingState('idle');
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Meraki home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span className="brand-copy"><strong>meraki</strong><small>FILMS FOR THE FEELING</small></span>
        </a>
        <a className="topbar-link" href="#how-it-works">A different kind of movie finder <span aria-hidden="true">↗</span></a>
      </header>

      <main id="main-content" className="main-content">
        <section id="top" className={`hero ${hasResults ? 'hero--compact' : ''}`} aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT FILM STARTS WITH A FEELING</p>
            <h1 id="hero-title">Some stories just <em>get you.</em></h1>
            <p className="hero-description">Tell us what’s on your mind. We’ll find a film with a story that feels close to yours.</p>

            <form className="story-form" onSubmit={handleSubmit}>
              <label htmlFor="situation">What’s your story tonight?</label>
              <div className="input-frame">
                <textarea
                  id="situation"
                  rows={3}
                  placeholder="The thing you can’t quite put into words…"
                  value={situation}
                  onChange={event => setSituation(event.target.value)}
                  disabled={isLoading}
                  required
                />
                <div className="input-bottomline">
                  <span><span className="sparkle" aria-hidden="true">✳</span> No genres to choose. Just say what you mean.</span>
                  <span>{situation.length ? `${situation.length} characters` : 'A sentence is plenty'}</span>
                </div>
              </div>

              {errorMessage && <p role="alert" className="error-message">{errorMessage}</p>}

              <div className="form-actions">
                <button className="discover-button" type="submit" disabled={isLoading || !situation.trim()}>
                  {isLoading ? 'Finding your film' : 'Find my film'}
                  <span aria-hidden="true">{isLoading ? '···' : '↗'}</span>
                </button>
                {hasResults && <button className="start-over-button" type="button" onClick={handleReset}>Start a new story</button>}
                {loadingState === 'error' && <button className="start-over-button" type="button" onClick={() => setLoadingState('idle')}>Try again</button>}
              </div>

              {isLoading && <div className="loading-note"><LoadingState state={loadingState} /></div>}
            </form>

            {!hasResults && loadingState !== 'error' && (
              <div className="example-prompts" aria-label="Example situations">
                <span className="example-label">NEED A STARTING POINT?</span>
                <div className="example-list">
                  {examples.map(example => (
                    <button type="button" key={example} onClick={() => setSituation(example)}>{example}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!hasResults && (
            <div className="hero-art" aria-hidden="true">
              <div className="art-orbit art-orbit--one" />
              <div className="art-orbit art-orbit--two" />
              <div className="art-sun" />
              <div className="art-horizon" />
              <div className="art-landscape art-landscape--back" />
              <div className="art-landscape art-landscape--front" />
              <div className="art-filmstrip art-filmstrip--left" />
              <div className="art-filmstrip art-filmstrip--right" />
              <div className="art-caption"><span>TONIGHT’S FEATURE</span><strong>A story<br />that feels like yours.</strong><i>01 — ∞</i></div>
              <div className="art-stamp">TAKE<br />A FEELING<br />WITH YOU</div>
            </div>
          )}
        </section>

        {interpretedPreferences && (
          <section id="recommendations" className="results-section" aria-labelledby="results-heading">
            <div className="results-intro">
              <div>
                <p className="eyebrow"><span className="eyebrow-dot" /> A STORY THAT MEETS YOU THERE</p>
                <h2 id="results-heading">Your feeling, <em>in film.</em></h2>
              </div>
              <p className="results-count">{recommendations.length} {recommendations.length === 1 ? 'film' : 'films'} picked for your story</p>
            </div>

            <div className="interpretation-card">
              <span className="interpretation-mark" aria-hidden="true">“</span>
              <div>
                <p>{interpretedPreferences.situationSummary || 'We found the story threads that matter to you.'}</p>
                {Boolean(interpretedPreferences.themes?.length) && (
                  <div className="theme-list" aria-label="Story themes">
                    {interpretedPreferences.themes.map(theme => <span className="theme-chip" key={theme}>{theme}</span>)}
                  </div>
                )}
              </div>
            </div>

            {hasResults ? (
              <div className="recommendation-list">
                {recommendations.map((recommendation, index) => (
                  <RecommendationCard key={recommendation.movie.id} recommendation={recommendation} rank={index + 1} />
                ))}
              </div>
            ) : loadingState === 'success' ? (
              <div className="empty-state">No close story matches turned up this time. Try describing another part of what you’re looking for.</div>
            ) : null}

            <p className="results-footnote">A thoughtful match is more than a shared genre. These picks are based on the stories themselves.</p>
          </section>
        )}

        {!hasResults && (
          <section id="how-it-works" className="how-section">
            <div className="how-heading">
              <p className="eyebrow">A LITTLE MORE HUMAN</p>
              <h2>Not another mood picker.</h2>
              <p>Because “romance” doesn’t tell the whole story.</p>
            </div>
            <div className="how-steps">
              <article><span>01</span><h3>Tell us what’s real</h3><p>Write a thought, a moment, or the kind of story you need.</p></article>
              <article><span>02</span><h3>We find the thread</h3><p>We look for films with characters and stories that echo yours.</p></article>
              <article><span>03</span><h3>Meet your next film</h3><p>Get a short list with a reason each one might stay with you.</p></article>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <a className="footer-brand" href="#top">meraki<span> · Films for the feeling</span></a>
        <span>Made for the stories we carry.</span>
      </footer>
    </div>
  );
}
