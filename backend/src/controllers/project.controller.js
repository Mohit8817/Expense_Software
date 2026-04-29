import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


//   CREATE PROJECT
export const createProject = async (req, res) => {
  try {
    const {
      project_name,
      description,
      start_date,
      end_date,
      financial_year,
      funder_name,  
      manager_id,
      contact_person,
      contact_person_number,
      projectStatus,
    } = req.body;

    const company_id = req.user.company_id;
    const created_by = req.user.email;

    // 📄 Handle MOU file
    const mouFile = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : null;

    // 🔍 Check duplicate
    const existingProject = await prisma.project.findFirst({
      where: {
        name: project_name,
        financial_year,
      },
    });

    if (existingProject) {
      return res.status(400).json({
        message: "Project already exists for this financial year",
      });
    }

    // 🆔 Generate project_id
    const project_id = "PROJ" + Date.now();

    const newProject = await prisma.project.create({
      data: {
        company_id,
        project_id,
        name: project_name,
        description,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        financial_year,
        funder_name,
        manager_id,
        contact_person,
        contact_person_number,
        mou: mouFile,
        status: projectStatus,
        created_by,
      },
    });

    return res.status(201).json({
      message: "Project Created Successfully",
      data: newProject,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



//   GET ALL PROJECTS (with pagination + search)
export const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        company_id: req.user.company_id,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const total = await prisma.project.count({
      where: {
        company_id: req.user.company_id,
      },
    });

    return res.json({
      total,
      data: projects,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

//  GET MANAGERSS (FOR DROPDOWN)
export const getManagers = async (req, res) => {
  try {
    const managers = await prisma.user.findMany({
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

    res.json(managers);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//   GET SINGLE PROJECT
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
     const managers = await prisma.user.findMany({
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

    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.json({project,managers});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



//   UPDATE PROJECT
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      start_date,
      end_date,
      financial_year,
      funder_name,
      manager_id,
      contact_person,
      contact_person_number,
      mou,
      status,
    } = req.body;

    const existingProject = await prisma.project.findUnique({
      where: { id: Number(id) },
    });

    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    const updatedProject = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        start_date: start_date ? new Date(start_date) : undefined,
        end_date: end_date ? new Date(end_date) : undefined,
        financial_year,
        funder_name,
        manager_id,
        contact_person,
        contact_person_number,
        mou,
        //   String "true"/"1" → Boolean
        status: status === "true" || status === true || status === 1 || status === "1",
      },
    });

    return res.json({
      message: "Project updated successfully",
      data: updatedProject,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



//   DELETE PROJECT
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({
      where: { id: Number(id) },
    });

    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.project.delete({
      where: { id: Number(id) },
    });

    return res.json({
      message: "Project deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};