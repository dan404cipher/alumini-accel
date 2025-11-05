import { getAuthTokenOrNull } from "@/utils/auth";

// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

// Types matching your frontend
export interface Campaign {
  _id: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: string;
  images: string[];
  isPublic: boolean;
  allowAnonymous: boolean;
  featured: boolean;
  tags: string[];
  location?: string;
  contactInfo: {
    email: string;
    phone?: string;
    person?: string;
  };
  statistics: {
    totalDonations: number;
    totalDonors: number;
    averageDonation: number;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tenantId: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  // Frontend calculated fields
  raised: number;
  donors: number;
  progressPercentage: number;
  daysRemaining: number;
  isActive: boolean;
  imageUrl: string;
}

export interface Donation {
  _id: string;
  donor: string;
  tenantId: string;
  campaignId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  donationType: string;
  campaign?: string;
  cause?: string;
  message?: string;
  anonymous: boolean;
  receiptSent: boolean;
  receiptEmail?: string;
  transactionId?: string;
  paymentGateway?: string;
  screenshot?: string;
  eventId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignData {
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  currency?: string;
  startDate: string;
  endDate: string;
  location?: string;
  contactInfo: {
    email: string;
    phone?: string;
    person?: string;
  };
  tags?: string[];
  allowAnonymous?: boolean;
}

export interface CreateDonationData {
  campaignId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
  donationType?: string;
  message?: string;
  anonymous?: boolean;
  // Donor information
  donorName?: string;
  donorEmail?: string;
  donorPhone?: string;
  donorAddress?: string;
  taxDeductible?: boolean;
  // Razorpay payment fields
  paymentId?: string;
  orderId?: string;
  signature?: string;
}

class DonationApiService {
  private baseUrl = API_BASE_URL;

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Get token from localStorage or sessionStorage (same logic as AuthContext)
    const token = getAuthTokenOrNull();

    if (!token) {
      throw new Error("Access token is required");
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("API Error:", {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        errorData,
      });
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  // Campaign API methods
  async getAllCampaigns(params?: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      campaigns: Campaign[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
    count: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/campaigns?${queryString}` : "/campaigns";

    return this.makeRequest(endpoint);
  }

  async getCampaignById(
    id: string
  ): Promise<{ success: boolean; data: Campaign }> {
    return this.makeRequest(`/campaigns/${id}`);
  }

  async createCampaign(
    data: CreateCampaignData
  ): Promise<{ success: boolean; data: Campaign; message: string }> {
    return this.makeRequest("/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCampaign(
    id: string,
    data: Partial<CreateCampaignData>
  ): Promise<{ success: boolean; data: Campaign; message: string }> {
    return this.makeRequest(`/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteCampaign(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/campaigns/${id}`, {
      method: "DELETE",
    });
  }

  async getMyCampaigns(): Promise<{
    success: boolean;
    data: Campaign[];
    count: number;
  }> {
    return this.makeRequest("/campaigns/my-campaigns");
  }

  async getCampaignStats(): Promise<{ success: boolean; data: any }> {
    return this.makeRequest("/campaigns/stats");
  }

  async uploadCampaignImage(
    id: string,
    file: File
  ): Promise<{
    success: boolean;
    data: { imageUrl: string };
    message: string;
  }> {
    const formData = new FormData();
    formData.append("image", file);

    const token = getAuthTokenOrNull();
    if (!token) {
      throw new Error("Access token is required");
    }

    const response = await fetch(`${this.baseUrl}/campaigns/${id}/image`, {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  // Donation API methods
  async getAllDonations(): Promise<{
    success: boolean;
    data: Donation[];
    count: number;
  }> {
    return this.makeRequest("/donations");
  }

  async getDonationById(
    id: string
  ): Promise<{ success: boolean; data: Donation }> {
    return this.makeRequest(`/donations/${id}`);
  }

  async createDonation(
    data: CreateDonationData
  ): Promise<{ success: boolean; data: Donation; message: string }> {
    return this.makeRequest("/donations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateDonation(
    id: string,
    data: Partial<CreateDonationData>
  ): Promise<{ success: boolean; data: Donation; message: string }> {
    return this.makeRequest(`/donations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteDonation(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/donations/${id}`, {
      method: "DELETE",
    });
  }

  async getMyDonations(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      donations: Donation[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
    count: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/donations/my-donations?${queryString}`
      : "/donations/my-donations";

    return this.makeRequest(endpoint);
  }

  async getDonationStats(): Promise<{ success: boolean; data: any }> {
    return this.makeRequest("/donations/stats");
  }
}

export const donationApi = new DonationApiService();
