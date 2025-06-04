describe('User Login', () => {
  const testUser = {
    username: 'testuser',
    password: 'Test@1234'
  };

  it('should login successfully', () => {
    cy.visit('http://localhost:3000/login');

    cy.get('input').eq(0).type(testUser.username);
    cy.get('input').eq(2).type(testUser.password);
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('ברוך הבא');
    cy.contains(testUser.username);
  });
});