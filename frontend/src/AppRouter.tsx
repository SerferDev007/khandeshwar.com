import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from '../App';

// Define the routes including the admin routes as required
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'admin',
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <div>Dashboard</div>, // This will be handled by App.tsx activeTab
          },
          {
            path: 'donations',
            element: <div>Donations</div>, // This will be handled by App.tsx activeTab
          },
          {
            path: 'expenses', 
            element: <div>Expenses</div>, // This will be handled by App.tsx activeTab
          },
          {
            path: 'rent',
            children: [
              {
                index: true,
                element: <div>Rent Management</div>, // This will be handled by App.tsx activeTab
              },
              {
                path: 'units',
                element: <div>Rental Units</div>,
              },
              {
                path: 'tenants',
                element: <div>Tenants</div>,
              },
              {
                path: 'leases',
                element: <div>Leases</div>,
              },
              {
                path: 'payments',
                element: <div>Rent Payments</div>,
              }
            ]
          }
        ]
      }
    ]
  }
]);

export function AppWithRouter() {
  return <RouterProvider router={router} />;
}