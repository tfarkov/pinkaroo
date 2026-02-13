Cypress.Commands.add('login', () => {
  cy.request('POST', '/api/auth/signin', { email: 'admin@example.com', password: 'password' });
  // Assume session is set
});
