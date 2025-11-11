// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Comando personalizado para login
Cypress.Commands.add('login', (email = 'test@test.com', password = 'password123') => {
  cy.clearLocalStorage();
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/products', { timeout: 10000 });
});

// Comando para agregar producto al carrito
Cypress.Commands.add('addToCart', (productIndex = 0) => {
  cy.get('[data-testid="add-to-cart-button"]').eq(productIndex).click({ force: true });
  cy.contains(/agregado al carrito/i, { timeout: 5000 }).should('exist');
});

// Comando para ir al carrito
Cypress.Commands.add('goToCart', () => {
  cy.contains('Carrito').click();
  cy.url().should('include', '/cart');
});

// Comando para registro de usuario
Cypress.Commands.add('register', (userData) => {
  cy.visit('/register');
  cy.get('input[name="nombre"]').type(userData.nombre || 'Usuario Test');
  cy.get('input[name="email"]').type(userData.email || `test${Date.now()}@test.com`);
  cy.get('input[name="password"]').type(userData.password || 'Test123456');
  cy.get('input[name="confirmPassword"]').type(userData.confirmPassword || userData.password || 'Test123456');
  cy.get('input[name="telefono"]').type(userData.telefono || '1234567890');
  cy.get('input[name="direccion"]').type(userData.direccion || 'Calle Test 123');
  cy.get('button[type="submit"]').click();
});

//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })