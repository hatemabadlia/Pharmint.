import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

const RedirectBasedOnAuth = ({ fallback }) => {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/home'); // Logged-in users go to home
      } else {
        setChecked(true); // Not logged in → show fallback (LandingPage)
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return checked ? fallback : null;
};

export default RedirectBasedOnAuth;
