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
   - Place the project in your web server directory (in the www directory for wamp server)
   - Check php-server/config/database.js for database connection settings
   -

2. Node.js Server Setup:
   - Navigate to the node-server directory
   - Run: npm install
   - Run: npm start --host ip address
   - The Node.js server will run on the configured port (check config files)

3. Access Steps
   - Either use localhost or ip address using ip config to access the server


For more information, refer to the application documentation.