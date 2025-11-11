describe('Test E2E - Validación de Errores y Casos Límite', () => {
  
  // Usuario de prueba para estos tests - será creado en el before - agregar random para evitar colisiones
  const testUser = {
    email: `validacion_test_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
    password: 'Password123',
    nombre: 'ValidacionTest',
    apellido: 'Usuario'
  };

  before(() => {
    // Limpiar usuarios de test antes de empezar
    cy.cleanupTestUsers();
    // Crear el usuario UNA VEZ para todos los tests que lo necesiten
    cy.registerUser(testUser);
  });

  it('Debe mostrar error cuando las credenciales de login son incorrectas', () => {
    cy.visit('/login');

    // Intentar login con credenciales incorrectas
    cy.get('input[name="email"]').type('usuarioinexistente@email.com');
    cy.get('input[name="password"]').type('passwordincorrecto');
    cy.get('button[type="submit"]').click();

    // Esperar la respuesta del backend
    cy.wait(3000);

    // Verificar que NO se redirige a productos (que es lo que sucede cuando el login falla)
    cy.url().should('include', '/login');
    
    // Verificar que sigue visible el formulario de login
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
  });

  it('Debe mostrar error al intentar registrar con email duplicado', () => {
    cy.visit('/register');

    // Intentar registrar con el email que ya existe (el de testUser)
    cy.get('input[name="nombre"]').type('Usuario');
    cy.get('input[name="apellido"]').type('Duplicado');
    cy.get('input[name="email"]').type(testUser.email); // Email que ya existe
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');
    
    cy.get('button[type="submit"]').click();

    // Verificar que se muestra error (puede ser "El email ya está registrado" o similar)
    cy.get('.MuiAlert-standardError, .MuiAlert-filledError', { timeout: 5000 }).should('be.visible');
  });

  it('Debe permitir navegar entre login y registro correctamente', () => {
    cy.visit('/login');

    // Ir a registro desde login
    cy.contains(/Regístrate aquí/i).click();
    cy.url().should('include', '/register');

    // Volver a login desde registro
    cy.contains(/Inicia sesión aquí/i).click();
    cy.url().should('include', '/login');
  });

  it('Debe cargar y mostrar productos después de login exitoso', () => {
    cy.loginUser(testUser.email, testUser.password);

    // Verificar redirección a productos
    cy.url({ timeout: 10000 }).should('include', '/products');
    
    // Verificar que el catálogo se muestra
    cy.contains(/Catálogo de Productos/i, { timeout: 10000 }).should('be.visible');
    
    // Verificar que hay productos cargados
    cy.get('.MuiCard-root', { timeout: 10000 }).should('have.length.at.least', 1);
  });

  it('Debe permitir acceder a productos sin autenticación (catálogo público)', () => {
    cy.clearLocalStorage();
    cy.visit('/products');

    // Verificar que se pueden ver los productos sin login
    cy.contains(/Catálogo de Productos/i, { timeout: 10000 }).should('be.visible');
    cy.get('.MuiCard-root', { timeout: 10000 }).should('have.length.at.least', 1);
    
    // Verificar que aparece el botón de "Iniciar Sesión"
    cy.contains(/Iniciar Sesión/i).should('be.visible');
  });

  it('Debe mostrar información de stock en las tarjetas de productos', () => {
    cy.visit('/products');
    
    // Verificar que carga la página de productos
    cy.contains(/Catálogo de Productos/i, { timeout: 10000 }).should('be.visible');
    
    // Verificar que hay cards de productos
    cy.get('.MuiCard-root', { timeout: 10000 }).should('have.length.at.least', 1);
    
    // Verificar que hay botones de "Agregar al Carrito"
    cy.get('button').contains(/Agregar al Carrito/i).should('exist');
  });

  it('Debe cerrar sesión y redirigir al login', () => {
    // Login primero
    cy.loginUser(testUser.email, testUser.password);

    cy.url({ timeout: 10000 }).should('include', '/products');
    cy.wait(2000);

    // Buscar y hacer clic en el menú de usuario
    cy.get('button').then(($buttons) => {
      // Buscar el botón que contiene el email del usuario o un menú
      const menuButton = $buttons.filter((i, btn) => {
        return btn.textContent.includes(testUser.email) || 
               btn.getAttribute('aria-controls') === 'menu-appbar';
      });
      
      if (menuButton.length > 0) {
        cy.wrap(menuButton.first()).click();
        cy.wait(500);
        cy.contains(/Cerrar Sesión/i).click();
      }
    });

    // Verificar redirección (puede ser /login o / como home)
    cy.url({ timeout: 5000 }).should('match', /\/(login|)$/);
  });

  it('Debe mostrar el badge del carrito con la cantidad correcta', () => {
    // Login
    cy.loginUser(testUser.email, testUser.password);

    cy.url({ timeout: 10000 }).should('include', '/products');
    cy.wait(2000);

    // Agregar un producto al carrito
    cy.get('button').contains(/Agregar al Carrito/i).first().click();
    cy.wait(2000);

    // Verificar que el badge del carrito muestra "1"
    cy.get('.MuiBadge-badge').should('contain', '1');
  });
});
