const express = require("express");
const uuidUtil = require("../utils/uuidUtils.js")
const dateUtil = require("../utils/dateUtils.js")

const userModel = require("../models/userModel.js");
const categoryModel = require("../models/categoryModel.js");
const eventModel = require("../models/eventModel.js");

const reserveModel = require("../models/reservationModel.js");
// STATIC DICTIONARY TO MAP ABBREVIATIONS FROM QUERY STRING VALUES 
// DURING DB CRUD OPERATIONS
const reserveData = {
  "A":"approved",
  "R":"rejected",
  "W":"waitlist",
}
// RENDERS VIEW THAT DISPLAYS THE DASHBOARD OPTIONS
exports.displayDashboard = (req, res) =>{
    res.render("configuration/configuration.ejs")
}
// RENDERS VIEW THAT RETRIEVES EXISTING CATEGORIES
exports.displayCategories = async(req,res)=>{
  const categoryList = await getAllCategories();
  const newCategoryId = req.query.created;
  res.render("configuration/category.ejs",{categoryList,isRegister:false,validEntry:true,adminNameList:null,errorList:null,record:null,newCategoryId})
}

// RENDERS SAME VIEW AS DISPLAYCATEGORIES BUT INJECTS A CATEGORY REGISTATION FORM
exports.displayCategoryForm = async(req,res)=>{
    let adminNameList = await getAllAdmins() // GENERATE ALL ADMIN NAMES TO ALLOW LOGGED IN ADMIN TO CHOOSE APPROVER FOR A NEW CATEGORY ENTRY
    let categoryList = await getAllCategories();
    res.render("configuration/category.ejs",{categoryList,isRegister:true,validEntry:true,adminNameList,errorList:null,record:null,newCategoryId:null})
}
// RENDERS VIEW THAT DISPLAYS OUTCOME OF CATEGORY REGISTRATION AFTER DATA IS PROCESSED AND VALIDATED
exports.categoryRegistration = async(req,res)=>{
  let categoryName = req.body.categoryName.trim();
  let categoryDescription = req.body.categoryDescription.trim();
  let approver = req.body.approver;
  let adminNameList = await getAllAdmins()
  let categoryList = await getAllCategories();
  let validity = validateCategoryEntry(categoryDescription,categoryName,approver,categoryList);
  let result;
  let isRegister = true;
  if(validity.validEntry){
    const newCategoryID=uuidUtil.generateUUID();
    try {
      result = await categoryModel.addCategory(
      {
        CategoryID:newCategoryID,
        CategoryName:categoryName,
        CategoryDesc:categoryDescription,
        Approval:approver,
        CreatedBy:req.user.userId,
        RejectionReason:" ",
        isDeleted:0,
        createdAt:dateUtil.formatDateTime(new Date())
      });
    isRegister=false; // PASS BOOLEAN TO HIDE THE CATEGORY REGISTRATION FORM 
    res.redirect(`/configuration/category?created=${newCategoryID}`)
    } catch (error) {
      result = "fail";
      console.error("Error adding new category",error);
    }
 
  }else{
    res.render("configuration/category.ejs",{categoryList,isRegister,validEntry:validity.validEntry,adminNameList,errorList:validity.errorList,record:{categoryName,categoryDescription,approver},newCategoryId:null})

  }
}

// RENDERS A DETAILED VIEW OF THE CATEGORY INFO PLACEHOLDED IN AN UPDATE FORM AS A 'GET' REQUEST
exports.displayCategoryDetail = async(req,res)=>{
  const categoryId = req.query.categoryId;
  let catDetail;
  let events;
  try {
    catDetail = await getCategoryById(categoryId);
    catDetail.createdAt = dateUtil.formatDateTime(String(catDetail.createdAt))

  } catch (error) {
    console.error("Error retrieving Category Detail",error)
  }
  try {
    events = await eventModel.retrieveByCategoryId(categoryId) // TO DISPLAY LIST OF EXISTING EVENTS UNDER THIS CATEGORY 
  } catch (error) {
    console.error("Error retrieving events under a category.",error)
  }
  
  let categoryData = {

    catDetail,
    events:events||null
  }
  res.render("configuration/categoryDetail.ejs",{categoryData,errorList:null,message:null})
}

