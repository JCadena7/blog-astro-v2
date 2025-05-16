import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';

export function useUserRole() {
  const { user } = useUser();
  const [role, setRole] = useState('');

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) return;

      try {
        const response = await fetch(`/api/usuarios/rol?clerk_id=${user.id}`);
        const data = await response.json();
        
        if (data.rol) {
          setRole(data.rol);
        }
      } catch (error) {
        console.error('Error al obtener el rol:', error);
      }
    }

    fetchUserRole();
  }, [user]);

  return role;
} 