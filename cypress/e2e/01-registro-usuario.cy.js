/**
 * Test E2E: Flujo completo de registro de usuario
 * TP07 - Pruebas de Integración
 */

describe('Flujo de Registro de Usuario', () => {
  beforeEach(() => {
    cy.clearAuth();
    cy.visit('/register');
  });

  it('debe completar el registro de un nuevo usuario exitosamente', () => {
    // Arrange - Datos del usuario
    const userData = {
      nombre: 'Juan',
      apellido: 'Pérez',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      telefono: '1123456789',
      direccion: 'Calle Falsa 123'
    };

    // Act - Completar formulario de registro
    cy.get('input[name="nombre"]').type(userData.nombre);
    cy.get('input[name="apellido"]').type(userData.apellido);
    cy.get('input[name="email"]').type(userData.email);
    cy.get('input[name="password"]').type(userData.password);
    cy.get('input[name="telefono"]').type(userData.telefono);
    cy.get('input[name="direccion"]').type(userData.direccion);

    // Interceptar la llamada al API
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 201,
      body: {
        message: 'Usuario registrado exitosamente',
        user: {
          id: 1,
          nombre: userData.nombre,
          apellido: userData.apellido,
          email: userData.email
        },
        token: 'mock_token_123'
      }
    }).as('registerRequest');

    // Submit del formulario
    cy.get('button[type="submit"]').click();

    // Assert - Verificar que se hizo la llamada al API
    cy.wait('@registerRequest');

    // Verificar redirección o mensaje de éxito
    cy.url().should('include', '/products');
    cy.get('body').should('contain', userData.nombre);
  });

  it('debe mostrar error cuando el email ya está registrado', () => {
    // Arrange - Usuario existente
    const existingEmail = 'existing@example.com';

    // Act - Intentar registrar con email existente
    cy.get('input[name="nombre"]').type('Test');
    cy.get('input[name="apellido"]').type('User');
    cy.get('input[name="email"]').type(existingEmail);
    cy.get('input[name="password"]').type('password123');

    // Interceptar respuesta de error
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 400,
      body: {
        error: 'Email ya registrado',
        message: 'Este email ya está en uso'
      }
    }).as('registerError');

    cy.get('button[type="submit"]').click();

    // Assert - Verificar mensaje de error
    cy.wait('@registerError');
    cy.get('body').should('contain', 'email');
  });

  it('debe validar campos requeridos en el formulario', () => {
    // Act - Intentar enviar formulario vacío
    cy.get('button[type="submit"]').click();

    // Assert - Verificar que se muestran mensajes de validación
    cy.get('input[name="nombre"]:invalid').should('exist');
    cy.get('input[name="email"]:invalid').should('exist');
    cy.get('input[name="password"]:invalid').should('exist');
  });
});