// RENDERS THE OUTPUT OF THE UPDATE PROCESS WHEN ADMIN CLICKS UPDATE UPON PROCESSING & VALIDATING THE UPDATED DATA
exports.updateCategoryDetail = async(req,res)=>{
  const id = req.body.categoryId;
  const newName = req.body.catNameUpdated.trim();
  const newDesc = req.body.catDescUpdated.trim();
  
  let result,message;
  if((newName !=="") && (newDesc!== "")){ // CHECK FOR VALID ENTRIES
    try {
      result = await categoryModel.updateDetail(id,newName,newDesc)
    } catch (error) {
      console.error("Error updating Category Detail",error)
    }
    message = result? `Details for Category Id <b>${id}</b>, are updated successfully.`:`Error updating Category Id <b>${id}</b>, please try again later.`;
    res.render("configuration/outcome.ejs",{
      message,result
    })

  }else{
    let errorList = [];
    !newDesc ? errorList.push("Missing Category Description"):newDesc;
    !newName ? errorList.push("Missing Category Name"):newName;
    let categoryData = {

    
      catDetail:{
        CategoryID:id,
        CreatedBy:req.body.creator,
        createdAt:req.body.categoryDate,
        Approval:req.body.approver,
        CategoryName:newName,
        CategoryDesc:newDesc
      },
      
      events:null
    }

    res.render("configuration/categoryDetail.ejs",{categoryData,message,errorList})
  }
  
}
// RENDERS THE OUTPUT OF DELETE FEATURE IF ADMIN CHOOSES TO DELETE A CATEGORY
// NOTE: ONLY CATEGORIES THAT HAVE NO EXISTING EVENTS WILL BE ALLOWED TO FIRE UP THE THIS ENDPOINT
exports.deleteCategory = async(req,res) => {
  const id = req.query.categoryId;
  const option = (req.query.option).trim().toLowerCase();
  let result;
  if (option==="delete"){
    try {
      let events = await eventModel.retrieveByCategoryId(id);
      
      if (events.length>=1){ //REDIRECT IF CATEGORY HAS UPCOMING/ONGOING NON-DELETED EVENTS 
        res.redirect("/configuration/category");
        return
      }
      result = await categoryModel.deleteCategory(id)
      
      message = result? `Category Id <b>${id}</b> is deleted successfully.`:`Error deleting Category Id <b>${id}</b>, please try again later.`;

    } catch (error) {
        console.error(`Error deleting Category Id ${id}`,error)
    }
    res.render("configuration/outcome.ejs",{
        message,result
    })

  }else{
    res.redirect("/configuration/category")
  }
}
// RENDERS THE PENDING VIEW WITH ANY RESERVATIONS THAT LOGGED IN ADMIN IS ALLOWED TO APPROVE
exports.displayPendingReservations = async(req,res)=>{
  let pendingReservations =[];
  let raw =[]
  // this value indicates if the admin didn't click approve or reject
  let missingCategory = req.query.error;
  let reservationOutcome=req.query.reservationOutcome;
  if (reservationOutcome){
    reservationOutcome = {
      id:reservationOutcome.split("!")[1],
      outcome:reservationOutcome.split("!")[0]
    }
  }
  try {
    let user = await userModel.findByUserID(req.user.userId)
    if (user) {
      raw = await reserveModel.retrievePending(user.FirstName + " " + user.LastName)
    } else {
      console.error(`User with ID ${req.user.userId} not found.`)
      return res.redirect("/configuration");
    }
  } catch (error) {
    console.error("Error retrieving pending reservations",error)
  }
  if (raw){
    for (const r of raw) {
      //new attribute for formatted Date Time
      r.formattedTime = dateUtil.formatDateTime(String(r.CreatedDateTime));
      try {
        r.EventName = (await eventModel.retrieveEventName(r.EventId)).EventName
      } catch (error) {
        r.EventName = 'Event Name Not Found';
      }
      pendingReservations.push(r)
    }
  }
  
  res.render("configuration/pending",{pendingReservations,missingCategory,reservationOutcome})
}

