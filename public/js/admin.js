document.addEventListener('DOMContentLoaded', function() {
    // Handle status updates
    document.querySelectorAll('.update-status').forEach(button => {
        button.onclick = async function() {
            const ticketId = this.dataset.id;
            const statusSelect = this.parentElement.querySelector('.status-select');
            const newStatus = statusSelect.value;

            try {
                const response = await fetch(`/admin/ticket/${ticketId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                });

                const data = await response.json();

                if (data.success) {
                    alert('Status updated successfully');
                    // Update the status in the UI
                    const statusBadge = this.closest('.ticket-card')
                        .querySelector('.status-badge');
                    if (statusBadge) {
                        statusBadge.textContent = newStatus;
                        statusBadge.className = `status-badge ${newStatus}`;
                    }
                } else {
                    alert(data.message || 'Error updating status');
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Error updating status');
            }
        };
    });

    // Handle status filtering
    const statusFilter = document.getElementById('statusFilter');
    statusFilter.onchange = function() {
        const selectedStatus = this.value;
        document.querySelectorAll('.ticket-card').forEach(card => {
            if (!selectedStatus || card.querySelector('.status-select').value === selectedStatus) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
}); 