import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config({ path: "./.env" });

import userRoutes from "./src/routes/user.routes.js";
import loginRoutes from "./src/routes/auth/login.routes.js";
import projectRoutes from "./src/routes/project.routes.js";
import interventionRoutes from "./src/routes/intervention.routes.js";
import expenseRoutes from "./src/routes/expense.routes.js"
import dashboardRoutes from "./src/routes/dashboard.routes.js";
import roleRoutes from "./src/routes/role.routes.js"
import permissionRoutes from "./src/routes/permission.routes.js"
import reportRoutes from "./src/routes/report.routes.js"
import paymentRoutes from "./src/routes/payment.routes.js"
import purchaseRoutes from "./src/accounts/routes/purchase.routes.js";
import salesRoutes from "./src/accounts/routes/sales.routes.js";
import productDetailRoutes from "./src/accounts/routes/productdetail.routes.js";
import companyDetailRoutes from "./src/accounts/routes/companydetail.routes.js";
import debitNoteRoutes from "./src/accounts/routes/debitnote.routes.js";
import creditNoteRoutes from "./src/accounts/routes/creditnote.routes.js";
import deliveryChallanRoutes from "./src/accounts/routes/deliverychallan.routes.js";
import journalVoucherRoutes from "./src/accounts/routes/journalvoucher.routes.js";
import accountRoutes from "./src/accounts/routes/account.routes.js";
import paymentVoucherRoutes from "./src/accounts/routes/paymentvoucher.routes.js";
import attachmentRoutes from "./src/accounts/routes/attachment.routes.js";
import tallyRoutes from "./src/accounts/routes/tally.routes.js";



const app = express();

// middleware
app.use(express.json());

console.log("ENV JWT_SECRET:", process.env.JWT_SECRET);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://klk.co.in"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// Configure session
app.use(session({
  secret: "your_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true } 
}));


app.use(express.urlencoded({ extended: true }));

app.get("/test", (req, res) => {
  res.json({ ok: true });
});

// static
app.use(express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static("uploads"));

// ensure uploads folder
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/api/login", loginRoutes);

// Tally integration — public GET APIs (no login / no company_id filter)
app.use("/api/tally", tallyRoutes);

import {auth} from "./src/middlewares/auth.js"
import { report } from "process";

app.use(auth)


// routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/interventions", interventionRoutes); 
app.use("/api/expense", expenseRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/permission", permissionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/productdetail", productDetailRoutes);
app.use("/api/companydetail", companyDetailRoutes);
app.use("/api/debitnote", debitNoteRoutes);
app.use("/api/creditnote", creditNoteRoutes);
app.use("/api/deliverychallan", deliveryChallanRoutes);
app.use("/api/journalvoucher", journalVoucherRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/paymentvoucher", paymentVoucherRoutes);
app.use("/api/attachments", attachmentRoutes);


app.get("/", (req, res) => {
  res.send("API is running...");
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});