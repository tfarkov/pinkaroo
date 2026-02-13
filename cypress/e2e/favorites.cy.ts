describe('Favorites', () => {
  it('adds and views favorite', () => {
    cy.login();
    cy.visit('/listings/1');
    cy.contains('Favorite ❤️').click();
    cy.visit('/favorites');
    cy.contains('Sample Property').should('exist');
  });
});
