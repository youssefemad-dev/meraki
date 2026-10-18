const matchedMovieResponse = {
  preferences: {
    situationSummary: 'You want a story about love complicated by friction with your mom.',
    genrePreferences: ['Drama'],
    storySignals: ['mother-daughter-conflict'],
    storyKeywords: ['mother daughter relationship'],
    storyReferences: ['Lady Bird'],
    mood: 'thoughtful',
    themes: ['family', 'independence'],
    pace: null,
    contentToAvoid: [],
    desiredExperience: 'reflection',
    intensity: null,
    constraints: { excludeAdultContent: true }
  },
  recommendations: [{
    movie: {
      id: 391713,
      title: 'Lady Bird',
      overview: 'A teenager navigates a complicated relationship with her mother.',
      genre_ids: [18],
      release_date: '2017-09-01',
      vote_average: 7.4,
      vote_count: 1000,
      popularity: 100,
      runtime: 94,
      adult: false,
      poster_path: null
    },
    score: 91,
    breakdown: { storyMatch: 0.91, genreMatch: 0, themeMatch: 0, ratingBoost: 0, recencyBoost: 0 },
    matchReasons: ['The mother-daughter bond is affectionate, combative, and shaped by a push for independence.']
  }]
};

describe('Movie discovery flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('shows the story-first discovery page', () => {
    cy.title().should('contain', 'Meraki');
    cy.contains('h1', 'Some stories just').should('be.visible');
    cy.get('textarea#situation').should('be.visible');
    cy.contains('button', 'Find my film').should('be.disabled');
  });

  it('submits a situation and shows the matched movie with its explanation', () => {
    cy.intercept('POST', '/api/discover', {
      statusCode: 200,
      body: matchedMovieResponse
    }).as('discover');

    cy.get('textarea#situation').type('My mom loves me but doesn’t like me.');
    cy.contains('button', 'Find my film').click();

    cy.wait('@discover').its('request.body').should('deep.equal', {
      situation: 'My mom loves me but doesn’t like me.'
    });
    cy.contains('h3', 'Lady Bird').should('be.visible');
    cy.contains('The mother-daughter bond is affectionate').should('be.visible');
  });

  it('fills the story input from a suggested starting point', () => {
    cy.contains('button', 'I miss how close my sister and I used to be.').click();
    cy.get('textarea#situation').should('have.value', 'I miss how close my sister and I used to be.');
  });

  it('shows the AI error returned by discovery without fake results', () => {
    cy.intercept('POST', '/api/discover', {
      statusCode: 503,
      body: { error: 'AI interpretation is temporarily unavailable. Please try again.' }
    }).as('discoverError');

    cy.get('textarea#situation').type('I need a story that understands me.');
    cy.contains('button', 'Find my film').click();

    cy.wait('@discoverError');
    cy.get('[role="alert"]').should('contain.text', 'AI interpretation is temporarily unavailable');
    cy.contains('h2', 'Your feeling').should('not.exist');
  });
});
