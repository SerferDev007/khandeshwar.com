// Admin Dashboard JavaScript

/**
 * Admin Dashboard functionality for Temple Management System
 */

// Admin-specific configuration
const AdminConfig = {
    currentPage: 1,
    pageSize: 10,
    currentSection: 'overview'
};

// Admin Dashboard Controller
const AdminDashboard = {
    /**
     * Initialize admin dashboard
     */
    init: () => {
        console.log('Admin Dashboard initialized');
        
        // Initialize navigation
        AdminDashboard.initNavigation();
        
        // Load overview data
        AdminDashboard.loadOverview();
        
        // Initialize search and filters
        AdminDashboard.initFilters();
    },

    /**
     * Initialize navigation between sections
     */
    initNavigation: () => {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.content-section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetSection = link.getAttribute('data-section');
                
                // Remove active classes
                navLinks.forEach(l => l.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));
                
                // Add active class to clicked link and corresponding section
                link.classList.add('active');
                const targetElement = document.getElementById(`${targetSection}-section`);
                if (targetElement) {
                    targetElement.classList.add('active');
                    AdminConfig.currentSection = targetSection;
                    
                    // Load section-specific data
                    AdminDashboard.loadSectionData(targetSection);
                }
            });
        });
    },

    /**
     * Load overview statistics
     */
    loadOverview: async () => {
        try {
            // Load basic statistics (placeholder implementation)
            document.getElementById('total-devotees').textContent = '150';
            document.getElementById('total-donations').textContent = '₹2,50,000';
            document.getElementById('active-events').textContent = '5';
            document.getElementById('staff-count').textContent = '25';

            // Load recent activities
            const activitiesContainer = document.getElementById('recent-activities-list');
            activitiesContainer.innerHTML = `
                <div class="activity-item">
                    <strong>New Devotee Registered:</strong> John Doe - ${TempleMS.Utils.formatDate(new Date())}
                </div>
                <div class="activity-item">
                    <strong>Donation Received:</strong> ₹5,000 for Festival Fund - ${TempleMS.Utils.formatDate(new Date())}
                </div>
                <div class="activity-item">
                    <strong>Event Scheduled:</strong> Ganesh Chaturthi Celebration - ${TempleMS.Utils.formatDate(new Date())}
                </div>
                <div class="activity-item">
                    <strong>Staff Added:</strong> Temple Manager - ${TempleMS.Utils.formatDate(new Date())}
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading overview:', error);
            TempleMS.Utils.showError('Failed to load overview data');
        }
    },

    /**
     * Load data for specific section
     */
    loadSectionData: (section) => {
        switch (section) {
            case 'devotees':
                AdminDashboard.loadDevotees();
                break;
            case 'donations':
                AdminDashboard.loadDonations();
                break;
            case 'events':
                AdminDashboard.loadEvents();
                break;
            case 'staff':
                AdminDashboard.loadStaff();
                break;
            case 'reports':
                AdminDashboard.loadReports();
                break;
        }
    },

    /**
     * Load devotees data
     */
    loadDevotees: async () => {
        const container = document.getElementById('devotees-list');
        TempleMS.Utils.showLoading(container);

        try {
            const response = await TempleMS.API.devotees.getAll({
                page: AdminConfig.currentPage,
                limit: AdminConfig.pageSize
            });

            const columns = [
                { key: 'id', header: 'ID' },
                { key: 'full_name', header: 'Full Name' },
                { key: 'email', header: 'Email' },
                { key: 'phone', header: 'Phone' },
                { key: 'membership_type', header: 'Membership' },
                { 
                    key: 'created_at', 
                    header: 'Registered', 
                    formatter: (date) => TempleMS.Utils.formatDate(date) 
                },
                { 
                    key: 'id', 
                    header: 'Actions',
                    formatter: (id) => `
                        <button class="btn btn-sm btn-secondary" onclick="viewDevotee(${id})">View</button>
                        <button class="btn btn-sm btn-primary" onclick="editDevotee(${id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteDevotee(${id})">Delete</button>
                    `
                }
            ];

            // Since API returns skeleton data, we'll show the placeholder
            if (response.data && response.data.devotees) {
                TempleMS.UI.createTable(response.data.devotees, columns, container);
            } else {
                container.innerHTML = '<div class="alert alert-info">No devotees data available. API implementation pending.</div>';
            }

        } catch (error) {
            console.error('Error loading devotees:', error);
            TempleMS.Utils.showError('Failed to load devotees data', container);
        }
    },

    /**
     * Load donations data
     */
    loadDonations: async () => {
        const container = document.getElementById('donations-list');
        TempleMS.Utils.showLoading(container);

        try {
            const response = await TempleMS.API.donations.getAll({
                page: AdminConfig.currentPage,
                limit: AdminConfig.pageSize
            });

            const columns = [
                { key: 'id', header: 'ID' },
                { key: 'receipt_number', header: 'Receipt#' },
                { key: 'donor_name', header: 'Donor Name' },
                { 
                    key: 'amount', 
                    header: 'Amount',
                    formatter: (amount) => TempleMS.Utils.formatCurrency(amount)
                },
                { key: 'purpose', header: 'Purpose' },
                { key: 'donation_type', header: 'Type' },
                { 
                    key: 'donation_date', 
                    header: 'Date',
                    formatter: (date) => TempleMS.Utils.formatDate(date)
                },
                { 
                    key: 'id', 
                    header: 'Actions',
                    formatter: (id) => `
                        <button class="btn btn-sm btn-secondary" onclick="viewDonation(${id})">View</button>
                        <button class="btn btn-sm btn-primary" onclick="printReceipt(${id})">Receipt</button>
                    `
                }
            ];

            if (response.data && response.data.donations) {
                TempleMS.UI.createTable(response.data.donations, columns, container);
                
                // Update summary
                const summaryContainer = document.getElementById('donations-summary');
                summaryContainer.innerHTML = `
                    <div class="stat-card">
                        <h4>${response.data.summary?.total_donations || 0}</h4>
                        <p>Total Donations</p>
                    </div>
                    <div class="stat-card">
                        <h4>${TempleMS.Utils.formatCurrency(response.data.summary?.total_amount || 0)}</h4>
                        <p>Total Amount</p>
                    </div>
                `;
            } else {
                container.innerHTML = '<div class="alert alert-info">No donations data available. API implementation pending.</div>';
            }

        } catch (error) {
            console.error('Error loading donations:', error);
            TempleMS.Utils.showError('Failed to load donations data', container);
        }
    },

    /**
     * Load events data
     */
    loadEvents: async () => {
        const container = document.getElementById('events-list');
        TempleMS.Utils.showLoading(container);

        try {
            const response = await TempleMS.API.events.getAll({
                page: AdminConfig.currentPage,
                limit: AdminConfig.pageSize
            });

            const columns = [
                { key: 'id', header: 'ID' },
                { key: 'title', header: 'Title' },
                { key: 'event_type', header: 'Type' },
                { 
                    key: 'start_date', 
                    header: 'Start Date',
                    formatter: (date) => TempleMS.Utils.formatDate(date)
                },
                { key: 'location', header: 'Location' },
                { key: 'status', header: 'Status' },
                { 
                    key: 'id', 
                    header: 'Actions',
                    formatter: (id) => `
                        <button class="btn btn-sm btn-secondary" onclick="viewEvent(${id})">View</button>
                        <button class="btn btn-sm btn-primary" onclick="editEvent(${id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="cancelEvent(${id})">Cancel</button>
                    `
                }
            ];

            if (response.data && response.data.events) {
                TempleMS.UI.createTable(response.data.events, columns, container);
            } else {
                container.innerHTML = '<div class="alert alert-info">No events data available. API implementation pending.</div>';
            }

        } catch (error) {
            console.error('Error loading events:', error);
            TempleMS.Utils.showError('Failed to load events data', container);
        }
    },

    /**
     * Load staff data
     */
    loadStaff: async () => {
        const container = document.getElementById('staff-list');
        TempleMS.Utils.showLoading(container);

        try {
            const response = await TempleMS.API.staff.getAll({
                page: AdminConfig.currentPage,
                limit: AdminConfig.pageSize
            });

            const columns = [
                { key: 'id', header: 'ID' },
                { key: 'employee_id', header: 'Emp ID' },
                { key: 'full_name', header: 'Full Name' },
                { key: 'position', header: 'Position' },
                { key: 'department', header: 'Department' },
                { key: 'employment_type', header: 'Type' },
                { 
                    key: 'date_of_joining', 
                    header: 'Join Date',
                    formatter: (date) => TempleMS.Utils.formatDate(date)
                },
                { 
                    key: 'id', 
                    header: 'Actions',
                    formatter: (id) => `
                        <button class="btn btn-sm btn-secondary" onclick="viewStaff(${id})">View</button>
                        <button class="btn btn-sm btn-primary" onclick="editStaff(${id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStaff(${id})">Delete</button>
                    `
                }
            ];

            if (response.data && response.data.staff) {
                TempleMS.UI.createTable(response.data.staff, columns, container);
            } else {
                container.innerHTML = '<div class="alert alert-info">No staff data available. API implementation pending.</div>';
            }

        } catch (error) {
            console.error('Error loading staff:', error);
            TempleMS.Utils.showError('Failed to load staff data', container);
        }
    },

    /**
     * Initialize search and filter functionality
     */
    initFilters: () => {
        // Devotee search
        const devoteeSearch = document.getElementById('devotee-search');
        if (devoteeSearch) {
            devoteeSearch.addEventListener('input', 
                TempleMS.Utils.debounce(() => AdminDashboard.loadDevotees(), 300)
            );
        }

        // Filter change handlers
        const filters = ['membership-filter', 'donation-purpose-filter', 'event-type-filter', 
                        'event-status-filter', 'department-filter', 'employment-type-filter'];
        
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    AdminDashboard.loadSectionData(AdminConfig.currentSection);
                });
            }
        });
    }
};

// Action handlers for table buttons
window.viewDevotee = (id) => {
    console.log('View devotee:', id);
    TempleMS.UI.toast('View devotee functionality - implementation pending', 'info');
};

window.editDevotee = (id) => {
    console.log('Edit devotee:', id);
    TempleMS.UI.toast('Edit devotee functionality - implementation pending', 'info');
};

window.deleteDevotee = (id) => {
    if (confirm('Are you sure you want to deactivate this devotee?')) {
        console.log('Delete devotee:', id);
        TempleMS.UI.toast('Delete devotee functionality - implementation pending', 'info');
    }
};

window.showAddDevoteeForm = () => {
    console.log('Show add devotee form');
    TempleMS.UI.toast('Add devotee form - implementation pending', 'info');
};

window.viewDonation = (id) => {
    console.log('View donation:', id);
    TempleMS.UI.toast('View donation functionality - implementation pending', 'info');
};

window.printReceipt = (id) => {
    console.log('Print receipt:', id);
    TempleMS.UI.toast('Print receipt functionality - implementation pending', 'info');
};

window.showAddDonationForm = () => {
    console.log('Show add donation form');
    TempleMS.UI.toast('Add donation form - implementation pending', 'info');
};

window.loadDonations = () => {
    AdminDashboard.loadDonations();
};

window.viewEvent = (id) => {
    console.log('View event:', id);
    TempleMS.UI.toast('View event functionality - implementation pending', 'info');
};

window.editEvent = (id) => {
    console.log('Edit event:', id);
    TempleMS.UI.toast('Edit event functionality - implementation pending', 'info');
};

window.cancelEvent = (id) => {
    if (confirm('Are you sure you want to cancel this event?')) {
        console.log('Cancel event:', id);
        TempleMS.UI.toast('Cancel event functionality - implementation pending', 'info');
    }
};

window.showAddEventForm = () => {
    console.log('Show add event form');
    TempleMS.UI.toast('Add event form - implementation pending', 'info');
};

window.viewStaff = (id) => {
    console.log('View staff:', id);
    TempleMS.UI.toast('View staff functionality - implementation pending', 'info');
};

window.editStaff = (id) => {
    console.log('Edit staff:', id);
    TempleMS.UI.toast('Edit staff functionality - implementation pending', 'info');
};

window.deleteStaff = (id) => {
    if (confirm('Are you sure you want to deactivate this staff member?')) {
        console.log('Delete staff:', id);
        TempleMS.UI.toast('Delete staff functionality - implementation pending', 'info');
    }
};

window.showAddStaffForm = () => {
    console.log('Show add staff form');
    TempleMS.UI.toast('Add staff form - implementation pending', 'info');
};

// Report generation functions
window.generateDonationReport = () => {
    console.log('Generate donation report');
    TempleMS.UI.toast('Donation report generation - implementation pending', 'info');
};

window.generateDevoteeReport = () => {
    console.log('Generate devotee report');
    TempleMS.UI.toast('Devotee analytics - implementation pending', 'info');
};

window.generateEventReport = () => {
    console.log('Generate event report');
    TempleMS.UI.toast('Event statistics - implementation pending', 'info');
};

window.generateStaffReport = () => {
    console.log('Generate staff report');
    TempleMS.UI.toast('Staff reports - implementation pending', 'info');
};

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AdminDashboard.init();
});