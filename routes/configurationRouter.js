const express = require("express");
const auth = require("../auth/auth.js")
const router = express.Router();
const uuidUtil = require("../utils/uuidUtils.js")
const dateUtil = require("../utils/dateUtils.js")

const userModel = require("../models/userModel.js");
const categoryModel = require("../models/categoryModel.js");
const eventModel = require("../models/eventModel.js");

const reserveModel = require("../models/reservationModel.js")
//DUMMY DATA 






let reservationHistory = [5,7,8]
//BASIC ADMIN INTERFACE
router.get("/", (req, res) => {
   
    res.render("configuration/configuration.ejs")
})

module.exports = router;  


//CATEGORY ROUTES
router.get("/category",async(req,res)=>{
  const categoryList = await getAllCategories();
  res.render("configuration/category.ejs",{categoryList,isRegister:false,validEntry:true,adminNameList:null,errorList:null,record:null})

})

router.get("/category/register",async(req,res)=>{
    let adminNameList = await getAllAdmins()
    let categoryList = await getAllCategories();

    res.render("configuration/category.ejs",{categoryList,isRegister:true,validEntry:true,adminNameList,errorList:null,record:null})
});

router.post("/category/register",async(req,res)=>{
  let categoryName = req.body.categoryName.trim();
  let categoryDescription = req.body.categoryDescription.trim();
  let approver = req.body.approver;
  let adminNameList = await getAllAdmins()
  let categoryList = await getAllCategories();
  let validity = validateCategoryEntry(categoryDescription,categoryName,approver,categoryList);
  let result;
  let isRegister = true;
  if(validity.validEntry){
    try {
      result = await categoryModel.addCategory(
      {
    CategoryID:uuidUtil.generateUUID(),
    CategoryName:categoryName,
    CategoryDesc:categoryDescription,
    Approval:approver,
    CreatedBy:req.user.userId,
    RejectionReason:" ",
    isDeleted:0,
    createdAt:dateUtil.formatDateTime(new Date())
    });
    isRegister=false;
    res.redirect("/configuration/category")
    } catch (error) {
      result = "fail";
      console.error("Error adding new category",error);
    }
 
  }else{
    res.render("configuration/category.ejs",{categoryList,isRegister,validEntry:validity.validEntry,adminNameList,errorList:validity.errorList,record:{categoryName,categoryDescription,approver}})

  }
});


router.get("/categoryDetail", async(req,res)=>{
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
});

router.post("/categoryDetail",async(req,res)=>{
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
  
});

router.get("/deleteCategory",async(req,res) => {
  const id = req.query.categoryId;
  const option = (req.query.option).trim().toLowerCase();
  let result;
  if (option==="delete"){
    try {
      let eventRecord = await eventModel.retrieveByCategoryId(id);
      
      if (eventRecord.length>=1){
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
})
//RESERVATION ROUTES
router.get("/reservationList",(req,res)=>{
  res.render("configuration/reservationList")
});
router.get("/pending",async(req,res)=>{
  let pendingReservations;
  try {
    pendingReservations=await reserveModel.retrievePending()
    if (pendingReservations){
      pendingReservations.forEach((r,index) => {
        //new attribute for formatted Date Time
        r.newTime = dateUtil.formatDateTime(String(r.CreatedDateTime));
        console.log("event id",r.EventId)
        if (!filterAllowedReservation(r.EventId)){
          pendingReservations.splice(index,1)
        }

    });
    }
    
  } catch (error) {
    console.error("Error retrieving pending reservations",error)
  }
  console.log(pendingReservations)
  res.render("configuration/pending",{pendingReservations})
});
router.get("/handle",(req,res)=>{
  res.send("Done!")
});

router.get("/approvalHistory",(req,res)=>{
  res.render("configuration/approvalHistory",{reservationHistory})
})

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


async function filterAllowedReservation(EventId){
  let app;
  try {
      let event=await eventModel.retrieveByEventid(EventId)
      console.log("Eventype",event.EventType)
      app = await categoryModel.retrieveCategoryById(event.EventType)

  } catch (error) {
    console.error("Error finding the corresponding category's approver",error)
  }
  console.log("Approver",app)
  return (app=="ALL") || null
}
