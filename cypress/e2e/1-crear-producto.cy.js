describe('Test E2E - Flujo Completo de Creación de Usuario', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('Debe completar el flujo de registro exitosamente', () => {
    cy.visit('/register');

    // Completar formulario de registro con datos únicos usando timestamp
    const timestamp = Date.now();
    const testEmail = `usuario${timestamp}@test.com`;
    
    cy.get('input[name="nombre"]').type('UsuarioTest');
    cy.get('input[name="apellido"]').type('ApellidoTest');
    cy.get('input[name="email"]').type(testEmail);
    cy.get('input[name="password"]').type('Password123');
    cy.get('input[name="confirmPassword"]').type('Password123');
    cy.get('input[name="telefono"]').clear(); // Dejar vacío ya que es opcional
    cy.get('input[name="direccion"]').clear(); // Dejar vacío ya que es opcional

    // Enviar formulario
    cy.get('button[type="submit"]').click();

    // Verificar mensaje de éxito (el texto completo del frontend)
    cy.contains(/Usuario registrado exitosamente/i, { timeout: 10000 }).should('be.visible');
    
    // Verificar que después redirige al login (esperar los 2 segundos del setTimeout)
    cy.url({ timeout: 5000 }).should('include', '/login');
  });

  it('Debe validar que las contraseñas coincidan ANTES de enviar al backend', () => {
    cy.visit('/register');
    
    cy.get('input[name="nombre"]').type('UsuarioTest');
    cy.get('input[name="apellido"]').type('ApellidoTest');
    cy.get('input[name="email"]').type('test@test.com');
    cy.get('input[name="password"]').type('Password123');
    cy.get('input[name="confirmPassword"]').type('DiferentePassword');

    cy.get('button[type="submit"]').click();

    // Debe mostrar error Y permanecer en la página de registro
    cy.contains(/contraseña.*no coincid/i, { timeout: 3000 }).should('be.visible');
    cy.url().should('include', '/register');
  });

  it('Debe validar que la contraseña tenga al menos 6 caracteres', () => {
    cy.visit('/register');
    
    cy.get('input[name="nombre"]').type('UsuarioTest');
    cy.get('input[name="apellido"]').type('ApellidoTest');
    cy.get('input[name="email"]').type(`test${Date.now()}@test.com`);
    cy.get('input[name="password"]').type('12345'); // Solo 5 caracteres
    cy.get('input[name="confirmPassword"]').type('12345');

    cy.get('button[type="submit"]').click();

    // Debe mostrar error de contraseña muy corta
    cy.contains(/contraseña.*6.*caracteres/i, { timeout: 3000 }).should('be.visible');
    cy.url().should('include', '/register');
  });
});
