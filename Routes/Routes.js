const express = require('express')
const router = express.Router()
const adminRoute = require('../middleware/adminRoute')
const verifyRole = require('../middleware/verifyRole')
const tokenVerification = require("../middleware/tokenVerification")
const multer = require('multer');
const {
    signUp,
    logIn,
    emailActivation,
    userData,
    passwordCreation,
    Register
} = require('../Controller/AccountManagement/AccountController')


const {
    createProperty,
    getProperty,
    totalProperties,
    getPropertyById,
    getPropertyname,
    getMonthlyProperty,
    getManagerProperty 
} = require('../Controller/PropertyManagement/PropertyControl')


const { 
    Getmonthly
} = require('../Controller/PropertyManagement/Getmonthly')


const {
    roleConfiguration
} = require('../Controller/AccountManagement/AccountConfiguration')

const {
    createTenant,
    getOccupancyRate,
    getTenents,
    getTenantById
} = require('../Controller/PropertyManagement/TenantController')

const {
    createLease
} = require('../Controller/PropertyManagement/LeaseController')

const {getTenantWaterMeter} = require('../Controller/PropertyManagement/WaterControl')

const {getTenantInvoice,getRecipt,sendEmailInvoice, createInvoice, getTenantInvoiceSearch} = require('../Controller/PropertyManagement/InvoiceControl')

const {getReceiptList, createReceipt, sendEmailReceipt} = require('../Controller/PropertyManagement/ReceiptController')

const { sendReminder} =  require('../Controller/PropertyManagement/RemainderController')
const {getUnit, createMaintenance,  getMaintenance, getMaintenanceData}  = require('../Controller/PropertyManagement/MaintenanceController')


const {monthlyRevenue,getInvoice, getReceipt, getReminder, getOccupancyImpact, paymentTrend, getIncome, expenseBreakdown } = require('../Controller/PropertyManagement/FinanceController')
const {createBU,getBills , getBillData, billDelete} =  require('../Controller/PropertyManagement/BillsAndUtilitiesController')
const {getadmin} = require('../Controller/AccountManagement/AdminController')
const storage = multer.memoryStorage(); // or diskStorage for saving to a file
const upload = multer({ storage });


//AccountController Routes
router.post('/api/Register',Register)
router.post('/api/signup',adminRoute, signUp)
router.post('/api/passwordCreation', passwordCreation)
router.post('/api/login', logIn)
router.put('/api/emailverification', emailActivation)
router.get('/api/userdetails',tokenVerification, userData )

//AccountConfiguration Routes
router.put('/api/roleupdate',verifyRole, roleConfiguration)


//PropertyController Routes
router.post('/api/createProperty',adminRoute,createProperty)
router.get('/api/getProperty',adminRoute,getProperty)
router.get('/api/getTotalProperty',adminRoute,totalProperties)
router.get('/api/getmonthly',adminRoute,Getmonthly)
router.get('/api/getPropertyById',adminRoute, getPropertyById)
router.get('/api/getPropertyname', adminRoute,getPropertyname)
router.get('/api/getMonthlyProperty', adminRoute, getMonthlyProperty)
router.get('/api/getManagerProperty', adminRoute,getManagerProperty )

//TenantController Routes
router.post('/api/createTenant',adminRoute,createTenant)
router.get('/api/getOccupancyRate', adminRoute, getOccupancyRate)
router.get('/api/getTenants',adminRoute,getTenents)
router.get('/api/getTenantById', adminRoute, getTenantById)

//LeaseController Routes
router.post('/api/createLease', adminRoute, createLease)

//WaterController Routes
router.get('/api/getTenantWaterMeter',adminRoute, getTenantWaterMeter)

//InvioceController
router.get('/api/getTenantInvoice', adminRoute, getTenantInvoice)
router.post('/api/sendEmailInvoice', adminRoute,upload.single('doc'),sendEmailInvoice)
router.post('/api/createInvoice',adminRoute, createInvoice)
router.get('/api/getTenantInvoiceSearch', adminRoute, getTenantInvoiceSearch)

//ReceiptController
router.get('/api/getReceipt', adminRoute, getRecipt)
router.get('/api/getReceiptList', adminRoute, getReceiptList)
router.post('/api/createReceipt', adminRoute,createReceipt)
router.post('/api/sendEmailReceipt', adminRoute,upload.single('doc'),sendEmailReceipt)

//RemainderController
router.post('/api/sendReminder',adminRoute, sendReminder)

//FinancialController
router.get('/api/monthlyRevenue', adminRoute, monthlyRevenue)
router.get('/api/getInvoice', adminRoute, getInvoice)
router.get('/api/getReceiptData', adminRoute, getReceipt)
router.get('/api/getReminder', adminRoute, getReminder)
router.get('/api/getOccupancyImpact', adminRoute, getOccupancyImpact)
router.get('/api/paymentTrend', adminRoute, paymentTrend)
router.get('/api/getIncome', adminRoute, getIncome)
router.get('/api/expenseBreakdown', adminRoute, expenseBreakdown )
router.get('/api/getUnit', adminRoute, getUnit)

//MaintenanceController
router.post('/api/createMaintenance', adminRoute, createMaintenance)
router.get('/api/getMaintenance', adminRoute,  getMaintenance)
router.get('/api/getMaintenanceData', adminRoute, getMaintenanceData)

//Admin
router.get('/api/getadmin', adminRoute, getadmin)

//BillController
router.post('/api/createBU', adminRoute, createBU)
router.get('/api/getBills', adminRoute, getBills )
router.get('/api/getBillData', adminRoute,getBillData)
router.delete('/api/billDelete', adminRoute, billDelete)

module.exports = router