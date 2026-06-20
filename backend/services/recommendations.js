import { query, dbType } from '../config/db.js';
import { GroqService } from './groqService.js';

export class RecommendationsService {
  /**
   * Generates dynamic, personalized sustainability recommendations based on user activities
   */
  static async getPersonalized(userId) {
    // 1. Fetch user's emissions by category in the last 30 days
    const emissionsQuery = dbType === 'postgres'
      ? `SELECT category, SUM(calculated_emissions) as total 
         FROM carbon_activities 
         WHERE user_id = $1 AND activity_date >= CURRENT_DATE - INTERVAL '30 days' 
         GROUP BY category`
      : `SELECT category, SUM(calculated_emissions) as total 
         FROM carbon_activities 
         WHERE user_id = $1 AND activity_date >= date('now', '-30 days') 
         GROUP BY category`;
    const emissionsRes = await query(emissionsQuery, [userId]);

    const categories = {
      transportation: 0,
      electricity: 0,
      food: 0,
      waste: 0,
      water: 0,
    };

    let grandTotal = 0;
    emissionsRes.rows.forEach((row) => {
      categories[row.category] = Number(row.total);
      grandTotal += Number(row.total);
    });

    // 2. Try generating AI recommendations via Groq first
    const aiRecs = await GroqService.getAIRecommendations(categories);
    if (aiRecs) {
      return aiRecs;
    }

    // 3. Fetch user's current goals and profile preferences (Fallback compilation)
    const profileRes = await query('SELECT preferences FROM profiles WHERE id = $1', [userId]);
    const preferences = profileRes.rows[0]?.preferences 
      ? (typeof profileRes.rows[0].preferences === 'string' 
         ? JSON.parse(profileRes.rows[0].preferences) 
         : profileRes.rows[0].preferences)
      : {};

    const recommendations = [];


    // Base default recommendations (if no activity logged yet)
    if (grandTotal === 0) {
      return [
        {
          id: 'rec_general_1',
          title: 'Conduct a Full Footprint Audit',
          description: 'Log at least one activity in each category (Transport, Energy, Food, Waste, Water) to unlock hyper-personalized recommendations.',
          category: 'general',
          estimatedSavings: 20, // kg CO2e / month
          difficulty: 'Easy',
          impact: 'Low',
          icon: 'ClipboardList',
        },
        {
          id: 'rec_food_veggie',
          title: 'Try Vegetarian Days',
          description: 'Swap three meat-based meals this week for plant-based alternatives to lower your agricultural carbon footprint.',
          category: 'food',
          estimatedSavings: 15,
          difficulty: 'Easy',
          impact: 'Medium',
          icon: 'Leaf',
        },
        {
          id: 'rec_energy_led',
          title: 'Switch to LED Lighting',
          description: 'Replace traditional incandescent light bulbs with energy-efficient LED bulbs to reduce household energy waste by 75%.',
          category: 'electricity',
          estimatedSavings: 25,
          difficulty: 'Easy',
          impact: 'Medium',
          icon: 'Zap',
        }
      ];
    }

    // 3. Transportation recommendations
    const transportPct = (categories.transportation / grandTotal) * 100;
    if (transportPct > 30 || categories.transportation > 150) {
      recommendations.push({
        id: 'rec_trans_public',
        title: 'Adopt Public Transit Commutes',
        description: 'Replace at least 2 driving days a week with bus or train transit to reduce travel footprint by up to 80%.',
        category: 'transportation',
        estimatedSavings: Math.round(categories.transportation * 0.25),
        difficulty: 'Medium',
        impact: 'High',
        icon: 'Bus',
      });
      recommendations.push({
        id: 'rec_trans_carpool',
        title: 'Carpool with Coworkers',
        description: 'Share your commute route with colleagues or use ride-sharing. Splitting travel emissions instantly cuts car footprints in half.',
        category: 'transportation',
        estimatedSavings: Math.round(categories.transportation * 0.15),
        difficulty: 'Easy',
        impact: 'Medium',
        icon: 'Users',
      });
    }

    // 4. Electricity recommendations
    const electricityPct = (categories.electricity / grandTotal) * 100;
    if (electricityPct > 25 || categories.electricity > 100) {
      recommendations.push({
        id: 'rec_elec_solar',
        title: 'Switch to a Renewable Energy Plan',
        description: 'Check if your utility company offers a 100% green energy plan, or consider community solar programs to offset grid emissions.',
        category: 'electricity',
        estimatedSavings: Math.round(categories.electricity * 0.8),
        difficulty: 'Medium',
        impact: 'High',
        icon: 'Sun',
      });
      recommendations.push({
        id: 'rec_elec_phantom',
        title: 'Eliminate Phantom Electric Loads',
        description: 'Unplug chargers, routers, and appliances when going away for weekends. Use smart power strips to shut down idle power draw.',
        category: 'electricity',
        estimatedSavings: Math.round(categories.electricity * 0.08),
        difficulty: 'Easy',
        impact: 'Low',
        icon: 'ZapOff',
      });
    }

    // 5. Food recommendations
    const foodPct = (categories.food / grandTotal) * 100;
    if (foodPct > 20 || categories.food > 80) {
      recommendations.push({
        id: 'rec_food_reduce_meat',
        title: 'Participate in Meatless Mondays',
        description: 'Skip red meat once a week. Swapping beef or lamb for grain/veggie dishes saves significant amounts of carbon and water.',
        category: 'food',
        estimatedSavings: Math.round(categories.food * 0.15),
        difficulty: 'Easy',
        impact: 'Medium',
        icon: 'Leaf',
      });
      recommendations.push({
        id: 'rec_food_vegan_swap',
        title: 'Swap Dairy for Plant-Based Milk',
        description: 'Transition from cow dairy to oat, almond, or soy milk. Dairy production is a major source of methane and farm emissions.',
        category: 'food',
        estimatedSavings: Math.round(categories.food * 0.1),
        difficulty: 'Easy',
        impact: 'Medium',
        icon: 'Milk',
      });
    }

    // 6. Waste recommendations
    const wastePct = (categories.waste / grandTotal) * 100;
    if (wastePct > 10 || categories.waste > 30) {
      recommendations.push({
        id: 'rec_waste_compost',
        title: 'Start Organic Composting',
        description: 'Divert food scraps and garden waste from landfills into a compost bin. Landfill food waste decomposes anaerobically, generating methane.',
        category: 'waste',
        estimatedSavings: Math.round(categories.waste * 0.4),
        difficulty: 'Medium',
        impact: 'Medium',
        icon: 'Trash2',
      });
      recommendations.push({
        id: 'rec_waste_reusables',
        title: 'Ditch Single-Use Plastic Bags',
        description: 'Always carry canvas shopping bags and reusable water flasks. This directly reduces manufacturing demand for synthetic plastics.',
        category: 'waste',
        estimatedSavings: 8,
        difficulty: 'Easy',
        impact: 'Low',
        icon: 'ShoppingBag',
      });
    }

    // 7. Water recommendations
    const waterPct = (categories.water / grandTotal) * 100;
    if (waterPct > 5 || categories.water > 15) {
      recommendations.push({
        id: 'rec_water_shower',
        title: 'Trim Showers to 5 Minutes',
        description: 'Reducing hot water duration conserves fresh water supplies and cuts down on the gas/electricity required for water heaters.',
        category: 'water',
        estimatedSavings: 12,
        difficulty: 'Easy',
        impact: 'Low',
        icon: 'Droplet',
      });
    }

    // Ensure we always have at least 3 items
    if (recommendations.length < 3) {
      recommendations.push({
        id: 'rec_general_habits',
        title: 'Conduct Sustainable Habits Review',
        description: 'Check your logs weekly to track trends and compare your metrics with the global average footprint target.',
        category: 'general',
        estimatedSavings: 10,
        difficulty: 'Easy',
        impact: 'Low',
        icon: 'BarChart2',
      });
    }

    return recommendations;
  }
}
