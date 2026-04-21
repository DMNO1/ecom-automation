import React from 'react';
import { Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Orders from '../pages/Orders';
import CustomerService from '../pages/CustomerService';
import Products from '../pages/Products';
import Competitors from '../pages/Competitors';
import Settings from '../pages/Settings';
import Inventory from '../pages/Inventory';

const routes = [
  { path: '/', element: <Dashboard /> },
  { path: '/orders', element: <Orders /> },
  { path: '/inventory', element: <Inventory /> },
  { path: '/customer-service', element: <CustomerService /> },
  { path: '/products', element: <Products /> },
  { path: '/competitors', element: <Competitors /> },
  { path: '/settings', element: <Settings /> },
  { path: '*', element: <Navigate to="/" replace /> },
];

export default routes;
