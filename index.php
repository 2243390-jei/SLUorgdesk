<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Saint Louis University OrgDesk</title>
  <link rel="stylesheet" href="public/organization/styles/style.css">
  <link rel="icon" type="image/png" href="public/images/Icon.png" sizes="32x32">
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
  <div class="container">
    <div class="left">
      <img src="public/images/SLU_logo.png" alt="Saint Louis University Logo" class="logo">
    </div>

    <div class="login-box">
      <img src="public/images/lock.png" alt="Lock Icon" class="lock-logo">
      <h2>Welcome back!</h2>
      <p>Please enter your details</p>

      <form id="loginForm" novalidate onsubmit="return false;">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="Enter your email" required>

        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Enter your password" required>

        <button type="submit">Login</button>
        <a href="#" class="forgot">Forgot Password?</a>

        <div class="divider">or</div>

    
        <div id="g_id_signin"></div>
      </form>
    </div>
  </div>

  <script src="public/admin/script/config.js" defer></script>
  <script src="public/organization/script/main.js" defer></script>

  <script>
    /* ==============================
       DISABLE INSPECT & DEV TOOLS
       ============================== */
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C')) {
        e.preventDefault();
      }
    });
  </script> 

</body>
</html>
