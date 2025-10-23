import { Navigate } from "react-router-dom";

export default function Index() {
  // Redirect to driver login - main entry point for the mobile driver app
  return <Navigate to="/driver-login" replace />;
}
