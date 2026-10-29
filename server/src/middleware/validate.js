// Usage: router.post("/x", validate(zodSchema), handler)
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return res.status(400).json({ message: errors[0].message, errors });
  }
  req.body = result.data;
  next();
};
