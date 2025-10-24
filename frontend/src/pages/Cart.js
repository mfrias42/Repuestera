import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  TextField,
  Divider,
  Alert,
  Paper,
  CardMedia,
  Chip,
  Snackbar
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCartCheckout,
  ArrowBack
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { 
    items, 
    total, 
    itemCount, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }
    
    const product = items.find(item => item.id === productId);
    if (newQuantity > product.stock) {
      setSnackbar({
        open: true,
        message: `Solo hay ${product.stock} unidades disponibles`,
        severity: 'warning'
      });
      return;
    }
    
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId) => {
    const product = items.find(item => item.id === productId);
    removeFromCart(productId);
    setSnackbar({
      open: true,
      message: `${product.nombre} eliminado del carrito`,
      severity: 'info'
    });
  };

  const handleClearCart = () => {
    clearCart();
    setSnackbar({
      open: true,
      message: 'Carrito vaciado',
      severity: 'info'
    });
  };

  const handleCheckout = () => {
    // Aquí se implementaría la lógica de checkout
    setSnackbar({
      open: true,
      message: 'Funcionalidad de checkout en desarrollo',
      severity: 'info'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Tu carrito está vacío
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            ¡Agrega algunos productos para comenzar!
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/products')}
            size="large"
          >
            Continuar Comprando
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Carrito de Compras
        </Typography>
        <Chip 
          label={`${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}`} 
          color="primary" 
          variant="outlined"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Lista de productos */}
        <Grid item xs={12} md={8}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/products')}
              sx={{ mr: 2 }}
            >
              Continuar Comprando
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleClearCart}
            >
              Vaciar Carrito
            </Button>
          </Box>

          {items.map((item) => (
            <Card key={item.id} sx={{ mb: 2 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <CardMedia
                      component="img"
                      height="120"
                      image={item.imagen_url || '/placeholder-image.jpg'}
                      alt={item.nombre}
                      sx={{ objectFit: 'cover', borderRadius: 1 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="h6" gutterBottom>
                      {item.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Código: {item.codigo}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatPrice(item.precio)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        size="small"
                      >
                        <Remove />
                      </IconButton>
                      
                      <TextField
                        value={item.quantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          handleQuantityChange(item.id, value);
                        }}
                        size="small"
                        sx={{ width: 60 }}
                        inputProps={{ 
                          min: 1, 
                          max: item.stock,
                          style: { textAlign: 'center' }
                        }}
                      />
                      
                      <IconButton
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        size="small"
                        disabled={item.quantity >= item.stock}
                      >
                        <Add />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Stock: {item.stock}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={2}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" gutterBottom>
                        {formatPrice(item.precio * item.quantity)}
                      </Typography>
                      <IconButton
                        onClick={() => handleRemoveItem(item.id)}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Grid>

        {/* Resumen del pedido */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h5" gutterBottom>
              Resumen del Pedido
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              {items.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    {item.nombre} x{item.quantity}
                  </Typography>
                  <Typography variant="body2">
                    {formatPrice(item.precio * item.quantity)}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Total:
              </Typography>
              <Typography variant="h6" color="primary">
                {formatPrice(total)}
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<ShoppingCartCheckout />}
              onClick={handleCheckout}
              sx={{ mb: 2 }}
            >
              Proceder al Pago
            </Button>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Los precios incluyen IVA. Envío gratuito en compras superiores a $50.000
            </Alert>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Cart;