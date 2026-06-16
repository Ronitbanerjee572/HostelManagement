require('dotenv').config();
const express = require('express');
const cors = require('cors');
let jwt = require('jsonwebtoken');
// jsonwebtoken v9 may be an ESM default export when required; handle both shapes
if (jwt && !jwt.sign && jwt.default && typeof jwt.default.sign === 'function') {
    jwt = jwt.default;
}

// (diagnostics removed)

// Helper to sign JWTs robustly across module formats. Falls back to jwt-simple if necessary.
async function signJwt(payload, options = {}) {
    // prefer existing require'd jwt if available
    if (jwt && typeof jwt.sign === 'function') {
        return jwt.sign(payload, jwtSecret, options);
    }

    // try dynamic import (handles ESM distributions)
    try {
        const mod = await import('jsonwebtoken');
        const real = mod.default || mod;
        if (real && typeof real.sign === 'function') {
            return real.sign(payload, jwtSecret, options);
        }
    } catch (e) {
        console.warn('Dynamic import of jsonwebtoken failed:', e && e.message);
    }

    // fallback to jwt-simple (no expiresIn support — emulate with exp claim)
    try {
        const js = require('jwt-simple');
        const now = Math.floor(Date.now() / 1000);
        const tokenPayload = { ...payload };
        if (options && options.expiresIn) {
            // support numeric seconds or string like '8h'
            if (typeof options.expiresIn === 'number') {
                tokenPayload.exp = now + options.expiresIn;
            } else if (typeof options.expiresIn === 'string') {
                // simple parser for formats like '8h' or '3600s'
                const m = options.expiresIn.match(/^(\d+)([smhd])$/);
                if (m) {
                    const val = Number(m[1]);
                    const unit = m[2];
                    const mul = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
                    tokenPayload.exp = now + val * mul;
                }
            }
        }
        return js.encode(tokenPayload, jwtSecret);
    } catch (e) {
        // no jwt provider available
        throw new Error('No JWT provider available: ' + (e && e.message));
    }
}
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const app = express();
// Configure CORS using optional CORS_ORIGIN env for production
const corsOrigin = process.env.CORS_ORIGIN || '';
if (corsOrigin) {
    app.use(cors({ origin: corsOrigin }));
} else {
    // default to permissive for local development if not set
    app.use(cors());
}
app.use(express.json());

// Basic request logger for debugging (keeps minimal output)
// request logging removed for production cleanup

const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_structure';

// Create high-performance connection pool to cloud database
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 42358,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Structural self-check connection loop
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log("✅ Core System Link to Railway MySQL established successfully.");
        connection.release();
    } catch (err) {
        console.error("❌ Critical Link Fault: Cannot reach Railway database.", err.message);
    }
})();

// ==========================================
// UNIFIED AUTHENTICATION ENGINE
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing absolute auth payloads' });
        }

        // 1. Structural Check: Admin Bypass Check (.env)
        if (email.trim() === process.env.ADMIN_EMAIL) {
            if (password === process.env.ADMIN_PASSWORD) {
                try {
                    const token = await signJwt({ role: 'admin', email }, { expiresIn: '8h' });
                    return res.status(200).json({ token, user_role: 'admin' });
                } catch (e) {
                    console.error('JWT generation error (admin):', e && (e.stack || e));
                    return res.status(500).json({ error: 'Token generation failure', details: e?.message });
                }
            } else {
                return res.status(401).json({ error: 'Invalid admin system password' });
            }
        }

        // 2. Structural Check: Target Student Registry
        const [rows] = await pool.query('SELECT * FROM students WHERE email = ?', [email.trim()]);
        if (rows.length === 0) {
            console.log('Auth: no student found for', email.trim());
            return res.status(404).json({ error: 'Hostel account matching identity not found' });
        }

        const student = rows[0];
        console.log('Auth: student fetched', { student_id: student.student_id, email: student.email });

        // Process matching validation
        let passwordMatches = false;
        try {
            const stored = student.password || '';
            // If stored password looks like a bcrypt hash, use bcrypt.compare
            if (typeof stored === 'string' && stored.startsWith('$2')) {
                passwordMatches = await bcrypt.compare(password, stored);
            } else {
                // Fallback to direct comparison for legacy plaintext storage
                passwordMatches = password === stored;
            }
        } catch (e) {
            console.error('Password comparison error:', e && (e.stack || e));
            passwordMatches = false;
        }
        console.log('Auth: passwordMatches', passwordMatches);

        if (passwordMatches) {
            try {
                const token = await signJwt({ role: 'student', id: student.student_id }, { expiresIn: '8h' });
                return res.status(200).json({
                    token,
                    user_role: 'student',
                    student_id: student.student_id
                });
            } catch (e) {
                console.error('JWT generation error (student):', e && (e.stack || e));
                return res.status(500).json({ error: 'Token generation failure', details: e?.message });
            }
        }

        return res.status(401).json({ error: 'Invalid student registry credentials' });
    } catch (error) {
        console.error('Authentication Controller Error:', error && (error.stack || error));
        res.status(500).json({ error: 'Core Authentication Failure Internal' });
    }
});

