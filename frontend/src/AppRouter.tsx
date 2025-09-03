import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from '../App';
import { DashboardRoute } from './routes/DashboardRoute';
import { DonationsRoute } from './routes/DonationsRoute';
import { ExpensesRoute } from './routes/ExpensesRoute';
import { ReportsRoute } from './routes/ReportsRoute';
import { UsersRoute } from './routes/UsersRoute';
import { RentManagementRoute } from './routes/RentManagementRoute';

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
            element: <DashboardRoute />,
          },
          {
            path: 'donations',
            element: <DonationsRoute />,
          },
          {
            path: 'expenses', 
            element: <ExpensesRoute />,
          },
          {
            path: 'reports',
            element: <ReportsRoute />,
          },
          {
            path: 'users',
            element: <UsersRoute />,
          },
          {
            path: 'rent',
            children: [
              {
                index: true,
                element: <RentManagementRoute />,
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