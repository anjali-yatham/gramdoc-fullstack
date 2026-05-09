import jwt from 'jsonwebtoken'
export default function protect(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'No token' })
  try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret'); next() }
  catch { res.status(401).json({ message: 'Invalid token' }) }
}

export function optionalProtect(req, _res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return next()
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret')
  } catch {
    // Ignore invalid token for optional auth routes.
    req.user = null
  }
  next()
}
