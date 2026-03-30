/**
 * Check role of the current user is an admin
 * @returns {string} of the current role
 */
const isAdmin = (req) => {
    return req.user && req.user.role === "admin";
};

const attachUserLocals = (req, res, next) => {
    req.user = req.session && req.session.user ? req.session.user : null;
    res.locals.currentUser = req.user;
    res.locals.isAdmin = isAdmin(req);
    next();
};

const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.redirect("/login");
    }
    next();
};

const requireAdmin = (req, res, next) => {
    // check if user role is admin

    // res.redirect("/home");
    if (!isAdmin(req)) {
        return res.redirect("/home");
    }
    
    next();
}

module.exports = {
    attachUserLocals,
    requireAuth,
    requireAdmin
}