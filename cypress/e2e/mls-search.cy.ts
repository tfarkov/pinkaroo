describe('MLS Search', () => {
  beforeEach(() => {
    cy.login();
  });
  it('searches and imports', () => {
    cy.visit('/mls-search');
    cy.get('select[id="province"]').select('ONTARIO');
    cy.get('button').click();
    cy.get('button', { name: /Import to My Listings/i }).click();
  });
});
