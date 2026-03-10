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
router.get("/", (req, res) => {
    const adminOptions=
    `<ul>
        <li><a href="./configuration/category" style="color: green;">Manage Event Categories</a></li>
        <li><a href="" style="color: green;">Approve Reservations</a></li>
    <ul>`
    res.send(adminOptions)
})

module.exports = router;  

router.get("/category",(req,res)=>{
    let isRegister = false;
    let missingName = false;
    res.render("configuration/category.ejs",{categoryList,isRegister})
})

router.get("/category/register",(req,res)=>{
    let isRegister = true;
    let missingName = false;

    res.render("configuration/category.ejs",{categoryList,isRegister,missingName})
});
router.post("/category/register",(req,res)=>{
  let newCategoryName = req.body.categoryName;
  if (newCategoryName !== ""){
    categoryList.push({
      CategoryID:crypto.randomUUID().substring(0,8),
      CategoryName:newCategoryName,
      isDeleted:false,
      createdAt:new Date()
    })
    res.redirect("../category")
  }else{
      let isRegister = true;
      let missingName = true;

      res.render("configuration/category.ejs",{categoryList,isRegister,missingName})

  }
});


