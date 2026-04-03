/** Smoke: realtor listing form exposes draft save (operations feature). */
describe('Listing drafts', () => {
  it('add listing page shows save draft and primary submit', () => {
    cy.login();
    cy.visit('/listings/new');
    cy.contains('Save as draft').should('be.visible');
    cy.contains('Submit').should('be.visible');
  });
});
