import React, { useState } from 'react';
import OpenAI from 'openai';
import './App.css';

interface WeatherData {
  name: string;
  main: {
    temp: number;
    humidity: number;
    feels_like: number;
  };
  weather: {
    description: string;
    icon: string;
    main: string;
  }[];
  wind: {
    speed: number;
  };
  sys: {
    country: string;
  };
}

const App: React.FC = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiDescription, setAiDescription] = useState('');

  const WEATHER_API_KEY = 'aae308440e0fc63e257c420d973a245f';
  const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY'; // Replace with your OpenAI API key
  const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const getAIWeatherDescription = async (weatherData: WeatherData) => {
    try {
      const prompt = `Given the following weather conditions in ${weatherData.name}, ${weatherData.sys.country}:
      - Temperature: ${Math.round(weatherData.main.temp)}°C
      - Feels like: ${Math.round(weatherData.main.feels_like)}°C
      - Weather: ${weatherData.weather[0].description}
      - Humidity: ${weatherData.main.humidity}%
      - Wind Speed: ${weatherData.wind.speed} m/s
      
      Please provide a brief, natural description of the weather and what it means for people's daily activities.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
      });

      setAiDescription(response.choices[0].message.content || '');
    } catch (err) {
      console.error('Error getting AI description:', err);
      setAiDescription('AI description unavailable at the moment.');
    }
  };

  const fetchWeather = async () => {
    if (!city) return;
    
    setLoading(true);
    setError('');
    setAiDescription('');
    
    try {
      const response = await fetch(`${WEATHER_API_URL}?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
      if (!response.ok) {
        throw new Error('City not found');
      }
      const data: WeatherData = await response.json();
      setWeather(data);
      await getAIWeatherDescription(data);
    } catch (err) {
      setError('City not found. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      fetchWeather();
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Smart Weather Forecast</h1>
        
        <div className="search-box">
          <input
            type="text"
            placeholder="Enter city name..."
            value={city}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button onClick={fetchWeather} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}
       
        {weather && !loading && (
          <div className="weather-card">
            <div className="location">
              <h2>{weather.name}, {weather.sys.country}</h2>
            </div>
            <div className="weather-info">
              <div className="temperature">
                {Math.round(weather.main.temp)}°C
                <div className="feels-like">
                  Feels like: {Math.round(weather.main.feels_like)}°C
                </div>
              </div>
              <div className="description">
                {weather.weather[0].main}
                <div className="sub-description">
                  {weather.weather[0].description}
                </div>
              </div>
              <div className="details">
                <div className="detail-item">
                  <span className="label">Humidity</span>
                  <span className="value">{weather.main.humidity}%</span>
                </div>
                <div className="detail-item">
                  <span className="label">Wind Speed</span>
                  <span className="value">{weather.wind.speed} m/s</span>
                </div>
              </div>
              {aiDescription && (
                <div className="ai-description">
                  <h3>AI Weather Insight:</h3>
                  <p>{aiDescription}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App; 