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

export interface ServiceType {
    id: string;
    name: string;
}

export interface Variation {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
}

export interface Service {
    id: string;
    title: string;
    description: string;
    provider: { id: string; name: string; email?: string };
    service_type: ServiceType;
    variations: Variation[];
}

export interface Booking {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    service_variation: {
        price: number;
        duration_minutes: number;
        service: {
            title: string;
            provider: {
                name: string;
            }
        }
    };
    client: {
        name: string;
        email: string;
    };
}

export interface Availability {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
}

export interface AvailabilitySlot {
    time: string;
    available: boolean;
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
    return request<Service[]>(`/services${query}`, { requiresAuth: false });
  },
  getService: (id: string) => request<Service>(`/services/${id}`, { requiresAuth: false }),
  getServiceTypes: () => request<ServiceType[]>('/service-types', { requiresAuth: false }),

  // --- ROTAS DO PRESTADOR ---
  getProviderServices: () => request<Service[]>('/provider/services'),
  
  createService: (data: { title: string, description: string, service_type_id: string }) =>
    request<Service>("/provider/services", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateService: (id: string, data: { title: string, description: string, service_type_id: string }) =>
    request<Service>(`/provider/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteService: (id: string) =>
    request(`/provider/services/${id}`, {
      method: "DELETE",
    }),

  createServiceVariation: (serviceId: string, data: { name: string, price: number, duration_minutes: number }) =>
    request<Variation>(`/provider/services/${serviceId}/variations`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    
  updateServiceVariation: (variationId: string, data: { name: string, price: number, duration_minutes: number }) =>
    request<Variation>(`/provider/variations/${variationId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

  deleteServiceVariation: (variationId: string) =>
    request(`/provider/variations/${variationId}`, {
        method: 'DELETE',
    }),

  getProviderAvailabilities: () => request<Availability[]>('/provider/availabilities'),
  
  createProviderAvailability: (data: { day_of_week: number, start_time: string, end_time: string }) =>
    request<Availability>("/provider/availabilities", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteProviderAvailability: (id: string) =>
    request(`/provider/availabilities/${id}`, {
        method: 'DELETE'
    }),

  // --- ROTAS DE RESERVA (BOOKING) ---
  getProviderBookings: () => request<Booking[]>("/provider/bookings"),
  getClientBookings: () => request<Booking[]>("/client/bookings"),
  updateBookingStatus: (id: string, status: string) =>
    request(`/bookings/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
    
  getProviderAvailabilityForDate: (providerId: string, date: string, duration: number) => 
    request<AvailabilitySlot[]>(`/providers/${providerId}/availability?date=${date}&duration=${duration}`),

  createBooking: (data: { service_variation_id: string; start_time: string }) =>
    request<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
        requiresAuth: true,
    }),
}