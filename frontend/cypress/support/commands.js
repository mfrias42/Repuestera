// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Comandos personalizados para la aplicación Repuestera

/**
 * Login como usuario normal
 */
Cypress.Commands.add('loginAsUser', (email = 'test@example.com', password = 'password123') => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: {
      nombre: 'Test',
      apellido: 'User',
      email: email,
      password: password
    },
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 201 || response.status === 400) {
      // Usuario creado o ya existe, intentar login
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: {
          email: email,
          password: password
        }
      }).then((loginResponse) => {
        if (loginResponse.body.token) {
          window.localStorage.setItem('token', loginResponse.body.token);
          window.localStorage.setItem('user', JSON.stringify(loginResponse.body.user));
        }
      });
    }
  });
});

/**
 * Login como administrador
 */
Cypress.Commands.add('loginAsAdmin', (email = 'admin.qa@repuestera.com', password = 'AdminQA2024!') => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/admin/login`,
    body: {
      email: email,
      password: password
    }
  }).then((response) => {
    if (response.body.token) {
      window.localStorage.setItem('token', response.body.token);
      window.localStorage.setItem('admin', JSON.stringify(response.body.admin));
    }
  });
});

/**
 * Limpiar localStorage
 */
Cypress.Commands.add('clearAuth', () => {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
  window.localStorage.removeItem('admin');
});

