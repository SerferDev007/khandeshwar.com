# Khandeshwar Temple Management System

A comprehensive web-based temple management application built with Node.js, Express, and MySQL.

## Features

- **Devotee Management**: Maintain devotee records, membership details, and contact information
- **Donation Tracking**: Track donations, generate receipts, and manage financial records  
- **Event Management**: Plan and organize temple events, festivals, and ceremonies
- **Staff Administration**: Manage temple staff, volunteers, and their responsibilities
- **User Portal**: Allow devotees to view their profile, donation history, and register for events
- **Admin Dashboard**: Complete administrative interface for temple management

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Custom CSS with responsive design

## Project Structure

```
├── backend/
│   ├── app.js                 # Main Express application
│   ├── models/
│   │   └── db.js             # Database connection and utilities
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── devotees.js       # Devotee management routes
│   │   ├── donations.js      # Donation management routes
│   │   ├── events.js         # Event management routes
│   │   └── staff.js          # Staff management routes
│   ├── public/               # Static files (HTML, CSS, JS)
│   │   ├── index.html        # Landing page
│   │   ├── css/main.css      # Main stylesheet
│   │   ├── js/main.js        # Main JavaScript
│   │   ├── admin/            # Admin dashboard
│   │   │   ├── dashboard.html
│   │   │   └── admin.js
│   │   └── user/             # User portal
│   │       ├── dashboard.html
│   │       └── user.js
│   └── schema.sql            # Database schema
├── package.json
├── .env.example              # Environment variables template
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd khandeshwar.com
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up MySQL database**
   ```sql
   -- Create database
   CREATE DATABASE temple_management;
   
   -- Import schema
   mysql -u root -p temple_management < backend/schema.sql
   ```

5. **Start the server**
   ```bash
   npm start
   ```

   For development:
   ```bash
   npm run dev
   ```

## Usage

1. **Access the application**:
   - Homepage: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin
   - User Portal: http://localhost:3000/user

2. **API Documentation**: http://localhost:3000/api

3. **Health Check**: http://localhost:3000/api/health

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Devotees
- `GET /api/devotees` - Get all devotees
- `GET /api/devotees/:id` - Get devotee by ID
- `POST /api/devotees` - Create new devotee
- `PUT /api/devotees/:id` - Update devotee
- `DELETE /api/devotees/:id` - Delete devotee

### Donations
- `GET /api/donations` - Get all donations
- `GET /api/donations/:id` - Get donation by ID
- `POST /api/donations` - Create new donation
- `PUT /api/donations/:id` - Update donation
- `DELETE /api/donations/:id` - Delete donation
- `GET /api/donations/reports` - Get donation reports

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/upcoming` - Get upcoming events

### Staff
- `GET /api/staff` - Get all staff
- `GET /api/staff/:id` - Get staff by ID
- `POST /api/staff` - Create new staff
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Delete staff

## Database Schema

The application uses the following main tables:

- **users**: Authentication and user management
- **devotees**: Devotee information and membership details
- **donations**: Donation records and receipts
- **events**: Temple events and festivals
- **staff**: Staff and volunteer management

See `backend/schema.sql` for complete schema definitions.

## Development Status

This is a **skeleton implementation** with:

- ✅ Complete project structure
- ✅ All API endpoints defined
- ✅ Database schema ready
- ✅ Frontend interfaces (HTML/CSS/JS)
- ✅ Express server setup
- ⚠️ API endpoints return placeholder data
- ⚠️ Authentication not implemented
- ⚠️ Database queries not implemented
- ⚠️ File uploads not implemented

## Next Steps for Development

1. **Implement Authentication**
   - JWT token generation and validation
   - Password hashing with bcrypt
   - Session management

2. **Complete Database Integration**
   - Implement actual database queries
   - Add data validation
   - Implement transactions

3. **Add Business Logic**
   - Receipt generation
   - Email notifications
   - Reporting functionality
   - File upload handling

4. **Security Enhancements**
   - Input validation
   - SQL injection prevention
   - XSS protection
   - Rate limiting

5. **Testing**
   - Unit tests
   - Integration tests
   - API testing

## Contributing

This is a temple management system designed to be extended with additional features. Key areas for contribution:

- Complete API implementations
- Enhanced UI/UX
- Mobile responsiveness improvements
- Additional reporting features
- Payment gateway integration

## License

This project is open source and available under the ISC License.

## Support

For support or questions, please contact the temple administration.
