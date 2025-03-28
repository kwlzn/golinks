// DOM elements
const slugInput = document.getElementById('slug');
const urlInput = document.getElementById('url');
const usernameInput = document.getElementById('username');
const isDynamicCheckbox = document.getElementById('is-dynamic');
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
            
            // Format the date in a more compact way
            const createdAt = new Date(link.created_at);
            // Use YYYY-MM-DD HH:MM format to save space
            const formattedDate = createdAt.toISOString().replace('T', ' ').substring(0, 16);
            
            // Add dynamic link indicator if applicable
            const dynamicIndicator = link.is_dynamic ? 
                `<span class="dynamic-badge" title="Dynamic link with parameter">Dynamic</span>` : '';
                
            row.innerHTML = `
                <td>
                    <a href="/${link.slug}" target="_blank">${link.slug}</a>
                    ${dynamicIndicator}
                </td>
                <td><a href="${link.url}" target="_blank">${link.url}</a></td>
                <td>${formattedDate}</td>
                <td>
                    <button class="delete-btn" data-slug="${link.slug}" title="Delete this link">🗑️</button>
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
            
            // Hide the table when no results found
            document.getElementById('search-results-table').style.display = 'none';
        } else {
            // Make sure the table is visible
            document.getElementById('search-results-table').style.display = 'table';
            // Show results info
            resultsHeader.style.display = 'block';
            
            // Create the info message
            if (total_count > 10) {
                resultsHeader.innerHTML = `
                    <div class="results-count">Found <strong>${total_count}</strong> matches. Showing only the 10 most recent.</div>
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
    
    // Format the date in a more compact way
    const createdAt = new Date(link.created_at);
    // Use YYYY-MM-DD HH:MM format to save space
    const formattedDate = createdAt.toISOString().replace('T', ' ').substring(0, 16);
    
    // Add dynamic link indicator if applicable
    const dynamicIndicator = link.is_dynamic ? 
        `<span class="dynamic-badge" title="Dynamic link with parameter">Dynamic</span>` : '';
    
    // Truncate URL if it's too long (>50 chars)
    const maxUrlLength = 50;
    const displayUrl = link.url.length > maxUrlLength ? 
        `${link.url.substring(0, maxUrlLength)}...` : link.url;
    
    row.innerHTML = `
        <td>
            <a href="/${link.slug}" target="_blank">${link.slug}</a>
            ${dynamicIndicator}
        </td>
        <td><a href="${link.url}" target="_blank" title="${link.url}">${displayUrl}</a></td>
        <td>${link.username}</td>
        <td>${formattedDate}</td>
        <td>
            <button class="delete-btn" data-slug="${link.slug}" title="Delete this link">🗑️</button>
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
        errorMessage.textContent = 'Name must start with an alphanumeric character.';
        return;
    }
    
    if (!/^[a-zA-Z0-9._\-/]+$/.test(slug)) {
        errorMessage.textContent = 'Name can only contain alphanumeric characters, dots, underscores, hyphens, and forward slashes.';
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
    
    const isDynamic = isDynamicCheckbox.checked;
    
    // URL validation for dynamic links
    if (isDynamic && !url.includes('%s')) {
        errorMessage.textContent = 'Dynamic links must contain a %s placeholder in the URL.';
        return;
    }
    
    const payload = { slug, url, username, is_dynamic: isDynamic };
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
    // Use YYYY-MM-DD HH:MM format to save space
    const formattedDate = createdAt.toISOString().replace('T', ' ').substring(0, 16);
    
    // Get dynamic link indicator if applicable
    const dynamicInfo = link.is_dynamic ? 
        `<div class="link-property">
            <strong>Type:</strong> 
            <span class="dynamic-badge" title="Dynamic link with parameter">Dynamic</span>
            <small style="margin-left: 10px; color: #666;">
                Parameters after /${link.slug}/ will replace %s in the URL
            </small>
        </div>` : 
        `<div class="link-property">
            <strong>Type:</strong> Static
        </div>`;
    
    existingLinkDetails.innerHTML = `
        <div class="link-info">
            <div class="link-property">
                <strong>Slug:</strong> 
                <a href="/${link.slug}" target="_blank" class="slug-link">${link.slug}</a>
            </div>
            <div class="link-property">
                <strong>URL:</strong> 
                <a href="${link.url}" target="_blank" title="${link.url}">
                    ${link.url.length > 70 ? `${link.url.substring(0, 70)}...` : link.url}
                </a>
            </div>
            ${dynamicInfo}
            <div class="link-property">
                <strong>Created By:</strong> ${link.username}
            </div>
            <div class="link-property">
                <strong>Created At:</strong> ${formattedDate}
            </div>
        </div>
        <div class="link-action">
            <button class="delete-btn" id="existing-delete-btn" data-slug="${link.slug}" title="Delete this link">🗑️ Delete Link</button>
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
    
    // Make sure the table is visible since we're showing an existing link
    document.getElementById('search-results-table').style.display = 'table';
    
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

// Add event listener for isDynamicCheckbox to provide URL placeholder guidance
isDynamicCheckbox.addEventListener('change', function() {
    if (this.checked && !urlInput.value.includes('%s')) {
        // Suggest a placeholder URL format if user enables dynamic links
        if (urlInput.value.length > 0) {
            // Try to insert %s at a reasonable place in the existing URL
            const url = new URL(urlInput.value || 'https://example.com');
            if (!url.pathname || url.pathname === '/') {
                // No path, append a path with placeholder
                urlInput.value = urlInput.value.replace(/\/?$/, '/%s');
            } else {
                // There's a path, suggest replacing last segment with %s
                const pathParts = url.pathname.split('/');
                if (pathParts.length > 1) {
                    pathParts[pathParts.length - 1] = '%s';
                    url.pathname = pathParts.join('/');
                    urlInput.value = url.toString();
                } else {
                    // Just append the placeholder
                    urlInput.value = urlInput.value.replace(/\/?$/, '/%s');
                }
            }
        } else {
            // If empty, suggest a basic placeholder pattern
            urlInput.value = 'https://example.com/%s';
        }
    }
});

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
