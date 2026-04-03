/** Smoke: saved searches panel on home (buyer growth feature). */
describe('Saved searches', () => {
  it('shows saved searches section and sign-in prompt for guests', () => {
    cy.visit('/');
    cy.contains('Saved searches').should('be.visible');
    cy.contains('Sign in to save searches and get in-app alerts').should('be.visible');
  });
});
