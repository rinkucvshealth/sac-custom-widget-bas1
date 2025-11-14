import axios from 'axios';
// @ts-ignore
import * as xsenv from '@sap/xsenv';

const DEFAULT_CLOUD_CONNECTOR_LOCATION_ID = 'SAP_DI_Test';

export interface Destination {
  Name: string;
  Type: string;
  URL: string;
  Authentication: string;
  User?: string;
  Password?: string;
  ProxyType: string;
  sapclient?: string;
  cloudConnectorLocationId?: string;
}

export class DestinationService {
  private destinationServiceUrl: string;
  private uaaService: any;

  constructor() {
    try {
      // Get destination service configuration from environment (only destination, not uaa)
      const services = xsenv.getServices({
        destination: { tag: 'destination' }
      });

      this.destinationServiceUrl = services.destination.uri;
      console.log('Destination service found in environment:', this.destinationServiceUrl);
    } catch (error) {
      console.warn('Destination service not found in environment, using fallback configuration');
      console.log('Error details:', (error as any).message);
      
      // Try to get all services from VCAP_SERVICES environment variable
      try {
        const vcapServices = JSON.parse(process.env.VCAP_SERVICES || '{}');
        const destinationServices = Object.keys(vcapServices).filter(key => 
          key.toLowerCase().includes('destination')
        );
        
        if (destinationServices.length > 0) {
          const firstDestinationService = vcapServices[destinationServices[0]][0];
          this.destinationServiceUrl = firstDestinationService.credentials.uri;
          console.log(`Found ${destinationServices.length} destination services, using:`, this.destinationServiceUrl);
        } else {
          throw new Error('No destination service found in VCAP_SERVICES');
        }
      } catch (fallbackError) {
        console.log('Fallback service detection failed:', (fallbackError as any).message);
        // Final fallback to environment variables
        this.destinationServiceUrl = process.env.DESTINATION_SERVICE_URL || '';
      }
    }
  }

