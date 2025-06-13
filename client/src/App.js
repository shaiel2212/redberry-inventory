import DeliveriesPage from './pages/DeliveriesPage'; // ודא שהנתיב נכון

function App() {
  const { user } = useAuth();

  return (
    <>
      <div className="container">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products-view" element={<ProductsViewPage />} />
          <Route path="/admin/users" element={<UsersAdminPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* עבור role DELIVER — הצג רק את עמוד המשלוחים */}
            {user?.role === 'DELIVER' ? (
              <Route path="*" element={<DeliveriesPage />} />
            ) : (
              <>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/admin/products" element={<ProductsAdminPage />} />
                <Route path="/make-sale" element={<MakeSalePage />} />
                <Route path="/admin/sales" element={<SalesAdminPage />} />
                <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
              </>
            )}
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={4000} />
      </div>
    </>
  );
}
