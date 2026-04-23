import React, { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';

const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Orders = React.lazy(() => import('../pages/Orders'));
const CustomerService = React.lazy(() => import('../pages/CustomerService'));
const Products = React.lazy(() => import('../pages/Products'));
const Competitors = React.lazy(() => import('../pages/Competitors'));
const Marketing = React.lazy(() => import('../pages/Marketing'));
const System = React.lazy(() => import('../pages/System'));
const Analytics = React.lazy(() => import('../pages/Analytics'));
const SupplyChain = React.lazy(() => import('../pages/SupplyChain'));
const Customers = React.lazy(() => import('../pages/Customers'));
const Finance = React.lazy(() => import('../pages/Finance'));
const NotFound = React.lazy(() => import('../pages/NotFound'));

const withSuspense = (Component) => (
  <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>加载中...</div>}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: withSuspense(Dashboard) },
      { path: 'products', element: withSuspense(Products) },
      { path: 'orders', element: withSuspense(Orders) },
      { path: 'customers', element: withSuspense(Customers) },
      { path: 'marketing', element: withSuspense(Marketing) },
      { path: 'analytics', element: withSuspense(Analytics) },
      { path: 'service', element: withSuspense(CustomerService) },
      { path: 'finance', element: withSuspense(Finance) },
      { path: 'supply-chain', element: withSuspense(SupplyChain) },
      { path: 'system', element: withSuspense(System) },
      { path: '*', element: withSuspense(NotFound) },
    ],
  },
]);

export default router;
