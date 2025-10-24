import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CardActions,
  Snackbar
} from '@mui/material';
import { Search, AddShoppingCart } from '@mui/icons-material';
import { productService } from '../services/api';
import { useCart } from '../context/CartContext';

const Products = () => {
  const { addToCart, getItemQuantity } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('nombre');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('Cargando productos...');
      console.log('Token:', localStorage.getItem('token'));
      const response = await productService.getProducts({
        search: searchTerm,
        categoria: categoryFilter,
        sortBy: sortBy
      });
      console.log('Respuesta completa:', response);
      console.log('Estructura de response.data:', response.data);
      console.log('Productos encontrados:', response.data?.products);
      console.log('Cantidad de productos:', response.data?.products?.length);
      setProducts(response.data?.products || []);
    } catch (error) {
      setError('Error al cargar productos');
      console.error('Error al cargar productos:', error);
      console.error('Detalles del error:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadProducts();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, categoryFilter, sortBy]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'error';
    if (stock <= 5) return 'warning';
    return 'success';
  };

  const getStockText = (stock) => {
    if (stock === 0) return 'Sin stock';
    if (stock <= 5) return `Poco stock (${stock})`;
    return `En stock (${stock})`;
  };

  const handleAddToCart = (product) => {
    try {
      addToCart(product, 1);
      setSnackbar({
        open: true,
        message: `${product.nombre} agregado al carrito`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Catálogo de Productos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={categoryFilter}
                label="Categoría"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="repuestos">Repuestos</MenuItem>
                <MenuItem value="herramientas">Herramientas</MenuItem>
                <MenuItem value="accesorios">Accesorios</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortBy}
                label="Ordenar por"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="nombre">Nombre</MenuItem>
                <MenuItem value="precio">Precio</MenuItem>
                <MenuItem value="stock">Stock</MenuItem>
                <MenuItem value="fecha_creacion">Más recientes</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Lista de productos */}
      {products.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron productos
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={product.imagen_url || '/placeholder-image.jpg'}
                  alt={product.nombre}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2" noWrap>
                    {product.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Código: {product.codigo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {product.descripcion}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" color="primary">
                      {formatPrice(product.precio)}
                    </Typography>
                    <Chip
                      label={getStockText(product.stock)}
                      color={getStockColor(product.stock)}
                      size="small"
                    />
                  </Box>
                  {product.categoria && (
                    <Chip
                      label={product.categoria}
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    startIcon={<AddShoppingCart />}
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    fullWidth
                    size="small"
                  >
                    {product.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

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

export default Products;
