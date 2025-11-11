// ***********************************************
// Comandos custom para tests E2E
// ***********************************************

// Comando para registrar un nuevo usuario
Cypress.Commands.add('registerUser', (userData) => {
  cy.visit('/register');
  
  cy.get('input[name="nombre"]').type(userData.nombre);
  cy.get('input[name="apellido"]').type(userData.apellido);
  cy.get('input[name="email"]').type(userData.email);
  cy.get('input[name="password"]').type(userData.password);
  cy.get('input[name="confirmPassword"]').type(userData.password);
  cy.get('input[name="telefono"]').clear();
  cy.get('input[name="direccion"]').clear();
  
  cy.get('button[type="submit"]').click();
  
  // Esperar mensaje de éxito o redirección
  cy.wait(2000);
});

// Comando para hacer login
Cypress.Commands.add('loginUser', (email, password) => {
  cy.visit('/login');
  
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  
  // Esperar a que se complete el login
  cy.wait(2000);
});

// Comando para registrar Y hacer login (útil para tests que necesitan usuario autenticado)
Cypress.Commands.add('createAndLoginUser', (userData) => {
  // Registrar
  cy.registerUser(userData);
  
  // Hacer login
  cy.loginUser(userData.email, userData.password);
  
  // Verificar que estamos en /products
  cy.url({ timeout: 10000 }).should('include', '/products');
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