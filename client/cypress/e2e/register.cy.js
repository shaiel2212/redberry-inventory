describe('User Registration', () => {
  const testUser = {
    username: 'Test@1234',
    email:'shay2212@gmail.com',
    password: 'Test@1234'
  };

  it('should register a new user', () => {
    cy.visit('http://localhost:3000/register');

    cy.get('[data-testid="username"]').type(testUser.username);
    cy.get('[data-testid="email"]').type(testUser.email);
    cy.get('[data-testid="password"]').type(testUser.password);
    cy.get('[data-testid="confirmPassword"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/login');
  });
});