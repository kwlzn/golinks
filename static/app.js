// DOM elements
const slugInput = document.getElementById('slug');
const urlInput = document.getElementById('url');
const usernameInput = document.getElementById('username');
const createBtn = document.getElementById('create-btn');
const errorMessage = document.getElementById('error-message');
const linksBody = document.getElementById('links-body');
const searchBtn = document.getElementById('search-btn');
const searchQuery = document.getElementById('search-query');
const searchResultsBody = document.getElementById('search-results-body');
const existingLinkContainer = document.getElementById('existing-link-container');
const existingLinkDetails = document.getElementById('existing-link-details');

// Function to load user links
async function loadLinks() {
    console.log('Loading user links...');
    const userLinksSection = document.getElementById('user-links-section');
    
    // Get username from cookie
    const username = getCookie('golinks_username');
    if (!username) {
        // Hide the user links section if no username cookie
        userLinksSection.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`/_api/links/user/${encodeURIComponent(username)}`);
        console.log('User links API response status:', response.status);
        const links = await response.json();
        console.log('User links loaded:', links);
        
        if (links.length === 0) {
            // Hide the section if no links found for user
            userLinksSection.style.display = 'none';
            return;
        }
        
        // Show the user links section
        userLinksSection.style.display = 'block';
        
        linksBody.innerHTML = '';
        
        links.forEach(link => {
            const row = document.createElement('tr');
            
            // Format the date
            const createdAt = new Date(link.created_at);
            const formattedDate = createdAt.toLocaleDateString() + ' ' + createdAt.toLocaleTimeString();
            
            row.innerHTML = `
                <td><a href="/${link.slug}" target="_blank">${link.slug}</a></td>
                <td><a href="${link.url}" target="_blank">${link.url}</a></td>
                <td>${link.username}</td>
                <td>${formattedDate}</td>
                <td>
                    <button class="delete-btn" data-slug="${link.slug}">Delete</button>
                </td>
            `;
            
            linksBody.appendChild(row);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const button = e.target;
                const slug = button.getAttribute('data-slug');
                
                if (confirm(`Are you sure you want to delete the link '${slug}'?`)) {
                    await deleteLink(slug);
                }
            });
        });
    } catch (error) {
        console.error('Error loading user links:', error);
        // Just hide the section on error
        userLinksSection.style.display = 'none';
    }
}