// RENDERS THE OUTPUT WHEN ADMIN CLICKS APPROVE OR REJECT RESERVATION
exports.handleReservationApproval = async(req,res)=>{
  const actionValue = req.body.action;
  if (!actionValue){
    return res.redirect("/configuration/pending?error=MissingCategory")
  }
  let action = actionValue.split("!")[0].trim()
  const reservationId=actionValue.split("!")[1].trim();
  const eventId = req.body.EventId
  const pax = Number(req.body.numPax);

  let updateRes;
  let approveRes;
  
  if ( action === "R"){ //REJECT
    updateRes = await updateReservationStatus(reservationId,action)
  }else if(action==="A"){ // ACCEPT OR WAITLIST
    
    const isVacant= await checkVacancy(eventId,pax) // CHECK WHETHER RESERVATION CAN BE APPROVED SUBJECT TO EVENT CAPACITY
    
   
    if(isVacant.approvalStatus==="A"){// APPROVE THE RESERVATION
      updateRes = await updateReservationStatus(reservationId,isVacant.approvalStatus,req.user.userId,undefined); // UPDATES THE CORRESPONDING RESERVATION DETAILS
      approveRes = await updateEventCapacity(eventId,pax+ isVacant.currentCapacity); // UPDATES THE CORRESPONDING EVENT CAPACITY
    }else if (isVacant.approvalStatus === "W"){// WAITLIST THE RESERVATION
      action = "W"
      let info =await reserveModel.getReservationsWithEventDetails({"EventId":eventId,"Status":"waitlist"});
      let waitlistIndex =info.length>0?info.length:0;
      
      
      
      if(waitlistIndex>-1){
        waitlistIndex+=1 // UPDATE THE waitlistIndex AS THE NEXT QUEUE NUMBER IN LINE
        
        updateRes = await updateReservationStatus(reservationId,isVacant.approvalStatus,undefined,waitlistIndex)
      }
    }
}
  if (!updateRes){
      return res.redirect(`/configuration/pending?reservationOutcome=error!${reservationId}`)
  }
  return res.redirect(`/configuration/pending?reservationOutcome=${action}!${reservationId}`)

}

// RENDERS THE APPROVAL HISTORY VIEW OF ALL APPROVED PAST RESERVATIONS TILL CURRENT DATE
exports.displayApprovalHistory = async(req,res)=>{
  let reservationHistory;
  let err;
  try {
    reservationHistory = await reserveModel.retrieveApprovedByAdminId(req.user.userId)
  } catch (error) {
    err="fail"
    console.error("Error retrieving approved reservations for current Admin",error)
  }
  if(reservationHistory){
    for (const r of reservationHistory) {
      r.formattedTime =  dateUtil.formatDateTime(String(r.CreatedDateTime));
      
      try {
          r.EventName = (await eventModel.retrieveEventName(r.EventId)).EventName
      } catch (error) {
          r.EventName = 'Event Name Not Found';
      }
    };

  }
  res.render("configuration/approvalHistory",{reservationHistory,err})
}

//HELPER FUNCTIONS

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

// FILTERS OUT ALL THE RESERVATIONS CURRENT ADMIN IS ALLOWED TO APPROVE BASED ON THE CATEGORY OF EVENTS UNDER THE APPROVAL FIELD OF CATEGORY COLLECTION
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

// CHECKS MAX CAPACITY OF EVENT WHETHER REQUESTED NUMBER OF PAX CAN BE ALLOCATED TO EVENT
async function checkVacancy(eventId,pax){
  let event;
  try {
    
    event = await eventModel.retrieveByEventid(eventId)

    if (!event) { // IN CASE EVENT RECORD CANT BE FOUND, PLACE RESERVATION IN WAITLIST FIRST
      return { currentCapacity: 0, approvalStatus: "W" }
    }

    const currentCapacity = Number(event.CurrentCapacity) || 0;
    const maxCapacity = Number(event.MaxCapacity) || 0;
    const requestedPax = Number(pax) || 0;

    return {currentCapacity: event.CurrentCapacity,approvalStatus:(currentCapacity + requestedPax <= maxCapacity)?"A":"W"}
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
    // DEFAULT updateData FOR WAITLIST AND APPROVED STATUSES
    let updateData={
        "Status":reserveData[action]
      };
    if (approverId){// IF RESERVATION IS APPROVED ADDITONAL ATTRIBUTE TO BE UPDATED
      updateData["ApprovedBy"] = approverId;
    }
    if (waitListData){ // ELSE IF RESERVATION IS WAITLISTED, UPDATE RESERVATION WITH THE CURRENT WAITLIST NUMBER
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