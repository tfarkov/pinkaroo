describe('Home', () => {
  it('shows map', () => {
    cy.visit('/');
    cy.get('#home-title').should('contain', 'Welcome to Pinkaroo Real Estate Portal');
    cy.get('div[role="region"][aria-label="Map of nearby listings"]').should('exist');
  });
});
