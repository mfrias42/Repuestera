// ***********************************************
// Comandos custom para tests E2E
// ***********************************************

// Comando para limpiar usuarios de test antes de empezar
Cypress.Commands.add('cleanupTestUsers', () => {
  cy.request({
    method: 'DELETE',
    url: 'http://localhost:8000/api/test-cleanup/cleanup-test-users',
    failOnStatusCode: false // No fallar si el endpoint no existe
  }).then((response) => {
    if (response.status === 200) {
      cy.log(`✅ Usuarios de test eliminados: ${response.body.deletedCount}`);
    }
  });
});

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
  
  // Esperar a que aparezca el mensaje de éxito O el mensaje de error (usuario ya existe)
  // No verificamos redirección aquí para que sea más flexible
  cy.wait(3000);
});

// Comando para hacer login
Cypress.Commands.add('loginUser', (email, password) => {
  // Si ya estamos en login, no navegar de nuevo
  cy.url().then((url) => {
    if (!url.includes('/login')) {
      cy.visit('/login');
    }
  });
  
  cy.get('input[name="email"]').clear().type(email);
  cy.get('input[name="password"]').clear().type(password);
  cy.get('button[type="submit"]').click();
  
  // Esperar a que se complete el login y redirija a products
  cy.url({ timeout: 10000 }).should('include', '/products');
});

// Comando para registrar Y hacer login (útil para tests que necesitan usuario autenticado)
Cypress.Commands.add('createAndLoginUser', (userData) => {
  // Registrar
  cy.registerUser(userData);
  
  // Navegar al login (puede que ya estemos ahí o no)
  cy.visit('/login');
  
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