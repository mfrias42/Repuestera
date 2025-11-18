import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Chip,
  Avatar,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material';
import { productService } from '../services/api';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    codigo: '',
    categoria: '',
    año_desde: '',
    año_hasta: '',
    imagen: null
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts();
      setProducts(response.data?.products || []);
    } catch (error) {
      setError('Error al cargar productos');
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        nombre: product.nombre || '',
        descripcion: product.descripcion || '',
        precio: product.precio || '',
        stock: product.stock || '',
        codigo: product.codigo || '',
        categoria: product.categoria || '',
        año_desde: product.año_desde || '',
        año_hasta: product.año_hasta || '',
        imagen: null
      });
    } else {
      setEditingProduct(null);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '',
        codigo: '',
        categoria: '',
        año_desde: '',
        año_hasta: '',
        imagen: null
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'imagen') {
      setFormData({ ...formData, imagen: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Mapear campos del formulario a los que espera el backend
      const productData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        codigo_producto: formData.codigo || null,
        categoria_id: formData.categoria ? parseInt(formData.categoria) : null,
        año_desde: formData.año_desde ? parseInt(formData.año_desde) : null,
        año_hasta: formData.año_hasta ? parseInt(formData.año_hasta) : null,
        imagen: formData.imagen
      };

      console.log('📤 Enviando datos del producto:', productData);

      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, productData);
        setSuccess('Producto actualizado exitosamente');
      } else {
        await productService.createProduct(productData);
        setSuccess('Producto creado exitosamente');
      }
      
      await loadProducts();
      handleCloseDialog();
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      
      // Extraer mensaje de error más detallado
      let errorMessage = 'Error al guardar producto';
      
      if (error.response) {
        const errorData = error.response.data;
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = `${errorData.error}: ${errorData.message || 'Error desconocido'}`;
        } else if (Array.isArray(errorData)) {
          // Errores de validación
          errorMessage = errorData.map(err => err.msg || err.message).join(', ');
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await productService.deleteProduct(productId);
        setSuccess('Producto eliminado exitosamente');
        await loadProducts();
      } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        console.error('❌ Error response:', error.response);
        
        let errorMessage = 'Error al eliminar producto';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = `${error.response.data.error}: ${error.response.data.message || 'Error desconocido'}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
      }
    }
  };

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Gestión de Productos</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Nuevo Producto
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Imagen</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Avatar
                    src={product.imagen_url}
                    alt={product.nombre}
                    variant="rounded"
                    sx={{ width: 50, height: 50 }}
                  />
                </TableCell>
                <TableCell>{product.nombre}</TableCell>
                <TableCell>{product.codigo}</TableCell>
                <TableCell>{formatPrice(product.precio)}</TableCell>
                <TableCell>
                  <Chip
                    label={product.stock}
                    color={getStockColor(product.stock)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{product.categoria}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(product)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar producto */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Código"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="descripcion"
                  multiline
                  rows={3}
                  value={formData.descripcion}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  required
                  fullWidth
                  label="Precio"
                  name="precio"
                  type="number"
                  value={formData.precio}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  required
                  fullWidth
                  label="Stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    name="categoria"
                    value={formData.categoria}
                    label="Categoría"
                    onChange={handleChange}
                  >
                    <MenuItem value="repuestos">Repuestos</MenuItem>
                    <MenuItem value="herramientas">Herramientas</MenuItem>
                    <MenuItem value="accesorios">Accesorios</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Año Desde"
                  name="año_desde"
                  type="number"
                  value={formData.año_desde}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Año Hasta"
                  name="año_hasta"
                  type="number"
                  value={formData.año_hasta}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Imagen"
                  name="imagen"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ProductManagement;
