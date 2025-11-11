describe('Test E2E - Validación de Errores y Casos Límite', () => {
  
  const testUser = {
    email: 'test@test.com',
    password: 'password123'
  };

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

    // Intentar registrar con el email que ya existe (test@test.com)
    cy.get('input[name="nombre"]').type('Usuario');
    cy.get('input[name="apellido"]').type('Duplicado');
    cy.get('input[name="email"]').type('test@test.com'); // Email que ya existe
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
    cy.visit('/login');
    
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Verificar redirección a productos
    cy.url().should('include', '/products', { timeout: 10000 });
    
    // Verificar que el catálogo se muestra
    cy.contains(/Catálogo de Productos/i).should('be.visible');
    
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
    cy.wait(2000);

    // Verificar que se muestran las etiquetas de stock
    cy.contains(/En stock|Stock:/i).should('be.visible');
    
    // Verificar que hay botones de "Agregar al Carrito"
    cy.get('button').contains(/Agregar al Carrito/i).should('exist');
  });

  it('Debe cerrar sesión y redirigir al login', () => {
    // Login primero
    cy.visit('/login');
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/products');
    cy.wait(2000);

    // Buscar y hacer clic en el menú de usuario (buscar el email o avatar)
    cy.get('button').then(($buttons) => {
      // Buscar el botón que contiene el email del usuario o un menú
      const menuButton = $buttons.filter((i, btn) => {
        return btn.textContent.includes('test@test.com') || 
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
    cy.visit('/login');
    cy.get('input[name="email"]').type(testUser.email);
    cy.get('input[name="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/products');
    cy.wait(2000);

    // Agregar un producto al carrito
    cy.get('button').contains(/Agregar al Carrito/i).first().click();
    cy.wait(2000);

    // Verificar que el badge del carrito muestra "1"
    cy.get('.MuiBadge-badge').should('contain', '1');
  });
});
