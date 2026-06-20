import { query } from '../config/db.js';
import { ClimatiqService } from './climatiqService.js';

export class CalculatorService {
  /**
   * Fetches all current emission factors from the database
   */
  static async getFactors() {
    const res = await query('SELECT category, subcategory, factor, unit, source FROM emission_factors');
    return res.rows;
  }

  /**
   * Updates an emission factor (Admin function)
   */
  static async updateFactor(category, subcategory, factor) {
    const res = await query(
      'UPDATE emission_factors SET factor = $1, updated_at = CURRENT_TIMESTAMP WHERE category = $2 AND subcategory = $3 RETURNING *',
      [factor, category, subcategory]
    );
    return res.rows[0];
  }

  /**
   * Calculates emissions for a specific category, subcategory and amount
   */
  static async calculate(category, subcategory, amount) {
    // 1. Try Climatiq API first
    const climatiqResult = await ClimatiqService.calculateEmissions(subcategory, amount);
    if (climatiqResult) {
      return climatiqResult;
    }

    // 2. Fall back to local DB lookup
    const res = await query(
      'SELECT factor, unit FROM emission_factors WHERE category = $1 AND subcategory = $2',
      [category, subcategory]
    );

    if (res.rowCount === 0) {
      throw new Error(`Emission factor not found for category: ${category}, subcategory: ${subcategory}`);
    }

    const { factor, unit } = res.rows[0];
    const calculatedEmissions = amount * factor; // in kg CO2e

    return {
      amount: Number(amount),
      unit,
      emissionFactor: factor,
      calculatedEmissions: Number(calculatedEmissions.toFixed(3)),
      source: 'Database Local Lookup',
    };
  }
}