  async getDestination(destinationName: string): Promise<Destination | null> {
    try {
      console.log(`Getting destination: ${destinationName}`);
      
      // If we have a destination service URL, try to fetch from BTP
      if (this.destinationServiceUrl) {
        console.log('Fetching destination from BTP destination service');
        
        try {
          // Get authentication token for destination service
          const token = await this.getDestinationServiceToken();
          
          // Call the actual BTP destination service API
          const response = await axios.get(`${this.destinationServiceUrl}/destination-configuration/v1/destinations/${destinationName}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            timeout: 10000
          });

          if (response.data && response.data.destinationConfiguration) {
            const config = response.data.destinationConfiguration;
            console.log('Successfully fetched destination from BTP:', config);
            
            const destination: Destination = {
              Name: destinationName,
              Type: config.Type || 'HTTP',
              URL: config.URL,
              Authentication: config.Authentication || 'BasicAuthentication',
              User: config.User || process.env.SAP_USERNAME,
              Password: config.Password || process.env.SAP_PASSWORD,
              ProxyType: config.ProxyType || 'OnPremise',
              sapclient: config.sapclient || process.env.SAP_CLIENT,
                cloudConnectorLocationId: config.CloudConnectorLocationId || config.cloudConnectorLocationId || process.env.CLOUD_CONNECTOR_LOCATION_ID || DEFAULT_CLOUD_CONNECTOR_LOCATION_ID
            };

            console.log('Using BTP destination service for', destinationName);
            console.log('Destination URL:', destination.URL);
            return destination;
          }
        } catch (apiError: any) {
          console.error('Error calling BTP destination service API:', apiError.message);
          if (apiError.response) {
            console.error('API Response Status:', apiError.response.status);
            console.error('API Response Data:', apiError.response.data);
          }
          console.log('Falling back to environment configuration');
        }
      }
      
      // Fallback to environment variables
      console.log('No destination service URL found, using environment fallback');
      const destination: Destination = {
        Name: destinationName,
        Type: 'HTTP',
        URL: `http://${process.env.SAP_HOST}:${process.env.SAP_PORT}`,
        Authentication: 'BasicAuthentication',
        User: process.env.SAP_USERNAME,
        Password: process.env.SAP_PASSWORD,
        ProxyType: 'OnPremise',
          sapclient: process.env.SAP_CLIENT,
          cloudConnectorLocationId: process.env.CLOUD_CONNECTOR_LOCATION_ID || DEFAULT_CLOUD_CONNECTOR_LOCATION_ID
      };

      console.log('Using environment fallback for', destinationName);
      console.log('Destination URL:', destination.URL);
      return destination;
    } catch (error) {
      console.error('Error fetching destination:', error);
      return null;
    }
  }

  async createAxiosClient(destination: Destination): Promise<any> {
    const config: any = {
      baseURL: destination.URL,
      timeout: 30000,
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    };

    // Add authentication if provided
    if (destination.Authentication === 'BasicAuthentication' && destination.User && destination.Password) {
      config.auth = {
        username: destination.User,
        password: destination.Password
      };
    }

    // Add SAP client parameter
    if (destination.sapclient) {
      config.params = {
        'sap-client': destination.sapclient
      };
    }

    // For OnPremise destinations, we need to use the connectivity service
    if (destination.ProxyType === 'OnPremise') {
      console.log('Configuring OnPremise destination with connectivity service');
      
      try {
        // Get connectivity service configuration
        const connectivityToken = await this.getConnectivityToken();
        const connectivityServiceUrl = await this.getConnectivityServiceUrl();
        
        if (connectivityServiceUrl && connectivityToken) {
          console.log('Using connectivity service for OnPremise routing');
          
          // For OnPremise destinations, we need to route through the connectivity service
          // The base URL should be the connectivity service URL
          config.baseURL = connectivityServiceUrl;
          
          // Set headers for OnPremise routing through connectivity service
          config.headers = {
            ...config.headers,
            'SAP-Connectivity-Authentication': `Bearer ${connectivityToken}`,
            'SAP-Connectivity-Destination': destination.Name,
              'Host': destination.URL.replace('http://', '').replace('https://', '') // Set the target host
          };

            if (destination.cloudConnectorLocationId) {
              config.headers['SAP-Connectivity-Location-ID'] = destination.cloudConnectorLocationId;
            }
          
          // Add proxy authentication for OnPremise destinations
          if (connectivityServiceUrl.startsWith('http://') || connectivityServiceUrl.startsWith('https://')) {
            // For HTTP proxy, add Proxy-Authorization header
            config.headers['Proxy-Authorization'] = `Bearer ${connectivityToken}`;
          }
          
          console.log(`OnPremise routing configured: ${connectivityServiceUrl} -> ${destination.URL}`);
        } else {
          console.log('Connectivity service not available, falling back to direct connection');
          // Fall back to direct connection if connectivity service is not available
            if (destination.cloudConnectorLocationId) {
              config.headers = {
                ...config.headers,
                'SAP-Connectivity-Location-ID': destination.cloudConnectorLocationId
              };
            }
        }
      } catch (error) {
        console.error('Error configuring OnPremise connectivity:', error);
        // Fall back to direct connection
          if (destination.cloudConnectorLocationId) {
            config.headers = {
              ...config.headers,
              'SAP-Connectivity-Location-ID': destination.cloudConnectorLocationId
            };
          }
      }
    }

    return axios.create(config);
  }

  private async getConnectivityToken(): Promise<string> {
    try {
      // Try to get connectivity service from VCAP_SERVICES
      const vcapServices = JSON.parse(process.env.VCAP_SERVICES || '{}');
      const connectivityServices = Object.keys(vcapServices).filter(key => 
        key.toLowerCase().includes('connectivity')
      );
      
      if (connectivityServices.length > 0) {
        const firstConnectivityService = vcapServices[connectivityServices[0]][0];
        const credentials = firstConnectivityService.credentials;
        
        // Use the connectivity service credentials to get a token
        if (credentials.clientid && credentials.clientsecret) {
          const tokenResponse = await axios.post(`${credentials.url}/oauth/token`, 
            'grant_type=client_credentials',
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${credentials.clientid}:${credentials.clientsecret}`).toString('base64')}`
              },
              timeout: 10000
            }
          );
          
          if (tokenResponse.data && tokenResponse.data.access_token) {
            console.log('Successfully obtained connectivity service token');
            return tokenResponse.data.access_token;
          }
        }
      }
      
      console.log('No connectivity service found, using empty token');
      return '';
    } catch (error) {
      console.error('Error getting connectivity token:', error);
      return '';
    }
  }

