const express = require("express");
const auth = require("../auth/auth.js")
const router = express.Router();
const uuidUtil = require("../utils/uuidUtils.js")
const dateUtil = require("../utils/dateUtils.js")

const userModel = require("../models/userModel.js");
const categoryModel = require("../models/categoryModel.js");
const eventModel = require("../models/eventModel.js");

const reserveModel = require("../models/reservationModel.js");
const reserveData = {
  "A":"accepted",
  "R":"rejected",
  "W":"waitlist",
}

exports.displayDashboard = (req, res) =>{
    res.render("configuration/configuration.ejs")
}
exports.displayCategories = async(req,res)=>{
  const categoryList = await getAllCategories();
  const newCategoryId = req.query.created;
  res.render("configuration/category.ejs",{categoryList,isRegister:false,validEntry:true,adminNameList:null,errorList:null,record:null,newCategoryId})
}

exports.displayCategoryForm = async(req,res)=>{
    let adminNameList = await getAllAdmins()
    let categoryList = await getAllCategories();
    res.render("configuration/category.ejs",{categoryList,isRegister:true,validEntry:true,adminNameList,errorList:null,record:null,newCategoryId:null})
}
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
    isRegister=false;
    res.redirect(`/configuration/category?created=${newCategoryID}`)
    } catch (error) {
      result = "fail";
      console.error("Error adding new category",error);
    }
 
  }else{
    res.render("configuration/category.ejs",{categoryList,isRegister,validEntry:validity.validEntry,adminNameList,errorList:validity.errorList,record:{categoryName,categoryDescription,approver},newCategoryId:null})

  }
}

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
    events = await eventModel.retrieveByCategoryId(categoryId)
  } catch (error) {
    console.error("Error retrieving events under a category.",error)
  }
  
  let categoryData = {

    catDetail,
    events:events||null
  }
  res.render("configuration/categoryDetail.ejs",{categoryData,errorList:null,message:null})
}
exports.updateCategoryDetail = async(req,res)=>{
  const id = req.body.categoryId;
  const newName = req.body.catNameUpdated;
  const newDesc = req.body.catDescUpdated;
  
  let result,message;
  if(newName && newDesc){
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

exports.deleteCategory = async(req,res) => {
  const id = req.query.categoryId;
  const option = (req.query.option).trim().toLowerCase();
  let result;
  if (option==="delete"){
    try {
      let event = await eventModel.retrieveByCategoryId(id);
      
      if (event.length>=1){
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
    raw=await reserveModel.retrievePending()
    
        

    
    
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
     
      try {
        let isAllowed = await filterAllowedReservation(r.EventId,req.user.userId)
        
        if (isAllowed){
          pendingReservations.push(r)
        }
      }catch (error) {
        console.error("Error filtering allowed reservations",error)
      }
      
    }
  }
  
  res.render("configuration/pending",{pendingReservations,missingCategory,reservationOutcome})
}

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
  
  if ( action === "R"){ //reject 
    updateRes = await updateReservationStatus(reservationId,action)
  }else if(action==="A"){ // accept or waitlist
    
    const isVacant= await checkVacancy(eventId,pax) // check whether reservation can be accepted subjected to event capacity
    
   
    if(isVacant.approvalStatus==="A"){// approve the reservation
      updateRes = await updateReservationStatus(reservationId,isVacant.approvalStatus,req.user.userId,undefined); // updates the corresponding reservation details
      approveRes = await updateEventCapacity(eventId,pax+ isVacant.currentCapacity); // updates the corresponding event capacity
    }else if (isVacant.approvalStatus === "W"){// waitlist the reservation
      action = "W"
      let info =await reserveModel.getReservationsWithEventDetails({"EventId":eventId,"Status":"waitlist"});
      let waitlistIndex =info.length>0?info.length:0;
      
      
      
      if(waitlistIndex>-1){
        waitlistIndex+=1 // update waitListIndex as the next number in line
        
        updateRes = await updateReservationStatus(reservationId,isVacant.approvalStatus,undefined,waitlistIndex)
      }
    }
}
  if (!updateRes){
      return res.redirect(`/configuration/pending?reservationOutcome=error!${reservationId}`)
  }
  return res.redirect(`/configuration/pending?reservationOutcome=${action}!${reservationId}`)

}
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

exports.displayReservationDashboard = (req,res)=>{
  res.render("configuration/reservationDashboard");
}
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