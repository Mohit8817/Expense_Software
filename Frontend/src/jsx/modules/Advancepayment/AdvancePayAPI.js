const BASE_URL = import.meta.env.VITE_BACKEND_API_URL;

// GET ALL USERS (Reporting Heads)
export const getUsers = async () => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${BASE_URL}users/get-reporting-heads`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return { ok: true, result: data };
  } catch (error) {
    console.error("Get Users Error:", error);
    return { ok: false, result: [] };
  }
};

// GET PROJECTS & INTERVENTIONS
export const getProjectsAndInterventions = async () => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${BASE_URL}expense/add-expense`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return {
      ok: true,
      projects: data.projects || [],
      interventions: data.interventions || [],
    };
  } catch (error) {
    console.error("Get Projects Error:", error);
    return { ok: false, projects: [], interventions: [] };
  }
};

// CREATE ADVANCE EXPENSE
export const createAdvanceExpense = async (formData) => {
  const token = localStorage.getItem("token");
  const data = new FormData();

  Object.entries(formData).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      data.append(key, value);
    }
  });

  const response = await fetch(`${BASE_URL}payment/create-advance-expense`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // ❌ Do NOT set Content-Type — browser sets multipart boundary automatically
    },
    body: data,
  });

  const result = await response.json();

  if (!response.ok) {
    if (result.errors?.length) {
      const messages = result.errors.map((e) => e.message).join("\n");
      throw new Error(messages);
    }
    throw new Error(result.message || "Failed to create advance expense");
  }

  return result;
};



// GET ADVANCE PAYMENT LIST
export const getAdvancePaymentList = async () => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${BASE_URL}payment/view`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return { ok: true, result: data.data || [] };
  } catch (error) {
    console.error("Get Advance Payment List Error:", error);
    return { ok: false, result: [] };
  }
};



// SETTLE EXPENSE
export const settleExpense = async ({ user_id, amount, remarks }) => {
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`${BASE_URL}payment/settlement-expense`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id, amount, remarks }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Settlement failed");
    return { ok: true, result: data };
  } catch (error) {
    console.error("Settlement Error:", error);
    return { ok: false, message: error.message };
  }
};