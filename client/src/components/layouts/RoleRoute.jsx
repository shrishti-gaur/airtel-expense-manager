import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Route guard checking user role authorization
 * @param {Array<string>} allowedRoles - Roles allowed to access the route
 */
const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.includes(user.role);

  return hasAccess ? <Outlet /> : <Navigate to="/404" replace />;
};

export default RoleRoute;
