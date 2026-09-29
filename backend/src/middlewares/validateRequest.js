import { z } from 'zod';

export const validateRequest = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
      files: req.files,
      file: req.file,
    });

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: parsed.error.flatten(),
      });
    }

    req.body = parsed.data.body ?? req.body;
    req.query = parsed.data.query ?? req.query;
    req.params = parsed.data.params ?? req.params;
    req.file = parsed.data.file ?? req.file;
    req.files = parsed.data.files ?? req.files;
    return next();
  } catch (error) {
    return next(error);
  }
};
