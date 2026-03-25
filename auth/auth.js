/**
 * Check role of the current user is an admin
 * @returns {string} of the current role
 */
const isAdmin = (req) => {
    return req.user && req.user.role === "admin";
};

const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect("/login")};
    req.user = req.session.user;
    res.locals.isAdmin = isAdmin(req);
    res.locals.currentUser = req.user;
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
    requireAuth,
    requireAdmin
}