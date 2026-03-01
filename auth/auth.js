/**
 * Check role of the current user is an admin
 * @returns {string} of the current role
 */
const isAdmin = (req) => {
    return req.user && req.user.role === "admin";
};

const requireAuth = (req, res, next) => {
    // TODO: Check if user is authenticated via cookie

    // return res.redirect("/index.html");
    
    // mock user
    req.user = { userId: "aoisjdoiq", email: "testuser", role: "admin" };

    // set 
    res.locals.isAdmin = isAdmin(req);
    next();
}

const requireAdmin = (req, res, next) => {
    // check if user role is admin

    // res.redirect("/home");
    
    next();
}

module.exports = {
    requireAuth,
    requireAdmin
}