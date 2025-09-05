/**
 * SQL Helper Utilities
 * 
 * Provides utilities for handling SQL parameter binding and preventing undefined
 * values from being passed to MySQL2 driver.
 * Includes comprehensive backend logging for all SQL operations.
 */

/**
 * Filter undefined values from an object
 * 
 * @param {Object} obj - Object to filter
 * @returns {Object} - { filtered: Object with undefined values removed, removed: Array of removed keys }
 */
export function filterUndefined(obj) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [SQL-HELPERS] [filterUndefined] 🔍 Filtering undefined values:`, { 
    hasInput: !!obj,
    inputType: typeof obj,
    keyCount: obj && typeof obj === 'object' ? Object.keys(obj).length : 0
  });

  if (!obj || typeof obj !== 'object') {
    console.log(`[${timestamp}] [SQL-HELPERS] [filterUndefined] ⚠️ Invalid input, returning as-is:`, { 
      input: obj,
      type: typeof obj
    });
    return { filtered: obj, removed: [] };
  }

  const filtered = {};
  const removed = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      removed.push(key);
      console.log(`[${timestamp}] [SQL-HELPERS] [filterUndefined] 🗑️ Removing undefined value:`, { key });
    } else {
      filtered[key] = value;
    }
  }

  console.log(`[${timestamp}] [SQL-HELPERS] [filterUndefined] ✅ Filtering completed:`, { 
    originalKeys: Object.keys(obj).length,
    filteredKeys: Object.keys(filtered).length,
    removedKeys: removed.length,
    removedFields: removed
  });

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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [SQL-HELPERS] [buildInsertStatement] 🏗️ Building INSERT statement:`, { 
    table,
    hasData: !!data,
    dataType: typeof data,
    keyCount: data && typeof data === 'object' ? Object.keys(data).length : 0
  });

  if (!table || typeof table !== 'string') {
    const error = new Error('Table name must be a non-empty string');
    console.log(`[${timestamp}] [SQL-HELPERS] [buildInsertStatement] ❌ Invalid table name:`, { 
      table,
      type: typeof table,
      error: error.message
    });
    throw error;
  }

  if (!data || typeof data !== 'object') {
    const error = new Error('Data must be a non-null object');
    console.log(`[${timestamp}] [SQL-HELPERS] [buildInsertStatement] ❌ Invalid data:`, { 
      data,
      type: typeof data,
      error: error.message
    });
    throw error;
  }

  const keys = Object.keys(data);
  const values = Object.values(data);

  if (keys.length === 0) {
    const error = new Error('Data object cannot be empty');
    console.log(`[${timestamp}] [SQL-HELPERS] [buildInsertStatement] ❌ Empty data object:`, { 
      error: error.message
    });
    throw error;
  }

  const fields = keys.join(', ');
  const placeholders = keys.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${fields}) VALUES (${placeholders})`;

  const result = {
    sql,
    values,
    fields,
    placeholders
  };

  console.log(`[${timestamp}] [SQL-HELPERS] [buildInsertStatement] ✅ INSERT statement built:`, { 
    table,
    fieldCount: keys.length,
    fields: keys,
    sql,
    valueCount: values.length,
    sqlLength: sql.length
  });

  return result;
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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [SQL-HELPERS] [assertNoUndefinedParams] 🔍 Checking for undefined parameters:`, { 
    valueCount: Array.isArray(values) ? values.length : 'not-array',
    hasFields: !!fields,
    fieldsType: typeof fields
  });

  if (!Array.isArray(values)) {
    const error = new Error('Values must be an array');
    console.log(`[${timestamp}] [SQL-HELPERS] [assertNoUndefinedParams] ❌ Invalid values input:`, { 
      values,
      type: typeof values,
      error: error.message
    });
    throw error;
  }

  const undefinedIndexes = [];
  values.forEach((value, index) => {
    if (value === undefined) {
      undefinedIndexes.push(index);
      console.log(`[${timestamp}] [SQL-HELPERS] [assertNoUndefinedParams] ⚠️ Found undefined value:`, { 
        index,
        position: index + 1
      });
    }
  });

  if (undefinedIndexes.length > 0) {
    console.log(`[${timestamp}] [SQL-HELPERS] [assertNoUndefinedParams] ❌ Undefined parameters detected:`, { 
      totalValues: values.length,
      undefinedCount: undefinedIndexes.length,
      undefinedIndexes
    });

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
        console.log(`[${timestamp}] [SQL-HELPERS] [assertNoUndefinedParams] 🏷️ Affected fields identified:`, { 
          undefinedFields
        });
      }
    }

    console.log(`[${timestamp}] [SQL-HELPERS] [assertNoUndefinedParams] ❌ Throwing UNDEFINED_SQL_PARAM error:`, { 
      errorCode: error.code,
      undefinedCount: undefinedIndexes.length,
      message: error.message
    });
    throw error;
  }

  console.log(`[${timestamp}] [SQL-HELPERS] [assertNoUndefinedParams] ✅ No undefined parameters found:`, { 
    totalValues: values.length,
    allDefined: true
  });
}