  private async getConnectivityServiceUrl(): Promise<string | null> {
    try {
      // Try to get connectivity service from VCAP_SERVICES
      const vcapServices = JSON.parse(process.env.VCAP_SERVICES || '{}');
      const connectivityServices = Object.keys(vcapServices).filter(key => 
        key.toLowerCase().includes('connectivity')
      );
      
      if (connectivityServices.length > 0) {
        const firstConnectivityService = vcapServices[connectivityServices[0]][0];
        const credentials = firstConnectivityService.credentials;
        
        // For OnPremise destinations, we need to use the OnPremise proxy host
        // instead of trying to construct a connectivity service URL
        if (credentials.onpremise_proxy_host && credentials.onpremise_proxy_port) {
          const proxyUrl = `http://${credentials.onpremise_proxy_host}:${credentials.onpremise_proxy_port}`;
          console.log(`Using OnPremise proxy URL: ${proxyUrl}`);
          return proxyUrl;
        }
        
        // Also check for SOCKS5 proxy as alternative
        if (credentials.onpremise_socks5_proxy_port) {
          const socksProxyUrl = `socks5://${credentials.onpremise_proxy_host}:${credentials.onpremise_socks5_proxy_port}`;
          console.log(`Using SOCKS5 proxy URL: ${socksProxyUrl}`);
          return socksProxyUrl;
        }
        
        // Fallback to the authentication service URL if no proxy host is available
        if (credentials.url) {
          console.log(`Using authentication service URL as fallback: ${credentials.url}`);
          return credentials.url;
        }
      }
      
      console.log('No connectivity service URL found');
      return null;
    } catch (error) {
      console.error('Error getting connectivity service URL:', error);
      return null;
    }
  }

  private async getDestinationServiceToken(): Promise<string> {
    try {
      // In BTP, we can use the bound service credentials for authentication
      // The destination service should be bound to the app and provide credentials
      let destinationService = null;
      
      try {
        const services = xsenv.getServices({ destination: { tag: 'destination' } });
        destinationService = services.destination;
      } catch (error) {
        // Try to get all services from VCAP_SERVICES environment variable
        try {
          const vcapServices = JSON.parse(process.env.VCAP_SERVICES || '{}');
          const destinationServices = Object.keys(vcapServices).filter(key => 
            key.toLowerCase().includes('destination')
          );
          
          if (destinationServices.length > 0) {
            destinationService = vcapServices[destinationServices[0]][0];
          }
        } catch (vcapError) {
          console.log('VCAP_SERVICES parsing failed:', (vcapError as any).message);
        }
      }
      
      if (destinationService && destinationService.credentials) {
        const creds = destinationService.credentials;
        
        // Use client credentials flow for service-to-service authentication
        if (creds.clientid && creds.clientsecret && creds.url) {
          console.log('Getting OAuth token for destination service...');
          
          const tokenResponse = await axios.post(`${creds.url}/oauth/token`, 
            'grant_type=client_credentials',
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${creds.clientid}:${creds.clientsecret}`).toString('base64')}`
              },
              timeout: 10000
            }
          );

          if (tokenResponse.data && tokenResponse.data.access_token) {
            console.log('Successfully obtained destination service token');
            return tokenResponse.data.access_token;
          }
        }
      }
      
      console.log('No valid destination service credentials found, using empty token');
      return '';
    } catch (error: any) {
      console.error('Error getting destination service token:', error.message);
      return '';
    }
  }
}
