const express = require("express");
const auth = require("../auth/auth.js")
const router = express.Router();
//DUMMY DATA FOR CATERGORIES
let categoryList = [
   
  {
    "CategoryID": "a3f1c9e2",
    "CategoryName": "Lectures",
    "Approval": "ALL",
    "RejectionReason": null,
    "isDeleted": false,
    "createdAt": "2025-11-14T08:32:15Z"
  },
  {
    "CategoryID": "b7e2d4a8",
    "CategoryName": "Seminars & Workshops",
    "Approval": "adm7c2f1",
    "RejectionReason": null,
    "isDeleted": false,
    "createdAt": "2025-12-02T14:10:47Z"
  },
  {
    "CategoryID": "c91d8a7e",
    "CategoryName": "Competitions",
    "Approval": "ALL",
    "RejectionReason": null,
    "isDeleted": false,
    "createdAt": "2026-01-08T03:45:29Z"
  },
  {
    "CategoryID": "d4a7c2e9",
    "CategoryName": "Student Group Activities",
    "Approval": "adm4b9e2",
    "RejectionReason": null,
    "isDeleted": false,
    "createdAt": "2025-10-21T17:22:03Z"
  },
  {
    "CategoryID": "e8b1f3a7",
    "CategoryName": "Webinar & Online Learning",
    "Approval": "ALL",
    "RejectionReason": null,
    "isDeleted": false,
    "createdAt": "2026-02-11T11:59:54Z"
  },
  {
    "CategoryID": "f2c7a9d1",
    "CategoryName": "Conferences & Symposiums",
    "Approval": "adm1e8c3",
    "RejectionReason": null,
    "isDeleted": false,
    "createdAt": "2025-09-30T06:14:38Z"
  },
  {
    "CategoryID": "a9d3c7e1",
    "CategoryName": "Performances",
    "Approval": "ALL",
    "RejectionReason": null,
    "isDeleted": false,
    "createdAt": "2025-12-19T19:41:22Z"
  },
  {
    "CategoryID": "b1e7c9a3",
    "CategoryName": "Talks & Forums",
    "Approval": "adm9d4f6",
    "RejectionReason": null,
    "isDeleted": false,
    "createdAt": "2026-01-27T09:05:11Z"
  }
];
let reservationsToApprove = [1,4,7]

let reservationHistory = [5,7,8]
//BASIC ADMIN INTERFACE
router.get("/", (req, res) => {
    const adminOptions=
   ` <h2>Welcome to Admin Page</h2>
    <ul>
        <li><a href="./configuration/category" style="color: blue;">Manage Event Categories</a></li>
        <li><a href="./configuration/reservationList" style="color: green;">Manage Reservations</a></li>
    <ul>`
    res.send(adminOptions)
})

module.exports = router;  


//CATEGORY ROUTES
router.get("/category",(req,res)=>{
    let isRegister = false;
    let missingName = false;
    let isDuplicateCategory = false;
    res.render("configuration/category.ejs",{categoryList,isRegister})
})

router.get("/category/register",(req,res)=>{
    let isRegister = true;
    let missingName = false;
    let isDuplicateCategory = false;

    res.render("configuration/category.ejs",{categoryList,isRegister,missingName,isDuplicateCategory})
});
router.post("/categoryDetail",(req,res)=>{
  const categoryId = req.body.categoryId;
  let categoryData = {
    categoryId,
    events:[
      "event A","event B", "event C"
    ]
  }
  res.render("configuration/categoryDetail.ejs",{categoryData})
});
router.post("/category/register",(req,res)=>{
  let newCategoryName = req.body.categoryName;
  let isDuplicateCategory = false;
  if (newCategoryName !== ""){
      categoryList.forEach(c => {
      if (newCategoryName.trim().toLowerCase() === String(c.CategoryName).trim().toLowerCase()){
          isDuplicateCategory=true;
          res.render("configuration/category.ejs",{categoryList,isRegister:true,missingName:false,isDuplicateCategory})
        }
      });
    if(!isDuplicateCategory){
          categoryList.push({
      CategoryID:crypto.randomUUID().substring(0,8),
      CategoryName:newCategoryName,
      isDeleted:false,
      createdAt:new Date()
    })
    res.redirect("../category")

    }
  }else{
      let isRegister = true;
      let missingName = true;
     
      res.render("configuration/category.ejs",{categoryList,isRegister,missingName,isDuplicateCategory})

  }
});


//RESERVATION ROUTES
router.get("/reservationList",(req,res)=>{
  res.render("configuration/reservationList")
});
router.get("/pending",(req,res)=>{
  res.render("configuration/pending",{reservationsToApprove})
});
router.post("/handle",(req,res)=>{
  res.send("Done!")
});

router.get("/approvalHistory",(req,res)=>{
  res.render("configuration/approvalHistory",{reservationHistory})
})