// Function to search for links
async function searchLinks() {
    const query = searchQuery.value.trim();
    
    // Ensure search form is expanded when user performs a search
    const searchContent = document.querySelector('.search-content');
    const collapseArrow = document.querySelector('.collapse-arrow');
    
    if (!searchContent.classList.contains('expanded')) {
        searchContent.classList.add('expanded');
        collapseArrow.classList.add('expanded');
    }
    
    if (!query) {
        // Hide the search results container
        const searchResultsContainer = document.getElementById('search-results-container');
        searchResultsContainer.classList.remove('visible');
        
        // Clear any existing results
        setTimeout(() => {
            searchResultsBody.innerHTML = '';
            
            // Hide any existing results header
            const resultsHeader = document.getElementById('search-results-header');
            if (resultsHeader) {
                resultsHeader.style.display = 'none';
            }
        }, 300);
        
        return;
    }
    
    try {
        // Show the search results container
        const searchResultsContainer = document.getElementById('search-results-container');
        searchResultsContainer.classList.add('visible');
        
        // Encode the query to handle special characters
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(`/_api/links/search?query=${encodedQuery}`);
        
        if (!response.ok) {
            throw new Error('Failed to search links');
        }
        
        const data = await response.json();
        const { total_count, links } = data;
        
        // Clear previous results
        searchResultsBody.innerHTML = '';
        
        // Get the results header element or create it if it doesn't exist
        let resultsHeader = document.getElementById('search-results-header');
        if (!resultsHeader) {
            resultsHeader = document.createElement('div');
            resultsHeader.id = 'search-results-header';
            resultsHeader.className = 'search-results-info';
            document.getElementById('search-results-container').insertBefore(
                resultsHeader, 
                document.getElementById('search-results-table')
            );
        }
        
        if (total_count === 0) {
            // Show results header with 0 count
            resultsHeader.style.display = 'block';
            resultsHeader.innerHTML = `
                <div class="results-count">Found <strong>0</strong> matches.</div>
            `;
        } else {
            // Show results info
            resultsHeader.style.display = 'block';
            
            // Create the info message
            if (total_count > 10) {
                resultsHeader.innerHTML = `
                    <div class="results-count">Found <strong>${total_count}</strong> matches. Showing the 10 most recent.</div>
                    <div class="results-warning">Refine your search to see more specific results.</div>
                `;
            } else {
                resultsHeader.innerHTML = `
                    <div class="results-count">Found <strong>${total_count}</strong> matches.</div>
                `;
            }
            
            // Add the matching links to the table
            links.forEach(link => {
                const row = createLinkRow(link);
                searchResultsBody.appendChild(row);
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('#search-results-body .delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const button = e.target;
                    const slug = button.getAttribute('data-slug');
                    
                    if (confirm(`Are you sure you want to delete the link '${slug}'?`)) {
                        await deleteLink(slug);
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error searching links:', error);
        
        // Show the search results container
        const searchResultsContainer = document.getElementById('search-results-container');
        searchResultsContainer.style.display = 'block';
        
        // Show error message
        noResultsMessage.style.display = 'block';
        noResultsMessage.textContent = 'Error searching links. Please try again.';
        
        // Hide any results header
        const resultsHeader = document.getElementById('search-results-header');
        if (resultsHeader) {
            resultsHeader.style.display = 'none';
        }
    }
}

// Helper function to create a link row
function createLinkRow(link) {
    const row = document.createElement('tr');
    
    // Format the date
    const createdAt = new Date(link.created_at);
    const formattedDate = createdAt.toLocaleDateString() + ' ' + createdAt.toLocaleTimeString();
    
    row.innerHTML = `
        <td><a href="/${link.slug}" target="_blank">${link.slug}</a></td>
        <td><a href="${link.url}" target="_blank">${link.url}</a></td>
        <td>${link.username}</td>
        <td>${formattedDate}</td>
        <td>
            <button class="delete-btn" data-slug="${link.slug}">Delete</button>
        </td>
    `;
    
    return row;
}

// Function to check if a link exists
async function checkLinkExists(slug) {
    try {
        // Encode the slug to handle slashes and special characters
        const encodedSlug = encodeURIComponent(slug);
        
        console.log(`Checking if slug exists: ${slug}, encoded as: ${encodedSlug}`);
        
        const response = await fetch(`/_api/links/${encodedSlug}`);
        
        if (response.ok) {
            return await response.json();
        }
        
        return null;
    } catch (error) {
        console.error('Error checking if link exists:', error);
        return null;
    }
}

// Function to create a new link
async function createLink() {
    console.log('Create link button clicked');
    
    // Hide existing link container
    existingLinkContainer.style.display = 'none';
    
    const slug = slugInput.value.trim();
    const url = urlInput.value.trim();
    const username = usernameInput.value.trim();
    
    console.log('Form values:', { slug, url, username });
    
    // Basic validation
    if (!slug || !url || !username) {
        errorMessage.textContent = 'All fields are required.';
        return;
    }
    
    // Client-side slug validation
    if (!/^[a-zA-Z0-9]/.test(slug)) {
        errorMessage.textContent = 'Slug must start with an alphanumeric character.';
        return;
    }
    
    if (!/^[a-zA-Z0-9._\-/]+$/.test(slug)) {
        errorMessage.textContent = 'Slug can only contain alphanumeric characters, dots, underscores, hyphens, and forward slashes.';
        return;
    }
    
    // URL validation - ensure it's a valid URL format
    try {
        new URL(url);
    } catch (e) {
        errorMessage.textContent = 'Please enter a valid URL (e.g., https://example.com)';
        return;
    }
    
    // Save username in cookie for future use
    if (typeof setCookie === 'function') {
        setCookie('golinks_username', username, 365);
    }
    
    // Check if the link already exists
    const existingLink = await checkLinkExists(slug);
    if (existingLink) {
        // Display existing link details instead of error
        errorMessage.textContent = '';
        displayExistingLink(existingLink);
        return;
    }
    
    const payload = { slug, url, username };
    console.log('Sending payload:', payload);
    
    try {
        const response = await fetch('/_api/links/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('Server error:', error);
            throw new Error(error.detail || 'Failed to create link');
        }
        
        const result = await response.json();
        console.log('Success result:', result);
        
        // Reset form (except username)
        slugInput.value = '';
        urlInput.value = '';
        errorMessage.textContent = '';
        
        // Show success message if available
        const successMessage = document.getElementById('success-message');
        if (successMessage) {
            successMessage.style.display = 'block';
            successMessage.innerHTML = `Link "<a href="/${slug}" target="_blank" class="slug-link">${slug}</a>" created successfully!`;
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 30000);
        }
        
        loadLinks();
    } catch (error) {
        console.error('Error creating link:', error);
        errorMessage.textContent = error.message || 'Error creating link. Please try again.';
    }
}

// Function to display existing link details
function displayExistingLink(link) {
    const createdAt = new Date(link.created_at);
    const formattedDate = createdAt.toLocaleDateString() + ' ' + createdAt.toLocaleTimeString();
    
    existingLinkDetails.innerHTML = `
        <div class="link-info">
            <div class="link-property">
                <strong>Slug:</strong> 
                <a href="/${link.slug}" target="_blank" class="slug-link">${link.slug}</a>
            </div>
            <div class="link-property">
                <strong>URL:</strong> 
                <a href="${link.url}" target="_blank">${link.url}</a>
            </div>
            <div class="link-property">
                <strong>Created By:</strong> ${link.username}
            </div>
            <div class="link-property">
                <strong>Created At:</strong> ${formattedDate}
            </div>
        </div>
        <div class="link-action">
            <button class="delete-btn" id="existing-delete-btn" data-slug="${link.slug}">Delete This Link</button>
        </div>
    `;
    
    existingLinkContainer.style.display = 'block';
    
    // Add event listener to the delete button
    document.getElementById('existing-delete-btn').addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete the link '${link.slug}'?`)) {
            await deleteLink(link.slug);
            existingLinkContainer.style.display = 'none';
        }
    });
    
    // Auto-populate search results with this slug and make sure search section is visible
    searchQuery.value = link.slug;
    
    // Ensure search panel is expanded
    const searchContent = document.querySelector('.search-content');
    const collapseArrow = document.querySelector('.collapse-arrow');
    
    if (!searchContent.classList.contains('expanded')) {
        searchContent.classList.add('expanded');
        collapseArrow.classList.add('expanded');
    }
    
    // Make sure search results container is visible
    const searchResultsContainer = document.getElementById('search-results-container');
    searchResultsContainer.classList.add('visible');
    
    // Clear any previous search results header
    const existingHeader = document.getElementById('search-results-header');
    if (existingHeader) {
        existingHeader.style.display = 'none';
    }
    
    searchLinks();
}

// Function to delete a link
async function deleteLink(slug) {
    try {
        // Encode the slug to handle slashes and special characters
        const encodedSlug = encodeURIComponent(slug);
        
        console.log(`Deleting slug: ${slug}, encoded as: ${encodedSlug}`);
        
        const response = await fetch(`/_api/links/${encodedSlug}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete link');
        }
        
        // Show success message
        const successMessage = document.getElementById('success-message');
        if (successMessage) {
            successMessage.style.display = 'block';
            successMessage.innerHTML = `Link "${slug}" deleted successfully!`;
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 30000);
        }
        
        // Hide existing link container if visible
        if (existingLinkContainer && existingLinkContainer.style.display !== 'none') {
            existingLinkContainer.style.display = 'none';
        }
        
        // Refresh search results if search query exists
        if (searchQuery && searchQuery.value.trim()) {
            searchLinks();
        }
        
        loadLinks();
    } catch (error) {
        console.error('Error deleting link:', error);
        errorMessage.textContent = error.message || 'Error deleting link. Please try again.';
    }
}

// Event listeners
createBtn.addEventListener('click', createLink);
searchBtn.addEventListener('click', searchLinks);

// Add enter key support for the search input
searchQuery.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        searchLinks();
    }
});

// Load links on page load
document.addEventListener('DOMContentLoaded', loadLinks);