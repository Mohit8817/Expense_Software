import { PrismaClient } from "@prisma/client";
import fs from 'fs';
import path from "path";

const prisma = new PrismaClient();

//  CREATE EMPLOYEE
export const createUser = async (req, res) => {
  try {
    const {
      empName,
      empEmail,
      password,
      reportingHead,
      doj,
      dol,
      ctc,
      phone,
      designation,
      dob,
      gender,
      qualification,
      status,
      role_id
    } = req.body;

    //  FROM JWT (FIXED)
    const company_id = req.user.company_id;
    const created_by =  req.user.email;
    console.log(company_id, created_by);

    if (!company_id) {
      return res.status(401).json({ message: "Unauthorized ❌" });
    }

    const photo = req.file ? req.file.filename : null;
    const user_id = "EMP" + Date.now();

    const statusValue = status === "1" || status === 1 || status === true;

    const employee = await prisma.User.create({
      data: {
        company_id,
        user_id,
        username: empName,
        email: empEmail,
        password: password,
        reporting_head: reportingHead,
        doj: new Date(doj),
        dol: dol ? new Date(dol) : null,
        ctc: ctc ? parseFloat(ctc) : null,
        phone_no: phone,
        designation,
        dob: dob ? new Date(dob) : null,
        gender,
        qualification,
        user_img: photo,
        pfesi: false,
        status: statusValue,
        created_by,
        role_id : Number(role_id),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    res.status(201).json({
      message: "Employee created successfully",
      employee,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message ,
    });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.User.findMany({
      where: {
        company_id: req.user.company_id,
      },
      orderBy: { created_at: "desc" },
    });

    res.json(users);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//  GET REPORTING HEADS (FOR DROPDOWN)
export const getReportingHeads = async (req, res) => {
  try {
    const users = await prisma.User.findMany({
      where: {
        company_id: req.user.company_id,
      },
      orderBy: { username: "asc" },
      select: {
        id:true,
        username: true,
        email: true,
      },
    });

    res.json(users);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



//  GET SINGLE USER
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
      // Reporting heads
    const reportingHeads = await prisma.User.findMany({
      where: {
        company_id: req.user.company_id,
      },
      orderBy: { username: "asc" },
      select: {
        id:true,
        username: true,
        email: true,
      },
    });

    const user = await prisma.User.findUnique({
      where: { id: Number(id) },
    });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({ user, reportingHeads });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateUser = async (req, res) => {
  const { id } = req.params;

  try {
    const {
      empName,
      empEmail,
      password,
      reportingHead,
      doj,
      dol,
      ctc,
      phone,
      designation,
      gender,
      status,
      dob,
      qualification,
      role_id, //   added
    } = req.body;

    //   SAFE STATUS CONVERSION
    let parsedStatus;
    if (status !== undefined) {
      if (
        status === true ||
        status === "true" ||
        status === "1" ||
        status === 1
      ) {
        parsedStatus = true;
      } else if (
        status === false ||
        status === "false" ||
        status === "0" ||
        status === 0
      ) {
        parsedStatus = false;
      }
    }

    //   CLEAN UPDATE OBJECT
    const updatedData = {};

    if (empName) updatedData.username = empName;
    if (empEmail) updatedData.email = empEmail;
    if (password) updatedData.password = password;
    if (reportingHead) updatedData.reporting_head = reportingHead;
    if (phone) updatedData.phone_no = phone;
    if (designation) updatedData.designation = designation;
    if (gender) updatedData.gender = gender;
    if (qualification) updatedData.qualification = qualification;

    if (ctc) updatedData.ctc = parseFloat(ctc);
    if (doj) updatedData.doj = new Date(doj);
    if (dol) updatedData.dol = new Date(dol);
    if (dob) updatedData.dob = new Date(dob);

    //   STATUS UPDATE
    if (parsedStatus !== undefined) {
      updatedData.status = parsedStatus;
    }

    //   ROLE UPDATE (FIXED)
    if (role_id !== undefined) {
      updatedData.role_id = Number(role_id);
    }

    //   IMAGE UPDATE
    if (req.file) {
      updatedData.user_img = req.file.filename;
    }

    updatedData.updated_at = new Date();

    // 🔍 DEBUG
    console.log("FINAL UPDATE DATA:", updatedData);

    const user = await prisma.User.update({
      where: { id: Number(id) },
      data: updatedData,
    });

    res.json({
      message: "User updated successfully",
      data: user,
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};



//  DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔍 Find user first
    const existingUser = await prisma.User.findUnique({
      where: { id: Number(id) },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🖼️ Delete image if exists
    if (existingUser.user_img) {
      const imageName = existingUser.user_img.split("/uploads/")[1];

      if (imageName) {
        const imagePath = path.join(process.cwd(), "uploads", imageName);

        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    // ❌ Delete user from DB
    await prisma.User.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "User deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



//  OPTIONAL: CHANGE STATUS (ACTIVE / INACTIVE)
export const changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    //  Convert string to boolean if coming from frontend
    if (typeof status === "string") {
      status = status === "true";
    }

    const user = await prisma.User.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.json({
      message: "Status updated",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};