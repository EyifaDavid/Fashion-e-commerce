import {jwtDecode} from "jwt-decode";

export const tokenIsValid = (token) => {
  if (!token) return false;
  try {
    const { exp } = jwtDecode(token);
    return Date.now() < exp * 1000; // exp is in seconds
  } catch (err) {
    return false;
  }
};
