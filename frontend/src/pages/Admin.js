import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import ProductManagement from '../components/ProductManagement';
import UserManagement from '../components/UserManagement';
import { useAuth } from '../context/AuthContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Admin = () => {
  const [tabValue, setTabValue] = useState(0);
  const { user, isSuperAdmin } = useAuth();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Panel de Administración
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Bienvenido, {user?.nombre} {user?.apellido}
      </Typography>

      <Paper sx={{ width: '100%', mt: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab label="Gestión de Productos" />
            {isSuperAdmin() && <Tab label="Gestión de Usuarios" />}
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <ProductManagement />
        </TabPanel>
        
        {isSuperAdmin() && (
          <TabPanel value={tabValue} index={1}>
            <UserManagement />
          </TabPanel>
        )}
      </Paper>
    </Container>
  );
};

export default Admin;
