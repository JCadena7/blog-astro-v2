import { ClerkProvider } from '@clerk/clerk-react';

export default function ClerkProviderWrapper({ children }) {
  return (
    <ClerkProvider publishableKey={import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
} 