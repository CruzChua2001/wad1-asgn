const express = require("express");
const router = express.Router();
const uuidUtil = require("../utils/uuidUtils.js")
const dateUtil = require("../utils/dateUtils.js")

const userModel = require("../models/userModel.js");
const categoryModel = require("../models/categoryModel.js");
const eventModel = require("../models/eventModel.js");
const configurationController = require ("../controllers/configurationController.js");
const reserveModel = require("../models/reservationModel.js");
const { config } = require("dotenv");
const reserveData = {
  "A":"accepted",
  "R":"rejected",
  "W":"waitlist",
}

module.exports = router;  

//BASIC ADMIN INTERFACE
router.get("/", configurationController.displayDashboard);



//CATEGORY ROUTES
router.get("/category",configurationController.displayCategories)

router.get("/category/register",configurationController.displayCategoryForm);

router.post("/category/register",configurationController.categoryRegistration);


router.get("/categoryDetail", configurationController.displayCategoryDetail);

router.post("/categoryDetail",configurationController.updateCategoryDetail);

router.get("/deleteCategory",configurationController.deleteCategory)
//RESERVATION ROUTES
router.get("/reservationDashboard",configurationController.displayReservationDashboard);
router.get("/pending",configurationController.displayPendingReservations);

router.post("/handle",configurationController.handleReservationApproval);

router.get("/approvalHistory",configurationController.displayApprovalHistory)
