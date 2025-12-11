SLU Organization Desk Application

This is a web application for managing student organizations and submissions at SLU.

PROJECT STRUCTURE:
- index.php: Main entry point
- node-server/: Node.js backend server with routes and controllers
- php-server/: PHP backend server with authentication and data management
- public/: Frontend files including admin panel, organization pages, and OSAS dashboard
- uploads/: Directory for storing uploaded files

FEATURES:
- User authentication and authorization
- Organization management
- Submission tracking and management
- Admin dashboard
- OSAS (Office of Student Activities and Services) analytics
- File uploads and management

HOW TO RUN:

1. PHP Server Setup:
   - Place the project in your web server directory (e.g., htdocs for Apache/WAMP)
   - Access the application via: http://localhost/Webtech(Finals)/SLUorgdesk/
   - Ensure PHP and a MySQL database are configured
   - Check php-server/config/database.js for database connection settings

2. Node.js Server Setup:
   - Navigate to the node-server directory
   - Run: npm install
   - Run: npm start --host ip address
   - The Node.js server will run on the configured port (check config files)

3. Database Setup:
   - Import the database schema (if provided)
   - Update database connection credentials in config files

4. Frontend Access:
   - Admin Dashboard: http://localhost/Webtech(Finals)/SLUorgdesk/public/admin/
   - Organization Pages: http://localhost/Webtech(Finals)/SLUorgdesk/public/organization/
   - OSAS Dashboard: http://localhost/Webtech(Finals)/SLUorgdesk/public/osas/

For more information, refer to the application documentation.