// ==========================================
// ADMINISTRATOR EXCLUSIVE CONTROL PIPELINES
// ==========================================

// GET ALL ROOMS WITH OCCUPANCY STATUS
app.get('/api/rooms', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rooms');
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to extract system units', details: err.message });
    }
});

// ALLOCATE A STUDENT INTO A ROOM REGISTER
app.post('/api/allocations', async (req, res) => {
    try {
        const { student_id, room_id, start_date } = req.body;
        
        const [result] = await pool.query(
            'INSERT INTO allocations (student_id, room_id, start_date) VALUES (?, ?, ?)',
            [student_id, room_id, start_date]
        );
        res.status(201).json({ message: 'Room allocated successfully', allocationId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: 'Allocation handler engine halted', details: err.message });
    }
});

// LIST ALL ALLOCATIONS (ADMIN VIEW)
app.get('/api/allocations', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.allocation_id, a.student_id, a.room_id, a.start_date,
                   s.name AS student_name, s.roll_number AS student_roll, r.room_number
            FROM allocations a
            LEFT JOIN students s ON a.student_id = s.student_id
            LEFT JOIN rooms r ON a.room_id = r.room_id
            ORDER BY a.start_date DESC
        `);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch allocations', details: err.message });
    }
});

// EXTRACT OVERALL OUTSTANDING DEFAULTERS LIST (ADMIN VIEW)
app.get('/api/fees/defaulters', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT f.*, s.name, s.roll_number 
            FROM fees f
            JOIN students s ON f.student_id = s.student_id
            WHERE f.status IN ('UNPAID', 'OVERDUE')
        `);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch global ledger entries', details: err.message });
    }
});

