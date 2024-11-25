document.addEventListener('DOMContentLoaded', function() {
    const commentForm = document.getElementById('commentForm');
    const ticketId = window.location.pathname.split('/').pop();

    // Handle comment submission
    commentForm.onsubmit = async function(e) {
        e.preventDefault();
        
        const commentText = document.getElementById('commentText').value.trim();
        if (!commentText) {
            alert('Please enter a comment');
            return;
        }

        try {
            const response = await fetch(`/user/ticket/${ticketId}/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ commentText })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data.success) {
                // Add new comment to the list
                const commentsList = document.querySelector('.comments-list');
                const noComments = commentsList.querySelector('.no-comments');
                if (noComments) {
                    noComments.remove();
                }

                const commentHtml = `
                    <div class="comment">
                        <p>${data.comment.text}</p>
                        <small>Added ${new Date(data.comment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</small>
                    </div>
                `;
                commentsList.insertAdjacentHTML('beforeend', commentHtml);

                // Clear the form
                document.getElementById('commentText').value = '';
                
                // Show success message
                alert('Comment added successfully');
            } else {
                alert(data.message || 'Error adding comment');
            }
        } catch (err) {
            console.error('Error:', err);
            alert('Error adding comment. Please try again.');
        }
    };
}); 