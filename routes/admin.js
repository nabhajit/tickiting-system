const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Ticket = require('../models/Ticket');

// Get admin dashboard
router.get('/dashboard', protect, adminOnly, async (req, res) => {
    try {
        const tickets = await Ticket.find()
            .populate('userId', 'username')
            .sort({ createdAt: -1 })
            .lean();

        res.render('admin-dashboard', { 
            user: req.user,
            tickets
        });
    } catch (err) {
        console.error('Admin dashboard error:', err);
        res.status(500).render('error', { 
            message: 'Error loading admin dashboard',
            user: req.user
        });
    }
});

// Update ticket status
router.put('/ticket/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ 
                success: false, 
                message: 'Ticket not found' 
            });
        }

        const { status } = req.body;
        if (!['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid status' 
            });
        }

        ticket.status = status;
        await ticket.save();

        res.json({ 
            success: true, 
            message: 'Status updated successfully',
            status: ticket.status
        });
    } catch (err) {
        console.error('Status update error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating status' 
        });
    }
});

module.exports = router; 