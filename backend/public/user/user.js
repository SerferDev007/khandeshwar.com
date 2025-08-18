// User Dashboard JavaScript

/**
 * User Dashboard functionality for Temple Management System
 */

// User-specific configuration
const UserConfig = {
    currentSection: 'profile',
    currentUserId: 1, // This would be set from session/authentication
    selectedEventId: null
};

// User Dashboard Controller
const UserDashboard = {
    /**
     * Initialize user dashboard
     */
    init: () => {
        console.log('User Dashboard initialized');
        
        // Initialize navigation
        UserDashboard.initNavigation();
        
        // Load profile data
        UserDashboard.loadProfile();
        
        // Initialize forms
        UserDashboard.initForms();
        
        // Initialize event tabs
        UserDashboard.initEventTabs();
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
                    UserConfig.currentSection = targetSection;
                    
                    // Load section-specific data
                    UserDashboard.loadSectionData(targetSection);
                }
            });
        });
    },

    /**
     * Load user profile data
     */
    loadProfile: async () => {
        try {
            // Load profile data (placeholder implementation)
            // const profile = await TempleMS.API.auth.getProfile();
            
            // Placeholder data
            document.getElementById('user-name').textContent = 'Sample User';
            document.getElementById('user-email').textContent = 'user@example.com';
            document.getElementById('user-phone').textContent = '+91 9876543210';
            document.getElementById('user-membership').textContent = 'Regular Member';
            document.getElementById('member-since').textContent = 'Member since: January 2024';

            // Load user statistics
            document.getElementById('total-user-donations').textContent = '₹15,000';
            document.getElementById('donation-count').textContent = '8';
            document.getElementById('events-attended').textContent = '3';
            document.getElementById('upcoming-registrations').textContent = '2';

        } catch (error) {
            console.error('Error loading profile:', error);
            TempleMS.Utils.showError('Failed to load profile data');
        }
    },

    /**
     * Load data for specific section
     */
    loadSectionData: (section) => {
        switch (section) {
            case 'donations':
                UserDashboard.loadUserDonations();
                break;
            case 'events':
                UserDashboard.loadEvents();
                break;
            case 'register-event':
                UserDashboard.loadRegistrableEvents();
                break;
        }
    },

    /**
     * Load user's donation history
     */
    loadUserDonations: async () => {
        const container = document.getElementById('user-donations-list');
        TempleMS.Utils.showLoading(container);

        try {
            // In real implementation, we would pass user_id filter
            const response = await TempleMS.API.donations.getAll({
                devotee_id: UserConfig.currentUserId
            });

            const columns = [
                { key: 'receipt_number', header: 'Receipt#' },
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
                        <button class="btn btn-sm btn-secondary" onclick="viewDonationReceipt(${id})">View Receipt</button>
                        <button class="btn btn-sm btn-primary" onclick="downloadReceipt(${id})">Download</button>
                    `
                }
            ];

            if (response.data && response.data.donations) {
                TempleMS.UI.createTable(response.data.donations, columns, container);
            } else {
                container.innerHTML = '<div class="alert alert-info">No donations found. API implementation pending.</div>';
            }

        } catch (error) {
            console.error('Error loading donations:', error);
            TempleMS.Utils.showError('Failed to load donation history', container);
        }
    },

    /**
     * Load events data
     */
    loadEvents: async () => {
        // Load upcoming events by default
        UserDashboard.loadUpcomingEvents();
    },

    /**
     * Load upcoming events
     */
    loadUpcomingEvents: async () => {
        const container = document.getElementById('upcoming-events-list');
        TempleMS.Utils.showLoading(container);

        try {
            const response = await TempleMS.API.events.getUpcoming({
                limit: 10
            });

            if (response.data && response.data.events) {
                let eventsHtml = '';
                response.data.events.forEach(event => {
                    eventsHtml += `
                        <div class="event-card">
                            <h4>${event.title}</h4>
                            <p><strong>Type:</strong> ${event.event_type}</p>
                            <p><strong>Date:</strong> ${TempleMS.Utils.formatDate(event.start_date)}</p>
                            <p><strong>Time:</strong> ${event.start_time || 'TBA'}</p>
                            <p><strong>Location:</strong> ${event.location || 'Temple Premises'}</p>
                            <div class="event-actions">
                                <button class="btn btn-primary" onclick="registerForEvent(${event.id})">Register</button>
                                <button class="btn btn-secondary" onclick="viewEventDetails(${event.id})">View Details</button>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = eventsHtml || '<div class="alert alert-info">No upcoming events found.</div>';
            } else {
                container.innerHTML = '<div class="alert alert-info">No upcoming events found. API implementation pending.</div>';
            }

        } catch (error) {
            console.error('Error loading upcoming events:', error);
            TempleMS.Utils.showError('Failed to load upcoming events', container);
        }
    },

    /**
     * Load events available for registration
     */
    loadRegistrableEvents: async () => {
        const container = document.getElementById('registrable-events-list');
        TempleMS.Utils.showLoading(container);

        try {
            const response = await TempleMS.API.events.getAll({
                status: 'planned',
                registration_required: true
            });

            if (response.data && response.data.events) {
                let eventsHtml = '';
                response.data.events.forEach(event => {
                    eventsHtml += `
                        <div class="event-registration-card">
                            <h4>${event.title}</h4>
                            <p>${event.description || 'No description available'}</p>
                            <div class="event-meta">
                                <span><strong>Date:</strong> ${TempleMS.Utils.formatDate(event.start_date)}</span>
                                <span><strong>Type:</strong> ${event.event_type}</span>
                                <span><strong>Location:</strong> ${event.location || 'Temple'}</span>
                            </div>
                            <div class="registration-info">
                                <span class="fee">Registration Fee: ₹${event.registration_fee || 0}</span>
                                <span class="capacity">Max Participants: ${event.max_participants || 'Unlimited'}</span>
                            </div>
                            <button class="btn btn-primary" onclick="selectEventForRegistration(${event.id}, '${event.title}', ${event.registration_fee || 0})">
                                Select for Registration
                            </button>
                        </div>
                    `;
                });
                container.innerHTML = eventsHtml || '<div class="alert alert-info">No events available for registration.</div>';
            } else {
                container.innerHTML = '<div class="alert alert-info">No events available for registration. API implementation pending.</div>';
            }

        } catch (error) {
            console.error('Error loading registrable events:', error);
            TempleMS.Utils.showError('Failed to load events for registration', container);
        }
    },

    /**
     * Initialize forms
     */
    initForms: () => {
        // Donation form
        const donationForm = document.getElementById('donation-form');
        if (donationForm) {
            donationForm.addEventListener('submit', UserDashboard.handleDonationSubmit);
        }

        // Event registration form
        const registrationForm = document.getElementById('event-registration-form');
        if (registrationForm) {
            registrationForm.addEventListener('submit', UserDashboard.handleEventRegistration);
        }

        // Update registration fee when participants count changes
        const participantsInput = document.getElementById('participants-count');
        if (participantsInput) {
            participantsInput.addEventListener('input', UserDashboard.updateRegistrationFee);
        }
    },

    /**
     * Initialize event tabs
     */
    initEventTabs: () => {
        const eventTabs = document.querySelectorAll('.events-tab');
        const eventContents = document.querySelectorAll('.events-content');

        eventTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');
                
                // Remove active classes
                eventTabs.forEach(t => t.classList.remove('active', 'btn-primary'));
                eventTabs.forEach(t => t.classList.add('btn-secondary'));
                eventContents.forEach(c => c.classList.remove('active'));
                
                // Add active class
                tab.classList.remove('btn-secondary');
                tab.classList.add('btn-primary', 'active');
                const targetContent = document.getElementById(`${targetTab}-events`);
                if (targetContent) {
                    targetContent.classList.add('active');
                    
                    // Load content based on tab
                    switch (targetTab) {
                        case 'upcoming':
                            UserDashboard.loadUpcomingEvents();
                            break;
                        case 'registered':
                            UserDashboard.loadRegisteredEvents();
                            break;
                        case 'past':
                            UserDashboard.loadPastEvents();
                            break;
                    }
                }
            });
        });
    },

    /**
     * Handle donation form submission
     */
    handleDonationSubmit: async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const donationData = Object.fromEntries(formData.entries());
        
        // Add user-specific data
        donationData.devotee_id = UserConfig.currentUserId;
        donationData.donor_name = document.getElementById('user-name').textContent;
        donationData.donor_phone = document.getElementById('user-phone').textContent.replace('+', '');
        donationData.donor_email = document.getElementById('user-email').textContent;

        try {
            console.log('Donation data:', donationData);
            
            // Simulate API call
            TempleMS.UI.toast('Donation form submitted successfully! API implementation pending.', 'success');
            
            // Reset form
            e.target.reset();
            
        } catch (error) {
            console.error('Error submitting donation:', error);
            TempleMS.UI.toast('Failed to submit donation. Please try again.', 'error');
        }
    },

    /**
     * Handle event registration
     */
    handleEventRegistration: async (e) => {
        e.preventDefault();
        
        if (!UserConfig.selectedEventId) {
            TempleMS.UI.toast('Please select an event first.', 'error');
            return;
        }

        const formData = new FormData(e.target);
        const registrationData = Object.fromEntries(formData.entries());
        
        registrationData.event_id = UserConfig.selectedEventId;
        registrationData.user_id = UserConfig.currentUserId;

        try {
            console.log('Event registration data:', registrationData);
            
            // Simulate API call
            TempleMS.UI.toast('Event registration submitted successfully! API implementation pending.', 'success');
            
            // Hide registration form
            document.getElementById('registration-form-container').classList.add('hidden');
            UserConfig.selectedEventId = null;
            
        } catch (error) {
            console.error('Error submitting event registration:', error);
            TempleMS.UI.toast('Failed to submit registration. Please try again.', 'error');
        }
    },

    /**
     * Update registration fee based on participants count
     */
    updateRegistrationFee: () => {
        const participantsCount = parseInt(document.getElementById('participants-count').value) || 1;
        const feePerPerson = UserConfig.selectedEventFee || 0;
        const totalFee = participantsCount * feePerPerson;
        
        const feeInfo = document.getElementById('registration-fee-info');
        if (feeInfo) {
            feeInfo.innerHTML = `
                <div class="fee-breakdown">
                    <p><strong>Fee per person:</strong> ₹${feePerPerson}</p>
                    <p><strong>Number of participants:</strong> ${participantsCount}</p>
                    <p><strong>Total registration fee:</strong> ₹${totalFee}</p>
                </div>
            `;
        }
    },

    /**
     * Load registered events
     */
    loadRegisteredEvents: () => {
        const container = document.getElementById('registered-events-list');
        container.innerHTML = '<div class="alert alert-info">My registered events functionality - API implementation pending</div>';
    },

    /**
     * Load past events
     */
    loadPastEvents: () => {
        const container = document.getElementById('past-events-list');
        container.innerHTML = '<div class="alert alert-info">Past events functionality - API implementation pending</div>';
    }
};