// EXTRACT OPEN SUPPORT TICKETS (ADMIN VIEW)
app.get('/api/complaints/active', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT c.*, s.name, s.roll_number 
            FROM complaints c
            JOIN students s ON c.student_id = s.student_id
            WHERE c.status = 'PENDING'
            ORDER BY c.created_at DESC
        `);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to extract active operations terminal log', details: err.message });
    }
});

// [ADMIN] GET ALL REGISTERED STUDENTS (For the Allocation Dropdown Menu)
app.get('/api/students', async (req, res) => {
    try {
        // Fetch only necessary details to populate selection dropdowns safely
        const [rows] = await pool.query('SELECT student_id, name, roll_number, email FROM students');
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch student directory', details: err.message });
    }
});

// [ADMIN] CREATE/ADD A NEW ROOM TO THE REGISTRY
app.post('/api/rooms', async (req, res) => {
    try {
        const { room_number, capacity, status } = req.body;
        
        // Validation check for structural payload completion
        if (!room_number || !capacity) {
            return res.status(400).json({ error: 'Missing critical room configuration payloads' });
        }

        const [result] = await pool.query(
            'INSERT INTO rooms (room_number, capacity, status) VALUES (?, ?, ?)',
            [room_number, capacity, status || 'AVAILABLE']
        );
        
        res.status(201).json({ 
            message: 'New room registered successfully into infrastructure logs', 
            roomId: result.insertId 
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to append new room structure', details: err.message });
    }
});


// ==========================================
// TARGETED STUDENT DASHBOARD LOOKUP CHANNELS
// ==========================================

// GET A SPECIFIC STUDENT'S ROOM DATA
app.get('/api/student/:id/room', async (req, res) => {
    try {
        const studentId = req.params.id;
        const [rows] = await pool.query(`
            SELECT r.*, a.start_date 
            FROM allocations a
            JOIN rooms r ON a.room_id = r.room_id
            WHERE a.student_id = ?
        `, [studentId]);
        
        if (rows.length === 0) {
            return res.status(200).json({ message: 'No active hostel room assignment found.' });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to extract personal room registry data' });
    }
});

// GET A SPECIFIC STUDENT'S FINANCIAL HISTORY
app.get('/api/student/:id/fees', async (req, res) => {
    try {
        const studentId = req.params.id;
        const [rows] = await pool.query('SELECT * FROM fees WHERE student_id = ?', [studentId]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to pull isolated account balance profiles' });
    }
});

// GET A SPECIFIC STUDENT'S OWN LOGGED COMPLAINTS
app.get('/api/student/:id/complaints', async (req, res) => {
    try {
        const studentId = req.params.id;
        const [rows] = await pool.query('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to locate personal tracking tickets' });
    }
});

// FILE A COMPLAINT (STUDENT VIEW)
app.post('/api/complaints', async (req, res) => {
    try {
        const { student_id, title, description } = req.body;
        await pool.query(
            'INSERT INTO complaints (student_id, title, description) VALUES (?, ?, ?)',
            [student_id, title, description]
        );
        res.status(201).json({ message: 'Complaint lodged successfully into infrastructure queue' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to queue outbound tracking report' });
    }
});

// ==========================================
// ADDITIONAL CONTROLS: UPDATE & DELETE ROUTES
// ==========================================

// [ADMIN] UPDATE A ROOM'S STATUS OR CAPACITY
app.put('/api/rooms/:id', async (req, res) => {
    try {
        const roomId = req.params.id;
        const { room_number, capacity, status } = req.body;
        
        await pool.query(
            'UPDATE rooms SET room_number = ?, capacity = ?, status = ? WHERE room_id = ?',
            [room_number, capacity, status, roomId]
        );
        res.status(200).json({ message: 'Room updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update room records', details: err.message });
    }
});

// [ADMIN] DELETE/REVOKE A ROOM ALLOCATION
app.delete('/api/allocations/:id', async (req, res) => {
    try {
        const allocationId = req.params.id;
        await pool.query('DELETE FROM allocations WHERE allocation_id = ?', [allocationId]);
        res.status(200).json({ message: 'Room allocation revoked successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete allocation', details: err.message });
    }
});

// [ADMIN] UPDATE FEES STATUS (e.g., Marking as PAID)
app.put('/api/fees/:id', async (req, res) => {
    try {
        const feeId = req.params.id;
        const { status } = req.body; // Expects 'PAID', 'UNPAID', or 'OVERDUE'
        
        await pool.query('UPDATE fees SET status = ? WHERE fee_id = ?', [status, feeId]);
        res.status(200).json({ message: 'Payment ledger updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update fee status', details: err.message });
    }
});

// [ADMIN] RESOLVE A STUDENT COMPLAINT
app.put('/api/complaints/:id/resolve', async (req, res) => {
    try {
        const complaintId = req.params.id;
        await pool.query("UPDATE complaints SET status = 'RESOLVED' WHERE complaint_id = ?", [complaintId]);
        res.status(200).json({ message: 'Complaint marked as RESOLVED' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to resolve complaint ticket', details: err.message });
    }
});

// [STUDENT] DELETE/WITHDRAW A PENDING COMPLAINT
app.delete('/api/complaints/:id', async (req, res) => {
    try {
        const complaintId = req.params.id;
        // Optimization guard: Only let them delete it if it hasn't been resolved yet
        const [result] = await pool.query("DELETE FROM complaints WHERE complaint_id = ? AND status = 'PENDING'", [complaintId]);
        
        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'Cannot delete complaint. It may already be resolved.' });
        }
        res.status(200).json({ message: 'Complaint ticket withdrawn successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to withdraw complaint report', details: err.message });
    }
});

// Open and bind server portal
const PORT = process.env.PORT || 5000;

// Debug helper: list registered routes (useful to confirm runtime routing)
function listRegisteredRoutes() {
    try {
        const routes = [];
        if (app && app._router && Array.isArray(app._router.stack)) {
            app._router.stack.forEach((layer) => {
                if (layer.route && layer.route.path) {
                    const methods = Object.keys(layer.route.methods || {}).map(m => m.toUpperCase()).join(',');
                    routes.push(`${methods} ${layer.route.path}`);
                } else if (layer.name === 'router' && layer.handle && Array.isArray(layer.handle.stack)) {
                    layer.handle.stack.forEach((handler) => {
                        if (handler.route && handler.route.path) {
                            const methods = Object.keys(handler.route.methods || {}).map(m => m.toUpperCase()).join(',');
                            routes.push(`${methods} ${handler.route.path}`);
                        }
                    });
                }
            });
        }
        console.log('🔍 Registered Express routes:\n' + routes.join('\n'));
    } catch (err) {
        console.error('Failed to enumerate routes', err.message || err);
    }
    }

// enumerate routes at startup for visibility (non-sensitive)
listRegisteredRoutes();

app.listen(PORT, () => console.log(`🚀 Unified Hostel Proxy running on port ${PORT}`));