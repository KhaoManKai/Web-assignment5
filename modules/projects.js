require('dotenv').config();
require('pg');
const Sequelize = require('sequelize');

let sequelize = new Sequelize(process.env.PGDATABASE, process.env.PGUSER, process.env.PGPASSWORD, {
    host: process.env.PGHOST,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { 
        nest: true
    }
});

const Sector = sequelize.define('Sector', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    sector_name: Sequelize.STRING
}, {
    createdAt: false,
    updatedAt: false
});

const Project = sequelize.define('Project', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: Sequelize.STRING,
    feature_img_url: Sequelize.STRING,
    summary_short: Sequelize.TEXT,
    intro_short: Sequelize.TEXT,
    impact: Sequelize.TEXT,
    original_source_url: Sequelize.STRING,
    sector_id: Sequelize.INTEGER
}, {
    createdAt: false,
    updatedAt: false
});

Project.belongsTo(Sector, {foreignKey: 'sector_id'});

function initialize() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(async () => {
                try {
                    const sectorCount = await Sector.count();
                    if (sectorCount === 0) {
                        await Sector.bulkCreate([
                            { id: 1, sector_name: 'Land' },
                            { id: 2, sector_name: 'Industry' },
                            { id: 3, sector_name: 'Transportation' },
                            { id: 4, sector_name: 'Electricity' },
                            { id: 5, sector_name: 'Agriculture' }
                        ]);

                        await Project.bulkCreate([
                            {   
                                sector_id: 1,
                                title: "Abandoned Farmland Restoration",
                                feature_img_url: "https://drawdown.org/sites/default/files/solutions/solution_farmlandrestoration01.jpg",
                                summary_short: "Restoration can bring degraded farmland back into productivity and sequester carbon in the process.",
                                intro_short: "Around the world, many farmers are abandoning previously cultivated or grazed lands...",
                                impact: "Worldwide, millions of hectares of farmland have been abandoned due to land degradation...",
                                original_source_url: "https://drawdown.org/solutions/abandoned-farmland-restoration"
                            },
                        ]);
                    }
                    resolve();
                } catch(err) {
                    reject("Unable to sync the database: " + err);
                }
            })
            .catch((err) => reject("Unable to sync the database: " + err));
    });
}

function getAllProjects() {
    return new Promise((resolve, reject) => {
        Project.findAll({
            include: [Sector]
        })
        .then(projects => {
            resolve(projects);
        })
        .catch(err => reject("Error retrieving projects"));
    });
}

function getProjectById(projectId) {
    return new Promise((resolve, reject) => {
        Project.findOne({  
            include: [Sector],
            where: {
                id: projectId
            },
            raw: false 
        })
        .then(project => {
            if (project) {
                resolve(project);
            } else {
                reject("Unable to find requested project");
            }
        })
        .catch(err => reject("Error retrieving project"));
    });
}

function getProjectsBySector(sector) {
    return new Promise((resolve, reject) => {
        Project.findAll({
            include: [Sector],
            where: {
                '$Sector.sector_name$': {
                    [Sequelize.Op.iLike]: `%${sector}%`
                }
            }
        })
        .then(projects => {
            if (projects.length > 0) {
                resolve(projects);
            } else {
                reject("Unable to find requested projects");
            }
        })
        .catch(err => reject("Error retrieving projects"));
    });
}

function addProject(projectData) {
    return new Promise((resolve, reject) => {
        Project.create(projectData)
            .then(() => resolve())
            .catch(err => reject(err.errors[0].message));
    });
}

function editProject(id, projectData) {
    return new Promise((resolve, reject) => {
        Project.update(projectData, {
            where: { id: id }
        })
        .then(() => resolve())
        .catch(err => reject(err.errors[0].message));
    });
}

function deleteProject(id) {
    return new Promise((resolve, reject) => {
        Project.destroy({
            where: { id: id }
        })
        .then(() => resolve())
        .catch(err => reject(err.errors[0].message));
    });
}
function getAllSectors() {
    return new Promise((resolve, reject) => {
        Sector.findAll()
            .then(sectors => {
                resolve(sectors);
            })
            .catch(err => reject("Unable to get sectors"));
    });
}
module.exports = {
    initialize,
    getAllProjects,
    getProjectById,
    getProjectsBySector,
    getAllSectors,
    addProject,
    editProject,
    deleteProject,
    sequelize,
    Sector,
    Project
};