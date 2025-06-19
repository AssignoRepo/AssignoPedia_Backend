// === dashboard.js FINAL VERSION with Welcome Widget ===

import socialMediaService from "./social-media-service.js";

window.approveLeaveRequest = async function (id) {
  const token = localStorage.getItem("jwtToken");
  try {
    const res = await fetch(`http://localhost:5000/api/leave-requests/${id}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) loadLeaveApproval();
    else alert(data.message || "Failed to approve");
  } catch {
    alert("Error approving");
  }
};

window.rejectLeaveRequest = async function (id) {
  const token = localStorage.getItem("jwtToken");
  try {
    const res = await fetch(`http://localhost:5000/api/leave-requests/${id}/reject`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) loadLeaveApproval();
    else alert(data.message || "Failed to reject");
  } catch {
    alert("Error rejecting");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const employee = JSON.parse(localStorage.getItem("employee"));
  const token = localStorage.getItem("jwtToken");
  if (!employee || !token) {
    window.location.href = "login.html";
    return;
  }

  const isAdmin = employee.role === "Admin" || employee.role === "hr_admin";
  const isHR = ["hr_admin", "hr_manager", "hr_executive", "hr_recruiter"].includes(employee.role);

  const mainContent = document.getElementById("mainContent");

  function setActive(id) {
    document.querySelectorAll(".sidebar-btn").forEach((btn) => btn.classList.remove("active"));
    if (id) {
      const active = document.getElementById(id);
      if (active) active.classList.add("active");
    }
  }

  function loadWelcomeWidget() {
    setActive(null);
    const avatar =
      employee.profileImage ||
      "https://ui-avatars.com/api/?name=" + encodeURIComponent(employee.firstName || "Employee");

    mainContent.innerHTML = `
          <div class="admin-content-section">
            <div class="employee-info" style="display: flex; align-items: center; gap: 1rem;">
              <img src="${avatar}" class="employee-avatar" alt="Avatar" />
              <div>
                <div class="employee-name">Welcome, ${employee.firstName || "Employee"}</div>
                <div class="employee-id">ID: ${employee.employeeId}</div>
                <div class="employee-id">Role: ${employee.role}</div>
              </div>
            </div>

            <div style="margin-top: 2rem;">
              <h3>Hello ${employee.firstName || "Employee"} 👋</h3>
              <p>You can manage your leaves, payslips, announcements, and more using the sidebar.</p>
            </div>
          </div>
        `;
  }

  // Attach existing handlers (preserved)
  document.getElementById("btn-leave").onclick = loadLeaveRequest();
  if (isAdmin) document.getElementById("btn-social").onclick = loadSocialMedia;
  if (isAdmin || isHR) document.getElementById("btn-add-employee").onclick = loadAddEmployee;
  if (isAdmin) document.getElementById("btn-stats").onclick = loadStats;
  document.getElementById("btn-pay-slip").onclick = loadPaySlipAdmin;

  // Inject Leave Approval button if Admin or HR
  if (isAdmin || isHR) {
    const sidebar = document.querySelector(".sidebar");
    const leaveApprovalBtn = document.createElement("button");
    leaveApprovalBtn.id = "btn-leave-approval";
    leaveApprovalBtn.className = "sidebar-btn";
    leaveApprovalBtn.innerHTML = '<i class="fas fa-check-circle"></i> Leave Approval';
    sidebar.appendChild(leaveApprovalBtn);
    leaveApprovalBtn.onclick = loadLeaveApproval;
  }

  // Set Logout functionality
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("employee");
      localStorage.removeItem("jwtToken");
      window.location.href = "login.html";
    };
  }

  // === Load Default Welcome View ===
  loadWelcomeWidget();
});

// Define all other functions like:
// loadLeaveRequest()
// loadAddEmployee()
// loadLeaveApproval()
// loadPaySlipAdmin()
// loadSocialMedia()
// etc...

// (They already exist in your full file and don't need changes.)
