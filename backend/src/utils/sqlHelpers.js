/**
 * SQL Helper Utilities
 * 
 * Provides utilities for handling SQL parameter binding and preventing undefined
 * values from being passed to MySQL2 driver.
 */

/**
 * Filter undefined values from an object
 * 
 * @param {Object} obj - Object to filter
 * @returns {Object} - { filtered: Object with undefined values removed, removed: Array of removed keys }
 */
export function filterUndefined(obj) {
  if (!obj || typeof obj !== 'object') {
    return { filtered: obj, removed: [] };
  }

  const filtered = {};
  const removed = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      removed.push(key);
    } else {
      filtered[key] = value;
    }
  }

  return { filtered, removed };
}

/**
 * Build INSERT statement from filtered data
 * 
 * @param {string} table - Table name
 * @param {Object} data - Data object (should be pre-filtered of undefined values)
 * @returns {Object} - { sql, values, fields, placeholders }
 */
export function buildInsertStatement(table, data) {
  if (!table || typeof table !== 'string') {
    throw new Error('Table name must be a non-empty string');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Data must be a non-null object');
  }

  const keys = Object.keys(data);
  const values = Object.values(data);

  if (keys.length === 0) {
    throw new Error('Data object cannot be empty');
  }

  const fields = keys.join(', ');
  const placeholders = keys.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${fields}) VALUES (${placeholders})`;

  return {
    sql,
    values,
    fields,
    placeholders
  };
}

/**
 * Assert that no undefined parameters exist in values array
 * Throws a clear error if any undefined values are found
 * 
 * @param {Array} values - Array of parameter values
 * @param {Array|string} fields - Optional field names for better error reporting
 * @throws {Error} - Throws UNDEFINED_SQL_PARAM error if undefined values found
 */
export function assertNoUndefinedParams(values, fields = null) {
  if (!Array.isArray(values)) {
    throw new Error('Values must be an array');
  }

  const undefinedIndexes = [];
  values.forEach((value, index) => {
    if (value === undefined) {
      undefinedIndexes.push(index);
    }
  });

  if (undefinedIndexes.length > 0) {
    const error = new Error(
      `Undefined SQL parameters detected at positions: ${undefinedIndexes.join(', ')}. ` +
      `To pass SQL NULL use JS null, not undefined.`
    );
    error.code = 'UNDEFINED_SQL_PARAM';
    error.undefinedIndexes = undefinedIndexes;
    
    if (fields) {
      const fieldNames = Array.isArray(fields) ? fields : fields.split(',').map(f => f.trim());
      const undefinedFields = undefinedIndexes.map(i => fieldNames[i]).filter(Boolean);
      if (undefinedFields.length > 0) {
        error.undefinedFields = undefinedFields;
        error.message += ` Affected fields: ${undefinedFields.join(', ')}`;
      }
    }

    throw error;
  }
}