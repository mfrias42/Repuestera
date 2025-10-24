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
  Chip,
  Typography,
  Alert
} from '@mui/material';
import {
  Edit,
  Delete,
  PersonAdd
} from '@mui/icons-material';
import { userService, adminService } from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
    loadAdmins();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      const response = await adminService.getAdmins();
      setAdmins(response.data.admins || []);
    } catch (error) {
      console.error('Error al cargar administradores:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres desactivar este usuario?')) {
      try {
        await userService.deleteUser(userId);
        setSuccess('Usuario desactivado exitosamente');
        await loadUsers();
      } catch (error) {
        setError('Error al desactivar usuario');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getStatusColor = (active) => {
    return active ? 'success' : 'error';
  };

  const getStatusText = (active) => {
    return active ? 'Activo' : 'Inactivo';
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Gestión de Usuarios
      </Typography>

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

      {/* Tabla de Usuarios */}
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        Usuarios Registrados
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Fecha Registro</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.nombre} {user.apellido}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.telefono || 'N/A'}</TableCell>
                <TableCell>{formatDate(user.fecha_registro)}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(user.activo)}
                    color={getStatusColor(user.activo)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={!user.activo}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Tabla de Administradores */}
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        Administradores
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Fecha Registro</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell>{admin.id}</TableCell>
                <TableCell>{admin.nombre} {admin.apellido}</TableCell>
                <TableCell>{admin.email}</TableCell>
                <TableCell>
                  <Chip
                    label={admin.rol === 'super_admin' ? 'Super Admin' : 'Admin'}
                    color={admin.rol === 'super_admin' ? 'secondary' : 'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(admin.fecha_registro)}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(admin.activo)}
                    color={getStatusColor(admin.activo)}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UserManagement;
