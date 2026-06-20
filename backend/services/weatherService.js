import dotenv from 'dotenv';

dotenv.config();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export class WeatherService {
  /**
   * Fetches weather and air pollution metrics for a location (lat, lon)
   * @param {number} lat 
   * @param {number} lon 
   * @returns {Promise<object>}
   */
  static async getWeatherAndAirQuality(lat, lon) {
    const latitude = Number(lat);
    const longitude = Number(lon);

    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'your_openweather_api_key_here') {
      // Return highly realistic mock weather and air quality for regional demonstration
      const mockAqi = Math.round((Math.sin(latitude + longitude) + 1) * 2) + 1; // Generates 1 to 5 based on coordinates
      const mockTemp = Math.round(15 + Math.cos(latitude) * 15); // Generates temperature profile
      
      const mockDescriptions = ['Clear Sky', 'Few Clouds', 'Scattered Clouds', 'Overcast Clouds', 'Light Rain'];
      const descIndex = Math.abs(Math.round(latitude + longitude)) % mockDescriptions.length;

      return {
        isMock: true,
        weather: {
          temp: mockTemp,
          description: mockDescriptions[descIndex],
          humidity: 62,
          windSpeed: 4.2,
        },
        airQuality: {
          aqi: mockAqi, // 1 to 5
          pm2_5: Number((mockAqi * 8.5 + 4).toFixed(1)),
          pm10: Number((mockAqi * 14.2 + 8).toFixed(1)),
          co: Number((mockAqi * 120 + 200).toFixed(0)),
          no2: Number((mockAqi * 6.5 + 5).toFixed(1)),
        },
      };
    }

    try {
      // 1. Fetch current weather
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) throw new Error(`Weather fetch failed: ${weatherRes.statusText}`);
      const weatherData = await weatherRes.json();

      // 2. Fetch air pollution
      const pollutionUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`;
      const pollutionRes = await fetch(pollutionUrl);
      if (!pollutionRes.ok) throw new Error(`Pollution fetch failed: ${pollutionRes.statusText}`);
      const pollutionData = await pollutionRes.json();

      const pollutants = pollutionData.list[0]?.components || {};

      return {
        isMock: false,
        weather: {
          temp: Math.round(weatherData.main?.temp || 0),
          description: weatherData.weather[0]?.description || 'Unknown',
          humidity: weatherData.main?.humidity || 50,
          windSpeed: weatherData.wind?.speed || 0,
        },
        airQuality: {
          aqi: pollutionData.list[0]?.main?.aqi || 3, // 1 to 5
          pm2_5: pollutants.pm2_5 || 0,
          pm10: pollutants.pm10 || 0,
          co: pollutants.co || 0,
          no2: pollutants.no2 || 0,
        },
      };
    } catch (error) {
      console.error('Weather/AQI API error, falling back:', error);
      // Fallback in case of API outages
      return {
        isMock: true,
        error: error.message,
        weather: { temp: 22, description: 'Partly Cloudy', humidity: 55, windSpeed: 3.5 },
        airQuality: { aqi: 2, pm2_5: 12.5, pm10: 22.1, co: 350, no2: 15.2 },
      };
    }
  }
}
