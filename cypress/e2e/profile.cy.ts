describe('Profile', () => {
  it('shows profile and recently viewed', () => {
    cy.login();
    cy.visit('/profile');
    cy.contains('Admin User').should('exist');
    cy.contains('View Listing 1').should('exist');
  });
});
