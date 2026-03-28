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

//helper functions

async function getAllAdmins(){
    let adminNameList=[]
    try {
      const rawList = await userModel.getAdminUsers()
      rawList.forEach(a => {
        adminNameList.push(`${a.FirstName} ${a.LastName}`)
      });
    } catch (error) {
      console.error("Error retrieving Admins from Database",error)
    }
    return adminNameList;

}
async function getAllCategories(){
    let categoryList;
    try {
    categoryList = await categoryModel.retrieveAll();
    
  } catch (error) {
    console.error("Error retrieving Event Categories",error)
  }
  return categoryList
}
function validateCategoryEntry(catDesc,catName,approver,catList){
  let isDuplicateCategory = false;
  let isMissingDescription = !catDesc;
  let isMissingCategoryName = !catName;
  let isInvalidApprover = (approver==="");

  let errorList =[];
  if (isMissingCategoryName){
    errorList.push("Missing Category Name");
  }
  if (isMissingDescription){
    errorList.push("Missing a Category description");
  }
  
  if(isInvalidApprover){
    errorList.push("Missing a Valid Approver: Please select 'ANY ADMIN' or one admin user");
  }

  
 
  

  if (!isMissingCategoryName){
      catList.forEach(c => {
      const newCat = catName.trim().toLowerCase();
      const currentCat = String(c.CategoryName).trim().toLowerCase();
      // similarity and duplicate entry checks
      if ( newCat === currentCat ){
          isDuplicateCategory=true;
          
          errorList.push("Category Name exists")
  
        }
        
      else if(newCat.includes(currentCat) || currentCat.includes(newCat)){
          errorList.push("Category Name is similar to an existing category.")
          isDuplicateCategory=true;
      }  
      });
  }
  let validEntry = !isDuplicateCategory && !isMissingCategoryName && !isMissingDescription && !isInvalidApprover;

  return {validEntry,errorList,approverId:approver}
}

async function getCategoryById(id){
  let categoryDetail = {}
  try {
    let data = await categoryModel.retrieveAll();
    categoryDetail = data.filter(category => category.CategoryID === id)[0]
  } catch (error) {
    console.error("Error retrieving Category Data",error)
  }
  return categoryDetail;

}


async function filterAllowedReservation(EventId,currentUser){
  let app;
  
  try {
      let event=await eventModel.retrieveByEventid(EventId)
      
      app = await categoryModel.retrieveCategoryById(event.EventType)

  } catch (error) {
    console.error("Error finding the corresponding category's approver",error)
  }
 
  return (app.Approval=="ALL" ||app.Approval==currentUser) || false
}

async function checkVacancy(eventId,pax){
  let event;
  try {
    
    event = await eventModel.retrieveByEventid(eventId)
    return {currentCapacity: event.CurrentCapacity,approvalStatus:(event.CurrentCapacity + pax <= event.MaxCapacity)?"A":"W"}
  } catch (error) {
    console.error(`Error retrieving Event Record: ${eventId}`,error)
    return "Error"
  }

}

async function updateEventCapacity(eventId,pax){
   let res;
   try {
    res = await eventModel.updateEventPax(eventId,pax)
    await reserveModel.update()
   } catch (error) {
      console.error(`Error updating event pax for event id: ${eventId}`,error)
   }
   return res;
  
} 

async function updateReservationStatus (reservationId,action,approverId,waitListData){
    let updateRes;
    // default updateData for waitlist and approved
    let updateData={
        "Status":reserveData[action]
      };
    if (approverId){// if reservation is approved, additonal attribute to be updated
      updateData["ApprovedBy"] = approverId;
    }
    if (waitListData){ // if reservation is waitlisted, update reservation with the current waitlist number
      updateData["WaitlistNo"]=waitListData;
    }
    if(action)
      try {
      updateRes = await reserveModel.update(reservationId, updateData);
      
    } catch (error) {
        console.error(`Error updating Reservation ID:${reservationId} to status '${reserveData[action]}'`,error);
    }
    return updateRes
}