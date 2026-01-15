
/**
 * SERVICE DE CONNEXION BILLETERIE RÉELLE
 * Configuré avec les identifiants Amadeus fournis par l'agence.
 */

export interface FlightOffer {
  id: string;
  itineraries: any[];
  price: {
    total: string;
    currency: string;
  };
  validatingAirlineCodes: string[];
}

export interface SearchResponse {
  data: FlightOffer[];
  dictionaries?: {
    carriers: Record<string, string>;
  };
  meta?: {
    count: number;
  };
}

class FlightApiService {
  private baseUrl = "https://test.api.amadeus.com/v2"; 
  private apiKey = "2MGrDN2Nh9ZYmdEGkla3WEaO0z9uJWaU";
  private apiSecret = "2jNYtQcQb9sQ6x7Z";
  
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAuthToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.apiSecret}`
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || "Erreur d'authentification Amadeus");
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 20) * 1000;
      return this.accessToken;
    } catch (error) {
      console.error("GDS Auth Error:", error);
      throw new Error("Connexion GDS impossible.");
    }
  }

  public async searchFlights(origin: string, destination: string, date: string, adults: number, returnDate?: string): Promise<SearchResponse> {
    const token = await this.getAuthToken();
    
    const originCode = origin.trim().toUpperCase().slice(0, 3);
    const destCode = destination.trim().toUpperCase().slice(0, 3);

    const performQuery = async (currency: string) => {
      let url = `${this.baseUrl}/shopping/flight-offers?originLocationCode=${originCode}&destinationLocationCode=${destCode}&departureDate=${date}&adults=${adults}&max=15&currencyCode=${currency}`;
      if (returnDate) {
        url += `&returnDate=${returnDate}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { ok: response.ok, status: response.status, data: await response.json() };
    };

    try {
      let result = await performQuery('DZD');
      if (!result.ok) {
        result = await performQuery('EUR');
      }

      if (!result.ok) {
        const detail = result.data.errors?.[0]?.detail || "Erreur GDS";
        throw new Error(detail);
      }

      return {
        data: result.data.data || [],
        dictionaries: result.data.dictionaries
      };
    } catch (error) {
      console.error("GDS Search Error:", error);
      throw error;
    }
  }

  public getMockFlights(from: string, to: string, isRoundTrip: boolean): SearchResponse {
    const mock = (id: string, carrier: string, price: string) => ({
      id,
      itineraries: [
        {
          segments: [{
            departure: { at: '2024-06-15T09:30:00' },
            arrival: { at: '2024-06-15T12:45:00' }
          }]
        },
        ...(isRoundTrip ? [{
          segments: [{
            departure: { at: '2024-06-22T15:00:00' },
            arrival: { at: '2024-06-22T18:15:00' }
          }]
        }] : [])
      ],
      price: { total: price, currency: 'DZD' },
      validatingAirlineCodes: [carrier]
    });

    return {
      data: [
        mock('mock-1', 'AH', isRoundTrip ? '85000' : '45800'),
        mock('mock-2', 'AF', isRoundTrip ? '92000' : '52400'),
        mock('mock-3', 'TK', isRoundTrip ? '78000' : '38900')
      ],
      dictionaries: {
        carriers: {
          'AH': 'Air Algérie',
          'AF': 'Air France',
          'TK': 'Turkish Airlines'
        }
      }
    };
  }
}

export const flightApi = new FlightApiService();
