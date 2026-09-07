// =====================================================
// INNERVOICE — Admin Authorization Middleware
// Applied AFTER verifyToken on all /api/admin/* routes.
//
// Chain: verifyToken → requireAdmin → handler
//
// Returns:
//   403  if authenticated user does not have role 'admin'
// =====================================================

function requireAdmin(req, res, next) {
    // req.user is already set by verifyToken
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
}

module.exports = requireAdmin;