// Action handlers for user dashboard
window.editProfile = () => {
    console.log('Edit profile');
    TempleMS.UI.toast('Edit profile functionality - implementation pending', 'info');
};

window.downloadTaxReceipt = () => {
    console.log('Download tax receipt');
    TempleMS.UI.toast('Tax receipt download - implementation pending', 'info');
};

window.exportDonations = () => {
    console.log('Export donations');
    TempleMS.UI.toast('Export donations functionality - implementation pending', 'info');
};

window.filterUserDonations = () => {
    console.log('Filter user donations');
    UserDashboard.loadUserDonations();
};

window.viewDonationReceipt = (id) => {
    console.log('View donation receipt:', id);
    TempleMS.UI.toast('View receipt functionality - implementation pending', 'info');
};

window.downloadReceipt = (id) => {
    console.log('Download receipt:', id);
    TempleMS.UI.toast('Download receipt functionality - implementation pending', 'info');
};

window.registerForEvent = (eventId) => {
    console.log('Register for event:', eventId);
    TempleMS.UI.toast('Quick event registration - implementation pending', 'info');
};

window.viewEventDetails = (eventId) => {
    console.log('View event details:', eventId);
    TempleMS.UI.toast('View event details - implementation pending', 'info');
};

window.selectEventForRegistration = (eventId, eventTitle, registrationFee) => {
    UserConfig.selectedEventId = eventId;
    UserConfig.selectedEventFee = registrationFee;
    
    // Show registration form
    const formContainer = document.getElementById('registration-form-container');
    formContainer.classList.remove('hidden');
    
    // Update selected event info
    const eventInfo = document.getElementById('selected-event-info');
    eventInfo.innerHTML = `
        <h4>Selected Event: ${eventTitle}</h4>
        <p>Registration Fee: ₹${registrationFee} per person</p>
    `;
    
    // Update fee information
    UserDashboard.updateRegistrationFee();
    
    // Scroll to form
    formContainer.scrollIntoView({ behavior: 'smooth' });
};

window.cancelRegistration = () => {
    UserConfig.selectedEventId = null;
    UserConfig.selectedEventFee = 0;
    
    const formContainer = document.getElementById('registration-form-container');
    formContainer.classList.add('hidden');
    
    const form = document.getElementById('event-registration-form');
    form.reset();
};

// Initialize user dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    UserDashboard.init();
});