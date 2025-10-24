import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { Person, Edit, Save, Cancel } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await userService.updateProfile(formData);
      
      if (response.success) {
        setSuccess('Perfil actualizado exitosamente');
        updateUser(response.usuario);
        setEditing(false);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      email: user.email || '',
      telefono: user.telefono || '',
      direccion: user.direccion || ''
    });
    setEditing(false);
    setError('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          No se pudo cargar la información del usuario
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Person sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Mi Perfil
          </Typography>
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

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Información Personal
                  </Typography>
                  {!editing ? (
                    <Button
                      startIcon={<Edit />}
                      onClick={() => setEditing(true)}
                      variant="outlined"
                    >
                      Editar
                    </Button>
                  ) : (
                    <Box>
                      <Button
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={loading}
                        variant="contained"
                        sx={{ mr: 1 }}
                      >
                        Guardar
                      </Button>
                      <Button
                        startIcon={<Cancel />}
                        onClick={handleCancel}
                        variant="outlined"
                      >
                        Cancelar
                      </Button>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      disabled={!editing}
                      variant={editing ? "outlined" : "filled"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Apellido"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleInputChange}
                      disabled={!editing}
                      variant={editing ? "outlined" : "filled"}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!editing}
                      variant={editing ? "outlined" : "filled"}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      disabled={!editing}
                      variant={editing ? "outlined" : "filled"}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Dirección"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      disabled={!editing}
                      variant={editing ? "outlined" : "filled"}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información de Cuenta
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    ID de Usuario
                  </Typography>
                  <Typography variant="body1">
                    #{user.id}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de Registro
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(user.fecha_registro)}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Estado de Cuenta
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color={user.activo ? 'success.main' : 'error.main'}
                  >
                    {user.activo ? 'Activa' : 'Inactiva'}
                  </Typography>
                </Box>

                {user.rol && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Rol
                    </Typography>
                    <Typography variant="body1">
                      {user.rol === 'super_admin' ? 'Super Administrador' : 
                       user.rol === 'admin' ? 'Administrador' : 'Usuario'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Profile;
