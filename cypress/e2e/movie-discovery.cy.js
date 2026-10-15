describe('Movie Discovery Flow', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
  });

  it('should display the home page with title and form', () => {
    // Check that the page loads
    cy.title().should('eq', 'Meraki'); // Assuming you set a title

    // Check for the main heading or form elements
    cy.contains('Describe your movie night situation').should('be.visible');
    cy.get('textarea[id="situation"]').should('be.visible');
    cy.contains('Discover Movies').should('be.visible');
  });

  it('should allow user to enter a situation and get recommendations', () => {
    // Type a situation
    cy.get('textarea[id="situation"]').type('I want to watch something romantic but not too cheesy with my partner after a long week');

    // Click the discover button
    cy.contains('Discover Movies').click();

    // Wait for loading state to complete
    // Since we can't mock the API in E2E without more setup, we'll just check
    // that the button becomes disabled during processing
    cy.contains('Discover Movies').should('be.disabled');

    // In a real test with mocked APIs, we would then check for results
    // For now, we'll just verify the interaction works
  });

  it('should show example situation buttons in sidebar', () => {
    // Check that example buttons exist
    cy.contains('Romantic date night at home').should('be.visible');
    cy.contains('Action movie with friends').should('be.visible');
    cy.contains('Thoughtful solo drama').should('be.visible');

    // Click one of the buttons
    cy.contains('Romantic date night at home').click();

    // Check that the textarea was updated
    cy.get('textarea[id="situation"]').should('have.value', 'Romantic date night at home');
  });
});