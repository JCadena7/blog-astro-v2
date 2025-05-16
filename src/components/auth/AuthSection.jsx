import { UserButton, ClerkProvider, useUser } from "@clerk/clerk-react";
import { useUserRole } from '../../hooks/useUserRole';
import './AuthSection.css';

// Componente interno que usa los hooks
function AuthContent({ isAuthenticated }) {
  const { user } = useUser();
  const userRole = useUserRole();

  return (
    <div className="auth-section">
      {isAuthenticated ? (
        <div className="user-section">
          {/* <a href="/admin" className="nav-link admin-link">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <span>Admin</span>
          </a> */}
          <div className="user-button-wrapper">
            <UserButton 
              afterSwitchSessionUrl="/"
              appearance={{
                elements: {
                  userButtonBox: "user-button-box",
                  userButtonTrigger: "user-button-trigger",
                  userButtonAvatarBox: "user-button-avatar",
                  userButtonPopoverCard: "user-button-popover"
                }
              }}
              showName={false}
              userProfileMode="navigation"
              userProfileUrl="/user-profile"
            />
            <div className="user-info">
              <span className="user-name">{user?.firstName || user?.username || 'Usuario'}</span>
              <span className="user-role">{userRole || 'Cargando...'}</span>
            </div>
          </div>
        </div>
      ) : (
        <a href="/sign-in" className="nav-link signin-button">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
          </svg>
          <span>Iniciar sesión</span>
        </a>
      )}
    </div>
  );
}

// Componente principal que envuelve con ClerkProvider
export default function AuthSection({ isAuthenticated }) {
  return (
    <ClerkProvider publishableKey={import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <AuthContent isAuthenticated={isAuthenticated} />
    </ClerkProvider>
  );
} 