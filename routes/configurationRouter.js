const express = require("express");
const router = express.Router();
const { logger } = require("../middleware/logger");
const configurationController = require ("../controllers/configurationController.js");

router.use(logger);

module.exports = router;  

//BASIC ADMIN DASHBOARD 
// OPTION 1 OF ADMIN DASHBOARD: MANAGE EVENT CATEGORIES
router.get("/", configurationController.displayDashboard);

//CATEGORY ROUTES
router.get("/category",configurationController.displayCategories)

router.get("/category/register",configurationController.displayCategoryForm);

router.post("/category/register",configurationController.categoryRegistration);

router.get("/categoryDetail", configurationController.displayCategoryDetail);

router.post("/categoryDetail",configurationController.updateCategoryDetail);

router.get("/deleteCategory",configurationController.deleteCategory)

// RESERVATION ROUTES
// OPTION 2 OF ADMIN DASHBOARD: PENDING QUEUE
router.get("/pending",configurationController.displayPendingReservations);

router.post("/handle",configurationController.handleReservationApproval);

//OPTION 3 OF ADMIN DASHBOARD: APPROVAL HISTORY
router.get("/approvalHistory",configurationController.displayApprovalHistory)
