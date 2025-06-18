require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');

const app = express();
app.use(express.static(path.join(__dirname,"public")));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});
app.use(cors({
  origin: '*', // for development only
  //exposedHeaders: ['Authorization']
}));
app.use(express.json());


// ✅ MongoDB Connection
const conn = mongoose.createConnection(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    maxPoolSize: 10
});
console.log(process.env.MONGODB_URI);

conn.on('connected', () => {
    console.log('MongoDB connected successfully');
});
conn.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
});
conn.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// ✅ GridFS Setup
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('profileImages');
    console.log('GridFS initialized successfully');
});

// ✅ GridFS Storage Engine
const storage = new GridFsStorage({
    url: process.env.MONGODB_URI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => ({
        bucketName: 'profileImages',
        filename: `${Date.now()}-${file.originalname}`
    })
});
const upload = multer({ storage });

// ✅ Test connection
(async () => {
    try {
        await conn.asPromise();
        console.log('Database connection test successful');
    } catch (err) {
        console.error('Database connection test failed:', err.message);
    }
})();

// ✅ Models (using `conn` instead of `mongoose`)
const employeeSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    address: String,
    mobile: String,
    email: String,
    idCardType: String,
    idCardNumber: String,
    role: { 
        type: String, 
        enum: [
            'junior_developer', 'senior_developer', 'junior_writer', 'senior_writer', 
            'team_leader', 'bdm', 'hr_recruiter', 'hr_executive', 'hr_manager', 
            'hr_admin', 'Admin'
        ], 
        default: 'junior_developer' 
    },
    doj: Date,
    isAdmin: { type: Boolean, default: false },
    profileImage: {
        fileId: mongoose.Schema.Types.ObjectId,
        filename: String
    }
}, { collection: 'Employee Details', timestamps: true });

employeeSchema.index({ employeeId: 1 }, { unique: true });

const Employee = conn.model('Employee', employeeSchema);

const leaveRequestSchema = new mongoose.Schema({
    employeeId: String,
    name: String,
    reason: String,
    leaveCount: Number,
    fromDate: Date,
    toDate: Date,
    comments: String,
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
}, { collection: 'Leave Requests' });

const LeaveRequest = conn.model('LeaveRequest', leaveRequestSchema);

// ✅ Auth Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
   // console.log(authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    console.log("jwtToken->",token);
    if (!token) {
        console.warn("Token missing from request headers");
        return res.status(401).json({ success: false, message: 'No token provided' });}

    jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, user) => {
        if (err) {
            console.warn("Token verification failed", err.message);
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
         console.log("Authenticated user:", user);
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (!req.user.isAdmin) return res.status(403).json({ success: false, message: 'Admin access required' });
    next();
}

// New middleware for HR and Admin access
function requireHRorAdmin(req, res, next) {
    const adminRoles = ['Admin', 'hr_admin'];
    const hrRoles = ['hr_admin', 'hr_manager', 'hr_executive', 'hr_recruiter'];
    
    const userRole = req.user.role;
    
    if (!adminRoles.includes(userRole) && !hrRoles.includes(userRole)) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Only administrators and HR personnel can perform this action.' 
        });
    }
    next();
}

// ✅ Routes

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { employeeId, password } = req.body;
        if (!employeeId || !password) {
            return res.status(400).json({ success: false, message: 'Employee ID and password are required.' });
        }

        const employee = await Employee.findOne({ employeeId }).maxTimeMS(5000);
        if (!employee) {
            return res.status(401).json({ success: false, message: 'Invalid Employee ID or password.' });
        }

        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid Employee ID or password.' });
        }

        const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
        
        // Generate JWT token with more user data
        const token = jwt.sign({
            employeeId: employee.employeeId,
            isAdmin: employee.isAdmin,
            name: fullName || employee.employeeId,
            role: employee.role
        }, process.env.JWT_SECRET || 'secretkey', { 
            expiresIn: '24h'  // Increased token expiry time
        });

        // Send response with token in header
        res.setHeader('Authorization', `Bearer ${token}`);
        res.json({
            success: true,
            message: 'Login successful',
            token,
            employee: {
                employeeId: employee.employeeId,
                name: fullName || employee.employeeId,
                isAdmin: employee.isAdmin,
                role: employee.role
            }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, message: 'An error occurred during login. Please try again.' });
    }
});

// Add Employee
app.post('/api/employees', authenticateToken, requireHRorAdmin, upload.single("profileImage"), async (req, res) => {
    console.log("body-form", req.body);
    console.log("ufile upload", req.file);
    console.log("HIT /api/employees");
    
    const { employeeId, password, firstName, lastName, address, mobile, email, idCardType, idCardNumber, role, doj } = req.body;
    if (!employeeId || !password || !role) {
        return res.status(400).json({ success: false, message: 'Employee ID, password, and role are required.' });
    }

    // Validate role
    const validRoles = [
        'junior_developer', 'senior_developer', 'junior_writer', 'senior_writer', 
        'team_leader', 'bdm', 'hr_recruiter', 'hr_executive', 'hr_manager', 
        'hr_admin', 'Admin'
    ];
    
    if (!validRoles.includes(role)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid role. Please select a valid role from the dropdown.' 
        });
    }

    // Check if user has permission to assign admin roles
    const adminRoles = ['Admin', 'hr_admin'];
    if (adminRoles.includes(role) && !adminRoles.includes(req.user.role)) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access denied. Only administrators can create admin accounts.' 
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Set isAdmin based on role
        const isAdmin = adminRoles.includes(role);
        
        const employeeData = {
            employeeId,
            password: hashedPassword,
            firstName, lastName, address, mobile, email, idCardType, idCardNumber, role, doj,
            isAdmin: isAdmin
        };

        if (req.file) {
            employeeData.profileImage = {
                fileId: req.file.id,
                filename: req.file.filename
            };
        }

        const newEmployee = new Employee(employeeData);
        await newEmployee.save();
        res.json({ success: true, message: 'Employee added successfully.' });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ success: false, message: 'Employee ID already exists.' });
        } else {
            console.error('Error adding employee:', err);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
});

