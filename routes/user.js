const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Ticket = require('../models/Ticket');
const mongoose = require('mongoose');

// Get user dashboard with tickets
router.get('/dashboard', protect, async (req, res) => {
    try {
        // Populate the tickets with all necessary information
        const tickets = await Ticket.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .lean(); // Use lean() for better performance with plain objects

        // Format dates and prepare tickets for display
        const formattedTickets = tickets.map(ticket => ({
            ...ticket,
            createdAtFormatted: new Date(ticket.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }));

        res.render('user-dashboard', { 
            user: req.user,
            tickets: formattedTickets
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).render('error', { 
            message: 'Error loading dashboard',
            user: req.user
        });
    }
});

// Delete ticket
router.delete('/ticket/:id', protect, async (req, res) => {
    try {
        // Check if ID is valid
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid ticket ID' 
            });
        }

        const ticket = await Ticket.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!ticket) {
            return res.status(404).json({ 
                success: false, 
                message: 'Ticket not found' 
            });
        }

        // Delete the ticket
        await ticket.deleteOne();

        res.json({ success: true, message: 'Ticket deleted successfully' });
    } catch (err) {
        console.error('Error deleting ticket:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting ticket' 
        });
    }
});

// Create new ticket
router.post('/ticket', protect, async (req, res) => {
    try {
        const { title, description } = req.body;
        
        // Create new ticket
        const ticket = new Ticket({
            userId: req.user._id,
            title,
            description,
            status: 'Open'
        });

        await ticket.save();
        
        // Send success response
        res.status(200).json({ 
            success: true, 
            message: 'Ticket created successfully',
            ticket 
        });
    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating ticket' 
        });
    }
});

// View ticket details
router.get('/ticket/:id', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).render('error', { 
                message: 'Invalid ticket ID format',
                user: req.user
            });
        }

        const ticket = await Ticket.findOne({
            _id: req.params.id,
            userId: req.user._id
        })
        .populate('comments.createdBy', 'username')
        .lean();

        if (!ticket) {
            return res.render('ticket-not-found', { 
                user: req.user 
            });
        }

        // Format the dates for ticket and comments
        const formattedTicket = {
            ...ticket,
            createdAt: new Date(ticket.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            comments: ticket.comments.map(comment => ({
                ...comment,
                createdAt: new Date(comment.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }))
        };

        res.render('ticket-detail', { 
            ticket: formattedTicket,
            user: req.user
        });
    } catch (err) {
        console.error('Error viewing ticket:', err);
        res.status(500).render('error', { 
            message: 'Error loading ticket details',
            user: req.user
        });
    }
});

// Add comment to ticket
router.post('/ticket/:id/comment', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid ticket ID' 
            });
        }

        const ticket = await Ticket.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate('comments.createdBy', 'username');

        if (!ticket) {
            return res.status(404).json({ 
                success: false, 
                message: 'Ticket not found' 
            });
        }

        const { commentText } = req.body;
        if (!commentText || commentText.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required'
            });
        }
        
        // Create new comment
        const newComment = {
            text: commentText.trim(),
            createdBy: req.user._id,
            createdAt: new Date()
        };
        
        // Add comment to ticket
        ticket.comments.push(newComment);
        await ticket.save();

        // Send response with formatted comment
        res.json({ 
            success: true, 
            message: 'Comment added successfully',
            comment: {
                text: newComment.text,
                createdAt: newComment.createdAt,
                createdBy: req.user.username
            }
        });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error adding comment' 
        });
    }
});

// Update ticket status
router.put('/ticket/:id/status', protect, async (req, res) => {
    try {
        const ticket = await Ticket.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

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
        console.error('Error updating status:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error updating status' 
        });
    }
});

module.exports = router; 