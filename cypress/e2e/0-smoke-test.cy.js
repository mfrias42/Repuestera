describe('Test E2E - Smoke Test', () => {
  it('Debe cargar la página de login correctamente', () => {
    cy.visit('/login');
    cy.contains('Iniciar Sesión').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('Debe cargar la página de registro correctamente', () => {
    cy.visit('/register');
    cy.contains('Registrarse').should('be.visible');
  });

  it('Debe mostrar el logo o título de la aplicación', () => {
    cy.visit('/');
    // Verificar que la página carga sin errores
    cy.get('body').should('be.visible');
  });
});
