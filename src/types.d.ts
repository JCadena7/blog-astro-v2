import { User } from '@clerk/backend';

// Tipos para errores de base de datos
export interface DBError {
  type?: string;
  message: string;
  timestamp: string;
  actionRequired?: string;
}

// Definir el tipo AuthObject
interface AuthObject {
  userId?: string;
  user?: User;
  redirectToSignIn?: (options?: { returnBackUrl?: string }) => Response;
}

// Extender las definiciones de tipos para Astro
declare global {
  namespace App {
    interface Locals {
      auth?: AuthObject | (() => AuthObject);
      dbError?: DBError;
      dbSyncSuccessful?: boolean;
      middlewareError?: {
        message: string;
        timestamp: string;
      };
    }
  }
}

// No export default para archivos .d.ts 