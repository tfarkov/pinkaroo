describe('Listings Flow', () => {
  beforeEach(() => {
    cy.login(); // custom command
  });
  it('creates and views listing', () => {
    cy.visit('/listings');
    cy.contains('Add Listing').click();
    cy.get('#title').type('Test Listing');
    // Fill more fields, submit, verify on listings page, click detail.
    cy.submitForm();
    cy.contains('Test Listing').click();
    cy.contains('Test Listing').should('exist');
  });
});
