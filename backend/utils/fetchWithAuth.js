import { toast } from "sonner";

export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers, Authorization: `Bearer ${token}` };

  try {
    const response = await fetch(url, { ...options,
         headers:{   'Content-Type': 'application/json',
    },
    credentials: 'include',
         });

    if (response.status === 401) {
      // Token invalid or expired
      toast.error("Session expired. Please login again.");

      // Clear user session
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // Optional

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/login'; // Adjust to your login route
      }, 2000);

      return null;
    }

    return await response.json();
  } catch (error) {
    toast.error("An error occurred. Please try again.");
    throw error;
  }
};
