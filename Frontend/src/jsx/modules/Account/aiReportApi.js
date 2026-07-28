const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;
const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

export const askAiReport = async ({ question, from, to }) => {
  const res = await fetch(`${BASE_URL}account/ai-report/query`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ question, from, to }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to get AI answer");
  return data.data;
};
