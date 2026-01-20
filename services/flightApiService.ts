
/**
 * SERVICE DE CONNEXION BILLETERIE RÉELLE
 * Configuré avec les identifiants Amadeus fournis par l'agence.
 */

export interface FlightOffer {
  id: string;
  source: string;
  itineraries: any[];
  price: {
    total: string;
    currency: string;
    grandTotal: string;
    fees?: any[];
  };
  travelerPricings: {
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: { currency: string, total: string };
  }[];
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
  private baseUrl = "https://api.amadeus.com/v2";
  private apiKey = "2MGrDN2Nh9ZYmdEGkla3WEaO0z9uJWaU";
  private apiSecret = "2jNYtQcQb9sQ6x7Z";

  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAuthToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch("https://api.amadeus.com/v1/security/oauth2/token", {
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

  public async searchFlights(origin: string, destination: string, date: string, adults: number, children: number = 0, infants: number = 0, returnDate?: string): Promise<SearchResponse> {
    const token = await this.getAuthToken();

    const originCode = origin.trim().toUpperCase().slice(0, 3);
    const destCode = destination.trim().toUpperCase().slice(0, 3);

    const performQuery = async (currency: string) => {
      let url = `${this.baseUrl}/shopping/flight-offers?originLocationCode=${originCode}&destinationLocationCode=${destCode}&departureDate=${date}&adults=${adults}&children=${children}&infants=${infants}&max=15&currencyCode=${currency}`;
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

  public async confirmFlightOrder(flightOffer: FlightOffer, travelers: any[], contact: any) {
    const token = await this.getAuthToken();

    const body = {
      data: {
        type: 'flight-order',
        flightOffers: [flightOffer],
        travelers: travelers.map((t, idx) => ({
          id: (idx + 1).toString(),
          dateOfBirth: t.dateOfBirth,
          name: {
            firstName: t.firstName.toUpperCase(),
            lastName: t.lastName.toUpperCase()
          },
          gender: 'MALE', // Simplified for demo/B2B needs, would need real select in production
          contact: {
            emailAddress: contact.email,
            phones: [{
              deviceType: 'MOBILE',
              countryCallingCode: '213',
              number: contact.phone.replace(/[^0-9]/g, '')
            }]
          },
          documents: [{
            documentType: 'PASSPORT',
            number: t.passportNumber,
            expiryDate: '2030-01-01', // Placeholder or real
            issuanceCountry: 'DZA',
            nationality: 'DZA',
            holder: true
          }]
        }))
      }
    };

    try {
      const response = await fetch("https://api.amadeus.com/v1/booking/flight-orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.detail || "Échec de la réservation réelle.");
      }

      return await response.json();
    } catch (error) {
      console.error("GDS Order Error:", error);
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
      price: { total: price, currency: 'DZD', grandTotal: price },
      validatingAirlineCodes: [carrier],
      source: 'GDS',
      travelerPricings: [{
        travelerId: '1',
        fareOption: 'STANDARD',
        travelerType: 'ADULT',
        price: { currency: 'DZD', total: price }
      }]
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
