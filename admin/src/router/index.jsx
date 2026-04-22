import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';
import Dashboard from '../pages/Dashboard';
import Orders from '../pages/Orders';
import CustomerService from '../pages/CustomerService';
import Products from '../pages/Products';
import Competitors from '../pages/Competitors';
import Marketing from '../pages/Marketing';
import System from '../pages/System';
import Analytics from '../pages/Analytics';
import SupplyChain from '../pages/SupplyChain';
import Customers from '../pages/Customers';
import Finance from '../pages/Finance';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'products', element: <Products /> },
      { path: 'orders', element: <Orders /> },
      { path: 'customers', element: <Customers /> },
      { path: 'marketing', element: <Marketing /> },
      { path: 'analytics', element: <Analytics /> },
      { path: 'service', element: <CustomerService /> },
      { path: 'finance', element: <Finance /> },
      { path: 'supply-chain', element: <SupplyChain /> },
      { path: 'system', element: <System /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default router;