// Get all employees (admin/HR)
app.get('/api/employees', authenticateToken, requireHRorAdmin, async (req, res) => {
    try {
        const employees = await Employee.find({}, '-password');
        res.json({ success: true, employees });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get profile image
app.get('/api/employees/:id/profile-image', async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee?.profileImage) {
            return res.status(404).json({ success: false, message: 'Profile image not found' });
        }

        const file = await gfs.files.findOne({ _id: employee.profileImage.fileId });
        if (!file) return res.status(404).json({ success: false, message: 'File not found' });

        res.set('Content-Type', file.contentType);
        gfs.createReadStream(file._id).pipe(res);
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update profile image
app.patch('/api/employees/:id/profile-image', authenticateToken,  async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        if (employee.profileImage?.fileId) {
            await gfs.files.deleteOne({ _id: employee.profileImage.fileId });
        }

        if (req.file) {
            employee.profileImage = {
                fileId: req.file.id,
                filename: req.file.filename
            };
            await employee.save();
            res.json({ success: true, message: 'Profile image updated successfully' });
        } else {
            res.status(400).json({ success: false, message: 'No image file provided' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Leave Request (submit)
app.post('/api/leave-requests', authenticateToken, async (req, res) => {
    const { reason, leaveCount, fromDate, toDate, comments } = req.body;
    const { employeeId, name } = req.user;
    
    if (!reason || !leaveCount || !fromDate || !toDate) {
        return res.status(400).json({ success: false, message: 'All required fields are missing.' });
    }

    try {
        const leave = new LeaveRequest({ 
            employeeId, 
            name, 
            reason, 
            leaveCount, 
            fromDate, 
            toDate, 
            comments 
        });
        await leave.save();
        res.json({ success: true, message: 'Leave request submitted successfully.' });
    } catch (err) {
        console.error('Error submitting leave request:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Leave Request (view)
app.get('/api/leave-requests', authenticateToken, async (req, res) => {
    try {
        const adminRoles = ['admin', 'hr_admin'];
        const hrRoles = ['hr_admin', 'hr_manager', 'hr_executive', 'hr_recruiter'];
        
        // Admin and HR roles can see all leave requests, others see only their own
        const canViewAll = adminRoles.includes(req.user.role) || hrRoles.includes(req.user.role);
        
        const leaveRequests = canViewAll
            ? await LeaveRequest.find().sort({ createdAt: -1 })
            : await LeaveRequest.find({ employeeId: req.user.employeeId }).sort({ createdAt: -1 });
        res.json({ success: true, leaveRequests });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Leave Request (approve/reject)
app.patch('/api/leave-requests/:id/approve', authenticateToken, requireHRorAdmin, async (req, res) => {
    try {
        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

        leave.status = 'Approved';
        await leave.save();
        res.json({ success: true, message: 'Leave request approved' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
app.patch('/api/leave-requests/:id/reject', authenticateToken, requireHRorAdmin, async (req, res) => {
    try {
        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

        leave.status = 'Rejected';
        await leave.save();
        res.json({ success: true, message: 'Leave request rejected' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get employee statistics (admin only)
app.get('/api/employees/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalEmployees = await Employee.countDocuments();
        const totalAdmins = await Employee.countDocuments({ isAdmin: true });
        
        res.json({ 
            success: true, 
            totalEmployees, 
            totalAdmins 
        });
    } catch (err) {
        console.error('Error getting employee stats:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Pay slip generation (admin/HR)
app.post('/api/pay-slip', authenticateToken, requireHRorAdmin, async (req, res) => {
    try {
        const { employeeId, month, year, basicSalary, allowances } = req.body;
        
        if (!employeeId || !month || !year || !basicSalary || !allowances) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required for pay slip generation.' 
            });
        }

        // Check if employee exists
        const employee = await Employee.findOne({ employeeId });
        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                message: 'Employee not found.' 
            });
        }

        // Calculate total salary
        const totalSalary = basicSalary + allowances;
        
        // Here you would typically save the pay slip to database
        // For now, we'll just return success
        res.json({ 
            success: true, 
            message: 'Pay slip generated successfully',
            data: {
                employeeId,
                employeeName: `${employee.firstName} ${employee.lastName}`,
                month,
                year,
                basicSalary,
                allowances,
                totalSalary
            }
        });
    } catch (err) {
        console.error('Error generating pay slip:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});


// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
