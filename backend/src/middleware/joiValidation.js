import pino from 'pino';

const logger = pino({ name: 'joiValidation' });

/**
 * Joi validation middleware
 * @param {Object} schema - Joi schema to validate against
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
export const validateJoi = (schema, property = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[property];
      
      if (!dataToValidate) {
        return res.status(400).json({
          success: false,
          error: {
            message: `No ${property} data provided`,
            code: 'MISSING_DATA'
          }
        });
      }

      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        logger.warn('Joi validation failed', {
          property,
          errors: validationErrors,
          originalData: dataToValidate
        });

        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validationErrors
          }
        });
      }

      // Replace the original data with the validated and potentially transformed data
      req[property] = value;
      
      logger.debug('Joi validation successful', {
        property,
        validatedFields: Object.keys(value)
      });

      next();
    } catch (err) {
      logger.error('Joi validation middleware error', err);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Internal validation error',
          code: 'VALIDATION_MIDDLEWARE_ERROR'
        }
      });
    }
  };
};

/**
 * Shorthand for body validation
 */
export const validateBody = (schema) => validateJoi(schema, 'body');

/**
 * Shorthand for query validation
 */
export const validateQuery = (schema) => validateJoi(schema, 'query');

/**
 * Shorthand for params validation
 */
export const validateParams = (schema) => validateJoi(schema, 'params');

export default {
  validateJoi,
  validateBody,
  validateQuery,
  validateParams
};