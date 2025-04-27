import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-muted p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold">AI Meal Planner</h1>
          <p className="text-muted-foreground mt-2">Your smart kitchen companion</p>
        </div>
        
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;