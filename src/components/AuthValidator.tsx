import { useEffect } from 'react';
import { useAuth } from '@/lib/convex';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

/**
 * Component to validate authentication state and handle corrupted localStorage
 * Place this at the root of your app to ensure authentication is valid
 */
export function AuthValidator() {
  const { userId, clearSession } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if userId exists but might be invalid
    if (userId) {
      // Convex IDs should be 32 characters long and contain only lowercase letters and numbers
      const validIdPattern = /^[a-z0-9]{32}$/;
      
      if (!validIdPattern.test(userId)) {
        console.error('Invalid userId detected:', userId);
        console.log('Clearing corrupted session data...');
        
        // Clear the invalid session
        clearSession();
        
        // Show toast to user
        toast({
          title: 'Session Invalid',
          description: 'Your session data was corrupted. Please log in again.',
          variant: 'destructive',
        });
        
        // Redirect to login
        navigate('/login');
      }
    }
  }, [userId, clearSession, navigate, toast]);

  // This component doesn't render anything
  return null;
}
