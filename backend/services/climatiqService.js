import dotenv from 'dotenv';

dotenv.config();

const CLIMATIQ_API_KEY = process.env.CLIMATIQ_API_KEY;

// Mapping local subcategories to Climatiq activity IDs
const CLIMATIQ_MAPPINGS = {
  // Transportation (km)
  car_petrol: {
    activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_petrol-engine_size_na-vehicle_age_na-vehicle_weight_na',
    param_name: 'distance',
    param_unit: 'km',
  },
  car_diesel: {
    activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_diesel-engine_size_na-vehicle_age_na-vehicle_weight_na',
    param_name: 'distance',
    param_unit: 'km',
  },
  car_hybrid: {
    activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_hybrid-engine_size_na-vehicle_age_na-vehicle_weight_na',
    param_name: 'distance',
    param_unit: 'km',
  },
  car_electric: {
    activity_id: 'passenger_vehicle-vehicle_type_car-fuel_source_electric-engine_size_na-vehicle_age_na-vehicle_weight_na',
    param_name: 'distance',
    param_unit: 'km',
  },
  motorbike: {
    activity_id: 'passenger_vehicle-vehicle_type_motorcycle-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na',
    param_name: 'distance',
    param_unit: 'km',
  },
  bus: {
    activity_id: 'passenger_vehicle-vehicle_type_bus-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na',
    param_name: 'distance',
    param_unit: 'km',
  },
  train: {
    activity_id: 'passenger_vehicle-vehicle_type_train-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na',
    param_name: 'distance',
    param_unit: 'km',
  },
  flight_short: {
    activity_id: 'passenger_flight-route_type_short_haul-class_na',
    param_name: 'distance',
    param_unit: 'km',
  },
  flight_long: {
    activity_id: 'passenger_flight-route_type_long_haul-class_na',
    param_name: 'distance',
    param_unit: 'km',
  },

  // Electricity (kWh)
  grid_coal: {
    activity_id: 'electricity-facility_type_coal_fired_plant',
    param_name: 'energy',
    param_unit: 'kWh',
  },
  grid_gas: {
    activity_id: 'electricity-facility_type_gas_fired_plant',
    param_name: 'energy',
    param_unit: 'kWh',
  },
  grid_mixed: {
    activity_id: 'electricity-energy_source_grid_mix',
    param_name: 'energy',
    param_unit: 'kWh',
  },
  renewable_solar: {
    activity_id: 'electricity-energy_source_solar',
    param_name: 'energy',
    param_unit: 'kWh',
  },
  renewable_wind: {
    activity_id: 'electricity-energy_source_wind',
    param_name: 'energy',
    param_unit: 'kWh',
  },

  // Food (number of meals - Climatiq has standard factors for meal types)
  meat_heavy: {
    activity_id: 'food_meal-type_heavy_meat',
    param_name: 'money', // Or fallback to meal count weight estimation
    param_unit: 'usd',
    is_meal: true,
    factor: 3.6, // fallback
  },
  meat_average: {
    activity_id: 'food_meal-type_medium_meat',
    param_name: 'money',
    param_unit: 'usd',
    is_meal: true,
    factor: 2.1,
  },
  vegetarian: {
    activity_id: 'food_meal-type_vegetarian',
    param_name: 'money',
    param_unit: 'usd',
    is_meal: true,
    factor: 0.8,
  },
  vegan: {
    activity_id: 'food_meal-type_vegan',
    param_name: 'money',
    param_unit: 'usd',
    is_meal: true,
    factor: 0.5,
  },

  // Waste (kg)
  landfill: {
    activity_id: 'waste-disposal_method_landfill',
    param_name: 'weight',
    param_unit: 'kg',
  },
  recyclable: {
    activity_id: 'waste-disposal_method_recycling',
    param_name: 'weight',
    param_unit: 'kg',
  },
  organic: {
    activity_id: 'waste-disposal_method_composting',
    param_name: 'weight',
    param_unit: 'kg',
  },
  plastic: {
    activity_id: 'waste-material_plastic',
    param_name: 'weight',
    param_unit: 'kg',
  },
  electronic: {
    activity_id: 'waste-material_electronics',
    param_name: 'weight',
    param_unit: 'kg',
  },

  // Water (liters)
  tap_water: {
    activity_id: 'water-supply',
    param_name: 'volume',
    param_unit: 'l',
  },
  bottled_water: {
    activity_id: 'water-bottled',
    param_name: 'volume',
    param_unit: 'l',
  },
};

export class ClimatiqService {
  /**
   * Calculates carbon footprint using Climatiq API
   * @param {string} subcategory 
   * @param {number} amount 
   * @returns {Promise<object|null>}
   */
  static async calculateEmissions(subcategory, amount) {
    if (!CLIMATIQ_API_KEY || CLIMATIQ_API_KEY === 'your_climatiq_api_key_here') {
      return null; // Bypass and fall back to local factors
    }

    const mapping = CLIMATIQ_MAPPINGS[subcategory];
    if (!mapping) {
      return null;
    }

    // Special case for meals (if Climatiq requires monetary parameters, we estimate)
    if (mapping.is_meal) {
      return {
        amount,
        unit: 'meal',
        emissionFactor: mapping.factor,
        calculatedEmissions: Number((amount * mapping.factor).toFixed(3)),
        source: 'Climatiq Fallback Est.',
      };
    }

    try {
      const response = await fetch('https://api.climatiq.io/estimate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLIMATIQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emission_factor: {
            activity_id: mapping.activity_id,
          },
          parameters: {
            [mapping.param_name]: Number(amount),
            [`${mapping.param_name}_unit`]: mapping.param_unit,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Climatiq API responded with status ${response.status}: ${errText}`);
      }

      const result = await response.json();
      return {
        amount: Number(amount),
        unit: mapping.param_unit,
        emissionFactor: result.constituent_gases?.co2e || result.co2e / amount,
        calculatedEmissions: Number(result.co2e.toFixed(3)),
        source: 'Climatiq API v3',
      };
    } catch (error) {
      console.error('Climatiq calculation error:', error);
      return null; // Gracefully fall back to local DB factors
    }
  }
}
