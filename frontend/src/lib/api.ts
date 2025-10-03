import { goto } from "$app/navigation";
import { authStore } from "./stores/auth.store";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"

// --- DEFINIÇÃO DOS TIPOS DE RESPOSTA DA API ---
interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'client' | 'provider';
  };
}

interface RegisterResponse {
    message: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: 'client' | 'provider';
    };
}


// --- LÓGICA DE REQUISIÇÃO ---
interface RequestOptions extends RequestInit {
  requiresAuth?: boolean
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options

  const headers = new Headers({
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  });

  const token = authStore.getToken();
  if (requiresAuth && token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    if (response.status === 401) {
      authStore.logout()
      goto("/login", { replaceState: true });
      throw new Error("Não autorizado")
    }

    if (!response.ok) {
        try {
            const error = await response.json();
            throw new Error(error.message || `Erro na API: ${response.status}`);
        } catch (e) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
    }

    if (response.status === 204) {
        return null as T;
    }

    return await response.json()
  } catch (error) {
    console.error("Erro na chamada da API:", error)
    throw error
  }
}


// --- FUNÇÕES DA API EXPORTADAS ---
export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      requiresAuth: false,
    }),

  register: (name: string, email: string, password: string, role: "client" | "provider") =>
    request<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
      requiresAuth: false,
    }),
  
  // --- ROTAS PÚBLICAS (Marketplace) ---
  getServices: (serviceTypeId?: string) => {
    const query = serviceTypeId ? `?type=${serviceTypeId}` : "";
    return request(`/services${query}`, { requiresAuth: false });
  },
  getService: (id: string) => request(`/services/${id}`, { requiresAuth: false }),
  getServiceTypes: () => request('/service-types', { requiresAuth: false }),

  // --- ROTAS DO PRESTADOR ---
  getProviderServices: () => request(`/provider/services`),
  createService: (data: { title: string, description: string, service_type_id: string }) =>
    request("/provider/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateService: (id: string, data: { title: string, description: string, service_type_id: string }) =>
    request(`/provider/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteService: (id: string) =>
    request(`/provider/services/${id}`, {
      method: "DELETE",
    }),

  createServiceVariation: (serviceId: string, data: { name: string, price: number, duration_minutes: number }) =>
    request(`/provider/services/${serviceId}/variations`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
  updateServiceVariation: (variationId: string, data: { name: string, price: number, duration_minutes: number }) =>
    request(`/provider/variations/${variationId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
  deleteServiceVariation: (variationId: string) =>
    request(`/provider/variations/${variationId}`, {
        method: 'DELETE',
    }),
    
  getProviderAvailabilities: () => request(`/provider/availabilities`),
  createProviderAvailability: (data: { day_of_week: number, start_time: string, end_time: string }) =>
    request("/provider/availabilities", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteProviderAvailability: (id: string) =>
    request(`/provider/availabilities/${id}`, {
        method: 'DELETE'
    }),

  getProviderBookings: () => request("/provider/bookings"),
}

