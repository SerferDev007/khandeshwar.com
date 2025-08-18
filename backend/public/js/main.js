// Temple Management System - Main JavaScript

/**
 * Main application JavaScript for Temple Management System
 * Provides common functionality, API helpers, and UI interactions
 */

// Application configuration
const CONFIG = {
    API_BASE_URL: '/api',
    DEFAULT_PAGE_SIZE: 10,
    TOAST_DURATION: 3000
};

// Utility functions
const Utils = {
    /**
     * Format date to readable string
     */
    formatDate: (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Format currency amount
     */
    formatCurrency: (amount) => {
        if (!amount) return '₹0.00';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    },

    /**
     * Debounce function for search inputs
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Show loading state
     */
    showLoading: (element) => {
        if (element) {
            element.innerHTML = '<div class="loading">Loading...</div>';
        }
    },

    /**
     * Show error message
     */
    showError: (message, container = null) => {
        const errorHtml = `<div class="alert alert-error">${message}</div>`;
        if (container) {
            container.innerHTML = errorHtml;
        } else {
            console.error('Error:', message);
        }
    },

    /**
     * Show success message
     */
    showSuccess: (message, container = null) => {
        const successHtml = `<div class="alert alert-success">${message}</div>`;
        if (container) {
            container.innerHTML = successHtml;
        }
    }
};

// API helper functions
const API = {
    /**
     * Make HTTP request to API
     */
    request: async (endpoint, options = {}) => {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    },

    /**
     * GET request
     */
    get: (endpoint) => API.request(endpoint),

    /**
     * POST request
     */
    post: (endpoint, data) => API.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    /**
     * PUT request
     */
    put: (endpoint, data) => API.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),

    /**
     * DELETE request
     */
    delete: (endpoint) => API.request(endpoint, {
        method: 'DELETE'
    }),

    // Specific API endpoints
    health: () => API.get('/health'),
    devotees: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return API.get(`/devotees${queryString ? '?' + queryString : ''}`);
        },
        getById: (id) => API.get(`/devotees/${id}`),
        create: (data) => API.post('/devotees', data),
        update: (id, data) => API.put(`/devotees/${id}`, data),
        delete: (id) => API.delete(`/devotees/${id}`)
    },
    donations: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return API.get(`/donations${queryString ? '?' + queryString : ''}`);
        },
        getById: (id) => API.get(`/donations/${id}`),
        create: (data) => API.post('/donations', data),
        update: (id, data) => API.put(`/donations/${id}`, data),
        delete: (id) => API.delete(`/donations/${id}`),
        getReports: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return API.get(`/donations/reports${queryString ? '?' + queryString : ''}`);
        }
    },
    events: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return API.get(`/events${queryString ? '?' + queryString : ''}`);
        },
        getById: (id) => API.get(`/events/${id}`),
        create: (data) => API.post('/events', data),
        update: (id, data) => API.put(`/events/${id}`, data),
        delete: (id) => API.delete(`/events/${id}`),
        getUpcoming: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return API.get(`/events/upcoming${queryString ? '?' + queryString : ''}`);
        }
    },
    staff: {
        getAll: (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return API.get(`/staff${queryString ? '?' + queryString : ''}`);
        },
        getById: (id) => API.get(`/staff/${id}`),
        create: (data) => API.post('/staff', data),
        update: (id, data) => API.put(`/staff/${id}`, data),
        delete: (id) => API.delete(`/staff/${id}`)
    }
};

// UI Components
const UI = {
    /**
     * Create data table from array of objects
     */
    createTable: (data, columns, container) => {
        if (!data || !data.length) {
            container.innerHTML = '<div class="alert alert-info">No data available</div>';
            return;
        }

        let tableHtml = '<div class="table-container"><table class="data-table"><thead><tr>';
        
        // Create headers
        columns.forEach(col => {
            tableHtml += `<th>${col.header}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        // Create rows
        data.forEach(row => {
            tableHtml += '<tr>';
            columns.forEach(col => {
                let value = row[col.key];
                if (col.formatter) {
                    value = col.formatter(value, row);
                }
                tableHtml += `<td>${value || 'N/A'}</td>`;
            });
            tableHtml += '</tr>';
        });

        tableHtml += '</tbody></table></div>';
        container.innerHTML = tableHtml;
    },

    /**
     * Create pagination controls
     */
    createPagination: (currentPage, totalPages, onPageChange) => {
        let paginationHtml = '<div class="pagination">';
        
        // Previous button
        if (currentPage > 1) {
            paginationHtml += `<button class="btn btn-secondary" onclick="${onPageChange}(${currentPage - 1})">Previous</button>`;
        }

        // Page numbers
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            const activeClass = i === currentPage ? 'btn-primary' : 'btn-secondary';
            paginationHtml += `<button class="btn ${activeClass}" onclick="${onPageChange}(${i})">${i}</button>`;
        }

        // Next button
        if (currentPage < totalPages) {
            paginationHtml += `<button class="btn btn-secondary" onclick="${onPageChange}(${currentPage + 1})">Next</button>`;
        }

        paginationHtml += '</div>';
        return paginationHtml;
    },

    /**
     * Show toast notification
     */
    toast: (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            border-radius: 5px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, CONFIG.TOAST_DURATION);
    }
};

// Application initialization
const App = {
    /**
     * Initialize the application
     */
    init: () => {
        console.log('Temple Management System initialized');
        
        // Check system health
        App.checkHealth();
        
        // Initialize navigation
        App.initNavigation();
        
        // Initialize forms
        App.initForms();
    },

    /**
     * Check API health
     */
    checkHealth: async () => {
        try {
            const health = await API.health();
            console.log('System health:', health);
            
            if (health.database !== 'Connected') {
                console.warn('Database connection issue detected');
            }
        } catch (error) {
            console.error('Health check failed:', error);
        }
    },

    /**
     * Initialize navigation
     */
    initNavigation: () => {
        // Add active state to current page navigation
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.main-nav a, .dashboard-nav a');
        
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    },

    /**
     * Initialize forms
     */
    initForms: () => {
        // Add form validation and submission handlers
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                console.log('Form submission:', data);
                // TODO: Implement actual form submission logic
                UI.toast('Form submission is not yet implemented', 'info');
            });
        });
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Export for use in other scripts
window.TempleMS = {
    Utils,
    API,
    UI,
    App,
    CONFIG
};