document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('ticketModal');
    const newTicketBtn = document.getElementById('newTicketBtn');
    const closeBtn = document.querySelector('.close');
    const newTicketForm = document.getElementById('newTicketForm');

    // Open modal
    newTicketBtn.onclick = function() {
        // Clear form inputs
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        
        // Reset form state
        newTicketForm.reset();
        
        // Show modal
        modal.style.display = "block";
    }

    // Close modal
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Handle new ticket submission
    newTicketForm.onsubmit = async function(e) {
        e.preventDefault();
        
        // Get form elements
        const titleInput = document.getElementById('title');
        const descriptionInput = document.getElementById('description');

        const formData = {
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim()
        };

        // Validate inputs
        if (!formData.title || !formData.description) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const response = await fetch('/user/ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                // Add the new ticket to the dashboard
                const ticketsContainer = document.querySelector('.tickets-container');
                const noTicketsMessage = document.querySelector('.no-tickets');
                
                if (noTicketsMessage) {
                    noTicketsMessage.remove();
                }

                const ticketHtml = `
                    <div class="ticket-card" data-id="${data.ticket._id}">
                        <div class="ticket-header">
                            <h3>${data.ticket.title}</h3>
                            <span class="status-badge ${data.ticket.status}">${data.ticket.status}</span>
                        </div>
                        <div class="ticket-id">
                            <small>Ticket #${data.ticket._id}</small>
                        </div>
                        <p class="description">${data.ticket.description}</p>
                        <div class="ticket-footer">
                            <span class="date">Created: ${new Date(data.ticket.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                            <div class="ticket-actions">
                                <button class="btn btn-secondary view-ticket" data-id="${data.ticket._id}">View Details</button>
                                <button class="btn btn-danger delete-ticket" data-id="${data.ticket._id}">Delete</button>
                            </div>
                        </div>
                    </div>
                `;

                ticketsContainer.insertAdjacentHTML('afterbegin', ticketHtml);
                
                // Add click handler to the new ticket's view button
                const newTicketCard = ticketsContainer.firstElementChild;
                addViewTicketHandler(newTicketCard);
                
                // Add delete handler to the new ticket's delete button
                const deleteButton = newTicketCard.querySelector('.delete-ticket');
                handleDelete(deleteButton);
                
                // Close modal and reset form
                modal.style.display = "none";
                // Clear form inputs
                titleInput.value = '';
                descriptionInput.value = '';
                
                // Reset form state
                newTicketForm.reset();
                
                // Clear any validation states
                titleInput.classList.remove('invalid');
                descriptionInput.classList.remove('invalid');
            } else {
                alert(data.message || 'Error creating ticket');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error creating ticket');
        }
    }

    // Handle view ticket details
    document.querySelectorAll('.view-ticket').forEach(button => {
        button.onclick = function(e) {
            e.preventDefault(); // Prevent any default button behavior
            const ticketId = this.dataset.id;
            if (ticketId) {
                window.location.href = `/user/ticket/${ticketId}`;
            } else {
                alert('Invalid ticket ID');
            }
        }
    });

    // Add click handler for newly added tickets
    function addViewTicketHandler(ticketCard) {
        const viewButton = ticketCard.querySelector('.view-ticket');
        if (viewButton) {
            viewButton.onclick = function(e) {
                e.preventDefault(); // Prevent any default button behavior
                const ticketId = this.dataset.id;
                if (ticketId) {
                    window.location.href = `/user/ticket/${ticketId}`;
                } else {
                    alert('Invalid ticket ID');
                }
            }
        }
    }

    // Handle ticket deletion
    function handleDelete(button) {
        button.onclick = async function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to delete this ticket?')) {
                const ticketId = this.dataset.id;
                try {
                    const response = await fetch(`/user/ticket/${ticketId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // Remove the ticket card from the UI
                        const ticketCard = this.closest('.ticket-card');
                        ticketCard.remove();
                        
                        // Check if there are no tickets left
                        const ticketsContainer = document.querySelector('.tickets-container');
                        if (!ticketsContainer.querySelector('.ticket-card')) {
                            ticketsContainer.innerHTML = '<p class="no-tickets">No tickets found. Create a new ticket to get started.</p>';
                        }
                        // Show success message
                        alert('Ticket deleted successfully');
                    } else {
                        alert(data.message || 'Error deleting ticket');
                    }
                } catch (err) {
                    console.error('Error:', err);
                    alert('Error deleting ticket. Please try again.');
                }
            }
        }
    }

    // Add delete handlers to existing tickets
    document.querySelectorAll('.delete-ticket').forEach(button => {
        handleDelete(button);
    });
}); 