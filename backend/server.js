require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const APEX_URL = process.env.ORACLE_BASE_URL;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger (helps debugging in hosted environments)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.body || {}).length) {
        console.log('Request body:', JSON.stringify(req.body));
    }
    next();
});

// Early check: ensure APEX_URL is configured
if (!APEX_URL) {
    console.warn('WARNING: ORACLE_BASE_URL is not set. Backend proxy requests will fail.');
}

// --- 1. ROOMS & ALLOCATIONS ---
// Get available rooms
app.get('/api/rooms', async (req, res) => {
    try {
        const response = await fetch(`${APEX_URL}/rooms`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        const respText = await response.text().catch(() => '');
        let data = {};
        try { data = respText ? JSON.parse(respText) : {}; } catch { data = { raw: respText }; }
        
        console.log('Upstream /rooms status:', response.status);
        
        if (response.ok) {
            // If data.items is undefined, default safely to an empty array []
            const roomsArray = data.items || [];
            res.status(200).json(roomsArray);
        } else {
            res.status(response.status).json({ error: 'Upstream rooms error', details: data });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to communicate with Oracle DB", details: err.message });
    }
});

// Assign a student to a room
app.post('/api/allocations', async (req, res) => {
    try {
        const response = await fetch(`${APEX_URL}/allocations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        if (response.status === 201) {
            res.status(201).json({ message: "Room allocation processed successfully!" });
        } else {
            res.status(response.status).json({ error: "Failed to process allocation" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server Error", details: err.message });
    }
});

// --- 2. STUDENTS ---
// Register a new student
app.post('/api/students', async (req, res) => {
    try {
        const response = await fetch(`${APEX_URL}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        if (response.status === 201) {
            res.status(201).json({ message: "Student registered successfully inside Oracle Cloud!" });
        } else {
            res.status(response.status).json({ error: "Registration failed" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server Error", details: err.message });
    }
});

// --- 3. FEE TRACKING ---
// Get fee defaulters list
app.get('/api/fees/defaulters', async (req, res) => {
    try {
        const response = await fetch(`${APEX_URL}/fees/defaulters`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });
        const respText = await response.text().catch(() => '');
        let data = {};
        try { data = respText ? JSON.parse(respText) : {}; } catch { data = { raw: respText }; }
        
        console.log('Upstream /fees/defaulters status:', response.status);
        
        if (response.ok) {
            const feesArray = data.items || [];
            res.status(200).json(feesArray);
        } else {
            res.status(response.status).json({ error: 'Upstream fees error', details: data });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch financial data", details: err.message });
    }
});

// Mark an invoice as paid
app.put('/api/fees/:id/pay', async (req, res) => {
    try {
        const response = await fetch(`${APEX_URL}/fees/${req.params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            res.status(200).json({ message: `Invoice #${req.params.id} marked as Paid successfully.` });
        } else {
            res.status(response.status).json({ error: "Failed to update payment record" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server Error", details: err.message });
    }
});

// --- 4. COMPLAINT SYSTEM ---
// Get active complaints summary dashboard
app.get('/api/complaints/active', async (req, res) => {
    try {
        const response = await fetch(`${APEX_URL}/complaints/active`, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });
        const respText = await response.text().catch(() => '');
        let data = {};
        try { data = respText ? JSON.parse(respText) : {}; } catch { data = { raw: respText }; }
        
        console.log('Upstream /complaints/active status:', response.status);
        
        if (response.ok) {
            const complaintsArray = data.items || [];
            res.status(200).json(complaintsArray);
        } else {
            res.status(response.status).json({ error: 'Upstream complaints error', details: data });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch complaints data", details: err.message });
    }
});

// File a new complaint
app.post('/api/complaints/active', async (req, res) => {
    try {
        const response = await fetch(`${APEX_URL}/complaints/active`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        if (response.status === 201 || response.ok) {
            res.status(201).json({ message: "Complaint submitted successfully." });
        } else {
            const data = await response.json().catch(() => ({}));
            res.status(response.status).json(data.error ? data : { error: "Failed to submit complaint" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server Error", details: err.message });
    }
});

// Update complaint status (Resolve a complaint)
app.put('/api/complaints/:id', async (req, res) => {
    try {
        const response = await fetch(`${APEX_URL}/complaints/${req.params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });
        if (response.ok) {
            res.status(200).json({ message: `Complaint #${req.params.id} updated successfully.` });
        } else {
            res.status(response.status).json({ error: "Failed to update complaint" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server Error", details: err.message });
    }
});

// Delete a complaint
app.delete('/api/complaints/:id', async (req, res) => {
    try {
        const response = await fetch(`${APEX_URL}/complaints/${req.params.id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            res.status(200).json({ message: `Complaint #${req.params.id} deleted successfully.` });
        } else {
            res.status(response.status).json({ error: "Failed to delete complaint" });
        }
    } catch (err) {
        res.status(500).json({ error: "Server Error", details: err.message });
    }
});

// --- 5. AUTHENTICATION SYSTEM ---
// Handles User Login (Admin & Student)
app.post('/api/auth/login', async (req, res) => {
    try {
        // Add some common browser-like headers to reduce WAF blocking
        const response = await fetch(`${APEX_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
                'Referer': APEX_URL,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(req.body) // Sends { username, password }
        });

        const respText = await response.text().catch(() => '');
        let data = {};
        try {
            data = respText ? JSON.parse(respText) : {};
        } catch (parseErr) {
            // Not JSON — keep raw text for debugging
            data = { raw: respText };
        }

        console.log('Upstream auth response status:', response.status);
        console.log('Upstream auth response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
        console.log('Upstream auth response body (truncated):', (respText || '').slice(0, 1000));

        if (response.status === 200) {
            // Send role and student_id back to frontend session manager
            res.status(200).json(data);
        } else {
            // Forward status and include upstream body for troubleshooting
            res.status(response.status).json({ error: 'Upstream auth error', details: data });
        }
    } catch (err) {
        console.error('Error in /api/auth/login:', err);
        res.status(500).json({ error: "Authentication system failure", details: err.message });
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Node.js Gateway proxying traffic to Oracle Cloud on port ${PORT}`);
    console.log('APEX_URL present:', Boolean(APEX_URL));
});

// Global error handler for uncaught errors
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Server Error', details: err?.message || 'Unexpected error' });
});