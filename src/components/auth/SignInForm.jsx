import { SignIn, ClerkProvider } from '@clerk/clerk-react';
import './SignInForm.css';

export default function SignInForm() {
  return (
    <ClerkProvider publishableKey={import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <SignIn 
        redirectUrl="/admin"
        appearance={{
          elements: {
            rootBox: "mx-auto clerk-rootBox",
            card: "shadow-lg rounded-xl p-6 clerk-card",
            formButtonPrimary: "clerk-formButtonPrimary clerk-formButtonPrimary--hover clerk-formButtonPrimary--active clerk-formButtonPrimary--disabled clerk-formButtonPrimary--focus clerk-formButtonPrimary--loading clerk-formButtonPrimary--pressed clerk-formButtonPrimary--disabled",
            input: "clerk-input",
          }
        }}
      />
    </ClerkProvider>
  );
}