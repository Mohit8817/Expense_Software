import axios from "axios";

// attach token to every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// handle 401 globally
axios.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;

    console.log("Interceptor caught:", status);

    if (status === 401) {
      // 🔥 FORCE logout immediately
      localStorage.clear();

      // avoid multiple redirects
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);