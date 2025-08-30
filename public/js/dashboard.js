// import socialMediaService from "./social-media-service.js";

// Global function to handle Manage Account button click
// function handleManageAccountClick() {
//   console.log("handleManageAccountClick called"); // Debug log
//   const sidebarEl = document.getElementById('myProfileSidebar');
//   const overlayEl = document.getElementById('myProfileSidebarOverlay');
//   console.log("Sidebar element:", sidebarEl); // Debug log
//   console.log("Overlay element:", overlayEl); // Debug log
//   if (sidebarEl) sidebarEl.classList.remove('open');
//   if (overlayEl) overlayEl.classList.remove('open');
//   console.log("About to call showProfileInMainContent"); // Debug log
//   showProfileInMainContent();
//   console.log("showProfileInMainContent called successfully"); // Debug log
// }
// window.handleManageAccountClick = handleManageAccountClick;


// window.handleManageAccountClick = handleManageAccountClick;
//Make these functions globally available
//const token = localStorage.getItem('jwtToken');
//console.log("Token at dashbaoard",token);
   const ATTENDANCE_CHECKIN_KEY = 'attendanceCheckInTime';
   const ATTENDANCE_CHECKOUT_KEY = 'attendanceCheckOutTime';
   const ATTENDANCE_DATE_KEY = 'attendanceDate';
   const TEAM_MEMBER_EXCLUDE_ROLES = [
     'admin', 'hr_admin', 'hr_recruiter','hr_executive' ,'team_leader', 'senior_writer', 'bdm'
   ];
window.approveLeaveRequest = async function (id) {
  try {
    const approveBtn = document.querySelector(`button.approve-btn[onclick*="${id}"]`);
    const rejectBtn = document.querySelector(`button.reject-btn[onclick*="${id}"]`);
    if (approveBtn) approveBtn.disabled = true;
    if (rejectBtn) rejectBtn.disabled = true;
    const token = localStorage.getItem("jwtToken");
    const res = await fetch(`/api/leave-requests/${id}/approve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    let data = {};
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (jsonErr) {
      data = {};
    }
    if (res.ok && data.success) {
      await loadLeaveApproval();
    } else if (data && data.message) {
      alert(data.message || "Failed to approve leave request");
      if (approveBtn) approveBtn.disabled = false;
      if (rejectBtn) rejectBtn.disabled = false;
    } else {
      alert("Error approving leave request");
      if (approveBtn) approveBtn.disabled = false;
      if (rejectBtn) rejectBtn.disabled = false;
    }
  } catch (err) {
    alert("Error approving leave request");
    const approveBtn = document.querySelector(`button.approve-btn[onclick*="${id}"]`);
    const rejectBtn = document.querySelector(`button.reject-btn[onclick*="${id}"]`);
    if (approveBtn) approveBtn.disabled = false;
    if (rejectBtn) rejectBtn.disabled = false;
  }
};

window.rejectLeaveRequest = async function (id) {
  try {
    const approveBtn = document.querySelector(`button.approve-btn[onclick*="${id}"]`);
    const rejectBtn = document.querySelector(`button.reject-btn[onclick*="${id}"]`);
    if (approveBtn) approveBtn.disabled = true;
    if (rejectBtn) rejectBtn.disabled = true;
    const token = localStorage.getItem("jwtToken");
    const res = await fetch(`/api/leave-requests/${id}/reject`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    let data = {};
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (jsonErr) {
      data = {};
    }
    if (res.ok && data.success) {
      await loadLeaveApproval();
    } else if (data && data.message) {
      alert(data.message || "Failed to reject leave request");
      if (approveBtn) approveBtn.disabled = false;
      if (rejectBtn) rejectBtn.disabled = false;
    } else {
      alert("Error rejecting leave request");
      if (approveBtn) approveBtn.disabled = false;
      if (rejectBtn) rejectBtn.disabled = false;
    }
  } catch (err) {
    alert("Error rejecting leave request");
    const approveBtn = document.querySelector(`button.approve-btn[onclick*="${id}"]`);
    const rejectBtn = document.querySelector(`button.reject-btn[onclick*="${id}"]`);
    if (approveBtn) approveBtn.disabled = false;
    if (rejectBtn) rejectBtn.disabled = false;
  }
};
  window.editTeam = function(teamId) {
    editingTeamId = teamId;
    renderTeamList();
  };
  window.removeMemberFromTeam = function(teamId, memberId) {
    if (!window._editMembers || !window._editMembers[teamId]) return;
    window._editMembers[teamId] = window._editMembers[teamId].filter(id => id !== memberId);
    renderTeamList();
  };
  window.addMemberToTeam = function(teamId) {
    const select = document.getElementById(`addMemberSelect_${teamId}`);
    const memberId = select.value;
    if (!memberId) return;
    if (!window._editMembers) window._editMembers = {};
    if (!window._editMembers[teamId]) window._editMembers[teamId] = [];

    // Check if this member is already in another team (not this one)
    const alreadyInTeam = localTeams.find(t => t._id !== teamId && t.team_members.includes(memberId));
    if (alreadyInTeam) {
      // Find the employee's name for a better message
      const emp = allEmployees.find(e => e.employeeId === memberId);
      const nameOrId = emp ? `${emp.firstName || emp.name || ''} (${emp.employeeId})` : memberId;
      alert(`${nameOrId} is already in another team (${alreadyInTeam.team_name}).`);
      return;
    }

    if (!window._editMembers[teamId].includes(memberId)) {
      window._editMembers[teamId].push(memberId);
    }
    renderTeamList();
  };
  window.cancelEditTeam = function(teamId) {
    window._editMembers = undefined;
    editingTeamId = null;
    renderTeamList();
  };
  window.saveEditTeam = async function(teamId) {
    const teamIdx = localTeams.findIndex(t => t._id === teamId);
    if (teamIdx === -1) return;
    const newName = document.getElementById(`editTeamName_${teamId}`).value.trim();
    const newLeaderId = document.getElementById(`editTeamLeader_${teamId}`).value;
    const newMemberIds = (window._editMembers && window._editMembers[teamId]) ? window._editMembers[teamId] : [];
    // Call backend to update
    const token = localStorage.getItem("jwtToken");
    const res = await fetch(`/api/teams/${teamId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ team_name: newName, team_leader: newLeaderId, team_members: newMemberIds })
    });
    const data = await res.json();
    if (data.success) {
      window._editMembers = undefined;
      await loadTeamManagement();
    } else {
      alert(data.message || "Failed to update team");
    }
  };
  window.deleteTeam = async function(teamId) {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return;
    }
    const token = localStorage.getItem("jwtToken");
    const res = await fetch(`/api/teams/${teamId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      window._editMembers = undefined;
      editingTeamId = null;
      await loadTeamManagement();
    } else {
      alert(data.message || "Failed to delete team");
    }
  };
  window.removeSelectedMembersFromTeam = function(teamId) {
    if (!window._editMembers || !window._editMembers[teamId]) return;
    
    // Get all checked checkboxes for this team
    const checkboxes = document.querySelectorAll(`input[type="checkbox"][id^="remove_${teamId}_"]:checked`);
    const selectedMemberIds = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedMemberIds.length === 0) {
      alert("Please select at least one member to remove.");
      return;
    }
    
    if (!confirm(`Are you sure you want to remove ${selectedMemberIds.length} member(s) from this team?`)) {
      return;
    }
    
    // Remove selected members from the edit members array
    window._editMembers[teamId] = window._editMembers[teamId].filter(id => !selectedMemberIds.includes(id));
    
    // Re-render the team list to update the UI
    renderTeamList();
  };
  window.selectAllMembers = function(teamId) {
    const checkboxes = document.querySelectorAll(`input[type="checkbox"][id^="remove_${teamId}_"]`);
    checkboxes.forEach(cb => cb.checked = true);
    updateRemoveButtonText(teamId);
  };
  window.deselectAllMembers = function(teamId) {
    const checkboxes = document.querySelectorAll(`input[type="checkbox"][id^="remove_${teamId}_"]`);
    checkboxes.forEach(cb => cb.checked = false);
    updateRemoveButtonText(teamId);
  };
  window.updateRemoveButtonText = function(teamId) {
    const checkboxes = document.querySelectorAll(`input[type="checkbox"][id^="remove_${teamId}_"]:checked`);
    const removeBtn = document.querySelector(`button[onclick="window.removeSelectedMembersFromTeam('${teamId}')"]`);
    if (removeBtn) {
      const count = checkboxes.length;
      removeBtn.textContent = count > 0 ? `Remove Selected (${count})` : 'Remove Selected';
    }
  };

// Move these declarations to the top-level scope so all functions can access them
let isAdminRole = false;
let isHRRole = false;
let isBDMorTL = false;
let isRegularEmployee = false;
let isAdminOrHRRecruiter = false;
let mainContent = null;

// Make renderPaySlipHTML globally available
// function renderPaySlipHTML(slip, isPreviewOnly = false) {
//   console.log(slip);
//   return `
//   <style>
//     .payslip-main-box {
//       max-width: 800px;
//       margin: 32px auto;
//       border: 2px solid #7c4dbe;
//       border-radius: 6px;
//       background: #fff;
//       font-family: 'Segoe UI', Arial, sans-serif;
//       color: #222;
//       box-shadow: 0 2px 16px rgba(124,77,190,0.08);
//       padding: 0;
//     }
//     .payslip-header-row {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-start;
//       padding: 24px 32px 0 32px;
//     }
//     .payslip-header-title {
//       font-size: 1.4em;
//       font-weight: 700;
//       color: #2d197c;
//       margin-bottom: 4px;
//     }
//     .payslip-header-logo {
//       height: 60px;
//       margin-left: 16px;
//     }
//     .payslip-period {
//       font-size: 1.1em;
//       color: #222;
//       margin-bottom: 12px;
//       text-align: right;
//     }
//     .payslip-section {
//       margin: 0 32px 24px 32px;
//       border: 1px solid #e0d7f3;
//       border-radius: 4px;
//       overflow: hidden;
//     }
//     .payslip-section-title {
//       background: #7c4dbe;
//       color: #fff;
//       font-weight: 600;
//       padding: 8px 16px;
//       font-size: 1.08em;
//       border-bottom: 1px solid #e0d7f3;
//     }
//     .payslip-table-wrapper {
//       overflow-x: auto;
//       background: transparent;
//       margin: 0;
//       padding: 0;
//     }
//     .payslip-table {
//       width: 100%;
//       border-collapse: collapse;
//       font-size: 1em;
//       min-width: 600px;
//       margin: 0;
//       background: #fff;
//     }
//     .payslip-table th, .payslip-table td {
//       border: 1px solid #e0d7f3;
//       padding: 8px 12px;
//       text-align: left;
//     }
//     .payslip-table th {
//       background: #f3eaff;
//       color: #2d197c;
//       font-weight: 600;
//     }
//     .payslip-table td {
//       background: #fff;
//     }
//     .payslip-net-row th, .payslip-net-row td {
//       font-size: 1.1em;
//       font-weight: 700;
//       color: #2d197c;
//       background: #f3eaff;
//     }
//     .payslip-footer {
//       margin: 24px 32px 24px 32px;
//       font-size: 0.98em;
//       color: #888;
//       text-align: right;
//     }
//     @media (max-width: 600px) {
//       .payslip-section {
//         margin: 0 0 18px 0;
//         border-radius: 0;
//       }
//       .payslip-table {
//         min-width: 500px;
//         font-size: 14px;
//         border-radius: 8px;
//         display: table;
//       }
//       .payslip-table th, .payslip-table td {
//         white-space: nowrap;
//         padding: 8px 10px;
//       }
//       .payslip-table-wrapper {
//         overflow-x: auto;
//         -webkit-overflow-scrolling: touch;
//         background: transparent;
//         margin: 0;
//         padding: 0;
//       }
//     }
//   </style>
//   <div class="payslip-main-box">
//     <div class="payslip-header-row">
//       <div>
//         <div class="payslip-header-title">Assignopedia Services</div>
//         <div class="payslip-period">Payslip for the Month of <b>${slip.monthName} ${slip.year}</b></div>
//       </div>
//       <img src="images/logo.png" alt="Logo" class="payslip-header-logo" />
//     </div>
//     <div class="payslip-section">
//       <div class="payslip-section-title">Employee Details</div>
//       <div class="payslip-table-wrapper"><table class="payslip-table">
//         <tr><th>Employee Name</th><td>${slip.employeeName || ''}</td><th>Employee ID</th><td>${slip.employeeId || ''}</td></tr>
//         <tr><th>Department</th><td>${slip.department || ''}</td><th>Designation</th><td>${slip.designation || ''}</td></tr>
//         <tr><th>Employee Address</th><td colspan="3">${slip.location || ''}</td></tr>
//         <tr><th>Date of Joining</th><td>${slip.doj || ''}</td><td colspan="2"></td></tr>
//       </table></div>
//     </div>
//     <div class="payslip-section">
//       <div class="payslip-section-title">Attendance Summary</div>
//       <div class="payslip-table-wrapper"><table class="payslip-table">
//         <tr><th>Total Present</th><th>Total Absent</th><th>Paid Leaves</th><th>NPL</th><th>DNPL</th></tr>
//         <tr>
//           <td>${slip.workingDays || ''}</td>
//           <td>${slip.absentDays || ''}</td>
//           <td>${slip.paidLeaves || ''}</td>
//           <td>${slip.nplCount || ''}</td>
//           <td>${slip.dnplCount || ''}</td>
//         </tr>
//       </table></div>
//     </div>
//     <div class="payslip-section">
//       <div class="payslip-section-title">Earnings</div>
//       <div class="payslip-table-wrapper"><table class="payslip-table">
//         <tr><th>Description</th><th>Amount (INR)</th></tr>
//         <tr><td>Basic Salary</td><td>${slip.basic || '0.00'}</td></tr>
//         <tr><td>HRA</td><td>${slip.hra || '0.00'}</td></tr>
//         <tr><td>Special Allowance</td><td>${slip.specialAllowance || '0.00'}</td></tr>
//         <tr><th>Total Earnings</th><th>${slip.totalEarnings || '0.00'}</th></tr>
//       </table></div>
//     </div>
//     <div class="payslip-section">
//       <div class="payslip-section-title">Deductions</div>
//       <div class="payslip-table-wrapper"><table class="payslip-table">
//         <tr><th>Description</th><th>Amount (INR)</th></tr>
//         <tr><td>Provident Fund (PF)</td><td>${slip.epf || '0.00'}</td></tr>
//         <tr><td>ESI</td><td>${slip.esi || '0.00'}</td></tr>
//         <tr><td>Leave Deduction (DNPL)</td><td>${slip.dnplDeduction || '0.00'}</td></tr>
//         <tr><td>Leave Deduction (NPL)</td><td>${slip.nplDeduction || '0.00'}</td></tr>
//         <tr><th>Total Deductions</th>
//           <th>
//             ${isPreviewOnly
//               ? `<input id="editTotalDeductions" type="number" value="${slip.totalDeductions || '0.00'}" style="width:120px;">`
//               : (slip.totalDeductions || '0.00')}
//           </th></tr>
//       </table></div>
//     </div>
//     <div class="payslip-section">
//       <div class="payslip-section-title">Net Salary</div>
//       <div class="payslip-table-wrapper"><table class="payslip-table">
//         <tr class="payslip-net-row"><th>Net Pay (INR)</th><td>
//             ${isPreviewOnly
//               ? `<input id="editNetPay" type="number" value="${slip.netPay || '0.00'}" style="width:120px;">`
//               : (slip.netPay || '0.00')}
//           </td></tr>
//         <tr><th>Net Pay (in words)</th><td>${slip.netPayWords || ''}</td></tr>
//       </table></div>
//     </div>
//     <div class="payslip-footer">
//       This is a system generated payslip and does not require signature.
//     </div>
//   </div>
//   `;
// }

function renderPaySlipHTML(slip, isPreviewOnly = false) {
  return `
  <style>
    .payslip-container {
      max-width: 800px;
      margin: auto;
      padding: 25px;
      background: #fff;
      border: 3px solid #764ba2;
      position: relative;
      background: rgba(255,255,255,0.9);
      opacity: 1;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #004080;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .header img {
      height: 60px;
    }
    .header .company-name {
      font-size: 22px;
      font-weight: bold;
      color: #004080;
      text-align: left;
      flex: 1;
    }
    h3 {
      text-align: center;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: rgba(255,255,255,0.9);
    }
    th, td {
      padding: 10px;
      text-align: left;
      border: 1px solid #ddd;
    }
    th {
      background: #f0f0f0;
    }
    .section-title {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 8px;
      font-weight: bold;
      margin-top: 30px;
    }
    .footer {
      text-align: center;
      font-size: 13px;
      color: #555;
      margin-top: 30px;
    }
    .net-amount-words {
      font-style: italic;
      margin-top: -10px;
      font-size: 14px;
      color: #333;
    }
    @media screen and (max-width: 600px) {
      .payslip-container {
        padding: 15px;
        border: none;
      }
      .header {
        flex-direction: row;
        align-items: flex-start;
        text-align: left;
      }
      .header img {
        margin-bottom: 10px;
        height:35px;
      }
      .header .company-name {
        text-align: left;
        font-size: 20px;
      }
      table {
        font-size: 14px;
        display: block;
        overflow-x: auto;
        white-space: nowrap;
      }
      th, td {
        padding: 8px;
      }
      .section-title {
        font-size: 16px;
      }
      .net-amount-words {
        font-size: 13px;
      }
      .footer {
        font-size: 12px;
      }
    }
  </style>
  <div class="payslip-container">
    <div class="header">
      <div class="company-name">Assignopedia Services</div>
      <img src="images/logo.png" alt="Company Logo">
    </div>
    <h3>Payslip for the Month of ${slip.monthName || ''} ${slip.year || ''}</h3>
    <div class="section-title">Employee Details</div>
    <table>
      <tr><th>Employee Name</th><td>${slip.employeeName || ''}</td></tr>
      <tr><th>Employee ID</th><td>${slip.employeeId || ''}</td></tr>
      
      <tr><th>Designation</th><td>${slip.designation || ''}</td></tr>
      <tr><th>Employee Address</th><td>${slip.location || ''}</td></tr>
      <tr><th>Date of Joining</th><td>${slip.doj || ''}</td></tr>
    </table>
    <div class="section-title">Attendance Summary</div>
    <table>
      <tr>
        <th>Total Present</th>
        <th>Total Absent</th>
        <th>Paid Leaves</th>
        <th>NPL</th>
        <th>DNPL</th>
      </tr>
      <tr>
        <td>${slip.workingDays || ''}</td>
        <td>${slip.absentDays || ''}</td>
        <td>${slip.paidLeaves || ''}</td>
        <td>${slip.nplCount || ''}</td>
        <td>${slip.dnplCount || ''}</td>
      </tr>
    </table>
    <div class="section-title">Earnings</div>
    <table>
      <tr><th>Description</th><th>Amount (INR)</th></tr>
      <tr><td>Basic Salary</td><td>${slip.basic || '0.00'}</td></tr>
      <tr><td>HRA</td><td>${slip.hra || '0.00'}</td></tr>
      <tr><td>Special Allowance</td><td>${slip.specialAllowance || '0.00'}</td></tr>
      <tr><th>Total Earnings</th><th>${slip.totalEarnings || '0.00'}</th></tr>
    </table>
    <div class="section-title">Deductions</div>
    <table>
      <tr><th>Description</th><th>Amount (INR)</th></tr>
      <tr><td>Provident Fund (PF)</td><td>${slip.epf || '0.00'}</td></tr>
      <tr><td>ESI</td><td>${slip.esi || '0.00'}</td></tr>
      <tr><td>Leave Deduction (DNPL)</td><td>${slip.dnplDeduction || '0.00'}</td></tr>
      <tr><td>Leave Deduction (NPL)</td><td>${slip.nplDeduction || '0.00'}</td></tr>
      <tr><th>Total Deductions</th>
        <th>
          ${isPreviewOnly
            ? `<input id="editTotalDeductions" type="number" value="${slip.totalDeductions || '0.00'}" style="width:120px;">`
            : (slip.totalDeductions || '0.00')}
        </th></tr>
    </table>
    <div class="section-title">Net Salary</div>
    <table>
      <tr><th>Net Pay (INR)</th><td>
        ${isPreviewOnly
          ? `<input id="editNetPay" type="number" value="${slip.netPay || '0.00'}" style="width:120px;">`
          : (slip.netPay || '0.00')}
      </td></tr>
    </table>
    <div class="net-amount-words">Amount in words: <strong>${slip.netPayWords || ''}</strong></div>
    <div class="footer">
      This is a computer-generated payslip and does not require a signature.<br>
      For any queries, contact HR at hr@example.com
    </div>
  </div>
  `;
}

function setActive(buttonId) {
  document.querySelectorAll(".sidebar-btn").forEach((btn) => btn.classList.remove("active"));
  const activeBtn = document.getElementById(buttonId);
  if (activeBtn) activeBtn.classList.add("active");
}

// --- Logout logic (top-level, not inside any function) ---
function setLogoutListener() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("employee");
      localStorage.removeItem("jwtToken");
      window.location.href = "login.html";
    };
  }
}
// Blog Manager section loader
async function loadBlogManager() {
  // Role check: only admin and hr_recruiter
  const employee = JSON.parse(localStorage.getItem("employee"));
  if (!employee || (employee.role !== "admin" && employee.role !== "hr_recruiter" && employee.role=="hr_executive")) {
    alert("Access denied. Only admin and HR Recruiter can access Blog Manager.");
    return;
  }
  // On mobile, close sidebar when Blog Manager is loaded
  if (window.innerWidth <= 600) {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('show');
  }
  setActive("btn-blog-manager");
  const mainContent = document.getElementById("mainContent");

  mainContent.innerHTML = `
    <div class="blog-manager">
      <div class="bm-header">
        <div class="bm-header-title">
          <span class="bm-header-icon">📝</span>
          <h2>Post a New Blog</h2>
        </div>
        <p class="bm-subtext">Share updates, tips, and stories with the Assignopedia community</p>
      </div>

      <div class="bm-card">
        <form id="blogPostForm" enctype="multipart/form-data" autocomplete="off">
          <div class="bm-form-grid">
            <div class="bm-form-group bm-col-span-2">
              <label for="title" class="bm-label">Blog Title <span class="required">*</span></label>
              <input type="text" name="title" id="title" class="bm-input" placeholder="Enter blog title" required>
            </div>

            <div class="bm-form-group bm-col-span-2">
              <label for="excerpt" class="bm-label">Excerpt/Summary <span class="required">*</span></label>
              <textarea name="excerpt" id="excerpt" class="bm-textarea" rows="3" placeholder="Write a brief summary (max 200 characters)" maxlength="200" required></textarea>
              <small class="bm-hint">This appears as a preview on the blog listing page</small>
            </div>

            <div class="bm-form-group bm-col-span-2">
              <label for="content" class="bm-label">Content <span class="required">*</span></label>
              <div class="bm-editor-wrapper">
                <textarea name="content" id="editor"></textarea>
              </div>
            </div>

            <div class="bm-form-group">
              <label for="category" class="bm-label">Category</label>
              <select name="category" id="category" class="bm-input">
                <option value="Academic">Academic</option>
                <option value="Research">Research</option>
                <option value="Writing">Writing</option>
                <option value="Study Tips">Study Tips</option>
                <option value="General">General</option>
              </select>
            </div>

            <div class="bm-form-group">
              <label for="tags" class="bm-label">Tags</label>
              <input type="text" name="tags" id="tags" class="bm-input" placeholder="e.g., education, writing, tips">
            </div>
          </div>

          <div class="bm-actions">
            <button type="button" class="bm-btn bm-btn-primary" id="publishBlogBtn">
              <i class="fas fa-paper-plane"></i> Publish Blog
            </button>
            <div id="blogFormMsg" class="bm-msg"></div>
          </div>
        </form>
      </div>

      <div class="bm-card bm-table-card">
        <div class="bm-header bm-inner">
          <div class="bm-header-title">
            <span class="bm-header-icon">📋</span>
            <h2>Manage Blog Posts</h2>
          </div>
        </div>
        <div id="blogList" class="bm-table-wrapper">
          <div class="bm-loading">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Custom Upload Adapter for CKEditor
  class CustomUploadAdapter {
    constructor(loader) {
      this.loader = loader;
      console.log('CustomUploadAdapter created');
    }
    upload() {
      console.log('Starting upload...');
      return this.loader.file.then(file => {
        console.log('File to upload:', file.name, file.type, file.size);
        const formData = new FormData();
        formData.append('upload', file);
        return fetch('/api/blog/upload-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
          },
          body: formData
        })
        .then(response => {
          console.log('Upload response status:', response.status);
          return response.json();
        })
        .then(data => {
          console.log('Upload response data:', data);
          if (data.url) {
            return { default: data.url };
          } else {
            throw new Error('Upload failed: ' + (data.error?.message || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Upload error:', error);
          throw error;
        });
      });
    }
    abort() {
      console.log('Upload aborted');
    }
  }
  function CustomUploadAdapterPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
      return new CustomUploadAdapter(loader);
    };
  }

  // Load CKEditor Classic build (no retry, no super-build)
  if (typeof ClassicEditor !== 'undefined') {
    ClassicEditor
      .create(document.querySelector('#editor'), {
        toolbar: [
          'heading', '|',
          'bold', 'italic', '|',
          'bulletedList', 'numberedList', '|',
          'link', 'imageUpload', 'blockQuote', '|',
          'undo', 'redo'
        ],
        image: {
          toolbar: [
            'imageTextAlternative', '|',
            'imageStyle:alignLeft', 'imageStyle:alignCenter', 'imageStyle:alignRight'
          ],
          styles: [
            'alignLeft',
            'alignCenter',
            'alignRight'
          ]
        },
        removePlugins: ['CKFinderUploadAdapter', 'CKFinder', 'EasyImage'],
        extraPlugins: [CustomUploadAdapterPlugin]
      })
      .then(editor => {
        window._blogEditor = editor;
        console.log('CKEditor Classic loaded');
        // Enhanced image selection with caption toolbar
        editor.editing.view.document.on('click', (evt, data) => {
          const domTarget = data.domTarget;
          if (domTarget && domTarget.tagName === 'IMG') {
            // Visual feedback for selected image
            domTarget.style.outline = '2px solid #007cba';
            domTarget.style.resize = 'both';
            domTarget.style.overflow = 'auto';
            domTarget.setAttribute('draggable', 'true');
            
            // Add caption button to image toolbar
            addCaptionButtonToImageToolbar(editor, domTarget);
                    }
        });
        
        // Function to add caption button to image toolbar
        function addCaptionButtonToImageToolbar(editor, imageElement) {
          // Remove any existing caption buttons
          const existingButtons = document.querySelectorAll('.image-caption-btn');
          existingButtons.forEach(btn => btn.remove());
          
          // Create caption button
          const captionButton = document.createElement('button');
          captionButton.className = 'image-caption-btn';
          captionButton.innerHTML = '📝 Caption';
          captionButton.style.cssText = `
            background: #007cba;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            margin-left: 8px;
            font-size: 11px;
            font-weight: 500;
          `;
          
          captionButton.addEventListener('click', () => {
            // Get the image model element
            const viewElement = editor.editing.view.domConverter.domToView(imageElement);
            const modelElement = editor.editing.mapper.toModelElement(viewElement);
            
            if (modelElement) {
              // Check if image already has a caption
              const imageBlock = modelElement.parent;
              const nextElement = imageBlock.nextSibling;
              
              if (nextElement && nextElement.name === 'paragraph' && 
                  nextElement.getChild(0).data.includes('📝 Caption:')) {
                // Caption already exists, focus on it
                editor.model.change(writer => {
                  writer.setSelection(nextElement, 'in');
                });
              } else {
                // Add new caption
                editor.model.change(writer => {
                  const captionParagraph = writer.createElement('paragraph');
                  const captionText = writer.createText('📝 Caption: Enter your caption here...');
                  writer.append(captionText, captionParagraph);
                  writer.insert(captionParagraph, imageBlock, 'after');
                  writer.setSelection(captionParagraph, 'in');
                });
              }
            }
          });
          
          // Find the image toolbar and add the button
          setTimeout(() => {
            const imageToolbar = document.querySelector('.ck-image__toolbar');
            if (imageToolbar) {
              imageToolbar.appendChild(captionButton);
            } else {
              // If image toolbar doesn't exist, create one
              const imageContainer = imageElement.closest('.ck-widget');
              if (imageContainer) {
                let toolbar = imageContainer.querySelector('.ck-image__toolbar');
                if (!toolbar) {
                  toolbar = document.createElement('div');
                  toolbar.className = 'ck-image__toolbar';
                  toolbar.style.cssText = `
                    position: absolute;
                    top: -40px;
                    left: 0;
                    background: white;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    z-index: 1000;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  `;
                  imageContainer.style.position = 'relative';
                  imageContainer.appendChild(toolbar);
                }
                toolbar.appendChild(captionButton);
              }
            }
          }, 100);
        }
        
        // Remove any existing standalone caption buttons from main toolbar
        const existingMainButtons = document.querySelectorAll('.main-caption-btn');
        existingMainButtons.forEach(btn => btn.remove());
      })
      .catch(error => {
        console.error('CKEditor error:', error);
      });
  } else {
    console.error('CKEditor ClassicEditor is not loaded.');
  }

  // Attach submit handler
  setTimeout(() => {
    document.getElementById('publishBlogBtn').onclick = async function() {
      const form = document.getElementById('blogPostForm');
      const msgDiv = document.getElementById('blogFormMsg');
      msgDiv.innerHTML = '';
      
      const title = form.title.value.trim();
      const excerpt = form.excerpt.value.trim();
      const content = window._blogEditor ? window._blogEditor.getData() : '';
      const category = form.category.value;
      const tags = form.tags.value.trim();
      
      if (!title || !excerpt || !content) {
        msgDiv.innerHTML = '<div class="alert alert-danger">Please fill in all required fields.</div>';
        return;
      }
      
      // Fix form validation by removing required attribute from hidden textarea
      const contentTextarea = document.querySelector('#editor');
      if (contentTextarea) {
        contentTextarea.removeAttribute('required');
      }
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('excerpt', excerpt);
      formData.append('content', content);
      formData.append('category', category);
      if (tags) formData.append('tags', tags);
      
      const token = localStorage.getItem('jwtToken');
      try {
        const response = await fetch('/api/blog', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await response.json();
        console.log('Blog creation response:', data);
        if (data.success) {
          msgDiv.innerHTML = '<div class="alert alert-success">Blog post published successfully!</div>';
          form.reset();
          if (window._blogEditor) window._blogEditor.setData('');
          // Refresh the blog list
          console.log('Refreshing blog list...');
          loadBlogList();
        } else {
          msgDiv.innerHTML = `<div class="alert alert-danger">${data.error || 'Failed to publish blog post.'}</div>`;
        }
      } catch (err) {
        msgDiv.innerHTML = '<div class="alert alert-danger">Error publishing blog post. Please try again.</div>';
      }
    };
  }, 400);

  // Load blog list
  loadBlogList();
}

// Function to load and display blog posts
async function loadBlogList() {
  const blogListDiv = document.getElementById('blogList');
  if (!blogListDiv) return;

  try {
    const token = localStorage.getItem('jwtToken');
    console.log('Loading blogs with token:', token ? 'Token exists' : 'No token');
    
    const response = await fetch('/api/blog/admin/all', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      console.error('Blog API response not ok:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      blogListDiv.innerHTML = '<div class="alert alert-danger">Failed to load blog posts. Check console for details.</div>';
      return;
    }
    
    const blogs = await response.json();
    console.log('Loaded blogs:', blogs);

    if (blogs.length === 0) {
      blogListDiv.innerHTML = '<div class="text-center text-muted">No blog posts found.</div>';
      return;
    }

    blogListDiv.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover">
          <thead class="table-dark">
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Author</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${blogs.map(blog => `
              <tr>
                <td>
                  <strong>${blog.title}</strong>
                  <br><small class="text-muted">${blog.excerpt.substring(0, 50)}...</small>
                </td>
                <td><span class="badge bg-primary">${blog.category}</span></td>
                <td>${blog.author ? `${blog.author.firstName || ''} ${blog.author.lastName || ''}`.trim() || blog.author.employeeId : 'Unknown'}</td>
                <td>
                  <span class="badge ${blog.status === 'published' ? 'bg-success' : 'bg-warning'}">
                    ${blog.status}
                  </span>
                </td>
                <td>${new Date(blog.createdAt).toLocaleDateString()}</td>
                <td>
                  <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-primary" onclick="editBlog('${blog._id}')">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteBlog('${blog._id}')">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Error loading blogs:', error);
    blogListDiv.innerHTML = '<div class="alert alert-danger">Failed to load blog posts.</div>';
  }
}

// Function to delete blog post
async function deleteBlog(blogId) {
  if (!confirm('Are you sure you want to delete this blog post?')) return;

  try {
    const token = localStorage.getItem('jwtToken');
    const response = await fetch(`/api/blog/${blogId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.success) {
      alert('Blog post deleted successfully!');
      loadBlogList();
    } else {
      alert('Failed to delete blog post.');
    }
  } catch (error) {
    console.error('Error deleting blog:', error);
    alert('An error occurred while deleting the blog post.');
  }
}

// Function to edit blog post (placeholder for future implementation)
function editBlog(blogId) {
  alert('Edit functionality will be implemented soon!');
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("btn-blog-manager")) {
    document.getElementById("btn-blog-manager").addEventListener("click", loadBlogManager);
  }
});
document.addEventListener("DOMContentLoaded", () => {
  mainContent = document.getElementById("mainContent");

  // --- Inactivity Auto-Logout (5 minutes) ---
  let inactivityTimeout;
  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes in ms
  function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      localStorage.removeItem("employee");
      localStorage.removeItem("jwtToken");
      window.location.href = "login.html";
    }, INACTIVITY_LIMIT);
  }
  // Reset timer on any user activity
  ["mousemove", "keydown", "mousedown", "touchstart"].forEach(evt => {
    document.addEventListener(evt, resetInactivityTimer, true);
  });
  resetInactivityTimer();

  const employee = JSON.parse(localStorage.getItem("employee"));
  const token = localStorage.getItem("jwtToken");
  console.log("login->", token);
  if (!employee || !token) {
    window.location.href = "login.html";
    return;
  }
  console.log(employee);
  // Enhanced Role-based access control
  isAdminRole = employee.role === "admin" || employee.role === "hr_admin" ;
  isHRRole =
    employee.role === "hr_admin" ||
    employee.role === "hr_manager" ||
    employee.role === "hr_executive" ||
    employee.role === "hr_recruiter";
  isBDMorTL = employee.role === "bdm" || employee.role === "team_leader" || employee.role === "tl";
  isRegularEmployee = !isAdminRole && !isHRRole && !isBDMorTL;
  isAdminOrHRRecruiter = employee.role === "admin" || employee.role === "hr_recruiter"|| employee.role=="hr_executive";
  // mainContent = document.getElementById("mainContent"); // Remove this redeclaration

  // Enhanced Access Control Summary:
  // - Admin: My Dashboard (no word count), Notice Board, Leave Approval, Leave Tracker, Attendance Tracker, Pay Slip, WFH Approval, Social Media, Employee Stats
  // - HR Recruiter: My Dashboard (no word count), Notice Board, Leave Approval, Notifications, Leave Tracker, Attendance Tracker, Pay Slip, WFH Approval, Social Media, My Attendance, Leave Request, WFH Request, WFH Approval, Employee Stats
  // - BDM/TL: Everything except Attendance Tracker, Leave Tracker, WFH Approval, Notice Board, Pay Slip, Add Employee, Employee Stats
  // - Regular Employee: Notifications, Leave Request, WFH Request, My Attendance, My Dashboard (with word count)

  // Ensure attendance button is visible for all roles by default
  const attendanceBtn = document.getElementById("btn-attendance");
  if (attendanceBtn) {
    attendanceBtn.style.display = "";
  }

  // Show/hide buttons based on role
  if (isAdminRole) {
    // Admin: Show all admin features
    document.getElementById("btn-social").style.display = "";
    document.getElementById("btn-add-employee").style.display = "";
    document.getElementById("btn-manage-employee").style.display = "";
    document.getElementById("btn-stats").style.display = "";
    document.getElementById("btn-attendance").style.display = "";
    document.getElementById("btn-leave").style.display = "";
    document.getElementById("btn-pay-slip").style.display = "";

    // Add admin-specific buttons to sidebar
    const sidebarNav = document.querySelector(".sidebar-nav");
    
    // Add Notice Board button
    if (!document.getElementById("btn-notice-board")) {
      const noticeBoardBtn = document.createElement("button");
      noticeBoardBtn.id = "btn-notice-board";
      noticeBoardBtn.className = "sidebar-btn";
      noticeBoardBtn.innerHTML = '<i class="fas fa-bullhorn"></i> Notice Board';
      sidebarNav.insertBefore(noticeBoardBtn, document.getElementById("btn-stats"));
      noticeBoardBtn.addEventListener("click", () => {
        loadNoticeBoard();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

    // Add WFH Request button
    if (!document.getElementById("btn-wfh")) {
      const wfhBtn = document.createElement("button");
      wfhBtn.id = "btn-wfh";
      wfhBtn.className = "sidebar-btn";
      wfhBtn.innerHTML = '<i class="fas fa-laptop-house"></i> WFH Request';
      sidebarNav.insertBefore(wfhBtn, document.getElementById("btn-stats"));
      wfhBtn.addEventListener("click", () => {
        loadWFHRequest();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

    // Add WFH Approval button
    if (!document.getElementById("btn-wfh-approval")) {
      const wfhApprovalBtn = document.createElement("button");
      wfhApprovalBtn.id = "btn-wfh-approval";
      wfhApprovalBtn.className = "sidebar-btn";
      wfhApprovalBtn.innerHTML = '<i class="fas fa-check-circle"></i> WFH Approval';
      sidebarNav.insertBefore(wfhApprovalBtn, document.getElementById("btn-stats"));
      wfhApprovalBtn.addEventListener("click", () => {
        loadWFHApproval();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

    // Add Notifications button
    if (!document.getElementById("btn-notifications")) {
      const notificationsBtn = document.createElement("button");
      notificationsBtn.id = "btn-notifications";
      notificationsBtn.className = "sidebar-btn";
      notificationsBtn.innerHTML = '<i class="fas fa-bell"></i> Notifications';
      sidebarNav.insertBefore(notificationsBtn, document.getElementById("btn-stats"));
      notificationsBtn.addEventListener("click", () => {
        loadNotifications();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

    // Add leave approval button to sidebar for admin roles
    const leaveApprovalBtn = document.createElement("button");
    leaveApprovalBtn.id = "btn-leave-approval";
    leaveApprovalBtn.className = "sidebar-btn";
    leaveApprovalBtn.innerHTML = '<i class="fas fa-check-circle"></i> Leave Approval';
    sidebarNav.insertBefore(leaveApprovalBtn, document.getElementById("btn-stats"));

    // Add event listener for leave approval button
    leaveApprovalBtn.addEventListener("click", () => {
      loadLeaveApproval();
      if (window.innerWidth <= 768) {
        document.getElementById("sidebar").classList.remove("show");
        document.getElementById("sidebarOverlay").classList.remove("active");
      }
    });

    // Add Team Management button for admin roles
    if (!document.getElementById("btn-team-management")) {
      const teamMgmtBtn = document.createElement("button");
      teamMgmtBtn.id = "btn-team-management";
      teamMgmtBtn.className = "sidebar-btn";
      teamMgmtBtn.innerHTML = '<i class="fas fa-users-cog"></i> Team Management';
      
      // Insert before btn-stats if it exists, otherwise append to the end
      const statsBtn = document.getElementById("btn-stats");
      if (statsBtn) {
        sidebarNav.insertBefore(teamMgmtBtn, statsBtn);
      } else {
        sidebarNav.appendChild(teamMgmtBtn);
      }
      
      teamMgmtBtn.addEventListener("click", () => {
        setActive("btn-team-management");
        loadTeamManagement();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

    // Add Blog Manager button for admin
    if (!document.getElementById("btn-blog-manager")) {
      const blogManagerBtn = document.createElement("button");
      blogManagerBtn.id = "btn-blog-manager";
      blogManagerBtn.className = "sidebar-btn";
      blogManagerBtn.innerHTML = '<i class="fas fa-blog"></i> Blog Manager';
      // Insert before Team Management if exists, else before stats
      const teamMgmtBtn = document.getElementById("btn-team-management");
      const statsBtn = document.getElementById("btn-stats");
      if (teamMgmtBtn) {
        sidebarNav.insertBefore(blogManagerBtn, teamMgmtBtn);
      } else if (statsBtn) {
        sidebarNav.insertBefore(blogManagerBtn, statsBtn);
      } else {
        sidebarNav.appendChild(blogManagerBtn);
      }
      blogManagerBtn.addEventListener("click", () => {
        loadBlogManager();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

  } else if (isHRRole) {
    // HR Recruiter: Show HR features
    document.getElementById("btn-add-employee").style.display = "";
    document.getElementById("btn-manage-employee").style.display = "";
    document.getElementById("btn-attendance").style.display = "";
    document.getElementById("btn-leave").style.display = "";
    document.getElementById("btn-pay-slip").style.display = "";
    document.getElementById("btn-social").style.display = "";

    // Add HR-specific buttons to sidebar
    const sidebarNav = document.querySelector(".sidebar-nav");
  // Add employee-specific buttons to sidebar

    document.getElementById('btn-pay-slip-schedule').onclick = loadPaySlipSchedule;

    if (!document.getElementById("btn-organization-structure")) {
      const sidebarNav = document.querySelector(".sidebar-nav");
      const orgBtn = document.createElement("button");
      orgBtn.id = "btn-organization-structure";
      orgBtn.className = "sidebar-btn";
      orgBtn.innerHTML = '<i class="fas fa-sitemap"></i> Organization Structure';
      // Insert before Team Management if exists, else before Employee Stats
      const teamMgmtBtn = document.getElementById("btn-team-management");
      const statsBtn = document.getElementById("btn-stats");
      if (teamMgmtBtn) {
        sidebarNav.insertBefore(orgBtn, teamMgmtBtn);
      } else if (statsBtn) {
        sidebarNav.insertBefore(orgBtn, statsBtn);
      } else {
        sidebarNav.appendChild(orgBtn);
      }
      orgBtn.addEventListener("click", () => {
        loadOrganizationStructure();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }
    
    // Add Notice Board button
    if (!document.getElementById("btn-notice-board")) {
      const noticeBoardBtn = document.createElement("button");
      noticeBoardBtn.id = "btn-notice-board";
      noticeBoardBtn.className = "sidebar-btn";
      noticeBoardBtn.innerHTML = '<i class="fas fa-bullhorn"></i> Notice Board';
      sidebarNav.insertBefore(noticeBoardBtn, document.getElementById("btn-stats"));
      noticeBoardBtn.addEventListener("click", () => {
        loadNoticeBoard();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

    // Add WFH Request button
    if (!document.getElementById("btn-wfh")) {
      const wfhBtn = document.createElement("button");
      wfhBtn.id = "btn-wfh";
      wfhBtn.className = "sidebar-btn";
      wfhBtn.innerHTML = '<i class="fas fa-laptop-house"></i> WFH Request';
      sidebarNav.insertBefore(wfhBtn, document.getElementById("btn-stats"));
      wfhBtn.addEventListener("click", () => {
        loadWFHRequest();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

    // Add WFH Approval button
    if (!document.getElementById("btn-wfh-approval")) {
      const wfhApprovalBtn = document.createElement("button");
      wfhApprovalBtn.id = "btn-wfh-approval";
      wfhApprovalBtn.className = "sidebar-btn";
      wfhApprovalBtn.innerHTML = '<i class="fas fa-check-circle"></i> WFH Approval';
      sidebarNav.insertBefore(wfhApprovalBtn, document.getElementById("btn-stats"));
      wfhApprovalBtn.addEventListener("click", () => {
        loadWFHApproval();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

    // Add Notifications button
    if (!document.getElementById("btn-notifications")) {
      const notificationsBtn = document.createElement("button");
      notificationsBtn.id = "btn-notifications";
      notificationsBtn.className = "sidebar-btn";
      notificationsBtn.innerHTML = '<i class="fas fa-bell"></i> Notifications';
      sidebarNav.insertBefore(notificationsBtn, document.getElementById("btn-stats"));
      notificationsBtn.addEventListener("click", () => {
        loadNotifications();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

    // Add leave approval button to sidebar for HR roles
    const leaveApprovalBtn = document.createElement("button");
    leaveApprovalBtn.id = "btn-leave-approval";
    leaveApprovalBtn.className = "sidebar-btn";
    leaveApprovalBtn.innerHTML = '<i class="fas fa-check-circle"></i> Leave Approval';
    sidebarNav.insertBefore(leaveApprovalBtn, document.getElementById("btn-stats"));

    // Add event listener for leave approval button
    leaveApprovalBtn.addEventListener("click", () => {
      loadLeaveApproval();
      if (window.innerWidth <= 768) {
        document.getElementById("sidebar").classList.remove("show");
        document.getElementById("sidebarOverlay").classList.remove("active");
      }
    });

    // Add Team Management button for HR roles
    if (!document.getElementById("btn-team-management")) {
      const teamMgmtBtn = document.createElement("button");
      teamMgmtBtn.id = "btn-team-management";
      teamMgmtBtn.className = "sidebar-btn";
      teamMgmtBtn.innerHTML = '<i class="fas fa-users-cog"></i> Team Management';
      
      // Insert before btn-stats if it exists, otherwise append to the end
      const statsBtn = document.getElementById("btn-stats");
      if (statsBtn) {
        sidebarNav.insertBefore(teamMgmtBtn, statsBtn);
      } else {
        sidebarNav.appendChild(teamMgmtBtn);
      }
      
      teamMgmtBtn.addEventListener("click", () => {
        setActive("btn-team-management");
        loadTeamManagement();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

    // Add Blog Manager button for hr_recruiter only
    if (employee.role === "hr_recruiter" && employee.role=="hr_executive" && !document.getElementById("btn-blog-manager")) {
      const blogManagerBtn = document.createElement("button");
      blogManagerBtn.id = "btn-blog-manager";
      blogManagerBtn.className = "sidebar-btn";
      blogManagerBtn.innerHTML = '<i class="fas fa-blog"></i> Blog Manager';
      // Insert before Team Management if exists, else before stats
      const teamMgmtBtn = document.getElementById("btn-team-management");
      const statsBtn = document.getElementById("btn-stats");
      if (teamMgmtBtn) {
        sidebarNav.insertBefore(blogManagerBtn, teamMgmtBtn);
      } else if (statsBtn) {
        sidebarNav.insertBefore(blogManagerBtn, statsBtn);
      } else {
        sidebarNav.appendChild(blogManagerBtn);
      }
      blogManagerBtn.addEventListener("click", () => {
        loadBlogManager();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

  } else if (isBDMorTL) {
    // BDM/TL: Show limited features
    document.getElementById("btn-attendance").style.display = "";
    document.getElementById("btn-leave").style.display = "";
    
    // Hide buttons that BDM/TL shouldn't see
    document.getElementById("btn-social").style.display = "none";
    document.getElementById("btn-add-employee").style.display = "none";
    document.getElementById("btn-manage-employee").style.display = "none";
    document.getElementById("btn-stats").style.display = "none";
    document.getElementById("btn-pay-slip").style.display = "none";

    // Add BDM/TL-specific buttons to sidebar
    const sidebarNav = document.querySelector(".sidebar-nav");
      // Add employee-specific buttons to sidebar
   
    document.getElementById('btn-pay-slip-schedule').onclick = loadPaySlipSchedule;
    // Add WFH Request button
    if (!document.getElementById("btn-wfh")) {
      const wfhBtn = document.createElement("button");
      wfhBtn.id = "btn-wfh";
      wfhBtn.className = "sidebar-btn";
      wfhBtn.innerHTML = '<i class="fas fa-laptop-house"></i> WFH Request';
      sidebarNav.insertBefore(wfhBtn, document.getElementById("btn-stats"));
      wfhBtn.addEventListener("click", () => {
        loadWFHRequest();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

    // Add Notifications button
    if (!document.getElementById("btn-notifications")) {
      const notificationsBtn = document.createElement("button");
      notificationsBtn.id = "btn-notifications";
      notificationsBtn.className = "sidebar-btn";
      notificationsBtn.innerHTML = '<i class="fas fa-bell"></i> Notifications';
      sidebarNav.insertBefore(notificationsBtn, document.getElementById("btn-stats"));
      notificationsBtn.addEventListener("click", () => {
        loadNotifications();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

  } else {
    // Regular Employee: Show basic features
    document.getElementById("btn-attendance").style.display = "";
    document.getElementById("btn-leave").style.display = "";
    
    // Hide buttons that regular employees shouldn't see
    document.getElementById("btn-social").style.display = "none";
    document.getElementById("btn-add-employee").style.display = "none";
    document.getElementById("btn-manage-employee").style.display = "none";
    document.getElementById("btn-stats").style.display = "none";
    document.getElementById("btn-pay-slip").style.display = "none";

    // Add employee-specific buttons to sidebar
    const sidebarNav = document.querySelector(".sidebar-nav");
    document.getElementById('btn-pay-slip-schedule').onclick = loadPaySlipSchedule;
    
    // Add WFH Request button
    if (!document.getElementById("btn-wfh")) {
      const wfhBtn = document.createElement("button");
      wfhBtn.id = "btn-wfh";
      wfhBtn.className = "sidebar-btn";
      wfhBtn.innerHTML = '<i class="fas fa-laptop-house"></i> WFH Request';
      sidebarNav.insertBefore(wfhBtn, document.getElementById("btn-stats"));
      wfhBtn.addEventListener("click", () => {
        loadWFHRequest();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }

    // Add Notifications button
    if (!document.getElementById("btn-notifications")) {
      const notificationsBtn = document.createElement("button");
      notificationsBtn.id = "btn-notifications";
      notificationsBtn.className = "sidebar-btn";
      notificationsBtn.innerHTML = '<i class="fas fa-bell"></i> Notifications';
      sidebarNav.insertBefore(notificationsBtn, document.getElementById("btn-stats"));
      notificationsBtn.addEventListener("click", () => {
        loadNotifications();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }
  }

  // Add Leave Tracker button for admin/HR
  if (isAdminRole || isHRRole) {
    const sidebarNav = document.querySelector(".sidebar-nav");
    if (!document.getElementById("btn-leave-tracker")) {
      const leaveTrackerBtn = document.createElement("button");
      leaveTrackerBtn.id = "btn-leave-tracker";
      leaveTrackerBtn.className = "sidebar-btn";
      leaveTrackerBtn.innerHTML = '<i class="fas fa-search"></i> Leave Tracker';
      sidebarNav.insertBefore(leaveTrackerBtn, document.getElementById("btn-stats"));
      leaveTrackerBtn.addEventListener("click", () => {
        loadLeaveTracker();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }
    
      // if (!document.getElementById('btn-pay-slip-view')) {
      //   const paySlipViewBtn = document.createElement('button');
      //   paySlipViewBtn.id = 'btn-pay-slip-view';
      //   paySlipViewBtn.className = 'sidebar-btn';
      //   paySlipViewBtn.innerHTML = '<i class="fas fa-file-invoice-dollar"></i> Pay Slip View';
      //   // Insert after Pay Slip Admin if present, else before Attendance
      //   const paySlipAdminBtn = document.getElementById('btn-pay-slip');
      //   if (paySlipAdminBtn && paySlipAdminBtn.nextSibling) {
      //     sidebarNav.insertBefore(paySlipViewBtn, paySlipAdminBtn.nextSibling);
      //   } else if (paySlipAdminBtn) {
      //     sidebarNav.appendChild(paySlipViewBtn);
      //   } else {
      //     const attendanceBtn = document.getElementById('btn-attendance');
      //     if (attendanceBtn) {
      //       sidebarNav.insertBefore(paySlipViewBtn, attendanceBtn);
      //     } else {
      //       sidebarNav.appendChild(paySlipViewBtn);
      //     }
      //   }
      //   paySlipViewBtn.addEventListener('click', () => {
      //     setActive('btn-pay-slip-view');
      //     loadPaySlipView();
      //     if (window.innerWidth <= 768) {
      //       document.getElementById('sidebar').classList.remove('show');
      //       document.getElementById('sidebarOverlay').classList.remove('active');
      //     }
      //   });
      // }
    
  }

  // Add Word Count Entry button to sidebar for BDM/TL only (not admin/HR)
  if (isBDMorTL || isAdminOrHRRecruiter) {
    const sidebarNav = document.querySelector(".sidebar-nav");
    if (!document.getElementById("btn-word-count-entry")) {
      const wordCountBtn = document.createElement("button");
      wordCountBtn.id = "btn-word-count-entry";
      wordCountBtn.className = "sidebar-btn";
      wordCountBtn.innerHTML = '<i class="fas fa-keyboard"></i> Word Count Entry';
      sidebarNav.insertBefore(wordCountBtn, document.getElementById("btn-stats"));
      wordCountBtn.addEventListener("click", () => {
        loadWordCountEntry();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }
  }

  // Add Attendance Tracker button for admin/HR
  if (isAdminRole || isHRRole) {
    const sidebarNav = document.querySelector(".sidebar-nav");
    if (!document.getElementById("btn-attendance-tracker")) {
      const attTrackerBtn = document.createElement("button");
      attTrackerBtn.id = "btn-attendance-tracker";
      attTrackerBtn.className = "sidebar-btn";
      attTrackerBtn.innerHTML = '<i class="fas fa-user-clock"></i> Attendance Tracker';
      sidebarNav.insertBefore(attTrackerBtn, document.getElementById("btn-stats"));
      attTrackerBtn.addEventListener("click", () => {
        loadAttendanceTracker();
        if (window.innerWidth <= 768) {
          document.getElementById("sidebar").classList.remove("show");
          document.getElementById("sidebarOverlay").classList.remove("active");
        }
      });
    }
  }
  // Load Leave Request Form and History
  async function loadLeaveRequest() {
    setActive("btn-leave");
    mainContent.innerHTML = `
      <div class="leave-request-wrapper">
        <div class="leave-request-card">
          <h2>📄 Leave Requests</h2>
          <form id="leaveForm" class="leave-request-form">
            <div class="leave-form-row">
              <div class="leave-form-group">
                <label>Reason</label>
                <select name="Reason" required id="ReasonSelect" class="leave-select">
                  <option value="">Select a reason</option>
                  <option value="Medical Reason">Medical Reason</option>
                  <option value="Personal Reason">Personal Reason</option>
                  <option value="Emergency Reason">Emergency Reason</option>
                  <option value="Other Reason">Other Reason</option>
                </select>
              </div>
              <div class="leave-form-group">
                <label>Leave Count</label>
                <div class="leave-count-container">
                  <input type="number" name="leaveCount" min="1" max="20" value="" required class="leave-input" placeholder="Enter number of days (1-20)" id="leaveCountInput">
                </div>
              </div>
            </div>
            <div id="reasonCommentBox" class="leave-form-group" style="display: none; margin-top: 10px;">
              <div class="leave-form-group">
                <label>Additional Details</label>
                <textarea name="reasonComment" rows="3" placeholder="Please provide additional details about your reason..." class="others-textarea" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; transition: all 0.3s ease; resize: vertical; min-height: 100px; background: #f8f9fa;"></textarea>
                <div class="attachment-section">
                  <button type="button" class="attachment-btn" id="attachmentBtn">
                    <i class="fas fa-paperclip"></i>
                    Attach Image
                  </button>
                  <input type="file" id="imageUpload" accept="image/*" style="display: none;">
                  <div class="attachment-preview" id="attachmentPreview">
                    <img src="" alt="Preview" class="preview-image" id="previewImage">
                    <button type="button" class="remove-attachment" id="removeAttachment">
                      <i class="fas fa-times"></i>
                      Remove Image
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div id="singleDateSection" class="leave-form-row" style="flex-wrap: wrap; gap: 15px; margin-top: 15px; display: none;">
              <div class="leave-form-group" style="flex: 1; min-width: 250px;">
                <label>Select Date</label>
                <input type="date" name="singleDate" class="date-input" placeholder="Select date">
              </div>
            </div>
            <div id="dateRangeSection" class="leave-form-row" style="flex-wrap: wrap; gap: 15px; margin-top: 15px; display: none;">
              <div class="leave-form-group" style="flex: 1; min-width: 250px;">
                <label>From</label>
                <input type="date" name="fromDate" class="date-input" placeholder="Select start date">
              </div>
              <div class="leave-form-group" style="flex: 1; min-width: 250px;">
                <label>To</label>
                <input type="date" name="toDate" class="date-input" placeholder="Select end date">
              </div>
            </div>
            <div class="leave-button-row">
              <button type="button" class="leave-cancel-btn" id="cancelLeaveBtn">Cancel</button>
              <button type="submit" class="leave-submit-btn"style="flex:0.3;">Submit Request</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Sample holiday list (to be replaced with actual holidays later)
    const holidays = [
      "2024-01-01", // New Year's Day
      "2024-01-26", // Republic Day
      "2024-03-25", // Holi
      "2024-04-09", // Ram Navami
      "2024-05-01", // Labor Day
      "2024-08-15", // Independence Day
      "2024-10-02", // Gandhi Jayanti
      "2024-12-25", // Christmas
    ];

    // Function to check if a date is a holiday
    const isHoliday = (date) => {
      const dateStr = date.toISOString().split("T")[0];
      return holidays.includes(dateStr);
    };

    // Function to create date without timezone issues
    const createDate = (dateStr) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    // Function to calculate working days between two dates (inclusive)
    const calculateWorkingDays = (startDate, endDate) => {
      let count = 0;
      const currentDate = new Date(startDate);
      const lastDate = new Date(endDate);
      while (currentDate <= lastDate) {
        // Skip Sundays (0) and holidays
        if (currentDate.getDay() !== 0 && !isHoliday(currentDate)) {
          count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return count;
    };

    // Date change handlers
    const handleDateChange = () => {
      const leaveCountInput = document.getElementById("leaveCountInput");
      const leaveCount = parseInt(leaveCountInput.value);
      const singleDateInput = document.querySelector('input[name="singleDate"]');
      const fromDateInput = document.querySelector('input[name="fromDate"]');
      const toDateInput = document.querySelector('input[name="toDate"]');

      if (leaveCount === 1 && singleDateInput.value) {
        const selectedDate = createDate(singleDateInput.value);
        console.log("Selected Date:", selectedDate);
        console.log("Day of week:", selectedDate.getDay());

        // Check if it's Sunday (0) or holiday
        if (selectedDate.getDay() === 0 || isHoliday(selectedDate)) {
          alert("Cannot apply leave on Sunday or holiday");
          singleDateInput.value = "";
          leaveCountInput.value = "0";
          return;
        } else {
          // If it's a valid working day, set leave count to 1
          leaveCountInput.value = "1";
        }
      } else if (leaveCount > 1 && fromDateInput.value && toDateInput.value) {
        const fromDate = createDate(fromDateInput.value);
        const toDate = createDate(toDateInput.value);

        if (fromDate > toDate) {
          alert("From date cannot be after To date");
          fromDateInput.value = "";
          toDateInput.value = "";
          return;
        }

        // Calculate and update leave count based on selected dates (inclusive, working days only)
        const workingDays = calculateWorkingDays(fromDate, toDate);
        leaveCountInput.value = workingDays;
      }
    };

    // Leave count change handler
    document.getElementById("leaveCountInput").onchange = function () {
      const leaveCount = parseInt(this.value);
      const singleDateSection = document.getElementById("singleDateSection");
      const dateRangeSection = document.getElementById("dateRangeSection");
      const singleDateInput = document.querySelector('input[name="singleDate"]');
      const fromDateInput = document.querySelector('input[name="fromDate"]');
      const toDateInput = document.querySelector('input[name="toDate"]');

      // Reset all date inputs
      singleDateInput.value = "";
      fromDateInput.value = "";
      toDateInput.value = "";

      if (leaveCount === 1) {
        singleDateSection.style.display = "flex";
        dateRangeSection.style.display = "none";
        singleDateInput.required = true;
        fromDateInput.required = false;
        toDateInput.required = false;
      } else if (leaveCount > 1) {
        singleDateSection.style.display = "none";
        dateRangeSection.style.display = "flex";
        singleDateInput.required = false;
        fromDateInput.required = true;
        toDateInput.required = true;
      } else {
        singleDateSection.style.display = "none";
        dateRangeSection.style.display = "none";
        singleDateInput.required = false;
        fromDateInput.required = false;
        toDateInput.required = false;
      }
    };

    // Add event listeners for date changes
    document.querySelector('input[name="singleDate"]').addEventListener("change", handleDateChange);
    document.querySelector('input[name="fromDate"]').addEventListener("change", handleDateChange);
    document.querySelector('input[name="toDate"]').addEventListener("change", handleDateChange);

    // Also add event listener for leave count input to handle initial value
    document.getElementById("leaveCountInput").addEventListener("change", function () {
      const singleDateInput = document.querySelector('input[name="singleDate"]');
      if (this.value === "1" && singleDateInput.value) {
        // Re-trigger date validation when leave count is set to 1
        handleDateChange();
      }
    });

    // Add reason select change handler
    document.getElementById("ReasonSelect").onchange = function () {
      const reasonCommentBox = document.getElementById("reasonCommentBox");
      if (this.value !== "") {
        reasonCommentBox.style.display = "flex";
        reasonCommentBox.querySelector("textarea").required = true;
      } else {
        reasonCommentBox.style.display = "none";
        reasonCommentBox.querySelector("textarea").required = false;
      }
    };

    // Add cancel button functionality
    document.getElementById("cancelLeaveBtn").onclick = function () {
      document.getElementById("leaveForm").reset();
      document.getElementById("reasonCommentBox").style.display = "none";
      document.getElementById("singleDateSection").style.display = "none";
      document.getElementById("dateRangeSection").style.display = "none";
    };

    // Add attachment button functionality
    const attachmentBtn = document.getElementById("attachmentBtn");
    const imageUpload = document.getElementById("imageUpload");
    const attachmentPreview = document.getElementById("attachmentPreview");
    const previewImage = document.getElementById("previewImage");
    const removeAttachment = document.getElementById("removeAttachment");

    attachmentBtn.addEventListener("click", () => {
      imageUpload.click();
    });

    imageUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImage.src = e.target.result;
          attachmentPreview.classList.add("active");
        };
        reader.readAsDataURL(file);
      }
    });

    removeAttachment.addEventListener("click", () => {
      imageUpload.value = "";
      previewImage.src = "";
      attachmentPreview.classList.remove("active");
    });

    document.getElementById("leaveForm").onsubmit = async function (e) {
      e.preventDefault();
      const form = e.target;
      const leaveCount = parseInt(form.leaveCount.value);
      // Use FormData for file upload
      const formData = new FormData();
      formData.append("reason", form.Reason.value);
      formData.append("leaveCount", leaveCount);
      formData.append("fromDate", leaveCount === 1 ? form.singleDate.value : form.fromDate.value);
      formData.append("toDate", leaveCount === 1 ? form.singleDate.value : form.toDate.value);
      formData.append("comments", form.reasonComment.value);
      // Attach image if selected
      const imageFile = document.getElementById("imageUpload").files[0];
      if (imageFile) {
        if (imageFile.size > 512 * 1024) {
          alert("Attachment too large (max 512KB)");
          return;
        }
        formData.append("attachment", imageFile);
      }
      try {
        const res = await fetch("/api/leave-requests", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Do NOT set Content-Type, browser will set it for FormData
          },
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          alert("Leave request submitted successfully!");
          loadLeaveRequest();
        } else {
          alert(data.message || "Failed to submit leave request.");
        }
      } catch (err) {
        alert("Error submitting request.");
      }
    };

    setLogoutListener();
    injectProfileSidebar();
  }

  // Social Media Links
  function loadSocialMedia() {
    // Security check - only admin and HR roles can access social media
    if (!isAdminRole && !isHRRole) {
      alert("Access denied. Only administrators and HR personnel can access social media features.");
      return;
    }

    setActive("btn-social");
    mainContent.innerHTML = `
      <div class="admin-content-section social-media-section" id="social-media-section">
        <h2>Social Media Post</h2>
        <div class="social-media-flex-container">
          <div class="social-media-form-col">
            <form id="socialMediaForm" class="section-form">
              <div class="form-row">
                <div class="form-group" style="flex: 1;">
                  <label>Post Caption</label>
                  <textarea name="caption" rows="4" placeholder="Write your post caption here..." required></textarea>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group" style="flex: 1;">
                  <label>Attach File</label>
                  <div class="file-upload-container">
                    <input type="file" name="file" id="fileInput" class="file-input" />
                    <label for="fileInput" class="file-label">
                      <i class="fas fa-cloud-upload-alt"></i>
                      <span>Choose a file or drag it here</span>
                    </label>
                    <div id="fileInfo" class="file-info"></div>
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group" style="flex: 1;">
                  <label>Select Platforms</label>
                  <div class="platform-selection">
                    <label class="platform-checkbox">
                      <input type="checkbox" name="platforms" value="facebook" checked>
                      <span class="platform-icon"><i class="fab fa-facebook"></i></span>
                      <span>Facebook</span>
                    </label>
                    <label class="platform-checkbox">
                      <input type="checkbox" name="platforms" value="instagram" checked>
                      <span class="platform-icon"><i class="fab fa-instagram"></i></span>
                      <span>Instagram</span>
                    </label>
                    <label class="platform-checkbox">
                      <input type="checkbox" name="platforms" value="linkedin" checked>
                      <span class="platform-icon"><i class="fab fa-linkedin"></i></span>
                      <span>LinkedIn</span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="form-row" style="justify-content: flex-start;">
                <button type="submit" class="post-btn">
                  <i class="fas fa-paper-plane"></i>
                  Post to Social Media
                </button>
              </div>
            </form>
            <div id="postStatus" class="post-status"></div>
          </div>
          <div class="social-media-image-col">
            <img src="https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80" alt="Social Media Inspiration" class="social-media-side-image" />
          </div>
        </div>
      </div>
    `;

    // File upload handling
    const fileInput = document.getElementById("fileInput");
    const fileInfo = document.getElementById("fileInfo");
    const fileLabel = document.querySelector(".file-label");

    fileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        fileInfo.innerHTML = `
          <div class="file-preview">
            <i class="fas ${getFileIcon(file.type)}"></i>
            <span>${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button type="button" class="remove-social-image" style="margin-left:10px; background:#ff758c; color:#fff; border:none; border-radius:50%; width:28px; height:28px; cursor:pointer; display:flex; align-items:center; justify-content:center;"><i class="fas fa-times"></i></button>
          </div>
        `;
        fileLabel.classList.add("has-file");
        // Add remove button logic
        const removeBtn = fileInfo.querySelector(".remove-social-image");
        if (removeBtn) {
          removeBtn.addEventListener("click", function () {
            fileInput.value = "";
            fileInfo.innerHTML = "";
            fileLabel.classList.remove("has-file");
          });
        }
      } else {
        fileInfo.innerHTML = "";
        fileLabel.classList.remove("has-file");
      }
    });

    // Drag and drop handling
    const dropZone = document.querySelector(".file-upload-container");

    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ["dragenter", "dragover"].forEach((eventName) => {
      dropZone.addEventListener(eventName, highlight, false);
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
      dropZone.classList.add("highlight");
    }

    function unhighlight(e) {
      dropZone.classList.remove("highlight");
    }

    dropZone.addEventListener("drop", handleDrop, false);

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      fileInput.files = dt.files;
      const event = new Event("change");
      fileInput.dispatchEvent(event);
    }

    // Form submission
    document.getElementById("socialMediaForm").onsubmit = async function (e) {
      e.preventDefault();
      const form = e.target;
      const caption = form.caption.value;
      const file = form.file.files[0];
      const platforms = Array.from(form.platforms)
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);

      if (!caption) {
        showStatus("Please enter a caption", "error");
        return;
      }

      if (platforms.length === 0) {
        showStatus("Please select at least one platform", "error");
        return;
      }

      const postStatus = document.getElementById("postStatus");
      postStatus.innerHTML =
        '<div class="posting-status"><i class="fas fa-spinner fa-spin"></i> Posting to social media...</div>';

      try {
        const results = await socialMediaService.postToSocialMedia(caption, file, platforms);

        if (results.success.length > 0) {
          const successMessage = results.success
            .map((r) => `Successfully posted to ${r.platform}`)
            .join("<br>");
          showStatus(successMessage, "success");
        }

        if (results.failed.length > 0) {
          const errorMessage = results.failed
            .map((r) => `Failed to post to ${r.platform}: ${r.error}`)
            .join("<br>");
          showStatus(errorMessage, "error");
        }

        if (results.success.length > 0) {
          form.reset();
          fileInfo.innerHTML = "";
          fileLabel.classList.remove("has-file");
        }
      } catch (error) {
        showStatus("Error posting to social media. Please try again.", "error");
      }
    };

    setLogoutListener();
    injectProfileSidebar();
  }

  // Helper functions for file handling
  function getFileIcon(fileType) {
    if (fileType.startsWith("image/")) return "fa-image";
    if (fileType.startsWith("video/")) return "fa-video";
    if (fileType.startsWith("audio/")) return "fa-music";
    if (fileType.includes("pdf")) return "fa-file-pdf";
    if (fileType.includes("word")) return "fa-file-word";
    if (fileType.includes("excel") || fileType.includes("sheet")) return "fa-file-excel";
    return "fa-file";
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function showStatus(message, type) {
    const postStatus = document.getElementById("postStatus");
    postStatus.innerHTML = `
      <div class="status-message ${type}">
        <i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}"></i>
        ${message}
      </div>
    `;
  }

  async function simulateSocialMediaPost(caption, file, platforms) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Here you would typically make API calls to social media platforms
    console.log("Posting to:", platforms);
    console.log("Caption:", caption);
    console.log("File:", file ? file.name : "No file");

    // Simulate success
    return true;
  }
  // Add Employee Form
  function loadAddEmployee() {
    // Security check - only admin and HR roles can add employees
    if (!isAdminRole && !isHRRole) {
      alert("Access denied. Only administrators and HR personnel can add employees.");
      return;
    }
    setActive("btn-add-employee");
    mainContent.innerHTML = `
      <div class="admin-content-section" id="add-employee-section">
        <h2>Add New Employee</h2>
        <div class="scrollable-form-container">
          <form id="addEmployeeForm" class="section-form add-employee-flex-row" style="height:50vh;">
            <div class="form-row">
              <div class="form-group">
                <label>Employee ID</label>
                <input type="text" name="employeeId" required />
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>First Name</label>
                <input type="text" name="firstName" />
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input type="text" name="lastName" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Address</label>
                <textarea name="address" rows="3" class="address-textarea"></textarea>
              </div>
              <div class="form-group">
                <label>Mobile No</label>
                <input type="text" name="mobile" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>ID Card Type</label>
                <select name="idCardType" id="idCardType">
                  <option value="">Select ID Card Type</option>
                  <option value="aadhar">Aaddhar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving">Driving License</option>
                  <option value="voter">Voter ID</option>
                </select>
              </div>
              <div class="form-group">
                <label>ID Card Number</label>
                <input type="text" name="idCardNumber" id="idCardNumber" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Employee Designation</label>
                <select name="role">
                  <option value="junior_developer">Junior Developer</option>
                  <option value="senior_developer">Senior Developer</option>
                  <option value="junior_writer">Junior Writer</option>
                  <option value="senior_writer">Senior Writer</option>
                  <option value="team_leader">Team Leader</option>
                  <option value="bdm">B D M</option>
                  <option value="hr_recruiter">HR Recruiter</option>
                  <option value="hr_executive">HR Executive</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="hr_admin">HR Admin</option>  
                  <option value="hr_admin">Admin</option>
                </select>
              </div>
              <div class="form-group">
                <label>Email Id</label>
                <input type="email" name="email" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Date of Joining</label>
                <input type="date" name="doj" />
              </div>
              <div class="form-group">
                <label>Profile Image</label>
                <div class="image-upload-container">
                  <input type="file" name="profileImage" id="profileImage" accept="image/*" style="display: none;" />
                  <button type="button" class="image-upload-btn" onclick="document.getElementById('profileImage').click()">
                    <i class="fas fa-upload"></i> Choose Image
                  </button>
                  <div class="image-preview" id="imagePreview" style="display: none;">
                    <img src="" alt="Preview" id="previewImg" />
                    <button type="button" class="remove-image-btn" onclick="removeImage()">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-row button-container">
              <button type="button" class="cancel-btn">Cancel</button>
              <button type="submit" class="login-btn add-employee-btn">Add Employee</button>
            </div>
            <div id="addEmployeeMsg"></div>
          </form>
        </div>
      </div>
    `;

    // Add ID Card validation
    const idCardType = document.getElementById("idCardType");
    const idCardNumber = document.getElementById("idCardNumber");

    idCardType.addEventListener("change", function () {
      const type = this.value;
      idCardNumber.value = ""; // Clear previous value

      // Set pattern based on ID card type
      switch (type) {
        case "aadhar":
          idCardNumber.pattern = "[0-9]{12}";
          idCardNumber.placeholder = "Enter 12-digit Aadhar number";
          break;
        case "pan":
          idCardNumber.pattern = "[A-Z]{5}[0-9]{4}[A-Z]{1}";
          idCardNumber.placeholder = "Enter PAN number (e.g., ABCDE1234F)";
          break;
        case "passport":
          idCardNumber.pattern = "[A-Z]{1}[0-9]{7}";
          idCardNumber.placeholder = "Enter Passport number (e.g., A1234567)";
          break;
        case "driving":
          idCardNumber.pattern = "[A-Z]{2}[0-9]{2}[0-9]{11}";
          idCardNumber.placeholder = "Enter Driving License number";
          break;
        case "voter":
          idCardNumber.pattern = "[A-Z]{3}[0-9]{7}";
          idCardNumber.placeholder = "Enter Voter ID number";
          break;
        default:
          idCardNumber.pattern = "";
          idCardNumber.placeholder = "Select ID Card Type first";
      }
    });

    document.getElementById("addEmployeeForm").onsubmit = async function (e) {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData();

      // Add all form fields to FormData
      formData.append("employeeId", form.employeeId.value);
      formData.append("firstName", form.firstName.value);
      formData.append("lastName", form.lastName.value);
      formData.append("password", form.password.value);
      formData.append("role", form.role.value);
      formData.append("address", form.address.value);
      formData.append("mobile", form.mobile.value);
      formData.append("email", form.email.value);
      formData.append("idCardType", form.idCardType.value);
      formData.append("idCardNumber", form.idCardNumber.value);
      formData.append("doj", form.doj.value);

      // Add profile image if selected

      const profileImage = document.getElementById("profileImage").files[0];
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      try {
        const token = localStorage.getItem("jwtToken");
        console.log("Token at employee form", token);
        const res = await fetch("/api/employees", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const data = await res.json();
        console.log(data);
        const msgDiv = document.getElementById("addEmployeeMsg");
        if (data.success) {
          msgDiv.style.color = "green";
          msgDiv.textContent = "Employee added successfully!";
          form.reset();
          document.getElementById("imagePreview").style.display = "none";
        } else {
          msgDiv.style.color = "red";
          msgDiv.textContent = data.message || "Failed to add employee.";
        }
      } catch (err) {
        const msgDiv = document.getElementById("addEmployeeMsg");
        msgDiv.style.color = "red";
        msgDiv.textContent = "Error submitting form. Please try again.";
      }
    };

    // Add Cancel button logic
    document.querySelector(".cancel-btn").onclick = function () {
      document.getElementById("addEmployeeForm").reset();
    };

    // Add this function after the loadAddEmployee function
    function removeImage() {
      const preview = document.getElementById("imagePreview");
      const fileInput = document.getElementById("profileImage");
      preview.style.display = "none";
      fileInput.value = "";
    }

    // Add this event listener in the loadAddEmployee function after the form submission handler
    document.getElementById("profileImage").addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const preview = document.getElementById("imagePreview");
          const previewImg = document.getElementById("previewImg");
          previewImg.src = e.target.result;
          preview.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });

    setLogoutListener();
    injectProfileSidebar();
  }

  // Load Stats (Employee Stats Section)
  async function loadStats() {
    // Security check - only admin and HR roles can access stats
    if (!isAdminRole && !isHRRole) {
      alert("Access denied. Only administrators and HR personnel can view statistics.");
      return;
    }
    setActive("btn-stats");
    mainContent.innerHTML = `
      <div class="admin-content-section" id="employee-stats-section" style="max-width:900px",width:100vw;">
        <h2>Employee Stats</h2>
        <div class="scrollable-form-container">
          <form id="employeeSearchForm" class="section-form" style="max-width: 900px; margin: 0 auto;">
            <div class="form-row">
              <div class="form-group">
                <label for="searchEmployeeName">Search by Name</label>
                <input type="text" id="searchEmployeeName" placeholder="Type employee name..." autocomplete="off" />
                <div id="nameSearchDropdown" class="search-dropdown" style="position:relative;"></div>
              </div>
              <div class="form-group">
                <label for="searchEmployeeId">Search by Employee ID</label>
                <input type="text" id="searchEmployeeId" placeholder="Enter Employee ID" required />
              </div>
            </div>
          </form>
          <div id="employeeStatsResult" style="margin-top: 2rem;width:800px;"></div>
        </div>
      </div>
    `;
    attachStatsNameSearch();

    const searchInput = document.getElementById("searchEmployeeId");
    const resultDiv = document.getElementById("employeeStatsResult");

    async function fetchEmployeeDetails(employeeId) {
      if (!employeeId) {
        resultDiv.innerHTML = "";
        return;
      }
      resultDiv.innerHTML = '<div class="loading">Searching...</div>';
      try {
        const token = localStorage.getItem("jwtToken");
        // Only use /api/employees, filter on frontend
        const res = await fetch(`/api/employees`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.employees)) {
          const found = data.employees.find(
            (emp) => emp.employeeId && emp.employeeId.toLowerCase() === employeeId.toLowerCase()
          );
          if (found) {
            const imgSrc =
              found.profileImage && found._id
                ? `/api/employees/${found._id}/profile-image`
                : "images/default-avatar.png";
            resultDiv.innerHTML = `
              <div class="employee-card" style="background:rgba(255,255,255,0.13);border-radius:16px;padding:2rem;box-shadow:0 2px 8px rgba(67,206,162,0.10);max-width:900px;margin:0 auto;display:flex;gap:2rem;align-items:center;">
                <img id="empProfileImg" src="${imgSrc}" alt="${
              found.firstName || found.name || ""
            }" style="width:90px;height:90px;border-radius:12px;object-fit:cover;border:2px solid #764ba2;box-shadow:0 2px 8px rgba(118,75,162,0.10);background:#fff;">
                <div style="flex:1;">
                  <h3 style="margin-bottom:0.5rem;color:#764ba2;">${
                    found.firstName || found.name || ""
                  } ${found.lastName || ""}</h3>
                  <p><strong>Employee ID:</strong> ${found.employeeId}</p>
                  <p><strong>Role:</strong> ${found.role}</p>
                  <p><strong>Email:</strong> ${found.email || "-"}</p>
                  <p><strong>Mobile:</strong> ${found.mobile || "-"}</p>
                  <p><strong>Date of Joining:</strong> ${
                    found.doj ? new Date(found.doj).toLocaleDateString() : "-"
                  }</p>
                  <p><strong>Address:</strong> ${found.address || "-"}</p>
                  <p><strong>ID Card:</strong> ${
                    found.idCardType ? found.idCardType.toUpperCase() : "-"
                  } ${found.idCardNumber || ""}</p>
                </div>
              </div>
            `;
            const img = document.getElementById("empProfileImg");
            if (img) {
              img.onerror = function () {
                this.onerror = null;
                this.src = "/images/logo.png";
              };
            }
          } else {
            resultDiv.innerHTML =
              '<div class="error" style="color:#dc3545;font-weight:bold;">No employee found with this ID.</div>';
          }
        } else {
          resultDiv.innerHTML =
            '<div class="error" style="color:#dc3545;font-weight:bold;">Failed to fetch employee data.</div>';
        }
      } catch (err) {
        resultDiv.innerHTML =
          '<div class="error" style="color:#dc3545;font-weight:bold;">Error searching employee.</div>';
      }
    }

    // Search on input (debounced)
    let debounceTimeout;
    searchInput.addEventListener("input", function () {
      clearTimeout(debounceTimeout);
      const value = this.value.trim();
      if (!value) {
        resultDiv.innerHTML = "";
        return;
      }
      debounceTimeout = setTimeout(() => {
        fetchEmployeeDetails(value);
      }, 400);
    });

    setLogoutListener();
    injectProfileSidebar();
  }

  // Logout logic
  function setLogoutListener() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        localStorage.removeItem("employee");
        localStorage.removeItem("jwtToken");
        window.location.href = "login.html";
      };
    }
  }

  // Add event listeners for all buttons
  document.getElementById("btn-leave").addEventListener("click", () => {
    setActive("btn-leave");
    loadLeaveRequest();
  });

  document.getElementById("btn-attendance").addEventListener("click", () => {
    setActive("btn-attendance");
    loadAttendance();
  });

  // My Dashboard button event
  document.getElementById("btn-dashboard").addEventListener("click", () => {
    setActive("btn-dashboard");
    loadDashboard();
  });

  // Social media - only for admin and HR roles
  if (isAdminRole || isHRRole) {
    document.getElementById("btn-social").addEventListener("click", loadSocialMedia);
  }

  // Add employee - for admin and HR roles
  if (isAdminRole || isHRRole) {
    document.getElementById("btn-add-employee").addEventListener("click", loadAddEmployee);
  }

  // Manage employee account - for admin and HR roles
  if (isAdminRole || isHRRole) {
    document.getElementById("btn-manage-employee").addEventListener("click", loadManageEmployee);
  }

  // Stats - only for admin and HR roles
  if (isAdminRole || isHRRole) {
    document.getElementById("btn-stats").addEventListener("click", loadStats);
  }

  // Pay slip - for admin and HR roles
  if (isAdminRole || isHRRole) {
    document.getElementById("btn-pay-slip").addEventListener("click", loadPaySlipAdmin);
  }

  // Leave approval - for admin and HR roles
  if (isAdminRole || isHRRole) {
    const leaveApprovalBtn = document.getElementById("btn-leave-approval");
    if (leaveApprovalBtn) {
      leaveApprovalBtn.addEventListener("click", loadLeaveApproval);
    }
  }

  // Add Organization Structure button for all roles
  const sidebarNav = document.querySelector(".sidebar-nav");
  if (!document.getElementById("btn-organization-structure")) {
    const orgBtn = document.createElement("button");
    orgBtn.id = "btn-organization-structure";
    orgBtn.className = "sidebar-btn";
    orgBtn.innerHTML = '<i class="fas fa-sitemap"></i> Organization Structure';
    // Insert before Team Management if exists, else before Employee Stats
    const teamMgmtBtn = document.getElementById("btn-team-management");
    const statsBtn = document.getElementById("btn-stats");
    if (teamMgmtBtn) {
      sidebarNav.insertBefore(orgBtn, teamMgmtBtn);
    } else if (statsBtn) {
      sidebarNav.insertBefore(orgBtn, statsBtn);
    } else {
      sidebarNav.appendChild(orgBtn);
    }
    orgBtn.addEventListener("click", () => {
      loadOrganizationStructure();
      if (window.innerWidth <= 768) {
        document.getElementById("sidebar").classList.remove("show");
        document.getElementById("sidebarOverlay").classList.remove("active");
      }
    });
  }

  // Load default section
  loadDashboard();

  // Responsive styles
  const formRow = document.querySelector(".form-row");
  if (formRow) {
    const formGroups = formRow.querySelectorAll(".form-group");
    if (formGroups.length > 2) {
      formRow.style.flexWrap = "wrap";
      formRow.style.gap = "15px";
    }
  }

  const formGroups = document.querySelectorAll(".form-group");
  formGroups.forEach((group) => {
    if (group.style.flex === "1") {
      group.style.minWidth = "250px";
    }
  });

  const formRowEnd = document.querySelector('.form-row[style*="justify-content: flex-end"]');
  if (formRowEnd) {
    formRowEnd.style.justifyContent = "center";
    formRowEnd.style.gap = "1rem";
  }

  const cancelBtn = document.getElementById("cancelLeaveBtn");
  if (cancelBtn) {
    cancelBtn.style.minWidth = "120px";
  }

  const loginBtn = document.querySelector(".login-btn");
  if (loginBtn) {
    loginBtn.style.minWidth = "120px";
  }

  const adminContentSection = document.querySelector(".admin-content-section");
  if (adminContentSection) {
    const styles = window.getComputedStyle(adminContentSection);
    if (styles.padding.split(" ").some((p) => p.includes("px"))) {
      adminContentSection.style.padding = "15px";
    }
  }

  formGroups.forEach((group) => {
    if (group.style.marginBottom) {
      group.style.marginBottom = "10px";
    }
  });

  const labels = document.querySelectorAll(".form-group label");
  labels.forEach((label) => {
    if (label.style.fontSize) {
      label.style.fontSize = "14px";
    }
  });

  const selects = document.querySelectorAll(".form-group select");
  const inputs = document.querySelectorAll(".form-group input");
  const textareas = document.querySelectorAll(".form-group textarea");
  selects.forEach((select) => {
    if (select.style.padding) {
      select.style.padding = "10px";
    }
  });
  inputs.forEach((input) => {
    if (input.style.padding) {
      input.style.padding = "10px";
    }
  });
  textareas.forEach((textarea) => {
    if (textarea.style.padding) {
      textarea.style.padding = "10px";
    }
  });
  // Load Leave Approval Page (Admin Only)
  async function loadLeaveApproval() {
    // Security check - only admin and HR roles can approve leaves
    if (!isAdminRole && !isHRRole) {
      alert("Access denied. Only administrators and HR personnel can approve leave requests.");
      return;
    }
    setActive("btn-leave-approval");
    mainContent.innerHTML = `
      <div class="admin-content-section leave-approval-section" id="leave-approval-section">
        <h2 style="align-self: center; margin-bottom: 1.5rem;">Leave Approval Requests</h2>
        <div class="leave-requests-container" style="width:80vw;">
          <div class="filters">
            <select id="statusFilter" class="filter-select">
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <input type="text" id="employeeFilter" class="filter-input" placeholder="Search by Employee ID or Name">
          </div>
          <div class="leave-requests-table" style="height:50vh;width:100%;">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Reason</th>
                  <th>Comments</th>
                  <th>Leave Count</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="leaveRequestsBody">
                <tr>
                  <td colspan="9" class="loading">Loading leave requests...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Add styles for the leave approval page
    const style = document.createElement("style");
    style.setAttribute("data-leave-approval-style", "");
    style.textContent = `
      .leave-approval-section {
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border: none !important;
        width: 100%;
        max-width: 1200px;
        padding: 0;
      }
      .leave-requests-container {
        background: #ede8f7;
        border-radius: 12px;
        padding: 24px;
        width: 100%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      .filters {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      .filter-select, .filter-input {
        padding: 0.75rem 1rem;
        border: 1px solid #d1c5e8;
        border-radius: 8px;
        background: #fff;
        font-size: 1rem;
        color: #333;
      }
      .filter-input {
        flex-grow: 1;
        max-width: 350px;
      }
      .leave-requests-table {
        width: 100%;
        overflow-x: auto;
        max-height: 60vh;
        overflow-y: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th, td {
        padding: 1rem 1.25rem;
        text-align: left;
        border-bottom: 1px solid #d1c5e8;
        color: #3a2c5c;
      }
      th {
        background: #dcd3f0;
        font-weight: 600;
      }
      tbody tr {
        background-color: #f7f3ff;
      }
      tbody tr:hover {
        background: #f0ebf9;
      }
      .status-badge {
        padding: 0.35rem 0.85rem;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        border: 1px solid transparent;
      }
      .status-pending {
        background: #fff3cd;
        color: #664d03;
        border-color: #ffecb5;
      }
      .status-approved {
        background: #d1e7dd;
        color: #0f5132;
        border-color: #badbcc;
      }
      .status-rejected {
        background: #f8d7da;
        color: #58151c;
        border-color: #f1c2c7;
      }
      .action-buttons {
        display: flex;
        gap: 0.5rem;
      }
      .approve-btn, .reject-btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.2s ease;
      }
      .approve-btn {
        background: #198754;
        color: white;
      }
      .reject-btn {
        background: #dc3545;
        color: white;
      }
      .approve-btn:hover {
        background: #157347;
      }
      .reject-btn:hover {
        background: #bb2d3b;
      }
      .loading {
        text-align: center;
        padding: 2rem;
        color: #666;
      }
      h2 {
        color: #fff;
      }
    `;
    document.head.appendChild(style);

    // Load leave requests
    try {
      const res = await fetch("/api/leave-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        console.log("Leave requests data:", data);
        displayLeaveRequests(data.leaveRequests);
      } else {
        document.getElementById("leaveRequestsBody").innerHTML = `
          <tr>
            <td colspan="9" class="error">Failed to load leave requests</td>
          </tr>
        `;
      }
    } catch (err) {
      document.getElementById("leaveRequestsBody").innerHTML = `
        <tr>
          <td colspan="9" class="error">Error loading leave requests</td>
        </tr>
      `;
    }

    // Add event listeners for filters
    document.getElementById("statusFilter").addEventListener("change", filterLeaveRequests);
    document.getElementById("employeeFilter").addEventListener("input", filterLeaveRequests);

    setLogoutListener();
    injectProfileSidebar();
    loadRecentNotices();
  }

  // Function to display leave requests
  function displayLeaveRequests(requests) {
    const tbody = document.getElementById("leaveRequestsBody");
    if (requests.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="no-data">No leave requests found</td>
        </tr>
      `;
      return;
    }
    const groups = groupLeaveRequestsByOriginal(requests);
    tbody.innerHTML = groups
      .map((group, idx) => {
        const isMulti = group._isMultiMonth; // Use the new flag instead of just checking length
        const main = group._group[0];
        // Truncate comments if too long
        let commentHtml = '-';
        if (main.comments && main.comments.trim()) {
          const full = main.comments.trim();
          if (full.length > 60) {
            const short = full.slice(0, 60) + '...';
            const commentId = `comment-toggle-${main._id}-${idx}`;
            commentHtml = `<span id="${commentId}" class="truncated-comment">${short} <a href="#" class="read-more-link" data-full="${encodeURIComponent(full)}" data-short="${encodeURIComponent(short)}" onclick="toggleComment('${commentId}', this); return false;">Read more</a></span>`;
          } else {
            commentHtml = full;
          }
        }
        return `
        <tr data-id="${main._id}" data-status="${main.status}">
          <td>${main.employeeId}</td>
          <td>${main.name}</td>
          <td>${main.reason || '-'}</td>
          <td>${commentHtml}</td>
          <td>${main.leaveCount}</td>
          <td>${new Date(main.fromDate).toLocaleDateString()}</td>
          <td>${new Date(main.toDate).toLocaleDateString()}</td>
          <td>
            <span class="status-badge status-${main.status.toLowerCase()}">
              ${main.status}
            </span>
          </td>
          <td class="action-buttons">
            ${
              main.status === "Pending"
                ? `
              <button class="approve-btn" onclick="approveLeaveRequest('${main._id}')">
                Approve
              </button>
              <button class="reject-btn" onclick="rejectLeaveRequest('${main._id}')">
                Reject
              </button>
            `
                : ""
            }
            ${
              isMulti
               ? `<button class="expand-breakdown-btn" onclick="toggleBreakdown(this)">Show Breakdown</button>`
                : ""
            }
          </td>
        </tr>
        ${
          isMulti
            ? `
          <tr class="breakdown-row" style="display:none;"><td colspan="9">
            <div class="breakdown-section">
              <strong>Month-wise Breakdown:</strong>
              <ul style="margin:0.5em 0 0 1.5em;">
                ${group._group
                  .map(
                    (seg) => `
                  <li>
                    <b>${new Date(seg.fromDate).toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}:</b>
                    ${seg.leaveCount} day(s) — Paid: ${seg.paidLeaves}, Unpaid: ${seg.unpaidLeaves}
                    <span style="color:#888;font-size:0.95em;">(${new Date(
                      seg.fromDate
                    ).toLocaleDateString()} to ${new Date(seg.toDate).toLocaleDateString()})</span>
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          </td></tr>
        `
            : ""
        }
      `;
      })
      .join("");
  }

  // Add this function globally to handle read more/less toggle
  window.toggleComment = function(commentId, link) {
    const span = document.getElementById(commentId);
    if (!span) return;
    const full = decodeURIComponent(link.getAttribute('data-full'));
    const short = decodeURIComponent(link.getAttribute('data-short'));
    if (link.textContent === 'Read more') {
      span.innerHTML = `${full} <a href="#" class="read-more-link" data-full="${encodeURIComponent(full)}" data-short="${encodeURIComponent(short)}" onclick="toggleComment('${commentId}', this); return false;">Read less</a>`;
    } else {
      span.innerHTML = `${short} <a href="#" class="read-more-link" data-full="${encodeURIComponent(full)}" data-short="${encodeURIComponent(short)}" onclick="toggleComment('${commentId}', this); return false;">Read more</a>`;
    }
  }

  // Function to filter leave requests
  function filterLeaveRequests() {
    const statusFilter = document.getElementById("statusFilter").value;
    const employeeFilter = document.getElementById("employeeFilter").value.toLowerCase();
    const rows = document.querySelectorAll("#leaveRequestsBody tr");

    rows.forEach((row) => {
      if (row.classList.contains("no-data") || row.classList.contains("error")) return;

      const status = row.dataset.status;
      const employeeId = row.cells[0].textContent.toLowerCase();
      const employeeName = row.cells[1].textContent.toLowerCase();

      const statusMatch = statusFilter === "all" || status === statusFilter;
      const employeeMatch =
        !employeeFilter ||
        employeeId.includes(employeeFilter) ||
        employeeName.includes(employeeFilter);

      row.style.display = statusMatch && employeeMatch ? "" : "none";
    });
  }

  function createEmployeeRow(employee) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="employee-info">
          <img src="${
            employee.profileImage
              ? `/api/employees/${employee._id}/profile-image`
              : "images/default-avatar.png"
          }" 
               alt="${employee.firstName}" 
               class="employee-avatar">
          <div>
            <div class="employee-name">${employee.firstName} ${employee.lastName}</div>
            <div class="employee-id">${employee.employeeId}</div>
          </div>
        </div>
      </td>
      <td>${employee.role}</td>
      <td>${employee.mobile}</td>
      <td>${employee.email}</td>
      <td>${new Date(employee.doj).toLocaleDateString()}</td>
      <td>
        <div class="action-buttons">
          <button onclick="editEmployee('${employee._id}')" class="edit-btn">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteEmployee('${employee._id}')" class="delete-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    return row;
  }

  // function loadPaySlipAdmin() {
  //   if (!isAdminRole && !isHRRole) {
  //     alert("Access denied. Only administrators and HR personnel can generate pay slips.");
  //     return;
  //   }

  //   setActive("btn-pay-slip");
  //   mainContent.innerHTML = `
  //     <div class="pay-slip-outer" id="paySlipOuter">
  //       <div class="admin-content-section pay-slip-section" id="pay-slip-admin-section">
  //         <div class="scrollable-form-container">
  //           <div class="pay-slip-container">
  //             <h2>Pay Slip Generation</h2>
  //             <form id="paySlipForm">
  //             <div class="form-group" style="position:relative;">
  //               <label for="paySlipSearchEmployeeName">Search by Name</label>
  //               <input type="text" id="paySlipSearchEmployeeName" placeholder="Type employee name..." autocomplete="off" />
  //               <div id="paySlipNameSearchDropdown"></div>
  //             </div>
  //               <div class="form-group">
  //                 <label for="empId">Employee ID</label>
  //                 <input type="text" id="empId" placeholder="Enter Employee ID" required />
  //               </div>
  //               <div class="form-group">
  //                 <label for="month">Month</label>
  //                 <select id="month" required>
  //                   <option value="">Select Month</option>
  //                   <option value="01">January</option>
  //                   <option value="02">February</option>
  //                   <option value="03">March</option>
  //                   <option value="04">April</option>
  //                   <option value="05">May</option>
  //                   <option value="06">June</option>
  //                   <option value="07">July</option>
  //                   <option value="08">August</option>
  //                   <option value="09">September</option>
  //                   <option value="10">October</option>
  //                   <option value="11">November</option>
  //                   <option value="12">December</option>
  //                 </select>
  //               </div>
  //               <div class="form-group">
  //                 <label for="year">Year</label>
  //                 <input type="number" id="year" placeholder="Enter Year" min="2000" max="2100" required />
  //               </div>
  //               <hr />
  //               <div class="form-group">
  //                 <label for="totalEarningsInput">Total Earnings</label>
  //                 <input type="number" id="totalEarningsInput" placeholder="Enter Total Earnings" required />
  //               </div>
  //               <div class="button-group">
  //                 <button type="button" class="cancel-btn" onclick="clearForm()">Cancel</button>
  //                 <button type="submit" class="generate-btn">Generate Pay Slip</button>
  //                   <button type="submit" class="search-btn" style="width:100%;margin-top:10px;">Search</button>
  //               </div>
  //             </form>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   `;

  //   // Add styles
  //   const style = document.createElement("style");
  //   style.textContent = `
  //     .pay-slip-container {
  //       background: linear-gradient(135deg, #c0b8f0, #dfc8f7);
  //       padding: 30px;
  //       border-radius: 15px;
  //       width: 500px;
  //       margin: 40px auto;
  //       box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  //       color: #333;
  //     }

  //     .pay-slip-container h2 {
  //       font-size: 22px;
  //       margin-bottom: 20px;
  //       color: #000;
  //     }

  //     .form-group {
  //       margin-bottom: 15px;
  //     }

  //     .form-group label {
  //       display: block;
  //       font-weight: 600;
  //       margin-bottom: 5px;
  //     }

  //     .form-group input,
  //     .form-group select {
  //       width: 100%;
  //       padding: 10px 12px;
  //       border: none;
  //       border-radius: 10px;
  //       background: #f4f4fc;
  //       outline: none;
  //       font-size: 15px;
  //     }

  //     hr {
  //       margin: 25px 0;
  //       border: 0;
  //       border-top: 1px solid #b3a9e4;
  //     }

  //     .button-group {
  //       display: flex;
  //       justify-content: space-between;
  //       margin-top: 20px;
  //     }

  //     .cancel-btn,
  //     .generate-btn {
  //       padding: 10px 20px;
  //       font-weight: bold;
  //       border: none;
  //       border-radius: 12px;
  //       cursor: pointer;
  //       font-size: 14px;
  //     }

  //     .cancel-btn {
  //       background-color: #f3eaff;
  //       color: #7a42f4;
  //     }

  //     .generate-btn {
  //       background: linear-gradient(90deg, #6f42c1, #4dd0a9);
  //       color: white;
  //     }

  //     .form-group input[readonly] {
  //       background-color: #e4e4fa;
  //       font-weight: bold;
  //     }
  //   `;
  //   document.head.appendChild(style);

  //   window.clearForm = function () {
  //     document.querySelectorAll("input, select").forEach((el) => (el.value = ""));
  //   };

  //   // Add form submission handler
  //   document.getElementById("paySlipForm").addEventListener("submit", function (e) {
  //     e.preventDefault();

  //     const employeeId = document.getElementById("empId").value.trim();
  //     const month = document.getElementById("month").value.trim();
  //     const year = document.getElementById("year").value.trim();
  //     const totalEarningsRaw = document.getElementById("totalEarningsInput").value.trim();
  //     const totalEarnings = parseFloat(totalEarningsRaw);

  //     // Strict validation
  //     if (!employeeId) {
  //       alert("Employee ID is required.");
  //       return;
  //     }
  //     if (!month || isNaN(Number(month)) || Number(month) < 1 || Number(month) > 12) {
  //       alert("Valid month (1-12) is required.");
  //       return;
  //     }
  //     if (!year || isNaN(Number(year)) || year.length !== 4) {
  //       alert("Valid 4-digit year is required.");
  //       return;
  //     }
  //     if (!totalEarningsRaw || isNaN(totalEarnings) || totalEarnings <= 0) {
  //       alert("Total Earnings must be a positive number.");
  //       return;
  //     }

  //     // Compose preview slip (simulate what backend would do, but don't save)
  //     const slipPreview = {
  //       employeeId,
  //       month,
  //       year,
  //       totalEarnings
  //     };
  //     showPaySlipProceedModal(slipPreview);
  //   });

  //   function showPaySlipProceedModal(formData) {
  //     // Remove any existing modal
  //     const existingModal = document.getElementById('paySlipModal');
  //     if (existingModal) existingModal.remove();
  //     const modalHTML = `
  //       <div id="paySlipModal" class="modal-overlay" style="display:flex;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);z-index:9999;justify-content:center;align-items:center;">
  //         <div class="modal-content" style="background:#fff;border-radius:12px;max-width:500px;width:95vw;max-height:90vh;overflow:auto;box-shadow:0 4px 32px rgba(0,0,0,0.18);padding:2rem 2rem 1.5rem 2rem;position:relative;display:flex;flex-direction:column;align-items:center;">
  //           <h2 style="margin-bottom:1.5rem;color:#764ba2;">Proceed to Pay Slip Preview</h2>
  //           <p style="margin-bottom:2rem;font-size:1.1em;text-align:center;color:chocolate;font-style:oblique;">Are you sure you want to generate the pay slip for <b>${formData.employeeId}</b> for <b>${formData.month}/${formData.year}</b>?</p>
  //           <div style="display:flex;justify-content:flex-end;gap:1rem;width:100%;">
  //             <button id="cancelPaySlipModalBtn" class="cancel-btn" style="padding:10px 28px;font-size:1.1em;">Cancel</button>
  //             <button id="proceedPaySlipModalBtn" class="generate-btn" style="padding:10px 28px;font-size:1.1em;">Proceed</button>
  //           </div>
  //         </div>
  //       </div>
  //     `;
  //     document.body.insertAdjacentHTML('beforeend', modalHTML);
  //     document.getElementById('cancelPaySlipModalBtn').onclick = closePaySlipModal;
  //     document.getElementById('proceedPaySlipModalBtn').onclick = async function() {
  //       closePaySlipModal();
  //       // Fetch/generate pay slip preview from backend (do NOT store in DB)
  //       try {
  //         const response = await fetch("/api/payslip/preview", {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //             Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
  //           },
  //           body: JSON.stringify(formData),
  //         });
  //         const data = await response.json();
  //         if (response.ok && data.success && data.payslip) {
  //           // Step 2: Show pay slip preview modal with editable fields and Save/Cancel
  //           showPaySlipModal(data.payslip, true);
  //         } else {
  //           alert(data.message || "Failed to generate pay slip preview.");
  //         }
  //       } catch (err) {
  //         alert("Error generating pay slip preview.");
  //       }
  //     };
  //       }
  //       // Actually save to backend now
  //       try {
  //         const response = await fetch("/api/payslip/generate", {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //             Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
  //           },
  //           body: JSON.stringify(slipData),
  //         });
  //         let data = {};
  //         try { data = await response.json(); } catch (err) {}
  //         if (response.ok && data.payslip) {
  //           // Re-render modal with full payslip data from backend
  //           closePaySlipModal();
  //           showPaySlipModal(data.payslip, false); // Not preview mode, disables save
  //         } else {
  //           let msg = data.message || "Failed to save pay slip";
  //           if (data.error) msg += `\nDetails: ${data.error}`;
  //           alert(msg);
  //         }
  //       } catch (error) {
  //         alert("An error occurred. Please try again.\n" + (error.message || error));
  //       }
  //     };
  //     // In showPaySlipModal, after rendering, if isPreviewOnly is false, hide the Save button
  //     if (!isPreviewOnly) {
  //       const saveBtn = document.getElementById('savePaySlipModalBtn');
  //       if (saveBtn) saveBtn.style.display = 'none';
  //     }
  //     document.getElementById('cancelPaySlipModalBtn').onclick = closePaySlipModal;
  //   }
  //   function closePaySlipModal() {
  //     const modal = document.getElementById('paySlipModal');
  //     if (modal) modal.remove();
  //   }

  //   setLogoutListener();
  //   injectProfileSidebar();
  // }

  function loadPaySlipAdmin() {
  if (!isAdminRole && !isHRRole) {
    alert("Access denied. Only administrators and HR personnel can generate pay slips.");
    return;
}
  setActive("btn-pay-slip");
  mainContent.innerHTML = `
    <div class="pay-slip-outer" id="paySlipOuter">
      <div class="admin-content-section pay-slip-section" id="pay-slip-admin-section">
        <div class="scrollable-form-container">
          <div class="pay-slip-container">
            <h2>Pay Slip Generation</h2>
            <form id="paySlipForm" autocomplete="off">
              <div class="form-group" style="position:relative;">
                <label for="paySlipSearchEmployeeName">Search by Name</label>
                <input type="text" id="paySlipSearchEmployeeName" placeholder="Type employee name..." autocomplete="off" />
                <div id="paySlipNameSearchDropdown"></div>
              </div>
              <div class="form-group">
                <label for="empId">Employee ID</label>
                <input type="text" id="empId" placeholder="Enter Employee ID" required />
              </div>
              <div class="form-group">
                <label for="month">Month</label>
                <select id="month" required>
                  <option value="">Select Month</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              <div class="form-group">
                <label for="year">Year</label>
                <input type="number" id="year" placeholder="Enter Year" min="2000" max="2100" required />
              </div>
              <hr />
              <div class="form-group">
                <label for="totalEarningsInput">Total Earnings</label>
                <input type="number" id="totalEarningsInput" placeholder="Enter Total Earnings" required />
              </div>
              <div class="button-group">
                <button type="button" class="cancel-btn" onclick="clearForm()">Cancel</button>
                <button type="submit" class="generate-btn">Generate Pay Slip</button>
                <button type="button" id="searchPaySlipBtn" class="search-btn" style="width:100%;margin-top:10px;">Search</button>
              </div>
            </form>
            <div id="paySlipAdminResult" style="margin-top:2rem;display:none;"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add styles (same as before)
  const style = document.createElement("style");
  style.textContent = `
    .pay-slip-container {
      background: linear-gradient(135deg, #c0b8f0, #dfc8f7);
      padding: 30px;
      border-radius: 15px;
      width: 500px;
      margin: 40px auto;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
      color: #333;
    }
    .pay-slip-container h2 {
      font-size: 22px;
      margin-bottom: 20px;
      color: #000;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 10px 12px;
      border: none;
      border-radius: 10px;
      background: #f4f4fc;
      outline: none;
      font-size: 15px;
    }
    hr {
      margin: 25px 0;
      border: 0;
      border-top: 1px solid #b3a9e4;
    }
    .button-group {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
    .cancel-btn,
    .generate-btn {
      padding: 10px 20px;
      font-weight: bold;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-size: 14px;
    }
    .cancel-btn {
      background-color: #f3eaff;
      color: #7a42f4;
    }
    .generate-btn {
      background: linear-gradient(90deg, #6f42c1, #4dd0a9);
      color: white;
    }
    .form-group input[readonly] {
      background-color: #e4e4fa;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);

  window.clearForm = function () {
    document.querySelectorAll("input, select").forEach((el) => (el.value = ""));
  };

    const totalEarningsInput = document.getElementById('totalEarnings');
  const totalDeductionsInput = document.getElementById('totalDeductions');
  const netPayInput = document.getElementById('netPay');

  function updateNetPay() {
    const earnings = parseFloat(totalEarningsInput.value) || 0;
    const deductions = parseFloat(totalDeductionsInput.value) || 0;
    const netPay = earnings - deductions;
    netPayInput.value = netPay.toFixed(2);
  }

  if (totalDeductionsInput) {
    totalDeductionsInput.addEventListener('input', updateNetPay);
  }
  if (totalEarningsInput) {
    totalEarningsInput.addEventListener('input', updateNetPay);
  }
  // --- Search by Name Autocomplete ---
  (function attachPaySlipNameSearch() {
    const nameInput = document.getElementById("paySlipSearchEmployeeName");
    const idInput = document.getElementById("empId");
    const dropdown = document.getElementById("paySlipNameSearchDropdown");
    if (!nameInput || !idInput || !dropdown) return;

    let searchCache = [];
    async function fetchEmployeesForSearch() {
      if (searchCache.length > 0) return;
      try {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch("/api/employees", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.employees)) {
          searchCache = data.employees.map(e => ({
            id: e.employeeId,
            name: `${e.firstName || ''} ${e.lastName || ''}`.trim()
          }));
        }
      } catch (err) {}
    }
    nameInput.addEventListener("focus", fetchEmployeesForSearch);
    nameInput.addEventListener("keyup", function () {
      const term = nameInput.value.toLowerCase().trim();
      if (!term) {
        dropdown.innerHTML = "";
        return;
      }
      const filtered = searchCache.filter(e =>
        e.name.toLowerCase().includes(term)
      );
      dropdown.innerHTML = filtered
        .map(
          (e) => `
            <div data-id="${e.id}" data-name="${e.name}" style="padding:6px 12px;cursor:pointer;">
              <span style="color:#a020f0;font-weight:600;">${e.name}</span>
              <span style="color:#222;font-weight:bold;"> (${e.id})</span>
            </div>
          `
        )
        .join("");
    });
    dropdown.addEventListener("click", function (e) {
      const targetDiv = e.target.closest('div[data-id]');
      if (targetDiv) {
        nameInput.value = targetDiv.dataset.name;
        idInput.value = targetDiv.dataset.id;
        dropdown.innerHTML = "";
      }
    });
    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target) && e.target !== nameInput) {
        dropdown.innerHTML = "";
      }
    });
  })();

  // --- Search Button Handler ---
  document.getElementById("searchPaySlipBtn").addEventListener("click", async function (e) {
    e.preventDefault();
    const empId = document.getElementById("empId").value.trim();
    let month = document.getElementById("month").value.trim();
    let year = document.getElementById("year").value.trim();
    const resultDiv = document.getElementById("paySlipAdminResult");

    if (!empId) {
      resultDiv.style.display = "block";
      resultDiv.innerHTML = `<div class='error' style='color:#dc3545;font-weight:bold;'>Please select an employee from the dropdown or enter Employee ID.</div>`;
      return;
    }
    if (month) month = parseInt(month, 10);
    if (year) year = parseInt(year, 10);

    let url = `/api/payslip?employeeId=${encodeURIComponent(empId)}`;
    if (month) url += `&month=${encodeURIComponent(month)}`;
    if (year) url += `&year=${encodeURIComponent(year)}`;

    resultDiv.style.display = "block";
    resultDiv.innerHTML = '<div class="loading">Loading pay slip...</div>';

    try {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data && data.employeeId) {
        let slip = data;
        // Remove any existing modal
        const existingModal = document.getElementById('paySlipModal');
        if (existingModal) existingModal.remove();

        const paySlipModalHTML = `
          <div id="paySlipModal" class="modal-overlay" style="display:flex;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);z-index:9999;justify-content:center;align-items:center;">
            <div class="modal-content" style="background:#fff;border-radius:12px;max-width:900px;width:98vw;max-height:95vh;overflow:auto;box-shadow:0 4px 32px rgba(0,0,0,0.18);padding:0;position:relative;">
              <div id="paySlipPreviewContainer">${renderPaySlipHTML(slip)}</div>
              <div style="display:flex;justify-content:flex-end;gap:1rem;padding:18px 32px 18px 0;background:#faf9fd;border-top:1px solid #eee;">
                <button id="clearPaySlipViewBtn" class="cancel-btn" style="padding:10px 28px;font-size:1.1em;">Clear</button>
                <button class="search-btn" id="sendPaySlipViewBtn">Send</button>
              </div>
              <div id="paySlipSendStatus" style="margin-top:1rem;"></div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', paySlipModalHTML);

        document.getElementById("clearPaySlipViewBtn").onclick = function() {
          const modal = document.getElementById('paySlipModal');
          if (modal) modal.remove();
        };

        document.getElementById("sendPaySlipViewBtn").onclick = async function() {
          const statusDiv = document.getElementById("paySlipSendStatus");
          statusDiv.innerHTML = '<span style="color:#764ba2;font-weight:bold;">Sending pay slip notification...</span>';
          try {
            const token = localStorage.getItem("jwtToken");
            if (!empId || !month || !year) {
              statusDiv.innerHTML = `<span style='color:#dc3545;font-weight:bold;'>Error sending pay slip notification: employeeId, month, and year are required.</span>`;
              return;
            }
            const res = await fetch(`/api/payslip/send-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                employeeId: empId,
                month: month,
                year: year,
                message: "Your pay slip has been generated. Now click the download to generate the pay slip. Thank You."
              })
            });
            const data = await res.json();
            if (res.ok) {
              statusDiv.innerHTML = '<span style="color:#28a745;font-weight:bold;">Pay slip notification sent successfully.</span>';
            } else {
              statusDiv.innerHTML = `<span style="color:#dc3545;font-weight:bold;">Error sending pay slip notification: ${data.message}</span>`;
            }
          } catch (err) {
            statusDiv.innerHTML = '<span style="color:#dc3545;font-weight:bold;">An error occurred while sending the notification.</span>';
          }
        };

      } else {
        resultDiv.innerHTML = `<div class='error'>${data.error || 'Pay slip not found.'}</div>`;
      }
    } catch (err) {
      resultDiv.innerHTML = '<div class="error">An error occurred. Please try again.</div>';
    }
  });

  // --- Generate Pay Slip Handler (existing functionality) ---
  document.getElementById("paySlipForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const employeeId = document.getElementById("empId").value.trim();
    const month = document.getElementById("month").value.trim();
    const year = document.getElementById("year").value.trim();
    const totalEarningsRaw = document.getElementById("totalEarningsInput").value.trim();
    const totalEarnings = parseFloat(totalEarningsRaw);

    // Strict validation
    if (!employeeId) {
      alert("Employee ID is required.");
      return;
    }
    if (!month || isNaN(Number(month)) || Number(month) < 1 || Number(month) > 12) {
      alert("Valid month (1-12) is required.");
      return;
    }
    if (!year || isNaN(Number(year)) || year.length !== 4) {
      alert("Valid 4-digit year is required.");
      return;
    }
    if (!totalEarningsRaw || isNaN(totalEarnings) || totalEarnings <= 0) {
      alert("Total Earnings must be a positive number.");
      return;
    }

    // Compose preview slip (simulate what backend would do, but don't save)
    const slipPreview = {
      employeeId,
      month,
      year,
      totalEarnings
    };
    showPaySlipProceedModal(slipPreview);
  });

  // --- Modal functions (existing) ---
  function showPaySlipProceedModal(formData) {
    // ... (keep your existing modal code here)
    // unchanged from your current implementation
    const existingModal = document.getElementById('paySlipModal');
      if (existingModal) existingModal.remove();
      const modalHTML = `
        <div id="paySlipModal" class="modal-overlay" style="display:flex;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);z-index:9999;justify-content:center;align-items:center;">
          <div class="modal-content" style="background:#fff;border-radius:12px;max-width:500px;width:95vw;max-height:90vh;overflow:auto;box-shadow:0 4px 32px rgba(0,0,0,0.18);padding:2rem 2rem 1.5rem 2rem;position:relative;display:flex;flex-direction:column;align-items:center;">
            <h2 style="margin-bottom:1.5rem;color:#764ba2;">Proceed to Pay Slip Preview</h2>
            <p style="margin-bottom:2rem;font-size:1.1em;text-align:center;color:chocolate;font-style:oblique;">Are you sure you want to generate the pay slip for <b>${formData.employeeId}</b> for <b>${formData.month}/${formData.year}</b>?</p>
            <div style="display:flex;justify-content:flex-end;gap:1rem;width:100%;">
              <button id="cancelPaySlipModalBtn" class="cancel-btn" style="padding:10px 28px;font-size:1.1em;">Cancel</button>
              <button id="proceedPaySlipModalBtn" class="generate-btn" style="padding:10px 28px;font-size:1.1em;">Proceed</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      document.getElementById('cancelPaySlipModalBtn').onclick = closePaySlipModal;
      document.getElementById('proceedPaySlipModalBtn').onclick = async function() {
        closePaySlipModal();
        // Fetch/generate pay slip preview from backend (do NOT store in DB)
        try {
          const response = await fetch("/api/payslip/preview", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            },
            body: JSON.stringify(formData),
          });
          const data = await response.json();
          if (response.ok && data.success && data.payslip) {
            // Step 2: Show pay slip preview modal with editable fields and Save/Cancel
            showPaySlipModal(data.payslip, true);
          } else {
            alert(data.message || "Failed to generate pay slip preview.");
          }
        } catch (err) {
          alert("Error generating pay slip preview.");
        }
      };
  }
  function showPaySlipModal(slipData, isPreviewOnly) {
    // ... (keep your existing modal code here)
    // unchanged from your current implementation
    const existingModal = document.getElementById('paySlipModal');
      if (existingModal) existingModal.remove();
    const paySlipModalHTML = `
        <div id="paySlipModal" class="modal-overlay" style="display:flex;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);z-index:9999;justify-content:center;align-items:center;">
        <div class="modal-content" style="background:#fff;border-radius:12px;max-width:900px;width:98vw;max-height:95vh;overflow:auto;box-shadow:0 4px 32px rgba(0,0,0,0.18);padding:0;position:relative;">
          <div id="paySlipPreviewContainer"></div>
          <div style="display:flex;justify-content:flex-end;gap:1rem;padding:18px 32px 18px 0;background:#faf9fd;border-top:1px solid #eee;">
            <button id="cancelPaySlipModalBtn" class="cancel-btn" style="padding:10px 28px;font-size:1.1em;">Cancel</button>
            <button id="savePaySlipModalBtn" class="generate-btn" style="padding:10px 28px;font-size:1.1em;">Save</button>
            ${slipData.slipId ? `<a href="/api/payslip/download/${slipData.slipId}" target="_blank" class="download-btn" style="padding:10px 28px;font-size:1.1em;background:#43cea2;color:#fff;border:none;border-radius:6px;text-decoration:none;">Download PDF</a>` : ''}
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', paySlipModalHTML);
      // Render the pay slip preview using slipData
      const container = document.getElementById('paySlipPreviewContainer');
      if (!container) return;
      container.innerHTML = renderPaySlipHTML(slipData, isPreviewOnly);
      if (isPreviewOnly) {
  const totalEarnings = slipData.totalEarnings || (slipData.earnings && slipData.earnings.totalEarnings) || 0;
  const totalDedInput = document.getElementById('editTotalDeductions');
  const netPayInput = document.getElementById('editNetPay');
  function updateNetPayField() {
    const deductions = parseFloat(totalDedInput.value) || 0;
    const netPay = parseFloat(totalEarnings) - deductions;
    if (netPayInput) netPayInput.value = netPay.toFixed(2);
  }
  if (totalDedInput && netPayInput) {
    totalDedInput.addEventListener('input', updateNetPayField);
    // Optionally, update once on load
    updateNetPayField();
  }
}
      // Add swipe/scroll hint for mobile
      if (window.innerWidth <= 600) {
        const hint = document.createElement('div');
        hint.className = 'swipe-hint';
        hint.innerHTML = '<span class="swipe-icon"></span> Swipe to see full pay slip';
        container.parentNode.appendChild(hint);
      }
      // Attach save handler only if not already attached
      const saveBtn = document.getElementById('savePaySlipModalBtn');
      saveBtn.onclick = async function() {
        // Before sending, update slipData with edited values
        if (isPreviewOnly) {
          const totalDedInput = document.getElementById('editTotalDeductions');
          const netPayInput = document.getElementById('editNetPay');
          if (totalDedInput && !isNaN(+totalDedInput.value)) {
            slipData.deductions = slipData.deductions || {};
            slipData.deductions.totalDeductions = +totalDedInput.value;
          }
          if (netPayInput && !isNaN(+netPayInput.value)) {
            slipData.netPay = +netPayInput.value;
          }
        }
        // Now send slipData to backend as before
        if (!isPreviewOnly) {
          closePaySlipModal();
          alert('Pay Slip saved successfully!');
          clearForm();
          return;
        }
        // Actually save to backend now
        try {
          const response = await fetch("/api/payslip/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            },
            body: JSON.stringify(slipData),
          });
          let data = {};
          try { data = await response.json(); } catch (err) {}
          if (response.ok && data.payslip) {
            // Re-render modal with full payslip data from backend
            closePaySlipModal();
            showPaySlipModal(data.payslip, false); // Not preview mode, disables save
          } else {
            let msg = data.message || "Failed to save pay slip";
            if (data.error) msg += `\nDetails: ${data.error}`;
            alert(msg);
          }
        } catch (error) {
          alert("An error occurred. Please try again.\n" + (error.message || error));
        }
      };
      // In showPaySlipModal, after rendering, if isPreviewOnly is false, hide the Save button
      if (!isPreviewOnly) {
        const saveBtn = document.getElementById('savePaySlipModalBtn');
        if (saveBtn) saveBtn.style.display = 'none';
      }
      document.getElementById('cancelPaySlipModalBtn').onclick = closePaySlipModal;
  }
  function closePaySlipModal() {
    const modal = document.getElementById('paySlipModal');
    if (modal) modal.remove();
  }

  setLogoutListener();
  injectProfileSidebar();
}
  async function loadAttendance() {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      window.location.href = "/login.html";
      return;
    }

    try {
      // Get user role from token
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userRole = payload.role;
      const employee = JSON.parse(localStorage.getItem("employee"));
      // Allow all roles to access attendance section
      // No role restriction needed as all employees should be able to mark attendance

      mainContent.innerHTML = `
            <div class="attendance-container scrollable-form-container">
                <h2>My Attendance</h2>
                <div class="timestamp-box" id="timestamp"></div>
                <div class="attendance-form">
                    <!-- Check-In -->
                    <div class="form-section">
                        <h3>Log-In</h3>
                        <input type="text" id="checkinTime" placeholder="Click to record" readonly />
                        <button id="checkinBtn">Submit Log-In</button>
                    </div>
                    <!-- Check-Out -->
                    <div class="form-section">
                        <h3>Log-Out</h3>
                        <input type="text" id="checkoutTime" placeholder="Click to record" readonly />
                        <button id="checkoutBtn">Submit Log-Out</button>
                    </div>
                </div>
                <div style="margin: 1rem 0; text-align: right;">
                  <span id="lateCountDisplay" style="font-weight:bold;color:#ffeb3b;"></span>
                </div>
                <div style="text-align:center;">
                  <button id="finalSubmitBtn" style="display:none;min-width:160px;padding:10px 24px;font-size:1rem;border-radius:10px;background:linear-gradient(90deg,#764ba2,#43cea2);color:#fff;font-weight:bold;border:none;cursor:pointer;">Submit</button>
                </div>
                <!-- Attendance Table -->
                <table class="attendance-table" id="attendanceTable">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Log-In</th>
                            <th>Log-Out</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="attendanceBody">
                        <!-- Rows will be added dynamically -->
                    </tbody>
                </table>
            </div>
        `;

      // Add styles for the attendance section
      const style = document.createElement("style");
      style.textContent = `
            .attendance-container {
                background: linear-gradient(135deg, #b79df5, #d3b4f9);
                padding: 30px;
                border-radius: 15px;
                width: 90%;
                max-width: 950px;
                margin: 40px auto;
                box-shadow: 0 0 20px rgba(0,0,0,0.2);
            }

            .attendance-form {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                justify-content: center;
                margin-bottom: 40px;
            }

            .form-section {
                background: rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 15px;
                flex: 1 1 300px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .form-section h3 {
                margin-bottom: 15px;
                font-size: 18px;
                color: #fff;
            }

            .form-section input[type="text"] {
                padding: 10px 15px;
                border: none;
                border-radius: 10px;
                width: 100%;
                font-size: 15px;
                background: #e8dbff;
                color: #333;
                margin-bottom: 15px;
                text-align: center;
            }

            .form-section button {
                background: linear-gradient(to right, #8c6ce7, #4fd1c5);
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                cursor: pointer;
                transition: 0.3s ease;
                width: 100%;
            }

            .form-section button:hover {
                opacity: 0.9;
            }

            .timestamp-box {
                text-align: center;
                margin-bottom: 25px;
                font-size: 16px;
                font-weight: bold;
                color: #fff;
            }

            .attendance-table {
                width: 100%;
                border-collapse: collapse;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                overflow: hidden;
            }

            .attendance-table th,
            .attendance-table td {
                padding: 14px 16px;
                text-align: center;
                font-size: 15px;
                color: #fff;
            }

            .attendance-table thead {
                background-color: rgba(100, 65, 165, 0.8);
            }

            .attendance-table tbody tr:nth-child(even) {
                background-color: rgba(255, 255, 255, 0.1);
            }

            .attendance-table tbody tr:hover {
                background-color: rgba(255, 255, 255, 0.2);
                transition: 0.3s;
            }

            @media screen and (max-width: 768px) {
                .attendance-form {
                    flex-direction: column;
                }
            }

            @media screen and (max-width: 600px) {
                .attendance-table thead {
                    display: none;
                }

                .attendance-table,
                .attendance-table tbody,
                .attendance-table tr,
                .attendance-table td {
                    display: block;
                    width: 100%;
                }

                .attendance-table tr {
                    margin-bottom: 15px;
                    border-radius: 10px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.1);
                }

                .attendance-table td {
                    text-align: right;
                    position: relative;
                    padding-left: 50%;
                }

                .attendance-table td::before {
                    content: attr(data-label);
                    position: absolute;
                    left: 15px;
                    width: 45%;
                    text-align: left;
                    font-weight: bold;
                }
            }
        `;
      document.head.appendChild(style);

      // Initialize attendance functionality
      let checkInRecorded = false;
      let checkOutRecorded = false;
      let checkInTime = "";
      let checkOutTime = "";
      let lateEntry = false;
      let lateCount = 0;
      const checkinInput = document.getElementById("checkinTime");
      const checkoutInput = document.getElementById("checkoutTime");
      const checkinBtn = document.getElementById("checkinBtn");
      const checkoutBtn = document.getElementById("checkoutBtn");
      const finalSubmitBtn = document.getElementById("finalSubmitBtn");
      const lateCountDisplay = document.getElementById("lateCountDisplay");

      // Helper to get current time in HH:mm format
      function getCurrentTime24() {
        const now = new Date();
        return now.toTimeString().slice(0, 5);
      }
      function getCurrentTime12() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      function getCurrentDateISO() {
        const now = new Date();
        // IST is UTC+5:30, so add 5.5 hours in ms
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffset);
        return istNow.toISOString().slice(0, 10);
      }

      // --- Button logic ---
      checkinBtn.onclick = async function () {
        console.log('Check-in button clicked!'); // Debug log
        // Allow check-in even if there's an existing value - let the backend handle duplicates
        const time24 = getCurrentTime24();
        const time12 = getCurrentTime12();
        // Only set the input value if this is a fresh check-in (not a duplicate)
        // The backend will tell us if it's a duplicate
        // Send check-in to backend
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employeeId: employee.employeeId,
            employeeName: employee.firstName + ' ' + (employee.lastName || ''),
            date: getCurrentDateISO(),
            checkIn: time24
          }),
        });
        let data = {};
        try {
          data = await res.json();
        } catch (e) {
          data = {};
        }
        console.log('Check-in response:', data, 'Status:', res.status, 'res.ok:', res.ok);
        
        // Debug: Check all conditions
        const condition1 = !res.ok && data && data.error === 'ALREADY_LOGGED_IN';
        const condition2 = data && data.success === false && data.message && data.message.toLowerCase().includes('already logged in');
        console.log('Condition 1 (400 + ALREADY_LOGGED_IN):', condition1);
        console.log('Condition 2 (success false + message):', condition2);
        
        if (condition1 || condition2) {
          console.log('Showing alert for duplicate check-in');
          alert("You can't check-in again until 12:00 AM.");
          checkinInput.value = "";
          
          // Refresh timestamp after a few seconds
          setTimeout(() => {
            updateTimestamp(); // Refresh timestamp box
          }, 1000);
          return;
        }
        
        // If we reach here, check-in was successful
        checkinInput.value = time12; // Set the input value only after successful check-in
        // Enable checkout
        checkoutBtn.disabled = false;
        checkoutInput.disabled = false;
        // Fetch today's attendance from backend to ensure latest data
        await fetchTodayAttendance();
        await loadAttendanceTable();
        
        // Clear check-in input and refresh timestamp after a few seconds
        setTimeout(() => {
          checkinInput.value = '';
          updateTimestamp(); // Refresh timestamp box
        }, 3000); // Clear after 3 seconds
        // Show late count and clear after 10 seconds
        lateCountDisplay.textContent = `Late Count (This Month): ${data.lateCount || 0}`;
        let elCountSpan = document.getElementById("earlyCheckoutCountDisplay");
        if (!elCountSpan) {
          elCountSpan = document.createElement("span");
          elCountSpan.id = "earlyCheckoutCountDisplay";
          elCountSpan.style = "font-weight:bold;color:#ff9800;margin-left:1.5rem;";
          lateCountDisplay.parentNode.appendChild(elCountSpan);
        }
        elCountSpan.textContent = '';
        if (typeof data.earlyCheckoutCount !== 'undefined') {
          elCountSpan.textContent = `Early Logout (This Month): ${data.earlyCheckoutCount || 0}`;
        }
        setTimeout(() => {
          lateCountDisplay.textContent = '';
          if (elCountSpan) elCountSpan.textContent = '';
        }, 10000);
        // Show success alert
        alert("You have successfully logged in.");
      };

      checkoutBtn.onclick = async function () {
        console.log('Check-out button clicked!'); // Debug log
        // Allow check-out even if there's an existing value - let the backend handle duplicates
        const time24 = getCurrentTime24();
        const time12 = getCurrentTime12();
        // Don't set checkoutInput.value immediately - wait for backend response
        // Send check-out to backend
        let data = {};
        try {
        const res = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employeeId: employee.employeeId,
            employeeName: employee.firstName + ' ' + (employee.lastName || ''),
            date: getCurrentDateISO(),
            checkOut: time24
          }),
        });
          data = await res.json();
          console.log('Check-out response:', data);
          if (!res.ok || (data && data.success === false)) {
            let msg = (data && data.message) ? data.message : 'Check-out failed. Please try again.';
            alert(msg);
            checkoutInput.value = '';
            updateTimestamp(); // Refresh timestamp box on error
            return; // Don't proceed further on error
          } else {
            // If we reach here, check-out was successful
            checkoutInput.value = time12; // Set the input value only after successful check-out
            // Show late and early checkout counts and clear after 10 seconds
        lateCountDisplay.textContent = `Late Count (This Month): ${data.lateCount || 0}`;
        let elCountSpan = document.getElementById("earlyCheckoutCountDisplay");
        if (!elCountSpan) {
          elCountSpan = document.createElement("span");
          elCountSpan.id = "earlyCheckoutCountDisplay";
          elCountSpan.style = "font-weight:bold;color:#ff9800;margin-left:1.5rem;";
          lateCountDisplay.parentNode.appendChild(elCountSpan);
        }
        elCountSpan.textContent = `Early Logout (This Month): ${data.earlyCheckoutCount || 0}`;
            setTimeout(() => {
              lateCountDisplay.textContent = '';
              if (elCountSpan) elCountSpan.textContent = '';
            }, 10000);
            // Show success alert
            alert("You have successfully logged out.");
            
            // Clear check-out input and refresh timestamp after a few seconds
            setTimeout(() => {
              checkoutInput.value = '';
              updateTimestamp(); // Refresh timestamp box
            }, 3000); // Clear after 3 seconds
            
            // Disable check-out button after successful check-out
            checkoutBtn.disabled = true;
            checkoutInput.disabled = true;
          }
        } catch (err) {
          alert('Check-out failed due to a network or server error.');
          checkoutInput.value = '';
          updateTimestamp(); // Refresh timestamp box on error
        } finally {
          // Always update UI after attempt
          await fetchTodayAttendance();
          await loadAttendanceTable();
        }
      };

      // Remove finalSubmitBtn and localStorage logic for attendance
      finalSubmitBtn.style.display = 'none';

      // On section load, fetch today's attendance and update UI
      async function fetchTodayAttendance() {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        const res = await fetch(`/api/attendance-summary?employeeId=${employee.employeeId}&month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.days) {
          const todayISO = getCurrentDateISO();
          const todayData = data.days.find(day => day.date === todayISO);
          if (todayData) {
            let checkInDisplay = todayData.checkIn ? todayData.checkIn + (todayData.lateEntry ? ' (L)' : '') : '-';
            let checkOutDisplay = todayData.checkOut ? todayData.checkOut + (todayData.earlyCheckout ? ' (EC)' : '') : '-';
            addOrUpdateTodayRow({
              date: todayISO,
              checkIn: checkInDisplay,
              checkOut: checkOutDisplay,
              status: todayData.attendanceStatus,
            });
            if (todayData.checkIn) {
              // Don't set the checkinInput value here - let it remain empty for fresh check-in
              // Only enable the checkout button if check-in exists AND no check-out yet
              if (!todayData.checkOut) {
                checkoutBtn.disabled = false;
                checkoutInput.disabled = false;
              } else {
                // If already checked out, disable check-out button
                checkoutBtn.disabled = true;
                checkoutInput.disabled = true;
              }
            } else {
              checkinInput.value = '';
              checkoutBtn.disabled = true;
              checkoutInput.disabled = true;
            }
            if (todayData.checkOut) {
              checkoutInput.value = todayData.checkOut + (todayData.earlyCheckout ? ' (EC)' : '');
              // Disable check-out button if already checked out
              checkoutBtn.disabled = true;
              checkoutInput.disabled = true;
            }
            // Do NOT show late/early counts here, only after check-in/check-out
          } else {
            // No attendance for today, disable checkout
            checkinInput.value = '';
            checkoutInput.value = '';
            checkoutBtn.disabled = true;
            checkoutInput.disabled = true;
          }
        }
      }
      fetchTodayAttendance();

      // --- Table logic ---
      function addOrUpdateTodayRow({ date, checkIn, checkOut, status }) {
        let row = document.getElementById("todayRow");
        if (!row) {
          row = document.createElement("tr");
          row.id = "todayRow";
          document.getElementById("attendanceBody").prepend(row);
        }
        row.innerHTML = `
            <td data-label="Date">${date}</td>
            <td data-label="Check-In">${checkIn}</td>
            <td data-label="Check-Out">${checkOut}</td>
            <td data-label="Status">${status}</td>
          `;
      }

      async function loadAttendanceTable() {
        // Fetch this month's attendance
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        const res = await fetch(
          `/api/attendance-summary?employeeId=${employee.employeeId}&month=${month}&year=${year}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        const tbody = document.getElementById("attendanceBody");
        tbody.innerHTML = "";
        if (data.success && data.days) {
          data.days.forEach((day) => {
            // Parse check-in/check-out as IST
            let checkInDisplay = "-";
            let checkOutDisplay = "-";
            if (day.checkIn) {
              // Compose ISO string for the day in IST
              const checkInDate = new Date(day.date + 'T' + day.checkIn);
              checkInDisplay = checkInDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
              if (day.lateEntry) checkInDisplay += " (L)";
            }
            if (day.checkOut) {
              const checkOutDate = new Date(day.date + 'T' + day.checkOut);
              checkOutDisplay = checkOutDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
              if (day.earlyCheckout) checkOutDisplay += " (EC)";
            }
            tbody.innerHTML += `
                <tr>
                  <td data-label="Date">${day.date}</td>
                  <td data-label="Log-In">${checkInDisplay}</td>
                  <td data-label="Log-Out">${checkOutDisplay}</td>
                  <td data-label="Status">${day.attendanceStatus}</td>
                </tr>
              `;
          });
        }
      }

      // Initial table load
      loadAttendanceTable();

      // Timestamp
      function updateTimestamp() {
        const now = new Date();
        const options = { weekday: "long", year: "numeric", month: "short", day: "numeric" };
        const dateStr = now.toLocaleDateString(undefined, options);
        const timeStr = now.toLocaleTimeString();
        const ts = document.getElementById("timestamp");
        if (ts) ts.innerText = `Today: ${dateStr}, ${timeStr}`;
      }
      updateTimestamp();
      setInterval(updateTimestamp, 1000);

      injectProfileSidebar();
    } catch (error) {
      console.error("Error loading attendance:", error);
      mainContent.innerHTML = `
            <div class="error-message">
                <h2>Error</h2>
                <p>Failed to load attendance section. Please try again later.</p>
            </div>
        `;
    }
  }
});

const hamburger = document.getElementById("hamburgerToggle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

if (hamburger && sidebar && sidebarOverlay) {
  hamburger.addEventListener("click", () => {
    sidebar.classList.toggle("show");
    sidebarOverlay.classList.toggle("active");
  });
  sidebarOverlay.addEventListener("click", () => {
    sidebar.classList.remove("show");
    sidebarOverlay.classList.remove("active");
  });
  // Close sidebar on any sidebar button click (mobile only)
  sidebar.querySelectorAll(".sidebar-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("show");
        sidebarOverlay.classList.remove("active");
      }
    });
  });
}

async function fetchWordCounts(employeeId, month, year) {
  const token = localStorage.getItem("jwtToken");
  const res = await fetch(`/api/word-count?employeeId=${employeeId}&month=${month}&year=${year}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.success ? data.wordCounts : [];
}
async function fetchTodayWordCount(employeeId) {
  // Use IST date for today
  const now = new Date();
  const istOffset = 330;
  const istTime = new Date(now.getTime() + (istOffset * 60 * 1000));
  const istDateString = istTime.toISOString().slice(0, 10);
  const token = localStorage.getItem("jwtToken");
  const res = await fetch(`/api/word-count?employeeId=${employeeId}&month=${istTime.getMonth() + 1}&year=${istTime.getFullYear()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.success && Array.isArray(data.wordCounts)) {
    // Patch: Convert each entry's UTC date to IST before comparing
    const todayEntry = data.wordCounts.find(wc => {
      if (!wc.date) return false;
      const d = new Date(wc.date);
      const IST_OFFSET = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(d.getTime() + IST_OFFSET);
      const wcISTDateString = istDate.toISOString().slice(0, 10);
      return wcISTDateString === istDateString;
    });
    return todayEntry ? todayEntry.wordCount : 0;
  }
  return 0;
}
async function fetchMonthTotalWordCount(employeeId, month, year) {
  const wordCounts = await fetchWordCounts(employeeId, month, year);
  return wordCounts.reduce((sum, wc) => sum + (wc.wordCount || 0), 0);
}
async function loadDashboard() {
  setActive("btn-dashboard");
  const employee = JSON.parse(localStorage.getItem("employee"));
  // If admin/HR, show separate admin dashboard and exit
  if (isAdminRole || isHRRole) {
    await loadAdminDashboard();
    return;
  }
  // --- Month/Year selector logic ---
  const today = new Date();
  let selectedMonth = today.getMonth() + 1;
  let selectedYear = today.getFullYear();
  // Helper to pad month
  const pad = (n) => (n < 10 ? "0" + n : n);
  // Month options
  const monthOptions = Array.from(
    { length: 12 },
    (_, i) =>
      `<option value="${pad(i + 1)}" ${i + 1 === selectedMonth ? "selected" : ""}>${new Date(
        0,
        i
      ).toLocaleString("en-IN", { month: "long" })}</option>`
  ).join("");
  // Year options (last 5 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = today.getFullYear() - i;
    return `<option value="${y}" ${y === selectedYear ? "selected" : ""}>${y}</option>`;
  }).join("");

  // Check if user should see word count sections
  const showWordCount = isRegularEmployee; // Only regular employees see word count
  const isTeamLeader = employee.role === "team_leader";

  mainContent.innerHTML = `
      <div class="my-dashboard-modern dashboard-main-section" id="dashboardMainSection">
        <div class="my-dashboard-header">
          <h2>Welcome, <span class="my-dashboard-empname">${employee.firstName} 👋</span></h2>
          <div class="my-dashboard-role">${employee.role}</div>
        </div>
        <div class="my-dashboard-month-selector">
          <label for="myDashboardMonth">Month:</label>
          <select id="myDashboardMonth">${monthOptions}</select>
          <label for="myDashboardYear">Year:</label>
          <select id="myDashboardYear">${yearOptions}</select>
        </div>
        <div class="my-dashboard-summary-cards">
          <div class="my-dashboard-summary-card" id="attendanceCountCard"><div class="count">-</div><div>Attendance</div></div>
          <div class="my-dashboard-summary-card" id="paidLeavesCard"><div class="count">-</div><div>Paid Leaves</div></div>
          <div class="my-dashboard-summary-card" id="unpaidLeavesCard"><div class="count">-</div><div>Unpaid Leaves</div></div>
        </div>
        ${showWordCount ? `
        <div class="my-dashboard-cards" style="display:flex;gap:2rem;align-items:stretch;">
          <div class="my-dashboard-card" style="flex:1;min-width:240px;max-width:370px;">
            <canvas id="performanceChart"></canvas>
            <div class="my-dashboard-card-title">Performance Tracker (Word Count)</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:1.2rem;justify-content:center;min-width:180px;max-width:220px;">
            <div class="my-dashboard-summary-card" id="todayWordCountCard"><div class="count">-</div><div>Today's Word Count</div></div>
            <div class="my-dashboard-summary-card" id="monthWordCountCard"><div class="count">-</div><div>Overall Word Count (Month)</div></div>
          </div>
        </div>
        ` : ''}
            <div id="teamLeaderWordCountSection"></div>
        <div class="my-dashboard-calendar-section">
          <div class="my-dashboard-calendar-title">Attendance & Leaves Calendar</div>
          <div class="my-dashboard-two-calendars">
            <div class="my-dashboard-calendar-block">
              <div class="my-dashboard-calendar-label">Attendance</div>
              <div id="myDashboardAttendanceCalendar"></div>
            </div>
            <div class="my-dashboard-calendar-block">
              <div class="my-dashboard-calendar-label">Leaves</div>
              <div id="myDashboardLeavesCalendar"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    if (employee.role === "team_leader") {
      if (!document.getElementById("teamLeaderWordCountSection")) {
        const section = document.createElement("div");
        section.id = "teamLeaderWordCountSection";
        const dashboardMain = document.getElementById("dashboardMainSection");
        dashboardMain.appendChild(section);
      }
      loadTeamLeaderDashboard();
    }
        

    
  // --- Scoped CSS ---
  if (!document.getElementById("myDashboardModernStyle")) {
    const style = document.createElement("style");
    style.id = "myDashboardModernStyle";
    style.textContent = `
        .my-dashboard-modern {
          background: linear-gradient(135deg, #f8fafc 0%, #e0c3fc 100%);
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(67, 206, 162, 0.10), 0 3px 16px rgba(118, 75, 162, 0.10);
          padding: 18px 24px 18px 24px;
          width: 100%;
          max-width: none;
          margin: 0;
          color: #3a2c5c;
          font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
          max-height: 92vh;
          overflow-y: auto;
        }
        .my-dashboard-header { display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 18px; }
        .my-dashboard-empname { font-weight: 700; color: #764ba2; }
        .my-dashboard-role { font-size: 1.1rem; color: #43cea2; margin-top: 4px; font-weight: 500; }
        .my-dashboard-month-selector { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 18px; }
        .my-dashboard-month-selector label { font-weight: 500; color: #764ba2; }
        .my-dashboard-month-selector select { padding: 4px 10px; border-radius: 8px; border: 1px solid #d1c5e8; background: #fff; color: #3a2c5c; font-size: 1rem; }
        .my-dashboard-summary-cards { display: flex; gap: 1.5rem; margin-bottom: 18px; }
        .my-dashboard-summary-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(67, 206, 162, 0.08); padding: 18px 18px 10px 18px; min-width: 120px; text-align: center; flex: 1 1 120px; }
        .my-dashboard-summary-card .count { font-size: 2.1rem; font-weight: bold; color: #764ba2; margin-bottom: 4px; }
        .my-dashboard-cards { display: flex; flex-wrap: wrap; gap: 2rem; margin-bottom: 18px; }
        .my-dashboard-card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(67, 206, 162, 0.08); padding: 18px 10px 10px 10px; flex: 1 1 320px; min-width: 240px; max-width: 370px; display: flex; flex-direction: column; align-items: center; max-height: 320px; overflow: hidden; }
        .my-dashboard-card canvas { width: 100% !important; height: 220px !important; max-height: 220px !important; min-height: 180px; display: block; }
        .my-dashboard-card-title { margin-top: 10px; font-size: 1.08rem; color: #764ba2; font-weight: 600; text-align: center; }
        .my-dashboard-calendar-section { margin-top: 18px; background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(67, 206, 162, 0.08); padding: 18px 10px 10px 10px; }
        .my-dashboard-calendar-title { font-size: 1.15rem; color: #764ba2; font-weight: 600; margin-bottom: 12px; }
        .my-dashboard-two-calendars { display: flex; gap: 2rem; flex-wrap: wrap; }
        .my-dashboard-calendar-block { flex: 1 1 320px; min-width: 220px; }
        .my-dashboard-calendar-label { font-weight: 600; color: #43cea2; margin-bottom: 6px; text-align: center; }
        #myDashboardAttendanceCalendar, #myDashboardLeavesCalendar { min-height: 220px; }
        @media (max-width: 900px) { .my-dashboard-cards, .my-dashboard-two-calendars { flex-direction: column; gap: 1.2rem; } }
        @media (max-width: 600px) { .my-dashboard-modern { padding: 10px 2vw; } .my-dashboard-card { min-width: 0; padding: 8px 2px 6px 2px; max-height: 260px; } .my-dashboard-card canvas { height: 150px !important; max-height: 150px !important; min-height: 120px; } }
        .my-dashboard-calendar-flex { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
        .my-dashboard-calendar-day { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.98rem; background: #e0c3fc; color: #3a2c5c; cursor: pointer; transition: 0.2s; }
        .my-dashboard-calendar-day.present { background: #43cea2; color: #fff; font-weight: bold; }
        .my-dashboard-calendar-day.absent { background: #ff758c; color: #fff; font-weight: bold; }
        .my-dashboard-calendar-day.leave-paid { background: #764ba2; color: #fff; font-weight: bold; }
        .my-dashboard-calendar-day.leave-unpaid { background: #ffb347; color: #fff; font-weight: bold; }
        .my-dashboard-calendar-day:hover { box-shadow: 0 2px 8px rgba(67,206,162,0.13); transform: scale(1.08); }
      `;
    document.head.appendChild(style);
  }
  // --- Fetch attendance/leave summary from API ---
  async function fetchSummary(month, year) {
    const res = await fetch(
      `/api/attendance-summary?employeeId=${employee.employeeId}&month=${pad(month)}&year=${year}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` },
      }
    );
    if (!res.ok) return null;
    return await res.json();
  }
  async function updateDashboard(month, year) {
    // Show loading
    const attendanceCountCard = document.getElementById("attendanceCountCard");
    const paidLeavesCard = document.getElementById("paidLeavesCard");
    const unpaidLeavesCard = document.getElementById("unpaidLeavesCard");
    const attendanceCalendar = document.getElementById("myDashboardAttendanceCalendar");
    const leavesCalendar = document.getElementById("myDashboardLeavesCalendar");
    if (attendanceCountCard && attendanceCountCard.querySelector(".count")) attendanceCountCard.querySelector(".count").textContent = "...";
    if (paidLeavesCard && paidLeavesCard.querySelector(".count")) paidLeavesCard.querySelector(".count").textContent = "...";
    if (unpaidLeavesCard && unpaidLeavesCard.querySelector(".count")) unpaidLeavesCard.querySelector(".count").textContent = "...";
    if (attendanceCalendar) attendanceCalendar.innerHTML = "<div>Loading...</div>";
    if (leavesCalendar) leavesCalendar.innerHTML = "<div>Loading...</div>";
    
    if (showWordCount) {
      const todayWordCountCard = document.getElementById("todayWordCountCard");
      const monthWordCountCard = document.getElementById("monthWordCountCard");
      if (todayWordCountCard && todayWordCountCard.querySelector(".count")) todayWordCountCard.querySelector(".count").textContent = "...";
      if (monthWordCountCard && monthWordCountCard.querySelector(".count")) monthWordCountCard.querySelector(".count").textContent = "...";
    }
    
    // Attendance/leave summary
    const data = await fetchSummary(month, year);
    if (!data || !data.success) {
      if (attendanceCountCard && attendanceCountCard.querySelector(".count")) attendanceCountCard.querySelector(".count").textContent = "-";
      if (paidLeavesCard && paidLeavesCard.querySelector(".count")) paidLeavesCard.querySelector(".count").textContent = "-";
      if (unpaidLeavesCard && unpaidLeavesCard.querySelector(".count")) unpaidLeavesCard.querySelector(".count").textContent = "-";
      if (attendanceCalendar) attendanceCalendar.innerHTML = "<div>No data</div>";
      if (leavesCalendar) leavesCalendar.innerHTML = "<div>No data</div>";
    } else {
      if (attendanceCountCard && attendanceCountCard.querySelector(".count")) attendanceCountCard.querySelector(".count").textContent = data.attendanceCount;
      if (paidLeavesCard && paidLeavesCard.querySelector(".count")) paidLeavesCard.querySelector(".count").textContent = data.paidLeaves;
      if (unpaidLeavesCard && unpaidLeavesCard.querySelector(".count")) unpaidLeavesCard.querySelector(".count").textContent = data.unpaidLeaves;
      if (attendanceCalendar) renderAttendanceCalendar("myDashboardAttendanceCalendar", data.days);
      if (leavesCalendar) renderLeavesCalendar("myDashboardLeavesCalendar", data.days);
    }
    
    // --- Word Count Data (only for regular employees) ---
    if (showWordCount) {
    // 1. Fetch word counts for chart
    const wordCounts = await fetchWordCounts(employee.employeeId, pad(month), year);
    // Build chart data for all days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    const chartLabels = [];
    const chartData = [];
    const wordCountMap = {};
    // Use IST for date key
    function toISTDateString(date) {
      // Convert UTC date to IST
      const IST_OFFSET = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(date.getTime() + IST_OFFSET);
      return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`;
    }
    wordCounts.forEach((wc) => {
      const d = new Date(wc.date);
      const key = toISTDateString(d);
      wordCountMap[key] = wc.wordCount;
    });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d);
      const key = toISTDateString(dateObj);
      chartLabels.push(dateObj.toLocaleDateString("en-IN", { month: "short", day: "numeric" }));
      chartData.push(wordCountMap[key] || 0);
    }
    // 2. Render chart
      const perfChartElem = document.getElementById("performanceChart");
      if (perfChartElem && perfChartElem.getContext) {
        const perfCtx = perfChartElem.getContext("2d");
    if (window.performanceChartInstance) window.performanceChartInstance.destroy();
    window.performanceChartInstance = new Chart(perfCtx, {
      type: "line",
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: "Words Written",
            data: chartData,
            borderColor: "#43cea2",
            backgroundColor: "rgba(67,206,162,0.15)",
            fill: true,
            tension: 0.3,
            pointRadius: 3,
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Word Count: ${context.parsed.y}`;
              },
            },
          },
        },
        scales: { y: { beginAtZero: true } },
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 2.2,
        layout: { padding: 0 },
      },
    });
      }
    // 3. Today's word count
    const todayWordCount = await fetchTodayWordCount(employee.employeeId);
      const todayWordCountCard = document.getElementById("todayWordCountCard");
      if (todayWordCountCard && todayWordCountCard.querySelector(".count"))
        todayWordCountCard.querySelector(".count").textContent = todayWordCount;
    // 4. Month total word count
    const monthTotal = chartData.reduce((sum, v) => sum + v, 0);
      const monthWordCountCard = document.getElementById("monthWordCountCard");
      if (monthWordCountCard && monthWordCountCard.querySelector(".count"))
        monthWordCountCard.querySelector(".count").textContent = monthTotal;
    }
     // --- Team Leader Extra Section ---
    if (isTeamLeader) {
      // Ensure myTeam is loaded
      if (!myTeam) {
        const token = localStorage.getItem("jwtToken");
        try {
          const res = await fetch("/api/my-team", { headers: { Authorization: `Bearer ${token}` } });
          const data = await res.json();
          if (data.success && data.team) myTeam = data.team;
        } catch (e) { myTeam = null; }
      }
      if (myTeam && myTeam.team_members_details) {
        showTeamPerformanceBarChart(myTeam.team_members_details, null, month, year);
      }
    }
  }
  // --- Calendar rendering ---
  function renderAttendanceCalendar(containerId, days) {
    const container = document.getElementById(containerId);
    if (!container) return; // Prevent error if element is missing
    if (!days || !days.length) {
      container.innerHTML = "<div>No data</div>";
      return;
    }
    let html = '<div class="my-dashboard-calendar-flex">';
    days.forEach((day) => {
      let status = day.attendanceStatus === "Present" ? "present" : "absent";
      html += `<div class="my-dashboard-calendar-day ${status}" title="${day.date}">${parseInt(
        day.date.split("-")[2]
      )}</div>`;
    });
    html += "</div>";
    container.innerHTML = html;
  }
  function renderLeavesCalendar(containerId, days) {
    const container = document.getElementById(containerId);
    if (!container) return; // Prevent error if element is missing
    if (!days || !days.length) {
      container.innerHTML = "<div>No data</div>";
      return;
    }
    let html = '<div class="my-dashboard-calendar-flex">';
    days.forEach((day) => {
      let status =
        day.leaveType === "Paid" ? "leave-paid" : day.leaveType === "Unpaid" ? "leave-unpaid" : "";
      html += `<div class="my-dashboard-calendar-day ${status}" title="${day.date}">${parseInt(
        day.date.split("-")[2]
      )}</div>`;
    });
    html += "</div>";
    container.innerHTML = html;
  }
  // --- Month/year selector events ---
  document.getElementById("myDashboardMonth").addEventListener("change", (e) => {
    selectedMonth = parseInt(e.target.value);
    updateDashboard(selectedMonth, selectedYear);
  });
  document.getElementById("myDashboardYear").addEventListener("change", (e) => {
    selectedYear = parseInt(e.target.value);
    updateDashboard(selectedMonth, selectedYear);
  });
  // --- Initial load ---
  updateDashboard(selectedMonth, selectedYear);
  setLogoutListener();
  injectProfileSidebar();
  loadRecentNotices();
}

// --- Dedicated Admin Dashboard (search any employee + performance + attendance/leave metrics) ---
async function loadAdminDashboard() {
  const admin = JSON.parse(localStorage.getItem("employee"));
  const today = new Date();
  let selectedMonth = today.getMonth() + 1;
  let selectedYear = today.getFullYear();
  const pad = (n) => (n < 10 ? "0" + n : n);

  const monthOptions = Array.from({ length: 12 }, (_, i) => `<option value="${pad(i + 1)}" ${i + 1 === selectedMonth ? "selected" : ""}>${new Date(0, i).toLocaleString("en-IN", { month: "long" })}</option>`).join("");
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = today.getFullYear() - i;
    return `<option value="${y}" ${y === selectedYear ? "selected" : ""}>${y}</option>`;
  }).join("");

  mainContent.innerHTML = `
    <div class="my-dashboard-modern dashboard-main-section" id="adminDashboardMain">
      <div class="my-dashboard-header">
        <h2>Welcome, <span class="my-dashboard-empname">${admin.firstName} 👋</span></h2>
        <div class="my-dashboard-role">${admin.role}</div>
      </div>
      <div class="my-dashboard-summary-cards" style="margin-top:6px;">
        <div class="my-dashboard-summary-card">
          <div style="font-size:1rem;color:#764ba2;font-weight:600">Search by Name</div>
          <div class="form-group" style="position:relative;margin-top:8px;">
            <input type="text" id="dashboardSearchEmployeeName" placeholder="Type employee name..." autocomplete="off" style="padding:8px 10px;border:1px solid #d1c5e8;border-radius:8px;width:100%;color:#3a2c5c;background:#fff;"/>
            <div id="dashboardNameSearchDropdown" style="position:absolute;left:0;right:0;top:100%;z-index:1000;"></div>
          </div>
        </div>
        <div class="my-dashboard-summary-card">
          <div class="count" style="font-size:1rem;color:#764ba2;font-weight:600">Employee ID</div>
          <input type="text" id="dashboardSearchEmployeeId" placeholder="Auto-filled by selection" style="margin-top:8px;padding:8px 10px;border:1px solid #d1c5e8;border-radius:8px;width:100%;color:#3a2c5c;background:#fff;"/>
        </div>
        <div class="my-dashboard-summary-card">
          <div style="font-size:1rem;color:#764ba2;font-weight:600">Month & Year</div>
          <select id="adminDashboardMonth" style="margin-top:8px;padding:8px 10px;border-radius:8px;border:1px solid #d1c5e8;background:#fff;color:#3a2c5c;">${monthOptions}</select>
          <select id="adminDashboardYear" style="margin-top:8px;padding:8px 10px;border-radius:8px;border:1px solid #d1c5e8;background:#fff;color:#3a2c5c;">${yearOptions}</select>
        </div>
      </div>

      <div class="my-dashboard-cards" style="display:flex;gap:2rem;align-items:stretch;">
        <div class="my-dashboard-card" style="flex:1;min-width:240px;max-width:370px;">
          <canvas id="performanceChart"></canvas>
          <div class="my-dashboard-card-title">Performance Tracker (Word Count)</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:1.2rem;justify-content:center;min-width:180px;max-width:220px;">
          <div class="my-dashboard-summary-card" id="todayWordCountCard"><div class="count">-</div><div>Today's Word Count</div></div>
          <div class="my-dashboard-summary-card" id="monthWordCountCard"><div class="count">-</div><div>Overall Word Count (Month)</div></div>
        </div>
      </div>

      <div class="my-dashboard-summary-cards" style="margin-top:8px;">
        <div class="my-dashboard-summary-card" id="adminAttendanceCount"><div class="count">-</div><div>Total Attendance</div></div>
        <div class="my-dashboard-summary-card" id="adminLeaveCount"><div class="count">-</div><div>Total Leaves</div></div>
        <div class="my-dashboard-summary-card" id="adminLateCount"><div class="count">-</div><div>Total Late Entries</div></div>
        <div class="my-dashboard-summary-card" id="adminEarlyCheckoutCount"><div class="count">-</div><div>Total Early Checkouts</div></div>
      </div>

      <!-- Tomorrow's Approved Leaves Section -->
      <div class="my-dashboard-leaves-section" style="margin-top: 1.5rem;">
        <div class="my-dashboard-leaves-card">
          <h3 style="margin: 0 0 1rem 0; color: #764ba2; font-size: 1.2rem;">Tomorrow's Approved Leaves</h3>
          <div id="tomorrowLeavesList" style="min-height: 60px;">
            <div style="text-align: center; color: #666; padding: 1rem;">Loading...</div>
          </div>
        </div>
      </div>

      <!-- Check Approved Leaves by Date Section -->
      <div class="my-dashboard-leaves-section" style="margin-top: 1.5rem;">
        <div class="my-dashboard-leaves-card">
          <h3 style="margin: 0 0 1rem 0; color: #764ba2; font-size: 1.2rem;">Check Approved Leaves by Date</h3>
          <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
            <input type="date" id="leaveDatePicker" style="padding: 8px 12px; border: 1px solid #d1c5e8; border-radius: 8px; background: #fff; color: #3a2c5c;">
            <button id="checkLeavesBtn" style="padding: 8px 16px; background: #764ba2; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Check Leaves</button>
          </div>
          <div id="dateLeavesList" style="min-height: 60px;">
            <div style="text-align: center; color: #666; padding: 1rem;">Select a date to check approved leaves</div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (!document.getElementById("adminDashboardStyle")) {
    const style = document.createElement("style");
    style.id = "adminDashboardStyle";
    style.textContent = `
      .my-dashboard-modern { background: linear-gradient(135deg, #f8fafc 0%, #e0c3fc 100%); border-radius: 18px; box-shadow: 0 8px 32px rgba(67, 206, 162, 0.10), 0 3px 16px rgba(118, 75, 162, 0.10); padding: 18px 24px; width: 100%; color: #3a2c5c; font-family: 'Segoe UI','Roboto',Arial,sans-serif; max-height: 92vh; overflow-y: auto; }
      .my-dashboard-header { display:flex; flex-direction:column; align-items:flex-start; margin-bottom: 12px; }
      .my-dashboard-summary-cards { display:flex; gap:1.5rem; margin-bottom: 12px; flex-wrap:wrap; }
      .my-dashboard-summary-card { background:#fff; border-radius:12px; box-shadow:0 2px 8px rgba(67,206,162,0.08); padding: 12px; min-width:220px; flex:1 1 220px; }
      .my-dashboard-summary-card .count { font-size:2.1rem; font-weight:bold; color:#764ba2; margin-bottom:4px; }
      .my-dashboard-card { background:#fff; border-radius:16px; box-shadow:0 2px 12px rgba(67,206,162,0.08); padding: 18px 10px 10px 10px; flex:1 1 320px; min-width:240px; max-width:370px; display:flex; flex-direction:column; align-items:center; max-height:320px; overflow:hidden; }
      .my-dashboard-card canvas { width:100% !important; height:220px !important; }
      
      /* Leave Management Styles */
      .my-dashboard-leaves-section { width: 100%; }
      .my-dashboard-leaves-card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(67,206,162,0.08); padding: 20px; }
      .my-dashboard-leaves-card h3 { margin: 0 0 1rem 0; color: #764ba2; font-size: 1.2rem; font-weight: 600; }
      
      .leave-item { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        padding: 12px 16px; 
        background: #f8f9fa; 
        border-radius: 8px; 
        margin-bottom: 8px; 
        border-left: 4px solid #764ba2;
        transition: all 0.3s ease;
      }
      .leave-item:hover { 
        background: #e9ecef; 
        transform: translateX(4px);
        box-shadow: 0 2px 8px rgba(118, 75, 162, 0.15);
      }
      .leave-item:last-child { margin-bottom: 0; }
      
      .leave-info { flex: 1; }
      .leave-name { font-weight: 600; color: #3a2c5c; margin-bottom: 4px; }
      .leave-details { font-size: 0.9rem; color: #666; }
      .leave-duration { background: #764ba2; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }
      
      .no-leaves { 
        text-align: center; 
        color: #666; 
        padding: 2rem; 
        font-style: italic;
        background: #f8f9fa;
        border-radius: 8px;
        border: 2px dashed #d1c5e8;
      }
      
      .loading-leaves { 
        text-align: center; 
        color: #666; 
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
      }
      
      #checkLeavesBtn:hover { 
        background: #5a4a7a; 
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(118, 75, 162, 0.3);
      }
      
      #leaveDatePicker { 
        min-width: 150px;
        cursor: pointer;
      }
      
      #leaveDatePicker:focus { 
        outline: none; 
        border-color: #764ba2; 
        box-shadow: 0 0 0 3px rgba(118, 75, 162, 0.1);
      }
      
      @media (max-width: 768px) {
        .my-dashboard-leaves-card { padding: 16px; }
        .leave-item { flex-direction: column; align-items: flex-start; gap: 8px; }
        .leave-duration { align-self: flex-start; }
        #leaveDatePicker { min-width: 120px; }
      }
    `;
    document.head.appendChild(style);
  }

  (function attachAdminDashboardNameSearch(){
    const nameInput = document.getElementById("dashboardSearchEmployeeName");
    const idInput = document.getElementById("dashboardSearchEmployeeId");
    const dropdown = document.getElementById("dashboardNameSearchDropdown");
    if (!nameInput || !idInput || !dropdown) return;
    let cache = [];
    async function ensureCache(){
      if (cache.length) return;
      try {
        const res = await fetch('/api/employees', { headers:{ Authorization:`Bearer ${localStorage.getItem('jwtToken')}` }});
        const data = await res.json();
        if (data.success && Array.isArray(data.employees)) {
          cache = data.employees.map(e=>({ id:e.employeeId, name:`${e.firstName||''} ${e.lastName||''}`.trim() }));
        }
      } catch(_e){}
    }
    nameInput.addEventListener('focus', ensureCache);
    nameInput.addEventListener('keyup', function(){
      const term = nameInput.value.toLowerCase().trim();
      if (!term) { dropdown.innerHTML = ''; return; }
      const filtered = cache.filter(e=> e.name.toLowerCase().includes(term));
      dropdown.innerHTML = filtered.map(e=>`<div data-id="${e.id}" data-name="${e.name}" style="padding:6px 12px;background:#fff;border:1px solid #eee;border-top:none;cursor:pointer;">${e.name} <span style='color:#764ba2;font-weight:600;'>(${e.id})</span></div>`).join('');
    });
    dropdown.addEventListener('click', (ev)=>{
      const item = ev.target.closest('div[data-id]');
      if (!item) return;
      idInput.value = item.dataset.id;
      nameInput.value = item.dataset.name;
      dropdown.innerHTML = '';
      triggerUpdate();
    });
    document.addEventListener('click', (e)=>{ if (!dropdown.contains(e.target) && e.target!==nameInput) dropdown.innerHTML=''; });
  })();

  async function fetchSummaryForEmployee(empId, month, year){
    try {
      const res = await fetch(`/api/attendance-summary?employeeId=${encodeURIComponent(empId)}&month=${pad(month)}&year=${year}`, { headers:{ Authorization:`Bearer ${localStorage.getItem('jwtToken')}` }});
      if (!res.ok) return null;
      return await res.json();
    } catch(_e){ return null; }
  }

  async function updateAdminCards(empId, month, year){
    const attEl = document.getElementById('adminAttendanceCount');
    const leaveEl = document.getElementById('adminLeaveCount');
    const lateEl = document.getElementById('adminLateCount');
    const earlyEl = document.getElementById('adminEarlyCheckoutCount');
    [attEl, leaveEl, lateEl, earlyEl].forEach(el=>{ if (el && el.querySelector('.count')) el.querySelector('.count').textContent='...'; });
    const data = await fetchSummaryForEmployee(empId, month, year);
    if (!data || !data.success) {
      [attEl, leaveEl, lateEl, earlyEl].forEach(el=>{ if (el && el.querySelector('.count')) el.querySelector('.count').textContent='-'; });
      return;
    }
    const days = Array.isArray(data.days) ? data.days : [];
    const attendanceCount = (typeof data.attendanceCount === 'number') ? data.attendanceCount : days.filter(d=>d.attendanceStatus==='Present').length;
    // Robust paid/unpaid extraction with fallbacks, then sum
    const paidLeaves =
      (typeof data.paidLeaves === 'number' ? data.paidLeaves :
      (typeof data.paidLeaveCount === 'number' ? data.paidLeaveCount :
      days.filter(d=>d.leaveType === 'Paid').length));
    const unpaidLeaves =
      (typeof data.unpaidLeaves === 'number' ? data.unpaidLeaves :
      (typeof data.unpaidLeaveCount === 'number' ? data.unpaidLeaveCount :
      days.filter(d=>d.leaveType === 'Unpaid').length));
    const leaveCount = paidLeaves + unpaidLeaves;
    const lateCount = (typeof data.lateCount === 'number') ? data.lateCount : days.filter(d=>d.late || d.isLate || d.lateEntry).length;
    const earlyCount = (typeof data.earlyCheckoutCount === 'number') ? data.earlyCheckoutCount : days.filter(d=>d.earlyCheckout || d.isEarlyCheckout).length;
    if (attEl && attEl.querySelector('.count')) attEl.querySelector('.count').textContent = attendanceCount;
    if (leaveEl && leaveEl.querySelector('.count')) leaveEl.querySelector('.count').textContent = leaveCount;
    if (lateEl && lateEl.querySelector('.count')) lateEl.querySelector('.count').textContent = lateCount;
    if (earlyEl && earlyEl.querySelector('.count')) earlyEl.querySelector('.count').textContent = earlyCount;
  }

  async function updateAdminChart(empId, month, year){
    const el = document.getElementById('performanceChart');
    if (!el || !el.getContext) return;
    const wordCounts = await fetchWordCounts(empId, pad(month), year);
    const daysInMonth = new Date(year, month, 0).getDate();
    const labels = [], values = [];
    const map = {};
    function toISTDateString(date){ const IST_OFFSET = 5.5*60*60*1000; const ist=new Date(date.getTime()+IST_OFFSET); return `${ist.getFullYear()}-${String(ist.getMonth()+1).padStart(2,'0')}-${String(ist.getDate()).padStart(2,'0')}`; }
    wordCounts.forEach(wc=>{ const d=new Date(wc.date); map[toISTDateString(d)] = wc.wordCount; });
    for (let d=1; d<=daysInMonth; d++){ const dt=new Date(year, month-1, d); const key=toISTDateString(dt); labels.push(dt.toLocaleDateString('en-IN',{month:'short',day:'numeric'})); values.push(map[key]||0); }
    const ctx = el.getContext('2d');
    if (window.performanceChartInstance) window.performanceChartInstance.destroy();
    window.performanceChartInstance = new Chart(ctx, { type:'line', data:{ labels, datasets:[{ label:'Words Written', data:values, borderColor:'#43cea2', backgroundColor:'rgba(67,206,162,0.15)', fill:true, tension:0.3, pointRadius:3 }] }, options:{ plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true } }, responsive:true, maintainAspectRatio:false, aspectRatio:2.2 } });
    const todayCnt = await fetchTodayWordCount(empId);
    const monthTotal = values.reduce((s,v)=>s+v,0);
    const todayCard = document.getElementById('todayWordCountCard');
    const monthCard = document.getElementById('monthWordCountCard');
    if (todayCard && todayCard.querySelector('.count')) todayCard.querySelector('.count').textContent = todayCnt;
    if (monthCard && monthCard.querySelector('.count')) monthCard.querySelector('.count').textContent = monthTotal;
  }

  async function triggerUpdate(){
    const empId = document.getElementById('dashboardSearchEmployeeId').value.trim();
    const m = parseInt(document.getElementById('adminDashboardMonth').value, 10);
    const y = parseInt(document.getElementById('adminDashboardYear').value, 10);
    if (!empId) return;
    await updateAdminChart(empId, m, y);
    await updateAdminCards(empId, m, y);
    
    // Load tomorrow's leaves when dashboard loads
    await loadTomorrowLeaves();
  }

  // Load tomorrow's approved leaves
  async function loadTomorrowLeaves() {
    try {
      const tomorrowLeavesList = document.getElementById('tomorrowLeavesList');
      if (!tomorrowLeavesList) return;
      
      tomorrowLeavesList.innerHTML = '<div class="loading-leaves">Loading tomorrow\'s leaves...</div>';
      
      const response = await fetch('/api/leaves/tomorrow', {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tomorrow\'s leaves');
      }
      
      const data = await response.json();
      
      if (data.success && data.leaves && data.leaves.length > 0) {
        const leavesHTML = data.leaves.map(leave => `
          <div class="leave-item">
            <div class="leave-info">
              <div class="leave-name">${leave.name}</div>
              <div class="leave-details">${leave.reason} • ${leave.leaveCount} day(s)</div>
            </div>
            <div class="leave-duration">${leave.leaveCount} day${leave.leaveCount > 1 ? 's' : ''}</div>
          </div>
        `).join('');
        
        tomorrowLeavesList.innerHTML = leavesHTML;
      } else {
        tomorrowLeavesList.innerHTML = '<div class="no-leaves">No approved leaves for tomorrow</div>';
      }
    } catch (error) {
      console.error('Error loading tomorrow\'s leaves:', error);
      const tomorrowLeavesList = document.getElementById('tomorrowLeavesList');
      if (tomorrowLeavesList) {
        tomorrowLeavesList.innerHTML = '<div class="no-leaves">Error loading leaves. Please try again.</div>';
      }
    }
  }

  // Check approved leaves for a specific date
  async function checkLeavesByDate(selectedDate) {
    try {
      const dateLeavesList = document.getElementById('dateLeavesList');
      if (!dateLeavesList) return;
      
      dateLeavesList.innerHTML = '<div class="loading-leaves">Loading leaves for selected date...</div>';
      
      const response = await fetch(`/api/leaves/by-date?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaves for selected date');
      }
      
      const data = await response.json();
      
      if (data.success && data.leaves && data.leaves.length > 0) {
        const leavesHTML = data.leaves.map(leave => `
          <div class="leave-item">
            <div class="leave-info">
              <div class="leave-name">${leave.name}</div>
              <div class="leave-details">${leave.reason} • ${leave.leaveCount} day(s)</div>
            </div>
            <div class="leave-duration">${leave.leaveCount} day${leave.leaveCount > 1 ? 's' : ''}</div>
          </div>
        `).join('');
        
        dateLeavesList.innerHTML = leavesHTML;
      } else {
        dateLeavesList.innerHTML = '<div class="no-leaves">No approved leaves for the selected date</div>';
      }
    } catch (error) {
      console.error('Error checking leaves by date:', error);
      const dateLeavesList = document.getElementById('dateLeavesList');
      if (dateLeavesList) {
        dateLeavesList.innerHTML = '<div class="no-leaves">Error loading leaves. Please try again.</div>';
      }
    }
  }

  // Set default date to today for the date picker
  function setDefaultDate() {
    const datePicker = document.getElementById('leaveDatePicker');
    if (datePicker) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      datePicker.value = `${year}-${month}-${day}`;
    }
  }

  // Attach event listeners for leave management
  function attachLeaveManagementEvents() {
    const checkLeavesBtn = document.getElementById('checkLeavesBtn');
    const leaveDatePicker = document.getElementById('leaveDatePicker');
    
    if (checkLeavesBtn) {
      checkLeavesBtn.addEventListener('click', () => {
        const selectedDate = leaveDatePicker.value;
        if (selectedDate) {
          checkLeavesByDate(selectedDate);
        } else {
          alert('Please select a date first');
        }
      });
    }
    
    if (leaveDatePicker) {
      leaveDatePicker.addEventListener('change', () => {
        const selectedDate = leaveDatePicker.value;
        if (selectedDate) {
          checkLeavesByDate(selectedDate);
        }
      });
    }
  }

  // Initialize leave management
  setDefaultDate();
  attachLeaveManagementEvents();
  await loadTomorrowLeaves();

  document.getElementById('adminDashboardMonth').addEventListener('change', triggerUpdate);
  document.getElementById('adminDashboardYear').addEventListener('change', triggerUpdate);

  setLogoutListener();
  injectProfileSidebar();
  loadRecentNotices();
}

// --- Team Leader Word Count Section ---

let myTeam = null; // <-- Make myTeam global to this module
let selectedMonth = (new Date()).getMonth() + 1;
let selectedYear = (new Date()).getFullYear();

async function loadTeamLeaderDashboard() {
  const employee = JSON.parse(localStorage.getItem("employee"));
  const token = localStorage.getItem("jwtToken");
  if (employee.role !== "team_leader") return;

  // Fetch team info
  myTeam = null;
  try {
    const res = await fetch("/api/my-team", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (data.success && data.team) myTeam = data.team;
  } catch (e) { myTeam = null; }

  if (!myTeam || !myTeam.team_members_details || !myTeam.team_members_details.length) {
    document.getElementById("teamLeaderWordCountSection").innerHTML = `<div style='margin:2rem 0;color:#888;text-align:center;'>No team or team members found for you.</div>`;
    return;
  }

  // Build member select dropdown
  const members = myTeam.team_members_details;
  let selectHtml = `<label style="color: #3a2c5c;;" for="teamMemberSelect">Select Team Member:</label>
    <select id="teamMemberSelect" style="margin-top:10px;">${members.map(m => `<option value="${m.employeeId}">${m.firstName || m.name || m.employeeId}</option>`).join('')}</select>
    <div id="teamMemberWordCounts"></div>
    <div id="teamPerformanceChartContainer" style="margin-top:2rem;"></div>
  `;
  document.getElementById("teamLeaderWordCountSection").innerHTML = selectHtml;

  // Handler for member selection
  document.getElementById("teamMemberSelect").addEventListener("change", async function() {
    await showTeamMemberWordCounts(this.value, selectedMonth, selectedYear);
    showTeamPerformanceBarChart(members, this.value, selectedMonth, selectedYear);
  });

  // Show for first member by default
  await showTeamMemberWordCounts(members[0].employeeId, selectedMonth, selectedYear);

  // Show performance chart for all members
  showTeamPerformanceBarChart(members, null, selectedMonth, selectedYear);
}

async function showTeamMemberWordCounts(employeeId, month, year) {
  const pad = n => (n < 10 ? "0" + n : n);
  // Fetch all word counts for the month
  const wordCounts = await fetchWordCounts(employeeId, pad(month), year);
  // Today's word count
  const now = new Date();
  const todayStr = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const todayEntry = wordCounts.find(wc => {
    const d = new Date(wc.date);
    const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
    return ist.toISOString().slice(0, 10) === todayStr;
  });
  const todayWordCount = todayEntry ? todayEntry.wordCount : 0;
  // Month total
  const monthTotal = wordCounts.reduce((sum, wc) => sum + (wc.wordCount || 0), 0);
  document.getElementById("teamMemberWordCounts").innerHTML = `
    <div style="margin:1rem 0;">
      <strong>Today's Word Count:</strong> ${todayWordCount}<br>
      <strong>Month Total Word Count:</strong> ${monthTotal}
    </div>
  `;
}

// --- Team Leader Performance Tracker Chart (Dynamic) ---
let teamPerformanceChartInstance = null;
async function showTeamPerformanceBarChart(teamMembers, selectedMemberId, month, year) {
  const chartContainer = document.getElementById("teamPerformanceChartContainer");
  chartContainer.innerHTML = '<div style="display:flex;justify-content:center;"><canvas id="teamPerformanceChart" style="max-width:900px;width:100%;"></canvas></div>';
  const ctx = document.getElementById("teamPerformanceChart").getContext("2d");
  let chartData, chartLabels, chartTitle, chartType, chartOptions;

  if (!selectedMemberId) {
    // --- BAR CHART for team comparison ---
    chartType = "bar";
    chartTitle = "Team Members' Total Word Count (Current Month)";
    chartLabels = teamMembers.map(m => m.firstName || m.name || m.employeeId);
    const wordCounts = await Promise.all(
      teamMembers.map(async m => {
        const res = await fetch(`/api/word-count?employeeId=${m.employeeId}&month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` }
        });
        const data = await res.json();
        return data.success
          ? (data.wordCounts || []).reduce((sum, w) => sum + (w.wordCount || 0), 0)
          : 0;
      })
    );
    chartData = {
      labels: chartLabels,
      datasets: [{
        label: "Total Word Count",
        data: wordCounts,
        backgroundColor: "#7b5fff",
        borderRadius: 6, // rounded bars
        barThickness:50, // thin bars
        maxBarThickness:74,
      }]
    };
    chartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 3,
      plugins: {
        title: {
          display: true,
          text: chartTitle,
          font: { size:12}
        },
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false }
        },
        y: { beginAtZero: true }
      }
    };
  } else {
    // --- LINE CHART for single member daily trend ---
    chartType = "line";
    const member = teamMembers.find(m => m.employeeId === selectedMemberId);
    chartTitle = `${member.firstName || member.name || member.employeeId}'s Daily Word Count (Current Month)`;
    const res = await fetch(`/api/word-count?employeeId=${selectedMemberId}&month=${month}&year=${year}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` }
    });
    const data = await res.json();
    const daysInMonth = new Date(year, month, 0).getDate();
    chartLabels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    const wordCountsByDay = Array(daysInMonth).fill(0);
    if (data.success && data.wordCounts) {
      data.wordCounts.forEach(wc => {
        const day = new Date(wc.date).getDate();
        wordCountsByDay[day - 1] = wc.wordCount;
      });
    }
    chartData = {
      labels: chartLabels,
      datasets: [{
        label: "Word Count",
        data: wordCountsByDay,
        borderColor: "#7b5fff",
        backgroundColor: "rgba(123,95,255,0.15)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
      }]
    };
    chartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        title: {
          display: true,
          text: chartTitle,
          font: { size: 12 }
        },
        legend: { display: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true }
      }
    };
  }

  // Destroy previous chart if exists
  if (teamPerformanceChartInstance) {
    teamPerformanceChartInstance.destroy();
  }
  teamPerformanceChartInstance = new Chart(ctx, {
    type: chartType,
    data: chartData,
    options: chartOptions
  });
}
// Add WFH Request Section
function loadWFHRequest() {
  setActive("btn-wfh");
  const employee = JSON.parse(localStorage.getItem("employee"));
  mainContent.innerHTML = `
      <div class="wfh-scroll-wrapper">
        <div class="wfh-card">
          <h2>🏠 Work From Home Request</h2>
          
          <!-- Top Row - Employee Information -->
          <div class="wfh-form-row">
            <div class="wfh-form-group">
              <label>👤 Employee ID:</label>
              <span class="readonly">${employee?.employeeId || ""}</span>
            </div>
            <div class="wfh-form-group">
              <label>😊 Name:</label>
              <span class="readonly">${employee?.name || ""}</span>
            </div>
            <div class="wfh-form-group">
              <label>🛡️ Designation:</label>
              <span class="readonly">${employee?.role || ""}</span>
            </div>
          </div>
          
          <!-- Middle Section - Text Areas -->
          <div class="wfh-form-group">
            <label for="reason">📄 WFH Reason:</label>
            <textarea id="reason" placeholder="Enter reason for WFH request..."></textarea>
          </div>
          <div class="wfh-form-group">
            <label for="additionalReason">💬 Additional Details:</label>
            <textarea id="additionalReason" placeholder="Enter any additional details or comments..."></textarea>
          </div>
          
          <!-- Bottom Row - Count and Attachment -->
          <div class="wfh-form-row">
            <div class="wfh-form-group">
              <label for="count">📅  Count (Days):</label>
              <input type="number" id="count" placeholder="Enter number of days">
            </div>
            <div class="wfh-form-group">
              <label for="attachment">📎 Attach Image (Optional):</label>
              <div class="attachment-section">
                <input type="file" id="attachment" accept="image/*" style="display: none;">
                <button type="button" class="attachment-btn" id="attachmentBtn">
                  <i class="fas fa-upload"></i> Choose Image
                </button>
                <div class="attachment-preview" id="attachmentPreview" style="display: none;">
                  <img id="previewImage" class="preview-image" alt="Preview">
                  <button type="button" class="remove-attachment" id="removeAttachment">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Calendar Container -->
          <div class="wfh-form-group" id="calendar-container"></div>
          
          <!-- Button Group -->
          <div class="button-group" style="display: flex; gap: 15px; margin-top: 20px;">
            <button class="submit-btn" id="wfhSubmitBtn" style="flex: 1;">
            ✅ Submit
            </button>
            <button class="cancel-btn" id="wfhCancelBtn" style="flex: 1;">
             ❌ Cancel
            </button>
          </div>
        </div>
      </div>
    `;

  // Calendar logic
  const countInput = document.getElementById("count");
  const calendarContainer = document.getElementById("calendar-container");

  function createDateInput(id, labelText, iconClass) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("wfh-form-group");
    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.innerHTML = `<i class="${iconClass}"></i> ${labelText}`;
    wrapper.appendChild(label);
    const input = document.createElement("input");
    input.type = "date";
    input.id = id;
    input.name = id;
    wrapper.appendChild(input);
    return wrapper;
  }

  function updateCalendarInputs() {
    const count = parseInt(countInput.value, 10);
    calendarContainer.innerHTML = "";
    if (!isNaN(count)) {
      if (count <= 1) {
        const singleDate = createDateInput("calendar", "Select Date:", "fas fa-calendar");
        calendarContainer.appendChild(singleDate);
      } else {
        // Create a row for date range
        const dateRow = document.createElement("div");
        dateRow.classList.add("wfh-form-row");
        
        const fromDate = createDateInput("fromDate", "From Date:", "fas fa-calendar");
        const toDate = createDateInput("toDate", "To Date:", "fas fa-calendar");
        
        dateRow.appendChild(fromDate);
        dateRow.appendChild(toDate);
        calendarContainer.appendChild(dateRow);
      }
    }
  }
  countInput.addEventListener("input", updateCalendarInputs);

  // Attachment functionality
  const attachmentBtn = document.getElementById("attachmentBtn");
  const attachmentInput = document.getElementById("attachment");
  const attachmentPreview = document.getElementById("attachmentPreview");
  const previewImage = document.getElementById("previewImage");
  const removeAttachment = document.getElementById("removeAttachment");

  attachmentBtn.addEventListener("click", () => {
    attachmentInput.click();
  });

  attachmentInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        alert("File size must be less than 1MB");
        attachmentInput.value = "";
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImage.src = e.target.result;
        attachmentPreview.style.display = "block";
        attachmentBtn.style.display = "none";
      };
      reader.readAsDataURL(file);
    }
  });

  removeAttachment.addEventListener("click", () => {
    attachmentInput.value = "";
    attachmentPreview.style.display = "none";
    attachmentBtn.style.display = "block";
  });

  // Cancel button functionality
  const cancelBtn = document.getElementById("wfhCancelBtn");
  cancelBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to cancel? All entered data will be lost.")) {
      loadDashboard(); // Return to dashboard
    }
  });

  // Submit functionality
  const submitBtn = document.getElementById("wfhSubmitBtn");
  submitBtn.addEventListener("click", async () => {
    try {
      // Get form data
      const reason = document.getElementById("reason").value.trim();
      const additionalReason = document.getElementById("additionalReason").value.trim();
      const count = document.getElementById("count").value;
      const attachment = attachmentInput.files[0];
      
      // Validation
      if (!reason) {
        alert("Please enter a reason for WFH request");
        return;
      }
      
      if (!count || count <= 0) {
        alert("Please enter a valid number of days");
        return;
      }

      // Get date values
      let fromDate, toDate;
      const countNum = parseInt(count);
      
      if (countNum === 1) {
        const calendarInput = document.getElementById("calendar");
        if (!calendarInput || !calendarInput.value) {
          alert("Please select a date");
          return;
        }
        fromDate = calendarInput.value;
        toDate = calendarInput.value;
      } else {
        const fromDateInput = document.getElementById("fromDate");
        const toDateInput = document.getElementById("toDate");
        
        if (!fromDateInput || !fromDateInput.value) {
          alert("Please select from date");
          return;
        }
        
        if (!toDateInput || !toDateInput.value) {
          alert("Please select to date");
          return;
        }
        
        fromDate = fromDateInput.value;
        toDate = toDateInput.value;
        
        // Validate date range
        if (new Date(fromDate) > new Date(toDate)) {
          alert("From date cannot be after to date");
          return;
        }
      }

      // Prepare form data
      const formData = new FormData();
      formData.append("reason", reason);
      formData.append("wfhCount", count);
      formData.append("fromDate", fromDate);
      formData.append("toDate", toDate);
      
      if (additionalReason) {
        formData.append("comments", additionalReason);
      }
      
      if (attachment) {
        formData.append("attachment", attachment);
      }

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

      // Submit to backend
      const token = localStorage.getItem("jwtToken");
      const response = await fetch("/api/wfh-request", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        alert("WFH request submitted successfully!");
        loadDashboard(); // Return to dashboard
      } else {
        alert(`Error: ${result.message || "Failed to submit WFH request"}`);
      }

    } catch (error) {
      console.error("Error submitting WFH request:", error);
      alert("An error occurred while submitting the request. Please try again.");
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit';
    }
  });

  injectProfileSidebar();
  setLogoutListener();
  loadRecentNotices();
}

// Add event listener for WFH button
if (document.getElementById("btn-wfh")) {
  document.getElementById("btn-wfh").addEventListener("click", loadWFHRequest);
}

// Add event listener for WFH Approval button
if (document.getElementById("btn-wfh-approval")) {
  document.getElementById("btn-wfh-approval").addEventListener("click", loadWFHApproval);
}

// Add WFH Approval Section
function loadWFHApproval() {
  console.log("loadWFHApproval function called"); // Debug log
  try {
    // Security check - only admin and HR roles can approve WFH
    const employee = JSON.parse(localStorage.getItem("employee"));
    console.log("Employee data:", employee); // Debug log
    if (!employee) {
      alert("Please login to access WFH approval.");
      return;
    }
    
    const isAdminRole = employee.role === "admin" || employee.role === "hr_admin";
    const isHRRole =
      employee.role === "hr_admin" ||
      employee.role === "hr_manager" ||
      employee.role === "hr_executive" ||
      employee.role === "hr_recruiter";
    console.log("Role check - isAdminRole:", isAdminRole, "isHRRole:", isHRRole, "userRole:", employee.role); // Debug log
    if (!isAdminRole && !isHRRole) {
      alert("Access denied. Only administrators and HR personnel can approve WFH requests.");
      return;
    }
    setActive("btn-wfh-approval");
    mainContent.innerHTML = `
        <div class="admin-content-section wfh-approval-section" id="wfh-approval-section">
          <h2><i class="fas fa-laptop-house"></i> WFH Approval Requests</h2>
          <div class="wfh-requests-container">
            <div class="filters">
              <select id="wfhStatusFilter" class="filter-select">
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
              <input type="text" id="wfhEmployeeFilter" class="filter-input" placeholder="Search by Employee ID or Name">
            </div>
            <div class="wfh-requests-table">
              <table>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>WFH Reason</th>
                    <th>Additional Details</th>
                    <th>WFH Count</th>
                    <th>From Date</th>
                    <th>To Date</th>
                    <th>Attachment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="wfhRequestsBody">
                  <tr>
                    <td colspan="10" class="loading">Loading WFH requests...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

    // Add styles for the WFH approval page
    const style = document.createElement("style");
    style.textContent = `
        .wfh-approval-section {
          max-width: 1100px;
          margin: 40px auto;
          background: rgba(255,255,255,0.13);
          border-radius: 18px;
          box-shadow: 0 8px 32px rgba(67, 206, 162, 0.18), 0 3px 16px rgba(118, 75, 162, 0.13);
          padding: 32px 32px 24px 32px;
          color: #fff;
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1.5px solid rgba(255,255,255,0.18);
        }
        .wfh-requests-container {
          width: 100%;
          overflow-x: auto;
        }
        .filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .filter-select, .filter-input {
          padding: 0.5rem;
          border: 1px solid #e0d7f3;
          border-radius: 8px;
          background: rgba(255,255,255,0.85);
        }
        .wfh-requests-table {
          width: 100%;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: rgba(255,255,255,0.22);
          border-radius: 12px;
          overflow: hidden;
        }
        th, td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          max-width: 150px;
          word-wrap: break-word;
        }
        th {
          background: rgba(118, 75, 162, 0.1);
          font-weight: 600;
          color: #3a2c5c;
        }
        tr:hover {
          background: rgba(255,255,255,0.1);
        }
        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .status-pending {
          background: #fff3cd;
          color: #856404;
        }
        .status-approved {
          background: #d4edda;
          color: #155724;
        }
        .status-rejected {
          background: #f8d7da;
          color: #721c24;
        }
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        .approve-btn, .reject-btn {
          padding: 0.4rem 0.8rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.3s ease;
        }
        .approve-btn {
          background: #28a745;
          color: white;
        }
        .reject-btn {
          background: #dc3545;
          color: white;
        }
        .approve-btn:hover, .reject-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
        .attachment-link {
          color: #007bff;
          text-decoration: underline;
          cursor: pointer;
        }
        .attachment-link:hover {
          color: #0056b3;
        }
        .no-data {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
        @media (max-width: 900px) {
          .wfh-approval-section {
            padding: 16px 4vw;
          }
          th, td {
            padding: 0.7rem;
            max-width: 120px;
          }
        }
      `;
    document.head.appendChild(style);

    // Load WFH requests from backend
    setTimeout(() => {
      loadWFHRequests();
    }, 100);

    // Add event listeners for filters
    setTimeout(() => {
      const statusFilter = document.getElementById("wfhStatusFilter");
      const employeeFilter = document.getElementById("wfhEmployeeFilter");

      if (statusFilter) {
        statusFilter.addEventListener("change", loadWFHRequests);
      }
      if (employeeFilter) {
        employeeFilter.addEventListener("input", debounce(loadWFHRequests, 500));
      }
    }, 200);

    injectProfileSidebar();
  } catch (error) {
    console.error("Error loading WFH approval section:", error);
    alert("Error loading WFH approval section. Please try again.");
  }
}

// Function to load WFH requests
async function loadWFHRequests() {
  try {
    console.log("Loading WFH requests...");
    const statusFilter = document.getElementById("wfhStatusFilter");
    const employeeFilter = document.getElementById("wfhEmployeeFilter");
    const tbody = document.getElementById("wfhRequestsBody");

    // Check if elements exist
    if (!statusFilter || !employeeFilter || !tbody) {
      console.error("Required elements not found");
      return;
    }

    // Show loading
    tbody.innerHTML = '<tr><td colspan="10" class="loading">Loading WFH requests...</td></tr>';

    // Build query parameters
    const params = new URLSearchParams();
    if (statusFilter.value !== "all") {
      params.append("status", statusFilter.value);
    }
    if (employeeFilter.value.trim()) {
      params.append("employeeName", employeeFilter.value.trim());
    }

    // Fetch from backend - Use consistent token key
    const token = localStorage.getItem("jwtToken");
    console.log("Fetching WFH requests with params:", params.toString());
    console.log("Using token:", token ? "Token exists" : "No token found");
    
    if (!token) {
      tbody.innerHTML = '<tr><td colspan="10" class="no-data">Authentication required. Please login again.</td></tr>';
      return;
    }

    const response = await fetch(`/api/wfh-requests?${params.toString()}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("WFH Requests result:", result);

    if (result.success) {
      displayWFHRequests(result.wfhRequests);
    } else {
      tbody.innerHTML = '<tr><td colspan="10" class="no-data">Error loading WFH requests: ' + (result.message || 'Unknown error') + '</td></tr>';
    }

  } catch (error) {
    console.error("Error loading WFH requests:", error);
    const tbody = document.getElementById("wfhRequestsBody");
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="10" class="no-data">Error loading WFH requests: ' + error.message + '</td></tr>';
    }
  }
}

// Function to display WFH requests
function displayWFHRequests(requests) {
  const tbody = document.getElementById("wfhRequestsBody");

  if (!requests || requests.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="no-data">No WFH requests found</td></tr>';
    return;
  }

  tbody.innerHTML = requests.map(request => `
    <tr>
      <td>${request.employeeId}</td>
      <td>${request.employeeName}</td>
      <td>${request.reason || "-"}</td>
      <td>${request.comments || "-"}</td>
      <td>${request.wfhCount}</td>
      <td>${new Date(request.fromDate).toLocaleDateString()}</td>
      <td>${new Date(request.toDate).toLocaleDateString()}</td>
      <td>
        ${request.attachment ? 
          `<a href="#" class="attachment-link" data-id="${request._id}">
            <i class="fas fa-paperclip"></i> View
           </a>` : 
          "-"
        }
      </td>
      <td>
        <span class="status-badge status-${request.status.toLowerCase()}">
          ${request.status}
        </span>
      </td>
      <td>
        ${request.status === "Pending" ? `
          <div class="action-buttons">
            <button class="approve-btn" onclick="approveWFHRequest('${request._id}')">
              <i class="fas fa-check"></i> Approve
            </button>
            <button class="reject-btn" onclick="rejectWFHRequest('${request._id}')">
              <i class="fas fa-times"></i> Reject
            </button>
          </div>
        ` : `
          ${request.approvedBy ? `By: ${request.approvedBy}` : ""}
        `}
      </td>
    </tr>
  `).join("");

  // Attach click handler for attachment links
  document.querySelectorAll('.attachment-link').forEach(link => {
    link.addEventListener('click', async function(e) {
      e.preventDefault();
      const id = this.getAttribute('data-id');
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }
      try {
        const response = await fetch(`/api/wfh-requests/${id}/attachment`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch attachment');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      } catch (err) {
        alert('Failed to open attachment.');
      }
    });
  });
}
// Function to approve WFH request
async function approveWFHRequest(requestId) {
  if (!confirm("Are you sure you want to approve this WFH request?")) {
    return;
  }

  try {
    const comments = prompt("Enter any comments (optional):");
    
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      alert("Authentication required. Please login again.");
      return;
    }

    const response = await fetch(`/api/wfh-requests/${requestId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        status: "Approved",
        comments: comments || ""
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      alert("WFH request approved successfully!");
      loadWFHRequests(); // Reload the list
    } else {
      alert(`Error: ${result.message || "Failed to approve request"}`);
    }

  } catch (error) {
    console.error("Error approving WFH request:", error);
    alert("An error occurred while approving the request: " + error.message);
  }
}

// Function to reject WFH request
async function rejectWFHRequest(requestId) {
  if (!confirm("Are you sure you want to reject this WFH request?")) {
    return;
  }

  try {
    const comments = prompt("Enter rejection reason (optional):");
    
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      alert("Authentication required. Please login again.");
      return;
    }

    const response = await fetch(`/api/wfh-requests/${requestId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        status: "Rejected",
        comments: comments || ""
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      alert("WFH request rejected successfully!");
      loadWFHRequests(); // Reload the list
    } else {
      alert(`Error: ${result.message || "Failed to reject request"}`);
    }

  } catch (error) {
    console.error("Error rejecting WFH request:", error);
    alert("An error occurred while rejecting the request: " + error.message);
  }
}

// Debounce function for search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Add event listeners for Notice Board and Notifications
if (document.getElementById("btn-notice-board")) {
  document.getElementById("btn-notice-board").addEventListener("click", loadNoticeBoard);
}

if (document.getElementById("btn-notifications")) {
  document.getElementById("btn-notifications").addEventListener("click", loadNotifications);
}

// Notice Board Section (Admin/HR only)
function loadNoticeBoard() {
  // Security check - only admin, hr_admin, and hr_recruiter roles can send notices
  const employee = JSON.parse(localStorage.getItem("employee"));
  if (!employee || !employee.role) {
    alert("Access denied. Only administrators and HR personnel can send notices.");
    return;
  }
  // Normalize role to lower case for robust comparison
  const role = employee.role.toLowerCase();
  const allowedRoles = ["admin", "hr_admin", "hr_recruiter","hr_executive"];
  if (!allowedRoles.includes(role)) {
    alert("Access denied. Only administrators and HR personnel can send notices.");
    return;
  }

  setActive("btn-notice-board");
  mainContent.innerHTML = `
      <div class="admin-content-section notice-board-section" id="notice-board-section">
        <h2><i class="fas fa-bullhorn"></i> Notice Board</h2>
        <div id="recent-form-container">
          <form id="noticeBoardForm" class="section-form">
            <div class="form-group">
              <label for="noticeMessage" style="color: #8C001A;font-weight:bold;font-size:1.2rem;">Notice Message</label>
              <textarea 
                id="noticeMessage" 
                name="noticeMessage" 
                placeholder="Enter your notice message here..." 
                required
                rows="6"
              ></textarea>
            </div>
            <div class="form-group" id="employeeIdGroup" style="display: none;">
              <label for="employeeId">Employee ID</label>
              <input 
                type="text" 
                id="employeeId" 
                name="employeeId" 
                placeholder="Enter Employee ID"
              />
            </div>
            <div class="notice-actions">
              <button type="button" id="sendBtn" class="notice-btn send-btn">
                <i class="fas fa-paper-plane"></i> Send
              </button>
              <button type="button" id="sendAllBtn" class="notice-btn send-all-btn">
                <i class="fas fa-broadcast-tower"></i> Send All
              </button>
              <button type="button" id="cancelNoticeBtn" class="notice-btn cancel-btn">
                <i class="fas fa-times"></i> Cancel
              </button>
            </div>
          </form>
          <div id="recentNoticesContainer">
            <h3><i class="fas fa-history"></i> Recent Notices</h3>
            <div id="recentNoticesList">
              <div class="no-notices">No recent notices</div>
            </div>
          </div>
        </div>
      </div>
    `;

  // Add event listeners for notice board buttons
  document.getElementById("sendBtn").addEventListener("click", function () {
    setMode("individual");
    handleSendNotice();
  });

  document.getElementById("sendAllBtn").addEventListener("click", function () {
    setMode("all");
    handleSendAllNotices();
  });

  document.getElementById("cancelNoticeBtn").addEventListener("click", handleCancelNotice);

  // Show/hide employee ID field based on button clicks
  let currentMode = null;

  function setMode(mode) {
    currentMode = mode;
    const employeeIdGroup = document.getElementById("employeeIdGroup");
    const employeeIdInput = document.getElementById("employeeId");

    if (mode === "individual") {
      employeeIdGroup.style.display = "block";
      employeeIdInput.required = true;
      employeeIdInput.focus();
    } else {
      employeeIdGroup.style.display = "none";
      employeeIdInput.required = false;
      employeeIdInput.value = "";
    }
  }

  async function handleSendNotice() {
    const message = document.getElementById("noticeMessage").value.trim();
    const employeeId = document.getElementById("employeeId").value.trim();

    if (!message) {
      alert("Please enter a notice message.");
      return;
    }

    if (currentMode === "individual" && !employeeId) {
      alert("Please enter an Employee ID.");
      return;
    }

    try {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          recipientId: employeeId,
          isForAll: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNoticeStatus("Notice sent successfully!", "success");
        await loadRecentNotices(); // <-- reload recent notices
      } else {
        showNoticeStatus(data.message || "Failed to send notice.", "error");
      }
    } catch (err) {
      showNoticeStatus("Error sending notice.", "error");
    }

    // Clear form
    document.getElementById("noticeMessage").value = "";
    const empIdInput = document.getElementById("employeeId");
    if (empIdInput) empIdInput.value = "";
    const empIdGroup = document.getElementById("employeeIdGroup");
    if (empIdGroup) empIdGroup.style.display = "none";
  }

  async function handleSendAllNotices() {
    const message = document.getElementById("noticeMessage").value.trim();

    if (!message) {
      alert("Please enter a notice message.");
      return;
    }

    try {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          isForAll: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNoticeStatus("Notice sent to all employees!", "success");
        await loadRecentNotices(); // <-- reload recent notices
      } else {
        showNoticeStatus(data.message || "Failed to send notice.", "error");
      }
    } catch (err) {
      showNoticeStatus("Error sending notice.", "error");
    }

    // Clear form
    document.getElementById("noticeMessage").value = "";
    const empIdInput = document.getElementById("employeeId");
    if (empIdInput) empIdInput.value = "";
    const empIdGroup = document.getElementById("employeeIdGroup");
    if (empIdGroup) empIdGroup.style.display = "none";
  }

  function handleCancelNotice() {
    document.getElementById("noticeMessage").value = "";
    const empIdInput = document.getElementById("employeeId");
    if (empIdInput) empIdInput.value = "";
    const empIdGroup = document.getElementById("employeeIdGroup");
    if (empIdGroup) empIdGroup.style.display = "none";
    showNoticeStatus("Notice cancelled.", "info");
  }

  function showNoticeStatus(message, type) {
    const statusDiv = document.createElement("div");
    statusDiv.className = `notice-status notice-status-${type}`;
    statusDiv.textContent = message;

    // Try to find the correct container
    let formContainer = document.getElementById("noticeBoardFormContainer");
    if (!formContainer) {
      // Fallback: try recent-form-container (the parent in the HTML)
      formContainer = document.getElementById("recent-form-container");
    }
    if (!formContainer) {
      // Fallback: try the main notice board section
      formContainer = document.querySelector(".notice-board-section");
    }
    if (!formContainer) {
      // Fallback: main content
      formContainer = document.getElementById("mainContent");
    }
    if (formContainer) {
      formContainer.appendChild(statusDiv);
    } else {
      // As a last resort, alert
      alert(message);
    }
    setTimeout(() => {
      statusDiv.remove();
    }, 3000);
  }
  injectProfileSidebar();
  setLogoutListener();
  loadRecentNotices();
}

// Notifications Section
function loadNotifications() {
  setActive("btn-notifications");
  mainContent.innerHTML = `
      <div class="admin-content-section notice-board-section" id="notification-section">
        <h2><i class="fas fa-bell"></i> Notifications</h2>
        <div id="notificationsList">
          <div class="loading-notifications">Loading notifications...</div>
        </div>
      </div>
    `;

  // Load notifications
  loadNotificationsList();
  injectProfileSidebar();
}

// Add My Profile floating avatar button and sidebar
function injectProfileSidebar() {
  // Remove any existing avatar/sidebar to prevent duplicates
  const oldAvatar = document.getElementById("myProfileAvatarBtn");
  if (oldAvatar) oldAvatar.remove();
  const oldSidebar = document.getElementById("myProfileSidebar");
  if (oldSidebar) oldSidebar.remove();
  const oldStyle = document.getElementById("myProfileSidebarStyle");
  if (oldStyle) oldStyle.remove();

  // Add avatar button
  const avatarBtn = document.createElement("div");
  avatarBtn.id = "myProfileAvatarBtn";
  avatarBtn.className = "my-profile-avatar-btn";
  const employee = JSON.parse(localStorage.getItem("employee"));
  const imgSrc =
    employee && employee._id ? `/api/employees/${employee._id}/profile-image` : "/images/logo.png";
  avatarBtn.innerHTML = `<img id="myProfileAvatarImg" src="${imgSrc}" alt="Profile" onerror="this.src='/images/logo.png'" />`;
  document.body.appendChild(avatarBtn);
  avatarBtn.style.position = "fixed";
  avatarBtn.style.top = "24px";
  avatarBtn.style.right = "36px";
  avatarBtn.style.zIndex = "3002";

  // Add sidebar
  const sidebar = document.createElement("div");
  sidebar.id = "myProfileSidebar";
  sidebar.className = "my-profile-sidebar";
  sidebar.innerHTML = `
      <div class="my-profile-sidebar-content">
        <button class="my-profile-close-btn" id="myProfileCloseBtn">&times;</button>
        <h3 style="color: #764ba2; margin-bottom: 1.5rem; text-align: center;">My Profile</h3>
        <div id="profileContent"></div>
      </div>
      <div class="my-profile-sidebar-overlay" id="myProfileSidebarOverlay"></div>
    `;
  document.body.appendChild(sidebar);

  // Add CSS
  if (!document.getElementById("myProfileSidebarStyle")) {
    const style = document.createElement("style");
    style.id = "myProfileSidebarStyle";
    style.textContent = `
        .my-profile-avatar-btn {
          position: fixed !important;
          top: 24px !important;
          right: 36px !important;
          z-index: 3002 !important;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(67,206,162,0.13);
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .my-profile-avatar-btn:hover { box-shadow: 0 4px 16px rgba(67,206,162,0.18); }
        .my-profile-avatar-btn img {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #764ba2;
        }
        .my-profile-sidebar {
          position: fixed;
          top: 0; right: 0;
          width: 370px;
          max-width: 98vw;
          height: 100vh;
          background: #fff;
          box-shadow: -4px 0 24px rgba(67,206,162,0.13);
          z-index: 3003;
          transform: translateX(100%);
          transition: transform 0.35s cubic-bezier(.77,0,.18,1);
          display: flex;
          flex-direction: column;
        }
        .my-profile-sidebar.open { transform: translateX(0); }
        .my-profile-sidebar-content {
          padding: 28px 24px 18px 24px;
          flex: 1;
          overflow-y: auto;
          position: relative;
        }
        .my-profile-close-btn {
          position: absolute;
          top: 18px; right: 18px;
          background: none;
          border: none;
          font-size: 2rem;
          color: #764ba2;
          cursor: pointer;
          z-index: 1;
        }
        .my-profile-sidebar-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.18);
          z-index: 3001;
          display: none;
        }
        .my-profile-sidebar.open ~ .my-profile-sidebar-overlay,
        .my-profile-sidebar-overlay.open { display: block; }
        @media (max-width: 600px) {
          .my-profile-avatar-btn {
            top: 12px !important;
            right: 12px !important;
            width: 40px;
            height: 40px;
          }
          .my-profile-sidebar { width: 99vw; padding: 0; }
          .my-profile-sidebar-content { padding: 16px 4vw 10px 4vw; }
        }
      `;
    document.head.appendChild(style);
  }

  // Open/close logic
  avatarBtn.onclick = () => {
    sidebar.classList.add("open");
    document.getElementById("myProfileSidebarOverlay").classList.add("open");
    renderProfileContent();
  };
  document.getElementById("myProfileCloseBtn").onclick = () => {
    sidebar.classList.remove("open");
    document.getElementById("myProfileSidebarOverlay").classList.remove("open");
  };
  document.getElementById("myProfileSidebarOverlay").onclick = () => {
    sidebar.classList.remove("open");
    document.getElementById("myProfileSidebarOverlay").classList.remove("open");
  };

  // Render profile content
  function renderProfileContent() {
    const emp = JSON.parse(localStorage.getItem("employee"));
    const profileContent = document.getElementById("profileContent");
    profileContent.innerHTML = `
        <div style="text-align:center;margin-bottom:18px;">
          <img src="${
            emp && emp._id ? `/api/employees/${emp._id}/profile-image` : "/images/logo.png"
          }" alt="Profile" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:2px solid #764ba2;box-shadow:0 2px 8px rgba(118,75,162,0.10);background:#fff;" onerror="this.src='/images/logo.png'" />
          <div id='manageAccountBtnContainer' style='display:flex;justify-content:center;margin-top:16px;margin-bottom:18px;'><button id='manageAccountBtn' class='add-employee-btn' style='width:80%;max-width:260px;text-align:center;' >Manage your account</button></div>
        </div>
        <div style="margin-bottom: 12px;"><strong>Name:</strong> ${emp.firstName || ""} ${
      emp.lastName || ""
    }</div>
        <div style="margin-bottom: 12px;"><strong>Employee ID:</strong> ${emp.employeeId}</div>
        <div style="margin-bottom: 12px;"><strong>Email:</strong> ${emp.email || "-"}</div>
        <div style="margin-bottom: 12px;"><strong>Role:</strong> ${emp.role}</div>
        <div style="margin-bottom: 12px;"><strong>Mobile:</strong> ${emp.mobile || "-"}</div>
        <div style="margin-bottom: 12px;"><strong>Date of Joining:</strong> ${
          emp.doj ? new Date(emp.doj).toLocaleDateString() : "-"
        }</div>
        <div style="margin-bottom: 12px;"><strong>Address:</strong> ${emp.address || "-"}</div>
        <div style="margin-bottom: 12px;"><strong>ID Card:</strong> ${
          emp.idCardType ? emp.idCardType.toUpperCase() : "-"
        } ${emp.idCardNumber || ""}</div>
      `;
      //console.log("Profile content rendered successfully"); // Debug log
       //console.log("manageAccountBtnContainer:", document.getElementById("manageAccountBtn")); // Debug log
    //  document.getElementById("manageAccountBtn").onclick = handleManageAccountClick;
    //document.getElementById("manageAccountBtn").addEventListener("click", handleManageAccountClick);
    handleManageAccountClick(); // Debug log
     

    // Event listener removed - now using onclick attribute in HTML
  }
 //document.getElementById("manageAccountBtn")?.addEventListener("click", handleManageAccountClick);

}
function handleManageAccountClick() {
  console.log("handleManageAccountClick called"); // Debug log
  const sidebarEl = document.getElementById('myProfileSidebar');
  const overlayEl = document.getElementById('myProfileSidebarOverlay');
  console.log("Sidebar element:", sidebarEl); // Debug log
  console.log("Overlay element:", overlayEl); // Debug log
  if (sidebarEl) sidebarEl.classList.remove('open');
  if (overlayEl) overlayEl.classList.remove('open');
  console.log("About to call showProfileInMainContent"); // Debug log
  showProfileInMainContent();
  console.log("showProfileInMainContent called successfully"); // Debug log
}


// Add Leave Tracker button for admin/HR
if (isAdminRole || isHRRole) {
  const sidebarNav = document.querySelector(".sidebar-nav");
  if (!document.getElementById("btn-leave-tracker")) {
    const leaveTrackerBtn = document.createElement("button");
    leaveTrackerBtn.id = "btn-leave-tracker";
    leaveTrackerBtn.className = "sidebar-btn";
    leaveTrackerBtn.innerHTML = '<i class="fas fa-search"></i> Leave Tracker';
    sidebarNav.insertBefore(leaveTrackerBtn, document.getElementById("btn-stats"));
    leaveTrackerBtn.addEventListener("click", () => {
      loadLeaveTracker();
      if (window.innerWidth <= 768) {
        document.getElementById("sidebar").classList.remove("show");
        document.getElementById("sidebarOverlay").classList.remove("active");
      }
    });
  }
}
// --- Leave Request Tracker Section ---
async function loadLeaveTracker() {
  setActive("btn-leave-tracker");
  mainContent.classList.add("center-flex");
  mainContent.innerHTML = `
      <div class="admin-content-section centered-section scrollable-form-container" id="leave-tracker-section">
        <h2 style="margin-bottom:30px;">Leave Request Tracker</h2>
        <form id="leaveTrackerForm" class="section-form" style="max-width:1000px;margin-bottom:2rem;">
          <div class="form-row">
            <div class="form-group">
              <label>Search by Name</label>
              <input type="text" id="leaveTrackerEmployeeName" placeholder="Type employee name..." autocomplete="off" />
              <div id="leaveTrackerNameDropdown" class="search-dropdown" style="position:relative;"></div>
            </div>
            <div class="form-group">
              <label>Employee ID</label>
              <input type="text" id="trackerEmployeeId" required placeholder="Enter Employee ID" />
            </div>
            <div class="form-group">
              <label>Month</label>
              <select id="trackerMonth" required>
                ${Array.from(
                  { length: 12 },
                  (_, i) =>
                    `<option value="${String(i + 1).padStart(2, "0")}">${new Date(
                      0,
                      i
                    ).toLocaleString("en-IN", { month: "long" })}</option>`
                ).join("")}
              </select>
            </div>
            <div class="form-group">
              <label>Year</label>
              <select id="trackerYear" required>
                ${Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return `<option value="${y}">${y}</option>`;
                }).join("")}
              </select>
            </div>
          </div>
          <div class="form-row">
            <button type="submit" class="add-employee-btn">Search</button>
          </div>
        </form>
        <div id="leaveTrackerResult"></div>
      </div>
      <style>
      .leave-tracker-table { width: 100%; border-collapse: collapse; margin-top: 1rem; background: #fff;color:#764ba2; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(67,206,162,0.08); }
      .leave-tracker-table th, .leave-tracker-table td { padding: 10px 8px; text-align: center; border-bottom: 1px solid #e0e0e0; font-size: 1rem; }
      .leave-tracker-table th { background: #f3eaff; color: #764ba2; font-weight: 600; }
      .leave-tracker-table td { background: #faf8ff; }
      .leave-tracker-table tr:last-child td { border-bottom: none; }
      .leave-tracker-table .leave-dates-cell { white-space: normal; word-break: break-all; font-size: 0.98rem; line-height: 1.3; }
      .leave-tracker-table .leave-count-cell { font-size: 1.1rem; font-weight: bold; color: #764ba2; }
      .leave-tracker-table .leave-type-cell select { padding: 4px 8px; border-radius: 6px; border: 1px solid #ccc; font-size: 1rem; }
      @media (max-width: 900px) {
        .leave-tracker-table th, .leave-tracker-table td { padding: 7px 4px; font-size: 0.97rem; }
      }
      @media (max-width: 600px) {
        .leave-tracker-table, .leave-tracker-table thead, .leave-tracker-table tbody, .leave-tracker-table tr, .leave-tracker-table th, .leave-tracker-table td { display: block; width: 100%; }
        .leave-tracker-table thead { display: none; }
        .leave-tracker-table tr { margin-bottom: 1.2em; border-radius: 10px; background: #764ba2;; box-shadow: 0 2px 8px rgba(67,206,162,0.08); }
        .leave-tracker-table td { text-align: left; padding: 10px 8px; border-bottom: none; position: relative; }
        .leave-tracker-table td:before { content: attr(data-label); font-weight: bold; color: #764ba2; display: block; margin-bottom: 2px;
        #leavveTrackerResult { width: 86vw;} 
      }
      </style>
    `;
  // Attach name search dropdown logic for leave tracker
  attachLeaveTrackerNameSearch();
  document.getElementById("leaveTrackerForm").onsubmit = async function (e) {
    e.preventDefault();
    const empId = document.getElementById("trackerEmployeeId").value.trim();
    const month = document.getElementById("trackerMonth").value;
    const year = document.getElementById("trackerYear").value;
    const resultDiv = document.getElementById("leaveTrackerResult");
    resultDiv.innerHTML = "<div>Loading...</div>";
    try {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch(
        `/api/leave-history?employeeId=${encodeURIComponent(empId)}&month=${month}&year=${year}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!data.success) {
        resultDiv.innerHTML = `<div class="error">${
          data.message || "Failed to fetch leave history."
        }</div>`;
        return;
      }
      if (!data.leaveHistory.length) {
        resultDiv.innerHTML = "<div>No leave history found for this month.</div>";
        return;
      }
      // Table header
      let hasPending = false;
      let html = `<table class="leave-tracker-table">
          <thead><tr>
            <th>Leave Dates</th>
            <th>Leave Count</th>
            <th>Leave Type</th>
            <th>Paid</th>
            <th>Unpaid</th>
            <th>Status</th>
            <th>Action</th>
          </tr></thead><tbody>`;
      data.leaveHistory.forEach((lr) => {
        const leaveDates =
          lr.leaveDates.length > 1
            ? `<div class='leave-dates-cell'>${new Date(
                lr.leaveDates[0]
              ).toLocaleDateString()}<br>to<br>${new Date(
                lr.leaveDates[lr.leaveDates.length - 1]
              ).toLocaleDateString()}</div>`
            : lr.leaveDates[0]
            ? `<div class='leave-dates-cell'>${new Date(
                lr.leaveDates[0]
              ).toLocaleDateString()}</div>`
            : "";
        html += `<tr data-id="${lr._id}">
            <td class='leave-dates-cell' data-label='Leave Dates'>${leaveDates}</td>
            <td class='leave-count-cell' data-label='Leave Count'>${lr.leaveCount}</td>
            <td class="leave-type-cell" data-label='Leave Type'>`;
        if (lr.editable && lr.leaveDates && lr.leaveDates.length > 1) {
          hasPending = true;
          html += `<div style="display:flex;flex-direction:column;gap:4px;">`;
          (lr.leaveDates || []).forEach((date, idx) => {
            const currentType = Array.isArray(lr.leaveType) ? lr.leaveType[idx] : lr.leaveType;
            html += `<div style='display:flex;align-items:center;gap:6px;'>
              <span style='min-width:90px;font-size:0.97em;'>${new Date(date).toLocaleDateString()}</span>
              <select class="leave-type-select" data-idx="${idx}">
                <option value="Pending"${currentType === "Pending" ? " selected" : ""}>Pending</option>
                <option value="CL"${currentType === "CL" ? " selected" : ""}>CL</option>
                <option value="SL"${currentType === "SL" ? " selected" : ""}>SL</option>
                <option value="NPL"${currentType === "NPL" ? " selected" : ""}>NPL</option>
                <option value="DNPL"${currentType === "DNPL" ? " selected" : ""}>DNPL</option>
              </select>
            </div>`;
          });
          html += `</div>`;
        } else if (lr.editable) {
          hasPending = true;
          html += `<select class="leave-type-select">
              <option value="Pending"${lr.leaveType === "Pending" ? " selected" : ""}>Pending</option>
              <option value="CL"${lr.leaveType === "CL" ? " selected" : ""}>CL</option>
              <option value="SL"${lr.leaveType === "SL" ? " selected" : ""}>SL</option>
              <option value="NPL"${lr.leaveType === "NPL" ? " selected" : ""}>NPL</option>
              <option value="DNPL"${lr.leaveType === "DNPL" ? " selected" : ""}>DNPL</option>
            </select>`;
        } else {
          // Show leaveType as text (array or string)
          if (Array.isArray(lr.leaveType)) {
            html += lr.leaveType.map((t, i) => `<div>${lr.leaveDates && lr.leaveDates[i] ? new Date(lr.leaveDates[i]).toLocaleDateString() + ': ' : ''}${t}</div>`).join('');
        } else {
          html += lr.leaveType;
          }
        }
        html += `</td>
            <td data-label='Paid'>${lr.paidLeaves}</td>
            <td data-label='Unpaid'>${lr.unpaidLeaves}</td>
            <td data-label='Status'>${lr.status}</td>
            <td data-label='Action'>`;
        if (lr.editable) {
          html += `<span style='color:#764ba2;font-size:1.1em;'>Editable</span>`;
        } else {
          html += "-";
        }
        html += `</td></tr>`;
      });
      html += "</tbody></table>";
      if (hasPending) {
        html += `<div style="text-align:right;margin-top:1.2em;"><button id="leaveTypeSubmitBtn" class="add-employee-btn" style="padding:8px 28px;font-size:1.08rem;">Submit</button></div>`;
      }
      html += `<div id="leaveTypeMsg" style="margin-top:1em;"></div>`;
      resultDiv.innerHTML = html;

      // --- Submit all changed leave types ---
      if (hasPending) {
        document.getElementById("leaveTypeSubmitBtn").onclick = async function () {
          const btn = this;
          btn.disabled = true;
          btn.textContent = "Saving...";
          const msgDiv = document.getElementById("leaveTypeMsg");
          msgDiv.textContent = "";
          let updates = [];
          document.querySelectorAll(".leave-tracker-table tr[data-id]").forEach((tr) => {
            const id = tr.getAttribute("data-id");
            const selects = tr.querySelectorAll(".leave-type-select");
            if (selects.length > 1) {
              // Multi-day: collect all values as array
              const newTypes = Array.from(selects).map(sel => sel.value);
              if (newTypes.some(t => t !== "Pending")) {
                updates.push({ id, leaveType: newTypes });
              }
            } else if (selects.length === 1) {
              const newType = selects[0].value;
              if (newType !== "Pending") {
                updates.push({ id, leaveType: newType });
              }
            }
          });
          if (!updates.length) {
            btn.disabled = false;
            btn.textContent = "Submit";
            msgDiv.textContent = "No changes to save.";
            return;
          }
          let success = 0,
            fail = 0;
          for (const upd of updates) {
            try {
              const res = await fetch(`/api/leave-history/${upd.id}/leave-type`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ leaveType: upd.leaveType }),
              });
              const data = await res.json();
              if (data.success) success++;
              else fail++;
            } catch {
              fail++;
            }
          }
          btn.disabled = false;
          btn.textContent = "Submit";
          if (fail === 0) {
            msgDiv.style.color = "green";
            msgDiv.textContent = "All leave types updated successfully!";
            // Optionally reload the table
            document.getElementById("leaveTrackerForm").dispatchEvent(new Event("submit"));
          } else {
            msgDiv.style.color = "red";
            msgDiv.textContent = `Some updates failed. Success: ${success}, Failed: ${fail}`;
          }
        };
      }
    } catch (err) {
      resultDiv.innerHTML = '<div class="error">Error fetching leave history.</div>';
    }
  };
  setLogoutListener();
  injectProfileSidebar();
}

// Add this function at the bottom of the file or after similar attach*NameSearch functions
function attachLeaveTrackerNameSearch() {
  const nameInput = document.getElementById("leaveTrackerEmployeeName");
  const idInput = document.getElementById("trackerEmployeeId");
  const dropdown = document.getElementById("leaveTrackerNameDropdown");
  let nameTimeout;
  if (nameInput && idInput && dropdown) {
    nameInput.addEventListener("input", function() {
      clearTimeout(nameTimeout);
      const value = this.value.trim();
      dropdown.innerHTML = "";
      if (value.length < 2) return;
      nameTimeout = setTimeout(async () => {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch(`/api/employees/search?name=${encodeURIComponent(value)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.employees.length) {
          dropdown.innerHTML = `<div style='position:absolute;z-index:1000;background:#fff;border:1px solid #ccc;width:100%;max-height:180px;overflow:auto;'>${data.employees.map(emp => {
            const displayName = `${emp.firstName || emp.name || ''} ${emp.lastName || ''}`.trim();
            return `<div class='dropdown-item' style='padding:8px;cursor:pointer;color:#8C001A;' data-id='${emp.employeeId}' data-name='${displayName.replace(/'/g, "&#39;")}' >${displayName} <span style='color:#764ba2;font-weight:bold;'>(${emp.employeeId})</span></div>`;
          }).join('')}</div>`;
          dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.onclick = function(e) {
              idInput.value = this.getAttribute('data-id');
              nameInput.value = this.getAttribute('data-name');
              dropdown.innerHTML = "";
              e.stopPropagation();
            };
          });
        }
      }, 300);
    });
    // Hide dropdown on outside click
    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target) && e.target !== nameInput) {
        dropdown.innerHTML = "";
      }
    });
  }
}

// Add Word Count Entry Section for Admin/HR
function getTodayISTDateString() {
  const now = new Date();
  // IST offset in minutes: 5 hours 30 minutes = 330 minutes
  const istOffset = 330;
  // Get UTC time + IST offset
  const istTime = new Date(now.getTime() + (istOffset * 60 * 1000));
  // Format as YYYY-MM-DD
  return istTime.toISOString().slice(0, 10);
}

function loadWordCountEntry() {
  setActive("btn-word-count-entry");
  mainContent.classList.add("center-flex");
  mainContent.innerHTML = `
      <div class="admin-content-section centered-section scrollable-form-container" id="word-count-entry-section">
        <h2>Word Count Entry</h2>
        <form id="wordCountEntryForm" class="section-form add-employee-flex-row">
          <div class="form-row" style="flex-wrap: wrap; gap: 15px;">
            <div class="form-group" style="flex: 1; min-width: 250px; position:relative;">
              <label>Employee Name</label>
              <input type="text" id="wordCountEmployeeName" autocomplete="off" placeholder="Type employee name..." style="width:100%;min-width:0;" />
              <div id="wordCountNameDropdown" style="width:100%;position:absolute;z-index:1000;"></div>
            </div>
            <div class="form-group" style="flex: 1; min-width: 250px;">
              <label>Employee ID</label>
              <input type="text" name="employeeId" id="wordCountEmployeeId" required placeholder="Enter Employee ID" />
            </div>
            <div class="form-group" style="flex: 1; min-width: 250px;">
              <label>Today's Word Count</label>
              <input type="number" name="wordCount" min="0" required placeholder="Enter word count" />
            </div>
            <div class="form-group" style="flex: 1; min-width: 250px;">
              <label>Date</label>
              <input type="date" name="date" required value="${getTodayISTDateString()}" />
            </div>
          </div>
          <div class="button-container">
            <button type="submit" class="add-employee-btn">Submit</button>
          </div>
          <div id="wordCountEntryMsg" style="margin-top:1rem;"></div>
        </form>
      </div>
    `;
  // Attach name search dropdown logic for word count entry
  attachWordCountNameSearch();
  document.getElementById("wordCountEntryForm").onsubmit = async function (e) {
    e.preventDefault();
    const form = e.target;
    const employeeId = form.employeeId.value.trim();
    const wordCount = parseInt(form.wordCount.value);
    const date = form.date.value;
    const msgDiv = document.getElementById("wordCountEntryMsg");
    msgDiv.textContent = "";
    try {
      const token = localStorage.getItem("jwtToken");
      // Get current admin/HR's employeeId for createdBy
      const currentUser = JSON.parse(localStorage.getItem("employee"));
      const createdBy = currentUser && currentUser.employeeId ? currentUser.employeeId : "";
      const res = await fetch("/api/word-count", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employeeId, wordCount, date, createdBy }),
      });
      const data = await res.json();
      if (data.success) {
        msgDiv.style.color = "green";
        msgDiv.textContent = "Word count submitted successfully!";
        form.reset();
        form.date.value = getTodayISTDateString();
      } else {
        msgDiv.style.color = "red";
        msgDiv.textContent = data.message || "Failed to submit word count.";
      }
    } catch (err) {
      msgDiv.style.color = "red";
      msgDiv.textContent = "Error submitting word count.";
    }
  };
  setLogoutListener();
  injectProfileSidebar();
}

// --- Add this function for Word Count Entry name search ---
function attachWordCountNameSearch() {
  const nameInput = document.getElementById("wordCountEmployeeName");
  const idInput = document.getElementById("wordCountEmployeeId");
  const dropdown = document.getElementById("wordCountNameDropdown");
  let nameTimeout;
  if (nameInput && idInput && dropdown) {
    nameInput.addEventListener("input", function() {
      clearTimeout(nameTimeout);
      const value = this.value.trim();
      dropdown.innerHTML = "";
      if (value.length < 2) return;
      nameTimeout = setTimeout(async () => {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch(`/api/employees/search?name=${encodeURIComponent(value)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.employees.length) {
          dropdown.innerHTML = `<div style='position:absolute;z-index:1000;background:#fff;border:1px solid #ccc;width:100%;max-height:180px;overflow:auto;'>${data.employees.map(emp => {
            const displayName = `${emp.firstName || emp.name || ''} ${emp.lastName || ''}`.trim();
            return `<div class='dropdown-item' style='padding:8px;cursor:pointer;color:#8C001A;' data-id='${emp.employeeId}' data-name='${displayName.replace(/'/g, "&#39;")}' >${displayName} <span style='color:#764ba2;font-weight:bold;'>(${emp.employeeId})</span></div>`;
          }).join('')}</div>`;
          dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.onclick = function(e) {
              idInput.value = this.getAttribute('data-id');
              nameInput.value = this.getAttribute('data-name');
              dropdown.innerHTML = "";
              e.stopPropagation();
            };
          });
        }
      }, 300);
    });
    // Hide dropdown on outside click
    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target) && e.target !== nameInput) {
        dropdown.innerHTML = "";
      }
    });
  }
}
// --- Attendance Tracker Section ---
async function loadAttendanceTracker() {
  setActive("btn-attendance-tracker");
  mainContent.classList.add("center-flex");
  mainContent.innerHTML = `
      <div class="admin-content-section centered-section scrollable-form-container" id="attendance-tracker-section">
        <h2 style="color: #8C001A;font-weight:bold;font-size:1.8rem;margin-bottom:25px;">Attendance Tracker</h2>
        <form id="attendanceTrackerForm" class="section-form" style="max-width:1240px;width:90%;margin-bottom:2rem;">
          <div class="form-row" style="display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-end;">
            <div class="form-group" style="flex:1 1 220px;min-width:200px;position:relative;">
              <label style="margin-bottom:6px;">Employee Name</label>
              <input type="text" id="attTrackerEmployeeName" autocomplete="off" placeholder="Enter Employee Name" style="width:100%;min-width:0;" />
              <div id="attTrackerNameDropdown" style="width:100%;"></div>
            </div>
            <div class="form-group" style="flex:1 1 160px;min-width:140px;">
              <label style="margin-bottom:6px;">Employee ID</label>
              <input type="text" id="attTrackerEmployeeId" required placeholder="Enter Employee ID" style="width:100%;min-width:0;" />
            </div>
            <div class="form-group" style="flex:0 1 110px;min-width:90px;">
              <label style="margin-bottom:6px;">Month</label>
              <select id="attTrackerMonth" required style="width:100%;min-width:0;">
                ${Array.from(
                  { length: 12 },
                  (_, i) =>
                    `<option value="${String(i + 1).padStart(2, "0")}">${new Date(
                      0,
                      i
                    ).toLocaleString("en-IN", { month: "long" })}</option>`
                ).join("")}
              </select>
            </div>
            <div class="form-group" style="flex:0 1 90px;min-width:70px;">
              <label style="margin-bottom:6px;">Year</label>
              <select id="attTrackerYear" required style="width:100%;min-width:0;">
                ${Array.from({ length: 5 }, (_, i) => {
                  const y = new Date().getFullYear() - i;
                  return `<option value="${y}">${y}</option>`;
                }).join("")}
              </select>
            </div>
          </div>
          <div class="form-row" style="justify-content:flex-start;margin-top:1.2rem;">
            <button type="submit" class="add-employee-btn">Search</button>
          </div>
        </form>
        <div id="attendanceTrackerResult" class="attendance-tracker-result-scrollable"></div>
      </div>
      <style>
        @media (max-width: 700px) {
          #attendance-tracker-section .form-row {
            flex-direction: column !important;
            gap: 0.7rem !important;
            align-items: stretch !important;
          }
        }
        #attTrackerNameDropdown > div {
          left: 0;
          right: 0;
        }
      </style>
    `;
  // Attach name search dropdown logic
  attachAttendanceTrackerNameSearch();
  document.getElementById("attendanceTrackerForm").onsubmit = async function (e) {
    e.preventDefault();
    const empId = document.getElementById("attTrackerEmployeeId").value.trim();
    const month = document.getElementById("attTrackerMonth").value;
    const year = document.getElementById("attTrackerYear").value;
    const resultDiv = document.getElementById("attendanceTrackerResult");
    resultDiv.innerHTML = "<div>Loading...</div>";
    try {
      const token = localStorage.getItem("jwtToken");
      // Fetch employee details
      const empRes = await fetch(`/api/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const empData = await empRes.json();
      let employee = null;
      if (empData.success && Array.isArray(empData.employees)) {
        employee = empData.employees.find(
          (emp) => emp.employeeId && emp.employeeId.toLowerCase() === empId.toLowerCase()
        );
      }
      if (!employee) {
        resultDiv.innerHTML = '<div class="error">No employee found with this ID.</div>';
        return;
      }
      // Fetch attendance summary
      const attRes = await fetch(
        `/api/attendance-summary?employeeId=${encodeURIComponent(
          empId
        )}&month=${month}&year=${year}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const attData = await attRes.json();
      console.log(attData);
      if (!attData || !attData.success || !Array.isArray(attData.days)) {
        resultDiv.innerHTML = '<div class="error">No attendance data found for this month.</div>';
        return;
      }
      // Fetch all attendance records for the month
      const attAllRes = await fetch(
        `/api/attendance?employeeId=${encodeURIComponent(empId)}&month=${month}&year=${year}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const attAllData = await attAllRes.json();
      console.log("AttALLDATA->",attAllData);
      if (!attAllData || !attAllData.success || !Array.isArray(attAllData.attendance)) {
        resultDiv.innerHTML =
          '<div class="error">No detailed attendance records found for this month.</div>';
        return;
      }
      // Calculate late entry count
      let lateCount = attAllData.attendance.filter((a) => a.lateEntry).length;
      // ... (rest of the rendering logic remains unchanged)
      // Build summary cards with labels
      let summaryHtml = `
          <div class="attendance-tracker-summary-cards">
            <div class="attendance-tracker-summary-card present-card">
              <div class="summary-label">Present</div>
              <div class="summary-value">${attData.attendanceCount}</div>
            </div>
            <div class="attendance-tracker-summary-card absent-card">
              <div class="summary-label">Absent</div>
              <div class="summary-value">${
                attData.days.filter((d) => d.attendanceStatus === "Absent").length
              }</div>
            </div>
            <div class="attendance-tracker-summary-card late-card">
              <div class="summary-label">Late Entry</div>
              <div class="summary-value">${lateCount}</div>
            </div>
            <div class="attendance-tracker-summary-card early-card">
              <div class="summary-label">Early Checkout</div>
              <div class="summary-value">${attData.earlyCheckoutCount || 0}</div>
            </div>
          </div>
        `;
      // Calendar grid with title, icons, and tooltips
      // Add dynamic month/year heading
      const monthNames = [
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
      ];
      const monthNum = parseInt(month, 10) - 1;
      const calendarHeading = `<div class="attendance-tracker-calendar-heading" style="font-size:1.18rem;font-weight:700;color:#764ba2;text-align:center;margin-bottom:0.5rem;">${monthNames[monthNum]}, ${year}</div>`;
      let calendarHtml = `
          <div class="attendance-tracker-calendar-container">
            ${calendarHeading}
            <div class="attendance-tracker-calendar-title">Attendance Calendar</div>
            <div class="attendance-tracker-calendar-flex">
        `;
      // Ensure all days of the month are shown, even if no attendance record exists
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayData = attData.days.find(day => day.date === dateStr);
        let statusClass = "absent";
        let icon = "<span title=\"Absent\" style=\"color:#fff;font-size:1.1em;\">&#10060;</span>";
        let statusText = "Absent";
        if (dayData) {
          // Always use attendanceStatus for present/absent
          if (dayData.attendanceStatus === "Present") {
            statusClass = "present";
            // Now check for late/early for icon only
            const lateDay = attAllData.attendance && attAllData.attendance.find(a => a.date && a.date.slice(0, 10) === dayData.date && a.lateEntry);
            const earlyDay = attAllData.attendance && attAllData.attendance.find(a => a.date && a.date.slice(0, 10) === dayData.date && a.earlyCheckout);
            if (lateDay) {
              icon = '<span title="Late Entry" style="color:#fff;font-size:1.1em;">&#128336;</span>';
              statusText = "Late Entry";
            } else if (earlyDay) {
              icon = '<span title="Early Checkout" style="color:#fff;font-size:1.1em;">&#9200;</span>';
              statusText = "Early Checkout";
            } else {
              icon = '<span title="Present" style="color:#fff;font-size:1.1em;">&#10003;</span>';
              statusText = "Present";
            }
          } else {
            // Only show late/early icon if not present
            const lateDay = attAllData.attendance && attAllData.attendance.find(a => a.date && a.date.slice(0, 10) === dayData.date && a.lateEntry);
            const earlyDay = attAllData.attendance && attAllData.attendance.find(a => a.date && a.date.slice(0, 10) === dayData.date && a.earlyCheckout);
            if (lateDay) {
              statusClass = "late";
              icon = '<span title="Late Entry" style="color:#fff;font-size:1.1em;">&#128336;</span>';
              statusText = "Late Entry";
            } else if (earlyDay) {
              statusClass = "early";
              icon = '<span title="Early Checkout" style="color:#fff;font-size:1.1em;">&#9200;</span>';
              statusText = "Early Checkout";
            }
          }
        }
        calendarHtml += `<div class="attendance-tracker-calendar-day ${statusClass}" tabindex="0" title="${dateStr}: ${statusText}">${icon}<div style='font-size:0.95em;'>${d}</div></div>`;
      }
      calendarHtml += "</div></div>";
      // Restore calendarStyle definition before use (do not delete empInfoHtml)
      let calendarStyle = `
          <style>
          .attendance-tracker-summary-cards {
            display: flex;
            gap: 1.2rem;
            margin: 1.5rem 0 1.2rem 0;
            justify-content: center;
            align-items: stretch;
          }
          .attendance-tracker-summary-card {
            background: #fff;
            border-radius: 14px;
            box-shadow: 0 2px 8px rgba(67,206,162,0.10);
            padding: 1.2rem 1.5rem 1.1rem 1.5rem;
            min-width: 110px;
            text-align: center;
            flex: 1 1 110px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .attendance-tracker-summary-card .summary-label {
            font-size: 1.05rem;
            color: #764ba2;
            font-weight: 600;
            margin-bottom: 0.4em;
          }
          .attendance-tracker-summary-card .summary-value {
            font-size: 2.1rem;
            font-weight: bold;
            color: #43cea2;
            margin-bottom: 0.1em;
          }
          .attendance-tracker-summary-card.present-card .summary-value {
            color: #43cea2;
          }
          .attendance-tracker-summary-card.absent-card .summary-value {
            color: #ff758c;
          }
          .attendance-tracker-summary-card.late-card .summary-value {
            color: #ffb347;
          }
          .attendance-tracker-summary-card.early-card .summary-value {
            color: #ff9800;
          }
          @media (max-width: 600px) {
            .attendance-tracker-summary-cards {
              flex-direction: column;
              gap: 0.8rem;
            }
            .attendance-tracker-summary-card {
              min-width: 0;
              padding: 1.1rem 0.7rem 1rem 0.7rem;
            }
          }
          .attendance-tracker-calendar-container {
            margin-top: 2.2rem;
            background: #fff;
            border-radius: 18px;
            box-shadow: 0 2px 12px rgba(67, 206, 162, 0.10);
            padding: 18px 10px 10px 10px;
            max-width: 420px;
            margin-left: auto;
            margin-right: auto;
          }
          .attendance-tracker-calendar-heading {
            font-size: 1.18rem;
            font-weight: 700;
            color: #764ba2;
            text-align: center;
            margin-bottom: 0.5rem;
          }
          .attendance-tracker-calendar-title {
            font-size: 1.12rem;
            color: #764ba2;
            font-weight: 600;
            margin-bottom: 10px;
            text-align: center;
          }
          .attendance-tracker-calendar-flex {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 6px;
            justify-items: center;
          }
          .attendance-tracker-calendar-day {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 1.08rem;
            background: #e0c3fc;
            color: #3a2c5c;
            cursor: pointer;
            transition: 0.2s;
            box-shadow: 0 1px 4px rgba(67,206,162,0.07);
            margin-bottom: 2px;
            position: relative;
          }
          .attendance-tracker-calendar-day.present {
            background: #43cea2;
            color: #fff;
            font-weight: bold;
          }
          .attendance-tracker-calendar-day.absent {
            background: #ff758c;
            color: #fff;
            font-weight: bold;
          }
          .attendance-tracker-calendar-day.late {
            background: #ffb347;
            color: #fff;
            font-weight: bold;
          }
          .attendance-tracker-calendar-day.early {
            background: #ff9800;
            color: #fff;
            font-weight: bold;
          }
          .attendance-tracker-calendar-day:hover, .attendance-tracker-calendar-day:focus {
            box-shadow: 0 2px 8px rgba(67,206,162,0.13);
            transform: scale(1.08);
            outline: none;
          }
          .attendance-tracker-calendar-day span {
            display: block;
            line-height: 1;
          }
          @media (max-width: 600px) {
            .attendance-tracker-calendar-container {
              max-width: 99vw;
              padding: 8px 2vw 8px 2vw;
            }
            .attendance-tracker-calendar-flex {
              grid-template-columns: repeat(7, 1fr);
              gap: 4px;
            }
            .attendance-tracker-calendar-day {
              width: 28px;
              height: 28px;
              font-size: 0.98rem;
              border-radius: 7px;
            }
          }
          </style>
        `;
      // Build employee info HTML safely (define before use)
      let empInfoHtml = "";
      if (employee && (employee.firstName || employee.name)) {
        empInfoHtml = `
          <div style="margin-bottom:1.2rem;text-align:center;">
            <strong>Employee Name:</strong> ${employee.firstName || employee.name || ""} ${employee.lastName || ""} &nbsp; | &nbsp;
            <strong>Designation:</strong> ${employee.role || ""}
          </div>
        `;
      }
      resultDiv.innerHTML = empInfoHtml + summaryHtml + calendarHtml + calendarStyle;
    } catch (err) {
      console.error("Attendance Tracker error:", err);
      resultDiv.innerHTML = '<div class="error">Error fetching attendance data.</div>';
    }
  };
  setLogoutListener();
  injectProfileSidebar();
}

// --- Enhanced: Group and show breakdown for multi-month leave requests ---
function groupLeaveRequestsByOriginal(requests) {
    // Group by reason, comments, and consecutive dates (simple heuristic)
  const groups = [];
  let last = null;
  for (const req of requests.sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))) {
    if (
      last &&
      req.reason === last.reason &&
      req.comments === last.comments &&
      req.employeeId === last.employeeId &&
      new Date(req.fromDate) - new Date(last.toDate) <= 86400000 // consecutive days
    ) {
      last._group.push(req);
      last.toDate = req.toDate; // extend group end
    } else {
      req._group = [req];
      groups.push(req);
      last = req;
    }
  }
  
  // Filter out single-day leaves from showing breakdown
  return groups.map(group => {
    // Check if this is actually a multi-day leave that spans multiple months
    if (group._group.length === 1) {
      // Single leave request - no breakdown needed
      group._isMultiMonth = false;
    } else {
      // Multiple leave requests - check if they span different months
      const firstDate = new Date(group._group[0].fromDate);
      const lastDate = new Date(group._group[group._group.length - 1].toDate);
      const firstMonth = firstDate.getMonth();
      const firstYear = firstDate.getFullYear();
      const lastMonth = lastDate.getMonth();
      const lastYear = lastDate.getFullYear();
      
      group._isMultiMonth = (firstYear !== lastYear) || (firstMonth !== lastMonth);
    }
    return group;
  });
}

// Add toggle for breakdown
window.toggleBreakdown = function (btn) {
  const tr = btn.closest("tr");
  const next = tr.nextElementSibling;
  if (next && next.classList.contains("breakdown-row")) {
    next.style.display = next.style.display === "none" ? "" : "none";
   btn.textContent = next.style.display === "none" ? "Show Breakdown" : "Hide Breakdown";
  }
};

// --- Fetch and display recent notices from backend ---
// --- Fetch and display recent notices from backend ---
async function loadRecentNotices() {
  const recentNoticesList = document.getElementById("recentNoticesList");
  if (!recentNoticesList) return;
  recentNoticesList.innerHTML = '<div class="loading-notifications">Loading...</div>';
  try {
    const token = localStorage.getItem("jwtToken");
    const res = await fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.notifications) || data.notifications.length === 0) {
      recentNoticesList.innerHTML = '<div class="no-notices">No recent notices</div>';
      return;
    }
    const currentEmployee = JSON.parse(localStorage.getItem("employee"));
    const noticesHtml = data.notifications
      .slice(0, 10)
      .map((notice) => {
        let extraDetails = '';
        if (notice.reason) {
          extraDetails += `<div style='margin-top:4px;font-size:0.97em;color:#5a3d8c;background:#f3eaff;padding:4px 8px;border-radius:6px;'><strong>Reason:</strong> ${notice.reason}</div>`;
        }
        if (notice.comments) {
          extraDetails += `<div style='margin-top:2px;font-size:0.97em;color:#5a3d8c;background:#eafff3;padding:4px 8px;border-radius:6px;'><strong>Comments:</strong> ${notice.comments}</div>`;
        }
        let downloadBtn = '';
        if (notice.payslipInfo && notice.payslipInfo.employeeId && notice.payslipInfo.month && notice.payslipInfo.year) {
          const { employeeId, month, year } = notice.payslipInfo;
          //downloadBtn = `<button data-employee-id="${encodeURIComponent(employeeId)}" data-month="${encodeURIComponent(month)}" data-year="${encodeURIComponent(year)}" style="display:inline-block;margin-top:8px;padding:7px 18px;background:linear-gradient(90deg,#764ba2,#43cea2);color:#fff;border-radius:8px;font-weight:600;text-decoration:none;font-size:0.98em;border:none;cursor:pointer;">Download Pay Slip</button>`;
        } else if (notice.message && notice.message.toLowerCase().includes('pay slip')) {
          const today = new Date();
          const employeeId = currentEmployee.employeeId;
          const month = (today.getMonth() + 1).toString().padStart(2, '0');
          const year = today.getFullYear();
         // downloadBtn = `<button data-employee-id="${encodeURIComponent(employeeId)}" data-month="${encodeURIComponent(month)}" data-year="${encodeURIComponent(year)}" style="display:inline-block;margin-top:8px;padding:7px 18px;background:linear-gradient(90deg,#764ba2,#43cea2);color:#fff;border-radius:8px;font-weight:600;text-decoration:none;font-size:0.98em;border:none;cursor:pointer;">Download Pay Slip</button>`;
        }
        return `
          <div class="notice-item ${!notice.readBy.includes(currentEmployee.employeeId) ? "unread" : ""}" data-notice-id="${notice._id}">
            <div class="notice-header">
              <span class="notice-sender">
                <i class="fas fa-user"></i>
                ${notice.senderName}
              </span>
              <span class="notice-date">${new Date(notice.createdAt).toLocaleString()}</span>
            </div>
            <div class="notice-message">${notice.message}</div>
            ${extraDetails}
            ${downloadBtn}
            <div class="notice-badge">
              ${notice.isForAll ? "All Employees" : `To: ${notice.recipientId}`}
            </div>
          </div>
        `;
      })
      .join("");
    recentNoticesList.innerHTML = noticesHtml;

    // Add download button click handler
    // document.querySelectorAll('button[data-employee-id]').forEach(button => {
    //   button.addEventListener('click', async () => {
    //     const employeeId = button.getAttribute('data-employee-id');
    //     const month = button.getAttribute('data-month');
    //     const year = button.getAttribute('data-year');
    //    downloadPayslip(employeeId, month, year);
    //   });
    // });
  } catch (err) {
    recentNoticesList.innerHTML = '<div class="no-notices">Error loading notices</div>';
  }
}

// --- Fetch and display notifications from backend ---
async function loadNotificationsList() {
  const notificationsList = document.getElementById("notificationsList");
  notificationsList.innerHTML = '<div class="loading-notifications">Loading notifications...</div>';
  try {
    const token = localStorage.getItem("jwtToken");
    const res = await fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const currentEmployee = JSON.parse(localStorage.getItem("employee"));
    if (!data.success || !Array.isArray(data.notifications) || data.notifications.length === 0) {
      notificationsList.innerHTML = '<div class="no-notifications">No notifications found</div>';
      return;
    }
    const notificationsHtml = data.notifications
      .map((notice) => {
        const isUnread = !notice.readBy.includes(currentEmployee.employeeId);
        let extraDetails = '';
        if (notice.reason) {
          extraDetails += `<div style='margin-top:4px;font-size:0.97em;color:#5a3d8c;background:#f3eaff;padding:4px 8px;border-radius:6px;'><strong>Reason:</strong> ${notice.reason}</div>`;
        }
        if (notice.comments) {
          extraDetails += `<div style='margin-top:2px;font-size:0.97em;color:#5a3d8c;background:#eafff3;padding:4px 8px;border-radius:6px;'><strong>Comments:</strong> ${notice.comments}</div>`;
        }
        let downloadBtn = '';
        if (notice.payslipInfo && notice.payslipInfo.employeeId && notice.payslipInfo.month && notice.payslipInfo.year) {
          const { employeeId, month, year } = notice.payslipInfo;
          //downloadBtn = `<button data-employee-id="${encodeURIComponent(employeeId)}" data-month="${encodeURIComponent(month)}" data-year="${encodeURIComponent(year)}" style="display:inline-block;margin-top:8px;padding:7px 18px;background:linear-gradient(90deg,#764ba2,#43cea2);color:#fff;border-radius:8px;font-weight:600;text-decoration:none;font-size:0.98em;border:none;cursor:pointer;" onclick="downloadPayslip(this)>Download Pay Slip</button>`;
        } else if (notice.message && notice.message.toLowerCase().includes('pay slip')) {
          const today = new Date();
          const employeeId = currentEmployee.employeeId;
          const month = (today.getMonth() + 1).toString().padStart(2, '0');
          const year = today.getFullYear();
         // downloadBtn = `<button data-employee-id="${encodeURIComponent(employeeId)}" data-month="${encodeURIComponent(month)}" data-year="${encodeURIComponent(year)}" style="display:inline-block;margin-top:8px;padding:7px 18px;background:linear-gradient(90deg,#764ba2,#43cea2);color:#fff;border-radius:8px;font-weight:600;text-decoration:none;font-size:0.98em;border:none;cursor:pointer;" onclick="downloadPayslip(this)">Download Pay Slip</button>`;
        }
        return `
          <div class="notice-item ${isUnread ? "unread" : ""}" data-notice-id="${notice._id}">
            <div class="notice-header">
              <span class="notice-sender">
                <i class="fas fa-user"></i>
                ${notice.senderName}
              </span>
              <span class="notice-date">${new Date(notice.createdAt).toLocaleString()}</span>
            </div>
            <div class="notice-message">${notice.message}</div>
            ${extraDetails}
            ${downloadBtn}
            <div class="notice-badge">
              ${notice.isForAll ? "All Employees" : "Personal"}
            </div>
          </div>
        `;
      })
      .join("");
    notificationsList.innerHTML = notificationsHtml;

    // Add download button click handler
    // document.querySelectorAll('button[data-employee-id]').forEach(button => {
    //   button.addEventListener('click', async () => {
    //     const employeeId = button.getAttribute('data-employee-id');
    //     const month = button.getAttribute('data-month');
    //     const year = button.getAttribute('data-year');
    //   downloadPayslip(employeeId, month, year);
    //   });
    // });

    // Add click handlers to mark as read
    document.querySelectorAll(".notice-item").forEach((item) => {
      item.addEventListener("click", async function () {
        const noticeId = this.dataset.noticeId;
        await markNotificationAsRead(noticeId);
        this.classList.remove("unread");
      });
    });

    // Update notification badge
    updateNotificationBadge(data.notifications);
  } catch (err) {
    notificationsList.innerHTML = '<div class="no-notifications">Error loading notifications</div>';
  }
}

// --- Helper function to handle payslip download ---
//  async function downloadPayslip(employeeId, month, year) {
//   const token = localStorage.getItem("jwtToken");
//   const url = `/api/download-payslip`
//     + `?employeeId=${encodeURIComponent(employeeId)}`
//     + `&month=${encodeURIComponent(month)}`
//     + `&year=${encodeURIComponent(year)}`
//     + `&token=${encodeURIComponent(token)}`;
//   window.open(url, "_blank");
// }

function downloadPayslip(employeeId, month, year) {
  const token = localStorage.getItem("jwtToken");
  const url = `/api/download-payslip?employeeId=${employeeId}&month=${month}&year=${year}&token=${token}`;

  // Create hidden link
  // const link = document.createElement("a");
  // link.href = url;
  // link.target = "_blank";  // Open in new tab (optional)
  // link.download = `Payslip_${employeeId}_${month}_${year}.pdf`;
  // document.body.appendChild(link);
  // link.click();
  // document.body.removeChild(link);
  window.open(url,"_blank");
}




// --- Mark notification as read in backend ---
async function markNotificationAsRead(noticeId) {
  try {
    const token = localStorage.getItem("jwtToken");
    await fetch(`/api/notifications/${noticeId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    // Ignore errors for now
  }
}
// --- Update notification badge using backend data ---
async function updateNotificationBadge(notificationsData) {
  let notifications = notificationsData;
  if (!notifications) {
    // If not provided, fetch from backend
    try {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success || !Array.isArray(data.notifications)) return;
      notifications = data.notifications;
    } catch {
      return;
    }
  }
  const currentEmployee = JSON.parse(localStorage.getItem("employee"));
  const unreadCount = notifications.filter(
    (notice) =>
      (notice.isForAll || notice.recipientId === currentEmployee.employeeId) &&
      !notice.readBy.includes(currentEmployee.employeeId)
  ).length;
  const badge = document.getElementById("notificationBadge");
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  }
}

// --- On page load, fetch recent notices and notifications from backend ---
loadRecentNotices();
updateNotificationBadge();

// --- Digital ID Card and Edit Profile in Main Content ---
function showProfileInMainContent() {
  console.log("🔍 showProfileInMainContent() was triggered");
  mainContent = document.getElementById("mainContent");
  const employee = JSON.parse(localStorage.getItem("employee"));
  if (!employee) return;

  const cardHTML = `
        <div class="digital-id-card">
      <div class="card-header">
        <img src="/images/logo.png" alt="Company Logo" class="company-logo">
        <h2>Employee ID Card</h2>
          </div>
      <div class="card-body">
        <div class="profile-pic">
          <img src="${employee && employee._id ? `/api/employees/${employee._id}/profile-image` : "/images/logo.png"}" alt="Profile" onerror="this.src='/images/logo.png'">
          </div>
        <div class="info">
          <h3>${employee.name}</h3>
          <p><strong>ID:</strong> ${employee.employeeId}</p>
          <p><strong>Email:</strong> ${employee.email}</p>
          <p><strong>Role:</strong> ${employee.role}</p>
          <p><strong>Mobile:</strong> ${employee.mobile}</p>
          <p><strong>DOJ:</strong> ${new Date(employee.doj).toLocaleDateString()}</p>
          <p><strong>ID Proof:</strong> ${employee.idCardType || "-"} (${employee.idCardNumber || "N/A"})</p>
          </div>
        </div>
      <div class="card-footer">
        <button class="clear-btn" onclick="window.location.reload()">Clear</button>
      </div>
    </div>
  `;

  mainContent.innerHTML = cardHTML; 
  console.log("🔍 showProfileInMainContent completed successfully");
}

window.showProfileInMainContent = showProfileInMainContent;

// ... existing code ...

// Load Manage Employee Account
function loadManageEmployee() {
  if (!isAdminRole && !isHRRole) {
    alert("Access denied. Only administrators and HR personnel can manage employee accounts.");
    return;
  }
  setActive("btn-manage-employee");
  mainContent.innerHTML = `
    <div class="manage-employee-container">
      <h2>Manage Employee Account</h2>
      <form id="manageEmployeeForm">
        <div class="form-group">
          <label for="searchEmployeeName">Search by Name</label>
          <input type="text" id="searchEmployeeName" placeholder="Type employee name..." autocomplete="off" />
          <div id="nameSearchDropdown" class="search-dropdown" style="position:relative;"></div>
        </div>
        <div class="form-group">
          <label for="searchEmployeeId">Search Employee ID</label>
          <input type="text" id="searchEmployeeId" placeholder="Enter Employee ID to search" required />
        </div>
        <div class="button-group">
          <button type="button" class="search-btn" onclick="searchEmployee()">Search Employee</button>
          <button type="button" class="clear-btn" onclick="clearManageForm()">Clear</button>
        </div>
        <hr />
        <div id="employeeDetailsSection" style="display: none;">
          <div class="form-row">
            <div class="form-group">
              <label>Employee ID</label>
              <input type="text" name="employeeId" id="editEmployeeId" readonly />
            </div>
            <div class="form-group">
              <label>First Name</label>
              <input type="text" name="firstName" id="editFirstName" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Last Name</label>
              <input type="text" name="lastName" id="editLastName" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" name="email" id="editEmail" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Mobile</label>
              <input type="text" name="mobile" id="editMobile" />
            </div>
            <div class="form-group">
              <label>Role</label>
              <select name="role" id="editRole">
                <option value="junior_developer">Junior Developer</option>
                <option value="senior_developer">Senior Developer</option>
                <option value="junior_writer">Junior Writer</option>
                <option value="senior_writer">Senior Writer</option>
                <option value="team_leader">Team Leader</option>
                <option value="bdm">B D M</option>
                <option value="hr_recruiter">HR Recruiter</option>
                <option value="hr_executive">HR Executive</option>
                <option value="hr_manager">HR Manager</option>
                <option value="hr_admin">HR Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Address</label>
              <textarea name="address" id="editAddress" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Date of Joining</label>
              <input type="date" name="doj" id="editDoj" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>ID Card Type</label>
              <select name="idCardType" id="editIdCardType">
                <option value="">Select ID Card Type</option>
                <option value="aadhar">Aadhar Card</option>
                <option value="pan">PAN Card</option>
                <option value="passport">Passport</option>
                <option value="driving">Driving License</option>
                <option value="voter">Voter ID</option>
              </select>
            </div>
            <div class="form-group">
              <label>ID Card Number</label>
              <input type="text" name="idCardNumber" id="editIdCardNumber" />
            </div>
          </div>
          <div class="button-group">
            <button type="button" class="cancel-btn" onclick="clearManageForm()">Cancel</button>
            <button type="submit" class="update-btn">Update Employee</button>
          </div>
        </div>
        <div id="manageEmployeeMsg"></div>
      </form>
    </div>
  `;
  attachManageEmployeeNameSearch();

  const style = document.createElement("style");
  style.textContent = `
    .manage-employee-container {
      background: linear-gradient(135deg, #c0b8f0, #dfc8f7);
      padding: 30px;
      border-radius: 15px;
      width: 600px;
      margin: 40px auto;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
      color: #333;
    }
    .manage-employee-container h2 {
      font-size: 22px;
      margin-bottom: 20px;
      color: #000;
      text-align: center;
    }
    .form-group {
      margin-bottom: 15px;
    }
    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 5px;
      color: #333;
    }
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 10px 12px;
      border: none;
      border-radius: 10px;
      background: #f4f4fc;
      outline: none;
      font-size: 15px;
      box-sizing: border-box;
    }
    .form-group textarea {
      resize: vertical;
      min-height: 80px;
    }
    .form-group input[readonly] {
      background-color: #e4e4fa;
      font-weight: bold;
      color: #666;
    }
    .form-row {
      display: flex;
      gap: 15px;
      margin-bottom: 15px;
    }
    .form-row .form-group {
      flex: 1;
      margin-bottom: 0;
    }
    hr {
      margin: 25px 0;
      border: 0;
      border-top: 1px solid #b3a9e4;
    }
    .button-group {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      gap: 15px;
    }
    .search-btn,
    .cancel-btn,
    .update-btn {
      padding: 12px 24px;
      font-weight: bold;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
    }
    .search-btn {
      background: linear-gradient(90deg, #6f42c1, #4dd0a9);
      color: white;
      flex: 1;
    }
    .search-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(111, 66, 193, 0.3);
    }
    .cancel-btn {
      background-color: #f3eaff;
      color: #7a42f4;
      flex: 1;
    }
    .cancel-btn:hover {
      background-color: #e8d5ff;
    }
    .update-btn {
      background: linear-gradient(90deg, #28a745, #20c997);
      color: white;
      flex: 1;
    }
    .update-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
    }
    #manageEmployeeMsg {
      margin-top: 15px;
      padding: 10px;
      border-radius: 8px;
      text-align: center;
      font-weight: bold;
    }
    @media (max-width: 768px) {
      .manage-employee-container {
        width: 85%;
        margin: 20px auto;
        padding: 20px;
      }
      .form-row {
        flex-direction: column;
        gap: 10px;
      }
      .button-group {
        flex-direction: row;
      }
      .search-btn,
      .cancel-btn,
      .update-btn {
        width: 100%;
      }
    }
    @media (max-width: 480px) {
      .manage-employee-container {
        padding: 15px;
        height:70vh
      }
      .manage-employee-container h2 {
        font-size: 20px;
      }
      .form-group input,
      .form-group select,
      .form-group textarea {
        padding: 8px 10px;
        font-size: 14px;
      }
    }
  `;
  document.head.appendChild(style);

  document.getElementById("manageEmployeeForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    await updateEmployee();
  });

setLogoutListener();
injectProfileSidebar();
}

window.searchEmployee = async function() {
  const employeeId = document.getElementById("searchEmployeeId").value.trim();
  if (!employeeId) {
    showManageEmployeeMsg("Please enter an Employee ID", "error");
    return;
  }

  try {
    const token = localStorage.getItem("jwtToken");
    const res = await fetch(`/api/employees`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    
    if (data.success && Array.isArray(data.employees)) {
      const employee = data.employees.find(
        (emp) => emp.employeeId && emp.employeeId.toLowerCase() === employeeId.toLowerCase()
      );
      
      if (employee) {
        populateEmployeeForm(employee);
        showManageEmployeeMsg("Employee found successfully!", "success");
      } else {
        showManageEmployeeMsg("No employee found with this ID", "error");
        document.getElementById("employeeDetailsSection").style.display = "none";
      }
    } else {
      showManageEmployeeMsg("Failed to fetch employee data", "error");
    }
  } catch (err) {
    showManageEmployeeMsg("Error searching employee", "error");
  }
};

window.populateEmployeeForm = function(employee) {
  document.getElementById("editEmployeeId").value = employee.employeeId || "";
  document.getElementById("editFirstName").value = employee.firstName || "";
  document.getElementById("editLastName").value = employee.lastName || "";
  document.getElementById("editEmail").value = employee.email || "";
  document.getElementById("editMobile").value = employee.mobile || "";
  document.getElementById("editRole").value = employee.role || "";
  document.getElementById("editAddress").value = employee.address || "";
  document.getElementById("editDoj").value = employee.doj ? employee.doj.split('T')[0] : "";
  document.getElementById("editIdCardType").value = employee.idCardType || "";
  document.getElementById("editIdCardNumber").value = employee.idCardNumber || "";
  
  document.getElementById("employeeDetailsSection").style.display = "block";
};

window.updateEmployee = async function() {
  const employeeId = document.getElementById("editEmployeeId").value;
  if (!employeeId) {
    showManageEmployeeMsg("No employee selected", "error");
    return;
  }

  const formData = new FormData();
  formData.append("firstName", document.getElementById("editFirstName").value);
  formData.append("lastName", document.getElementById("editLastName").value);
  formData.append("email", document.getElementById("editEmail").value);
  formData.append("mobile", document.getElementById("editMobile").value);
  formData.append("role", document.getElementById("editRole").value);
  formData.append("address", document.getElementById("editAddress").value);
  formData.append("doj", document.getElementById("editDoj").value);
  formData.append("idCardType", document.getElementById("editIdCardType").value);
  formData.append("idCardNumber", document.getElementById("editIdCardNumber").value);

  try {
    const token = localStorage.getItem("jwtToken");
    const res = await fetch(`/api/employees/${employeeId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    
    const data = await res.json();
    if (data.success) {
      showManageEmployeeMsg("Employee updated successfully!", "success");
      clearManageForm();
    } else {
      showManageEmployeeMsg(data.message || "Failed to update employee", "error");
    }
  } catch (err) {
    showManageEmployeeMsg("Error updating employee", "error");
  }
};

window.clearManageForm = function() {
  document.getElementById("manageEmployeeForm").reset();
  document.getElementById("employeeDetailsSection").style.display = "none";
  showManageEmployeeMsg("", "");
};

window.showManageEmployeeMsg = function(message, type) {
  const msgDiv = document.getElementById("manageEmployeeMsg");
  if (!message) {
    msgDiv.style.display = "none";
    return;
  }
  
  msgDiv.style.display = "block";
  msgDiv.textContent = message;
  msgDiv.style.color = type === "success" ? "#28a745" : "#dc3545";
  msgDiv.style.backgroundColor = type === "success" ? "#d4edda" : "#f8d7da";
  msgDiv.style.border = `1px solid ${type === "success" ? "#c3e6cb" : "#f5c6cb"}`;
};

function showEditProfileInMainContent() {
  const emp = JSON.parse(localStorage.getItem("employee"));
  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = `
      <div class="edit-profile-container">
        <div class="admin-content-section centered-section scrollable-form-container" style="max-width: 420px; margin: 2rem auto;">
          <h2>Edit Profile</h2>
          <form id="editProfileFormMain" class="section-form" autocomplete="off">
            <div style="text-align:center;margin-bottom:18px;">
              <img src="${
                emp && emp._id ? `/api/employees/${emp._id}/profile-image` : "/images/logo.png"
              }" alt="Profile" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:2px solid #764ba2;box-shadow:0 2px 8px rgba(118,75,162,0.10);background:#fff;" onerror="this.src='/images/logo.png'" />
            </div>
            <div class="form-group"><label>First Name</label><input type="text" name="firstName" value="${
              emp.firstName || ""
            }" /></div>
            <div class="form-group"><label>Last Name</label><input type="text" name="lastName" value="${
              emp.lastName || ""
            }" /></div>
            <div class="form-group"><label>Email</label><input type="email" name="email" value="${
              emp.email || ""
            }" /></div>
            <div class="form-group"><label>Mobile</label><input type="text" name="mobile" value="${
              emp.mobile || ""
            }" /></div>
            <div class="form-group"><label>Address</label><textarea name="address">${
              emp.address || ""
            }</textarea></div>
            <div class="form-group"><label>ID Card Type</label><input type="text" name="idCardType" value="${
              emp.idCardType || ""
            }" /></div>
            <div class="form-group"><label>ID Card Number</label><input type="text" name="idCardNumber" value="${
              emp.idCardNumber || ""
            }" /></div>
            <div class="form-group"><label>Date of Joining</label><input type="date" name="doj" value="${
              emp.doj ? new Date(emp.doj).toISOString().slice(0, 10) : ""
            }" /></div>
            <div style="text-align:center;margin-top:12px;"><button type="submit" class="add-employee-btn">Save Changes</button></div>
          </form>
          <div id="editProfileStatusMsg" style="margin-top:1rem;"></div>
        </div>
      </div>
    `;
  document.getElementById("editProfileFormMain").onsubmit = async function (e) {
    e.preventDefault();
    const form = e.target;
    const updated = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      email: form.email.value.trim(),
      mobile: form.mobile.value.trim(),
      address: form.address.value.trim(),
      idCardType: form.idCardType.value.trim(),
      idCardNumber: form.idCardNumber.value.trim(),
      doj: form.doj.value,
    };
    const statusMsg = document.getElementById("editProfileStatusMsg");
    try {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch(`/api/employees`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...updated, employeeId: emp.employeeId }),
      });
      const data = await res.json();
      if (data.success) {
        statusMsg.style.color = "green";
        statusMsg.textContent = "Profile updated successfully!";
        // Update localStorage
        const updatedEmp = { ...emp, ...updated };
        localStorage.setItem("employee", JSON.stringify(updatedEmp));
        setTimeout(() => showProfileInMainContent(), 1200);
      } else {
        statusMsg.style.color = "red";
        statusMsg.textContent = data.message || "Failed to update profile.";
      }
    } catch (err) {
      statusMsg.style.color = "red";
      statusMsg.textContent = "Error updating profile.";
    }
  };
}



// --- Show digital card in main-content and allow restoring previous sec

window.approveWFHRequest = approveWFHRequest;
window.rejectWFHRequest = rejectWFHRequest;

// After rendering the table, add this:
setTimeout(() => {
  document.querySelectorAll('.attachment-link').forEach(link => {
    link.addEventListener('click', async function(e) {
      e.preventDefault();
      const id = this.getAttribute('data-id');
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        alert('Authentication required. Please login again.');
        return;
      }
      try {
        const response = await fetch(`/api/wfh-requests/${id}/attachment`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch attachment');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      } catch (err) {
        alert('Failed to open attachment.');
      }
    });
  });
}, 0);

// Add badge to Leave Approval button
function updateLeaveApprovalBadge(count) {
  let badge = document.getElementById('leaveApprovalBadge');
  if (!badge) {
    const btn = document.getElementById('btn-leave-approval');
    if (btn) {
      badge = document.createElement('span');
      badge.id = 'leaveApprovalBadge';
      badge.className = 'notification-badge';
      btn.appendChild(badge);
    }
  }
  if (badge) {
    badge.textContent = count > 0 ? count : '';
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

async function fetchAndUpdateLeaveApprovalBadge() {
  try {
    const token = localStorage.getItem('jwtToken');
    const res = await fetch('/api/leave-unread-count', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    updateLeaveApprovalBadge(data.count || 0);
  } catch (err) {
    // Silent fail
  }
}

// Call on page load
fetchAndUpdateLeaveApprovalBadge();

// After approve/reject, call fetchAndUpdateLeaveApprovalBadge()
const origApproveLeaveRequest = window.approveLeaveRequest;
window.approveLeaveRequest = async function(id) {
  await origApproveLeaveRequest(id);
  await fetchAndUpdateLeaveApprovalBadge();
};
const origRejectLeaveRequest = window.rejectLeaveRequest;
window.rejectLeaveRequest = async function(id) {
  await origRejectLeaveRequest(id);
  await fetchAndUpdateLeaveApprovalBadge();
};
// On page load (after login or sidebar render):
const token = localStorage.getItem('jwtToken');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.role === 'admin' || payload.role === 'hr') {
    fetchAndUpdateLeaveApprovalBadge();
  }
}
// In updateLeaveApprovalBadge:

// ... existing code ...
// --- Add this inside loadManageEmployee after rendering the form ---
function attachManageEmployeeNameSearch() {
  const nameInput = document.getElementById("searchEmployeeName");
  const idInput = document.getElementById("searchEmployeeId");
  const dropdown = document.getElementById("nameSearchDropdown");
  let nameTimeout;
  if (nameInput && idInput && dropdown) {
    nameInput.addEventListener("input", function() {
      clearTimeout(nameTimeout);
      const value = this.value.trim();
      dropdown.innerHTML = "";
      if (value.length < 2) return;
      nameTimeout = setTimeout(async () => {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch(`/api/employees/search?name=${encodeURIComponent(value)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.employees.length) {
          dropdown.innerHTML = `<div style='position:absolute;z-index:1000;background:#fff;border:1px solid #ccc;width:100%;max-height:180px;overflow:auto;'>${data.employees.map(emp => `<div class='dropdown-item' style='padding:8px;cursor:pointer;color:#8C001A;' data-id='${emp.employeeId}' data-name='${displayName.replace(/'/g, "&#39;")}' >${displayName} <span style='color:#764ba2;font-weight:bold;'>(${emp.employeeId})</span></div>`).join('')}</div>`;
          dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.onclick = function(e) {
              idInput.value = this.getAttribute('data-id');
              nameInput.value = this.getAttribute('data-name');
              dropdown.innerHTML = "";
              e.stopPropagation();
            };
          });
        }
      }, 300);
    });
    // Hide dropdown on outside click
    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target) && e.target !== nameInput) {
        dropdown.innerHTML = "";
      }
    });
  }
}
function attachStatsNameSearch(resultDiv) {
  const nameInputStats = document.getElementById("searchEmployeeName");
  const idInputStats = document.getElementById("searchEmployeeId");
  const dropdownStats = document.getElementById("nameSearchDropdown");
  let nameTimeoutStats;
  if (nameInputStats && idInputStats && dropdownStats) {
    nameInputStats.addEventListener("input", function() {
      clearTimeout(nameTimeoutStats);
      const value = this.value.trim();
      dropdownStats.innerHTML = "";
      if (value.length < 2) return;
      nameTimeoutStats = setTimeout(async () => {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch(`/api/employees/search?name=${encodeURIComponent(value)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.employees.length) {
          dropdownStats.innerHTML = `<div style='position:absolute;z-index:1000;background:#fff;border:1px solid #ccc;width:100%;max-height:180px;overflow:auto;'>${data.employees.map(emp => `<div class='dropdown-item' style='padding:8px;cursor:pointer;' data-id='${emp.employeeId}'>${emp.firstName || emp.name || ''} ${emp.lastName || ''} <span style='color:#764ba2;font-weight:bold;'>(${emp.employeeId})</span></div>`).join('')}</div>`;
          dropdownStats.querySelectorAll('.dropdown-item').forEach(item => {
            item.onclick = function(e) {
              idInputStats.value = this.getAttribute('data-id');
              dropdownStats.innerHTML = "";
              e.stopPropagation();
              fetchEmployeeDetails(this.getAttribute('data-id'), resultDiv);
            };
          });
        }
      }, 300);
    });
    document.addEventListener('click', function(e) {
      if (!dropdownStats.contains(e.target) && e.target !== nameInputStats) {
        dropdownStats.innerHTML = "";
      }
    });
  }
}

// Move this function to top-level and attach to window
window.fetchEmployeeDetails = function(employeeId, resultDiv) {
  // fallback for resultDiv
  if (!resultDiv) {
    resultDiv = document.getElementById("employeeStatsResult");
  }
  if (!employeeId || !resultDiv) {
    if (resultDiv) resultDiv.innerHTML = "";
    return;
  }
  resultDiv.innerHTML = '<div class="loading">Searching...</div>';
  fetch(`/api/employees`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
    },
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.employees)) {
        const found = data.employees.find(
          (emp) => emp.employeeId && emp.employeeId.toLowerCase() === employeeId.toLowerCase()
        );
        if (found) {
          const imgSrc =
            found.profileImage && found._id
              ? `/api/employees/${found._id}/profile-image`
              : "/images/logo.png";
          resultDiv.innerHTML = `
            <div class="employee-card" style="background:rgba(255,255,255,0.13);border-radius:16px;padding:2rem;box-shadow:0 2px 8px rgba(67,206,162,0.10);max-width:900px;margin:0 auto;display:flex;gap:2rem;align-items:center;">
              <img id="empProfileImg" src="${imgSrc}" alt="${
            found.firstName || found.name || ""
          }" style="width:90px;height:90px;border-radius:12px;object-fit:cover;border:2px solid #764ba2;box-shadow:0 2px 8px rgba(118,75,162,0.10);background:#fff;">
              <div style="flex:1;">
                <h3 style="margin-bottom:0.5rem;color:#764ba2;">${
                  found.firstName || found.name || ""
                } ${found.lastName || ""}</h3>
                <p><strong>Employee ID:</strong> ${found.employeeId}</p>
                <p><strong>Role:</strong> ${found.role}</p>
                <p><strong>Email:</strong> ${found.email || "-"}</p>
                <p><strong>Mobile:</strong> ${found.mobile || "-"}</p>
                <p><strong>Date of Joining:</strong> ${
                  found.doj ? new Date(found.doj).toLocaleDateString() : "-"
                }</p>
                <p><strong>Address:</strong> ${found.address || "-"}</p>
                <p><strong>ID Card:</strong> ${
                  found.idCardType ? found.idCardType.toUpperCase() : "-"
                } ${found.idCardNumber || ""}</p>
              </div>
            </div>
          `;
          const img = document.getElementById("empProfileImg");
          if (img) {
            img.onerror = function () {
              this.onerror = null;
              this.src = "/images/logo.png";
            };
          }
        } else {
          resultDiv.innerHTML =
            '<div class="error" style="color:#dc3545;font-weight:bold;">No employee found with this ID.</div>';
        }
      } else {
        resultDiv.innerHTML =
          '<div class="error" style="color:#dc3545;font-weight:bold;">Failed to fetch employee data.</div>';
      }
    })
    .catch(() => {
      resultDiv.innerHTML =
        '<div class="error" style="color:#dc3545;font-weight:bold;">Error searching employee.</div>';
    });
}

// --- Add this function for Attendance Tracker name search ---
function attachAttendanceTrackerNameSearch() {
  const nameInput = document.getElementById("attTrackerEmployeeName");
  const idInput = document.getElementById("attTrackerEmployeeId");
  const dropdown = document.getElementById("attTrackerNameDropdown");
  let nameTimeout;
  if (nameInput && idInput && dropdown) {
    nameInput.addEventListener("input", function() {
      clearTimeout(nameTimeout);
      const value = this.value.trim();
      dropdown.innerHTML = "";
      if (value.length < 2) return;
      nameTimeout = setTimeout(async () => {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch(`/api/employees/search?name=${encodeURIComponent(value)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.employees.length) {
          dropdown.innerHTML = `<div style='position:absolute;z-index:1000;background:#fff;border:1px solid #ccc;width:100%;max-height:180px;overflow:auto;'>${data.employees.map(emp => {
            const displayName = `${emp.firstName || emp.name || ''} ${emp.lastName || ''}`.trim();
            return `<div class='dropdown-item' style='padding:8px;cursor:pointer;color:#8C001A;' data-id='${emp.employeeId}' data-name='${displayName.replace(/'/g, "&#39;")}' >${displayName} <span style='color:#764ba2;font-weight:bold;'>(${emp.employeeId})</span></div>`;
          }).join('')}</div>`;
          dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.onclick = function(e) {
              idInput.value = this.getAttribute('data-id');
              nameInput.value = this.getAttribute('data-name');
              dropdown.innerHTML = "";
              e.stopPropagation();
            };
          });
        }
      }, 300);
    });
    // Hide dropdown on outside click
    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target) && e.target !== nameInput) {
        dropdown.innerHTML = "";
      }
    });
  }
}

// ... existing code ...



// ... existing code ...
// --- Team Management Section ---
let localTeams = [];
let availableMembers = [];
let allEmployees = [];
let leaders = [];
let editingTeamId = null;

async function loadTeamManagement() {
  try {
    // First, create the HTML structure
    const mainContent = document.getElementById("mainContent");
    mainContent.innerHTML = `
      <div class="admin-content-section team-management-section">
        <h2 style="margin-bottom:20px;"><i class="fas fa-users-cog"></i> Team Management</h2>
        
        <!-- Create Team Form -->
        <div class="team-creation-section" style="margin-bottom: 2rem; padding: 1.5rem; background: rgba(255,255,255,0.1); border-radius: 12px;">
          <h3 style="margin-bottom: 1rem; color: #764ba2;">Create New Team</h3>
          <form id="createTeamForm" class="section-form" style="width:60vw;">
            <div class="form-group">
              <label for="teamName">Team Name</label>
              <input type="text" id="teamName" name="teamName" required placeholder="Enter team name">
            </div>
            
            <div class="form-group">
              <label for="teamLeader">Team Leader</label>
              <select id="teamLeader" name="teamLeader" required>
                <option value="">Select a team leader</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="teamMembers">Team Members</label>
              <select id="teamMembers" name="teamMembers" multiple style="height: 120px;">
                <option value="">Loading members...</option>
              </select>
              <small style="color: #fff; font-size: 0.9rem;">Hold Ctrl/Cmd to select multiple members</small>
            </div>
            
            <div class="form-row" style="justify-content: flex-start; gap: 1rem;">
              <button type="submit" class="modern-btn" style="background: linear-gradient(90deg, #43cea2, #764ba2); color: white; padding: 0.75rem 2rem; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">
                <i class="fas fa-plus"></i> Create Team
              </button>
            </div>
          </form>
        </div>
        
        <!-- Teams List -->
        <div class="teams-list-section">
          <h3 style="margin-bottom: 1rem; color: #764ba2;">Existing Teams</h3>
          <div id="teamListContainer">
            <div style="color:#888;text-align:center;margin-top:2rem;">Loading teams...</div>
          </div>
        </div>
      </div>
    `;

    const token = localStorage.getItem("jwtToken");
    console.log("Loading team management with token:", token ? "Token exists" : "No token");
    
    // Fetch all employees
    const empRes = await fetch("/api/employees", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Employees response status:", empRes.status);
    const empData = await empRes.json();
    console.log("Employees data:", empData);
    if (empData.success) {
      allEmployees = empData.employees;
      // Filter leaders (eligible for team leadership)
      leaders = allEmployees.filter(emp => emp.role === "team_leader");
      console.log("Found leaders:", leaders.length);
      
      // Debug: Check what roles are in the data
      const roles = [...new Set(allEmployees.map(emp => emp.role))];
      console.log("All roles in data:", roles);
      console.log("Roles that will be excluded:", TEAM_MEMBER_EXCLUDE_ROLES);
      
      const eligibleForTeams = allEmployees.filter(emp => !TEAM_MEMBER_EXCLUDE_ROLES.includes(emp.role));
      console.log("Employees eligible for teams:", eligibleForTeams.length);
      console.log("Eligible employees:", eligibleForTeams.map(emp => `${emp.firstName || emp.name || emp.employeeId} (${emp.role})`));
    } else {
      console.error("Failed to fetch employees:", empData.message);
    }

    // Fetch teams
    const teamsRes = await fetch("/api/teams", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Teams response status:", teamsRes.status);
    const teamsData = await teamsRes.json();
    console.log("Teams data:", teamsData);
    if (teamsData.success) {
      localTeams = teamsData.teams;
      console.log("Loaded teams:", localTeams.length);
    } else {
      console.error("Failed to fetch teams:", teamsData.message);
    }

    // Fetch available members
    const availRes = await fetch("/api/teams/available-members", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Available members response status:", availRes.status);
    const availData = await availRes.json();
    console.log("Available members data:", availData);
    if (availData.success) {
      availableMembers = availData.available;
      console.log("Available members:", availableMembers.length);
    } else {
      console.error("Failed to fetch available members:", availData.message);
    }

    // Update UI
    console.log("Updating team management UI...");
    updateTeamManagementUI();
    renderTeamList();
    setupTeamCreationForm();
    console.log("Team management UI updated successfully");
  } catch (error) {
    console.error("Error loading team management:", error);
    // Show error message in the main content
    const mainContent = document.getElementById("mainContent");
    mainContent.innerHTML = `
      <div class="admin-content-section team-management-section">
        <h2><i class="fas fa-users-cog"></i> Team Management</h2>
        <div style="color: #dc3545; text-align: center; padding: 2rem;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
          <p>Error loading team management. Please try again.</p>
          <button onclick="loadTeamManagement()" style="background: linear-gradient(90deg, #43cea2, #764ba2); color: white; padding: 0.75rem 2rem; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; margin-top: 1rem;">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    `;
  }
}
// --- Organization Structure Section ---
async function loadOrganizationStructure() {
  setActive("btn-organization-structure");
  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = `<div class="admin-content-section team-management-section" id="org-structure-section">
    <h2 style="margin-bottom:24px;"><i class="fas fa-sitemap"></i> Organization Structure</h2>
    <div id="orgStructureContent" style="display:flex;flex-direction:column;gap:2.5rem;"></div>
  </div>`;

  // Use public endpoints for non-admin/HR users
  if (!isAdminRole && !isHRRole) {
    if (!allEmployees.length) {
      try {
        const empRes = await fetch("/api/employees/public");
        console.log("/api/employees/public status:", empRes.status);
        const empData = await empRes.json();
        console.log("/api/employees/public data:", empData);
        if (empData.success) allEmployees = empData.employees;
        else console.error("Failed to fetch employees (public):", empData.message);
      } catch (err) {
        console.error("Error fetching /api/employees/public:", err);
      }
    }
    if (!localTeams.length) {
      try {
        const teamsRes = await fetch("/api/teams/public");
        console.log("/api/teams/public status:", teamsRes.status);
        const teamsData = await teamsRes.json();
        console.log("/api/teams/public data:", teamsData);
        if (teamsData.success) localTeams = teamsData.teams;
        else console.error("Failed to fetch teams (public):", teamsData.message);
      } catch (err) {
        console.error("Error fetching /api/teams/public:", err);
      }
    }
  } else {
    // Admin/HR: use full endpoints with token
    if (!allEmployees.length) {
      try {
        const token = localStorage.getItem("jwtToken");
        const empRes = await fetch("/api/employees", { headers: { Authorization: `Bearer ${token}` } });
        console.log("/api/employees status:", empRes.status);
        const empData = await empRes.json();
        console.log("/api/employees data:", empData);
        if (empData.success) allEmployees = empData.employees;
        else console.error("Failed to fetch employees:", empData.message);
      } catch (err) {
        console.error("Error fetching /api/employees:", err);
      }
    }
    if (!localTeams.length) {
      try {
        const token = localStorage.getItem("jwtToken");
        const teamsRes = await fetch("/api/teams", { headers: { Authorization: `Bearer ${token}` } });
        console.log("/api/teams status:", teamsRes.status);
        const teamsData = await teamsRes.json();
        console.log("/api/teams data:", teamsData);
        if (teamsData.success) localTeams = teamsData.teams;
        else console.error("Failed to fetch teams:", teamsData.message);
      } catch (err) {
        console.error("Error fetching /api/teams:", err);
      }
    }
  }

  // Group employees by role
  const roleGroups = {
    admin: [],
    hr_recruiter: [],
    bdm: [],
    senior_writer: [],
  };
  allEmployees.forEach(emp => {
    if (emp.role === "admin" || emp.role === "hr_admin") roleGroups.admin.push(emp);
    else if (emp.role === "hr_recruiter" || emp.role === "hr_manager" || emp.role === "hr_executive") roleGroups.hr_recruiter.push(emp);
    else if (emp.role === "bdm") roleGroups.bdm.push(emp);
    else if (emp.role === "senior_writer") roleGroups.senior_writer.push(emp);
  });

  // Card configs for each role
  const roleCards = [
    { key: "admin", label: "Admin", icon: "fa-crown", color: "#ffb347" },
    { key: "hr_recruiter", label: "HR / Recruiter", icon: "fa-user-tie", color: "#43cea2" },
    { key: "bdm", label: "BDM", icon: "fa-chart-line", color: "#764ba2" },
    { key: "senior_writer", label: "Senior Writer", icon: "fa-pen-nib", color: "#ff758c" },
  ];

  // Render role cards
  let html = '<div class="org-roles-row" style="display:flex;flex-wrap:wrap;gap:2rem;justify-content:center;">';
  for (const role of roleCards) {
    if (!roleGroups[role.key].length) continue;
    html += `<div class="org-role-card" style="background:linear-gradient(120deg,${role.color}22,#fff 80%);border-radius:16px;box-shadow:0 2px 12px rgba(67,206,162,0.10);padding:1.5rem 2rem;min-width:220px;max-width:300px;flex:1 1 220px;display:flex;flex-direction:column;align-items:center;">
      <div style="font-size:2.2rem;margin-bottom:0.5rem;color:${role.color};"><i class="fas ${role.icon}"></i></div>
      <div style="font-size:1.3rem;font-weight:700;margin-bottom:0.7rem;color:${role.color};">${role.label}</div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;width:100%;align-items:center;">
        ${roleGroups[role.key].map(emp => {
          let displayName = "";
          if (emp.firstName || emp.lastName) {
            displayName = `${emp.firstName || ""}${emp.firstName && emp.lastName ? " " : ""}${emp.lastName || ""}`.trim();
          } else {
            displayName = emp.employeeId || "Unknown";
          }
          return `<div style=\"background:linear-gradient(135deg, #667eea, #764ba2);border-radius:8px;padding:0.5rem 1rem;box-shadow:0 1px 4px #764ba211;font-size:1.08rem;font-weight:500;width:100%;text-align:center;\">${displayName}</div>`;
        }).join("")}
      </div>
    </div>`;
  }
  html += '</div>';

  // Teams Section
  html += '<div class="org-teams-section" style="margin-top:2.5rem;">';
  html += '<h3 style="margin-bottom:1.2rem;margin-left:45%;color:#764ba2;"><i class="fas fa-users"></i> Teams</h3>';
  html += '<div class="org-teams-list" style="display:flex;flex-wrap:wrap;gap:1.5rem;justify-content:center;">';
  for (const team of localTeams) {
    // Team leader display name
    let leaderName = "-";
    if (team.team_leader_details) {
      if (team.team_leader_details.firstName || team.team_leader_details.lastName) {
        leaderName = `${team.team_leader_details.firstName || ""}${team.team_leader_details.firstName && team.team_leader_details.lastName ? " " : ""}${team.team_leader_details.lastName || ""}`.trim();
      } else {
        leaderName = team.team_leader_details.employeeId || "Unknown";
      }
    } else if (team.team_leader) {
      leaderName = team.team_leader;
    }
    // Team members display names
    const memberNames = (team.team_members_details || []).map(m => {
      if (m.firstName || m.lastName) {
        return `${m.firstName || ""}${m.firstName && m.lastName ? " " : ""}${m.lastName || ""}`.trim();
      } else {
        return m.employeeId || "Unknown";
      }
    });
    html += `<div class="org-team-card" style="background:linear-gradient(120deg,#e0c3fc22,#fff 80%);border-radius:14px;box-shadow:0 2px 8px rgba(67,206,162,0.10);padding:1.2rem 1rem;min-width:220px;max-width:270px;flex:1 1 220px;display:flex;flex-direction:column;align-items:center;">
      <div style="font-size:1.1rem;font-weight:700;margin-bottom:0.5rem;color:#764ba2;"><i class="fas fa-users"></i> ${team.team_name}</div>
      <div style="font-size:1rem;margin-bottom:0.3rem;color:#800000"><b>Leader:</b> ${leaderName}</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:center;">
        ${memberNames.map(n => `<div style=\"background:linear-gradient(135deg, #667eea, #764ba2);border-radius:6px;padding:0.3rem 0.8rem;box-shadow:0 1px 3px #764ba211;font-size:0.97rem;\">${n}</div>`).join("")}
      </div>
    </div>`;
  }
  html += '</div></div>';

  document.getElementById("orgStructureContent").innerHTML = html;
}
window.loadOrganizationStructure = loadOrganizationStructure;

// Helper to update member select options
function updateMemberSelect(selectEl, selectedIds = []) {
  if (!selectEl) return;
  
  console.log("updateMemberSelect called with selectedIds:", selectedIds);
  console.log("availableMembers count:", availableMembers.length);
  console.log("allEmployees count:", allEmployees.length);
  
  // Only eligible employees (not in excluded roles)
  const eligibleAvailable = availableMembers.filter(m => !TEAM_MEMBER_EXCLUDE_ROLES.includes(m.role));
  const eligibleAll = allEmployees.filter(m => !TEAM_MEMBER_EXCLUDE_ROLES.includes(m.role));
  
  console.log("eligibleAvailable count:", eligibleAvailable.length);
  console.log("eligibleAll count:", eligibleAll.length);
  console.log("TEAM_MEMBER_EXCLUDE_ROLES:", TEAM_MEMBER_EXCLUDE_ROLES);
  
  // Use eligible availableMembers for creation, or eligible all for edit
  const allOptions = [
    ...eligibleAvailable,
    ...eligibleAll.filter(m => selectedIds.includes(m.employeeId) && !eligibleAvailable.some(a => a.employeeId === m.employeeId))
  ];
  
  // Remove duplicates
  const uniqueOptions = Array.from(new Map(allOptions.map(m => [m.employeeId, m])).values());
  
  console.log("final uniqueOptions count:", uniqueOptions.length);
  console.log("uniqueOptions:", uniqueOptions.map(m => `${m.firstName || m.name || m.employeeId} (${m.role})`));
  
  selectEl.innerHTML = uniqueOptions.map(m =>
    `<option value="${m.employeeId}" ${selectedIds.includes(m.employeeId) ? 'selected' : ''}>${m.firstName || m.name || m.employeeId}</option>`
  ).join("");
}

// Update team management UI elements
function updateTeamManagementUI() {
  // Populate leader dropdown
  const leaderSelect = document.getElementById("teamLeader");
  if (leaderSelect) {
    leaderSelect.innerHTML = leaders.map(l => 
      `<option value="${l.employeeId}">${l.firstName || l.name || l.employeeId}</option>`
    ).join("");
  }
  
  // Populate members multi-select
  const memberSelect = document.getElementById("teamMembers");
  if (memberSelect) {
    updateMemberSelect(memberSelect);
  }
}

// Render team list from localTeams
function renderTeamList() {
  
  const container = document.getElementById("teamListContainer");
  if (!container) return;

  if (!localTeams.length) {
    container.innerHTML = '<div style="color:#888;text-align:center;margin-top:2rem;">No teams created yet.</div>';
    return;
  }

  container.innerHTML = `<div class="teams-list-scroll" style="display:flex;flex-wrap:wrap;gap:1.5rem;max-height:400px;overflow-y:auto;">${localTeams.map(team => {
    if (editingTeamId === team._id) {
      // --- EDIT MODE ---
      if (!window._editMembers) window._editMembers = {};
      if (!window._editMembers[team._id]) window._editMembers[team._id] = [...team.team_members];
      const currentMemberIds = window._editMembers[team._id];
      const currentMembers = (team.team_members_details || []).filter(m => currentMemberIds.includes(m.employeeId));
      const eligibleAvailable = availableMembers.filter(m => !TEAM_MEMBER_EXCLUDE_ROLES.includes(m.role));
      const eligibleAll = allEmployees.filter(m => !TEAM_MEMBER_EXCLUDE_ROLES.includes(m.role));
      const addableMembers = [...eligibleAvailable, ...eligibleAll].filter(m => m && m.employeeId && !currentMemberIds.includes(m.employeeId));
      const uniqueAddable = Array.from(new Map(addableMembers.map(m => [m.employeeId, m])).values());
      return `<div class="team-card" style="background:#f8fafc;border-radius:14px;box-shadow:0 2px 8px rgba(67,206,162,0.10);padding:1.5rem 1.2rem;min-width:260px;max-width:320px;flex:1 1 260px;transition:box-shadow 0.2s;">
        <input type="text" id="editTeamName_${team._id}" value="${team.team_name}" style="width:100%;margin-bottom:0.5rem;padding:8px 10px;border-radius:6px;border:1px solid #ccc;font-size:1.1rem;" />
        <div style="margin-bottom:0.7rem;"><strong>Leader:</strong> <select id="editTeamLeader_${team._id}" style="width:100%;padding:6px;border-radius:6px;">${leaders.map(l => `<option value="${l.employeeId}" ${team.team_leader && l.employeeId === team.team_leader ? 'selected' : ''}>${l.firstName || l.name || l.employeeId}</option>`).join('')}</select></div>
        <div style="margin-bottom:0.7rem;"><strong>Members:</strong>
          <div style="margin-bottom:0.5rem;">
            <label style="font-size:0.9rem;color:#666;">Select members to remove:</label>
            <div class="team-selection-buttons">
              <button type="button" class="team-selection-btn" onclick="window.selectAllMembers('${team._id}')">Select All</button>
              <button type="button" class="team-selection-btn" onclick="window.deselectAllMembers('${team._id}')">Deselect All</button>
            </div>
            <div class="team-member-selection">
              ${currentMembers.map(m => `
                <div class="team-member-item">
                  <input type="checkbox" id="remove_${team._id}_${m.employeeId}" value="${m.employeeId}" onchange="window.updateRemoveButtonText('${team._id}')">
                  <label for="remove_${team._id}_${m.employeeId}">${m.firstName || m.name || m.employeeId}</label>
                </div>
              `).join('')}
            </div>
            <button type="button" class="team-remove-btn" onclick="window.removeSelectedMembersFromTeam('${team._id}')">Remove Selected</button>
          </div>
        </div>
        <div style="margin-bottom:0.7rem;">
          <strong>Add Member:</strong>
          <select id="addMemberSelect_${team._id}" style="width:100%;padding:6px;border-radius:6px;">
            <option value="">-- Select to Add --</option>
            ${uniqueAddable.map(m => `<option value="${m.employeeId}">${m.firstName || m.name || m.employeeId}</option>`).join('')}
          </select>
          <button type="button" style="margin-top:0.5rem;background:linear-gradient(90deg,#43cea2,#764ba2);color:#fff;padding:4px 14px;border-radius:7px;font-weight:600;font-size:0.95rem;box-shadow:0 2px 8px rgba(67,206,162,0.10);border:none;cursor:pointer;transition:background 0.2s;" onclick="window.addMemberToTeam('${team._id}')">Add</button>
        </div>
        <div class="team-edit-btn-group" style="display:flex;gap:0.2rem;margin-top:1rem;">
          <button class="modern-btn" style="background:linear-gradient(90deg,#43cea2,#764ba2);color:#fff;padding:7px 20px;border-radius:7px;font-weight:600;font-size:1rem;box-shadow:0 2px 8px rgba(67,206,162,0.10);border:none;cursor:pointer;transition:background 0.2s;" onclick="window.saveEditTeam('${team._id}')">Save</button>
          <button class="modern-btn" style="background:#6c757d;color:#fff;padding:7px 20px;border-radius:7px;font-weight:600;font-size:1rem;box-shadow:0 2px 8px rgba(108,117,125,0.10);border:none;cursor:pointer;transition:background 0.2s;" onclick="window.cancelEditTeam('${team._id}')">Cancel</button>
          <button class="modern-btn" style="background:linear-gradient(90deg,#dc3545,#ff7675);color:#fff;padding:7px 20px;border-radius:7px;font-weight:600;font-size:1rem;box-shadow:0 2px 8px rgba(220,53,69,0.10);border:none;cursor:pointer;transition:background 0.2s;" onclick="window.deleteTeam('${team._id}')">Delete Team</button>
        </div>
      </div>`;
    } else {
      // ... existing code for view mode ...
      const teamLeader = leaders.find(l => l.employeeId === team.team_leader);
      return `<div class="team-card" style="background:#f8fafc;border-radius:14px;box-shadow:0 2px 8px rgba(67,206,162,0.10);padding:1.5rem 1.2rem;min-width:260px;max-width:320px;flex:1 1 260px;transition:box-shadow 0.2s;">
        <div style="font-size:1.2rem;font-weight:700;color:#764ba2;margin-bottom:0.5rem;">${team.team_name}</div>
        <div style="margin-bottom:0.7rem;"><strong>Leader:</strong> ${teamLeader ? (teamLeader.firstName || teamLeader.name || teamLeader.employeeId) : team.team_leader}</div>
        <div style="margin-bottom:0.7rem;"><strong>Members:</strong><ul style="margin:0 0 0 1.2rem;padding:0;">${(team.team_members_details || []).map(m => `<li style="margin-bottom:2px;">${m.firstName || m.name || m.employeeId}</li>`).join('')}</ul></div>
        <div style="display:flex;gap:0.7rem;margin-top:1rem;">
          <button class="modern-btn" style="background:linear-gradient(90deg,#ffc107,#ff7675);color:#333;padding:7px 20px;border-radius:7px;font-weight:600;font-size:1rem;box-shadow:0 2px 8px rgba(255,193,7,0.10);border:none;cursor:pointer;transition:background 0.2s;" onclick="window.editTeam('${team._id}')">Edit</button>
          <button class="modern-btn" style="background:linear-gradient(90deg,#dc3545,#ff7675);color:#fff;padding:7px 20px;border-radius:7px;font-weight:600;font-size:1rem;box-shadow:0 2px 8px rgba(220,53,69,0.10);border:none;cursor:pointer;transition:background 0.2s;" onclick="window.deleteTeam('${team._id}')">Delete</button>
        </div>
      </div>`;
    }
  }).join('')}</div>`;

  // Attach global handlers for edit/save/cancel/delete

}

// Handle team creation (API)
function setupTeamCreationForm() {
  const createTeamForm = document.getElementById("createTeamForm");
  if (createTeamForm) {
    createTeamForm.onsubmit = async function(e) {
      e.preventDefault();
      const teamName = document.getElementById("teamName").value.trim();
      const teamLeaderId = document.getElementById("teamLeader").value;
      const memberIds = Array.from(document.getElementById("teamMembers").selectedOptions).map(opt => opt.value);
      const token = localStorage.getItem("jwtToken");
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team_name: teamName, team_leader: teamLeaderId, team_members: memberIds })
      });
      const data = await res.json();
      if (data.success) {
        await loadTeamManagement();
        this.reset();
      } else {
        alert(data.message || "Failed to create team");
      }
    };
  }

}
function loadPaySlipView() {
  mainContent.innerHTML = `
    <div class="pay-slip-outer" id="paySlipOuter">
      <div class="admin-content-section pay-slip-section" id="pay-slip-view-section">
        <div class="scrollable-form-container">
          <div class="pay-slip-container">
            <h2>Pay Slip View</h2>
            <form id="paySlipViewForm" autocomplete="off">
              <div class="form-group" style="position:relative;">
                <label for="paySlipSearchEmployeeName">Search by Name</label>
                <input type="text" id="paySlipSearchEmployeeName" placeholder="Type employee name..." autocomplete="off" />
                <div id="paySlipNameSearchDropdown"></div>
              </div>
              <div class="form-group">
                <label for="paySlipSearchEmployeeId">Employee ID</label>
                <input type="text" id="paySlipSearchEmployeeId" placeholder="Employee ID" readonly />
              </div>
              <div class="form-group">
                <label for="paySlipSearchMonth">Month</label>
                <select id="paySlipSearchMonth">
                  <option value="">Select Month</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              <div class="form-group">
                <label for="paySlipSearchYear">Year</label>
                <input type="number" id="paySlipSearchYear" placeholder="Year (e.g. 2025)" min="2000" max="2100" />
              </div>
              <div class="form-group">
                <button type="submit" class="search-btn" style="width:100%;margin-top:10px;">Search</button>
              </div>
            </form>
            <div id="paySlipViewResult" style="margin-top:2rem;display:none;"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach a search function to the name input
  (function attachPaySlipNameSearch() {
    const nameInput = document.getElementById("paySlipSearchEmployeeName");
    const idInput = document.getElementById("paySlipSearchEmployeeId");
    const dropdown = document.getElementById("paySlipNameSearchDropdown");
    if (!nameInput || !idInput || !dropdown) return;

    let searchCache = []; // Cache for employee search results
    
    // Function to fetch employees if cache is empty
    async function fetchEmployeesForSearch() {
      if (searchCache.length > 0) return;
      try {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch("/api/employees", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.employees)) {
          searchCache = data.employees.map(e => ({
            id: e.employeeId,
            name: `${e.firstName || ''} ${e.lastName || ''}`.trim()
          }));
        }
      } catch (err) {
        // handle error silently
      }
    }

    nameInput.addEventListener("focus", fetchEmployeesForSearch);

    nameInput.addEventListener("keyup", function () {
      const term = nameInput.value.toLowerCase().trim();
      if (!term) {
        dropdown.innerHTML = "";
        return;
      }
      const filtered = searchCache.filter(e =>
        e.name.toLowerCase().includes(term)
      );
   dropdown.innerHTML = filtered
  .map(
    (e) => `
      <div data-id="${e.id}" data-name="${e.name}" style="padding:6px 12px;cursor:pointer;">
        <span style="color:#a020f0;font-weight:600;">${e.name}</span>
        <span style="color:#222;font-weight:bold;"> (${e.id})</span>
      </div>
    `
  )
  .join("");
    });

dropdown.addEventListener("click", function (e) {
  const targetDiv = e.target.closest('div[data-id]');
  if (targetDiv) {
    nameInput.value = targetDiv.dataset.name;
    idInput.value = targetDiv.dataset.id;
    dropdown.innerHTML = "";
  }
});

    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target) && e.target !== nameInput) {
        dropdown.innerHTML = "";
      }
    });
  })();

  // Handle pay slip search
  document.getElementById("paySlipViewForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const empId = document.getElementById("paySlipSearchEmployeeId").value.trim();
    let month = document.getElementById("paySlipSearchMonth").value.trim();
    let year = document.getElementById("paySlipSearchYear").value.trim();
    const resultDiv = document.getElementById("paySlipViewResult");

    if (!empId) {
      resultDiv.style.display = "block";
      resultDiv.innerHTML = `<div class='error' style='color:#dc3545;font-weight:bold;'>Please select an employee from the dropdown.</div>`;
      return;
    }

    // Ensure month and year are numbers (no leading zeros)
    if (month) month = parseInt(month, 10);
    if (year) year = parseInt(year, 10);

    let url = `/api/payslip?employeeId=${encodeURIComponent(empId)}`;
    if (month) url += `&month=${encodeURIComponent(month)}`;
    if (year) url += `&year=${encodeURIComponent(year)}`;
    
    resultDiv.style.display = "block";
    resultDiv.innerHTML = '<div class="loading">Loading pay slip...</div>';
    
    try {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch(url , {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok && data && data.employeeId) {
        let slip = data;
        // Remove any existing modal
        const existingModal = document.getElementById('paySlipModal');
        if (existingModal) existingModal.remove();

        const paySlipModalHTML = `
          <div id="paySlipModal" class="modal-overlay" style="display:flex;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);z-index:9999;justify-content:center;align-items:center;">
            <div class="modal-content" style="background:#fff;border-radius:12px;max-width:900px;width:98vw;max-height:95vh;overflow:auto;box-shadow:0 4px 32px rgba(0,0,0,0.18);padding:0;position:relative;">
              <div id="paySlipPreviewContainer">${renderPaySlipHTML(slip)}</div>
              <div style="display:flex;justify-content:flex-end;gap:1rem;padding:18px 32px 18px 0;background:#faf9fd;border-top:1px solid #eee;">
              <button id="clearPaySlipViewBtn" class="cancel-btn" style="padding:10px 28px;font-size:1.1em;">Clear</button>
               <button class="search-btn">Send</button>
             
            </div>
            <div id="paySlipSendStatus" style="margin-top:1rem;"></div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', paySlipModalHTML);
        
        document.getElementById("clearPaySlipViewBtn").onclick = function() {
          const modal = document.getElementById('paySlipModal');
          if (modal) modal.remove();
        };

        document.getElementById("sendPaySlipViewBtn").onclick = async function() {
          // Call the new /api/payslip/send-notification endpoint
          const statusDiv = document.getElementById("paySlipSendStatus");
          statusDiv.innerHTML = '<span style="color:#764ba2;font-weight:bold;">Sending pay slip notification...</span>';
          try {
            const token = localStorage.getItem("jwtToken");
            // Use employeeId, month, year for notification
            if (!empId || !month || !year) {
              statusDiv.innerHTML = `<span style='color:#dc3545;font-weight:bold;'>Error sending pay slip notification: employeeId, month, and year are required.</span>`;
              return;
            }
            const res = await fetch(`/api/payslip/send-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                employeeId: empId,
                month: month,
                year: year,
                message: "Your pay slip has been generated. Now click the download to generate the pay slip. Thank You."
              })
            });
            const data = await res.json();
            if (res.ok) {
              statusDiv.innerHTML = '<span style="color:#28a745;font-weight:bold;">Pay slip notification sent successfully.</span>';
            } else {
              statusDiv.innerHTML = `<span style="color:#dc3545;font-weight:bold;">Error sending pay slip notification: ${data.message}</span>`;
            }
          } catch (err) {
            statusDiv.innerHTML = '<span style="color:#dc3545;font-weight:bold;">An error occurred while sending the notification.</span>';
          }
        };

      } else {
        resultDiv.innerHTML = `<div class='error'>${data.error || 'Pay slip not found.'}</div>`;
      }
    } catch (err) {
      resultDiv.innerHTML = '<div class="error">An error occurred. Please try again.</div>';
    }
  });
}
function loadPaySlipSchedule() {
  if (isAdminRole) {
    alert('Admins do not have a pay slip schedule.');
    return;
  }
  setActive('btn-pay-slip-schedule');
  mainContent.innerHTML = `
    <div class="pay-slip-schedule-container">
      <h2 class="pay-slip-schedule-title">My Payslips</h2>
      <div class="pay-slip-schedule-desc">Click to view or download your payslips</div>
      <table class="pay-slip-schedule-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Month - Year</th>
            <th>Uploaded On</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="paySlipScheduleTableBody">
          <tr><td colspan="5" style="text-align:center;padding:2em;color:#aaa;">Loading...</td></tr>
        </tbody>
      </table>
    </div>
  `;
  fetchMyPayslips();
}
async function fetchMyPayslips() {
  const tbody = document.getElementById('paySlipScheduleTableBody');
  if (!tbody) return;
  try {
    const token = localStorage.getItem('jwtToken');
    const employee = JSON.parse(localStorage.getItem('employee'));
    const res = await fetch(`/api/mypayslips?employeeId=${encodeURIComponent(employee.employeeId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.payslips)) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2em;color:#aaa;">No payslips found.</td></tr>';
      return;
    }
    if (data.payslips.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2em;color:#aaa;">No payslips found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.payslips.map((p, idx) => {
      const monthYear = `<b>${p.monthName} ${p.year}</b>`;
      const uploadedOn = p.uploadedOn ? `<b>${p.uploadedOn}</b>` : '';
      const status = p.status === 'new'
        ? '<span class="status-new">New</span>'
        : '<span class="status-viewed">Viewed</span>';
      // Always enable the View button
      const viewBtn = `<button class="action-btn view-payslip-btn" data-employee-id="${p.employeeId}" data-month="${p.month}" data-year="${p.year}">View</button>`;
      return `<tr>
        <td>${idx + 1}</td>
        <td>${monthYear}</td>
        <td>${uploadedOn}</td>
        <td>${status}</td>
        <td>${viewBtn}</td>
      </tr>`;
    }).join('');

    // Attach event listeners to all view buttons
    tbody.querySelectorAll('.view-payslip-btn').forEach(btn => {
      btn.addEventListener('click', async function() {
        const employeeId = this.getAttribute('data-employee-id');
        const month = this.getAttribute('data-month');
        const year = this.getAttribute('data-year');
        // Fetch payslip data
        const token = localStorage.getItem('jwtToken');
        try {
          const res = await fetch(`/api/payslip?employeeId=${encodeURIComponent(employeeId)}&month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const slip = await res.json();
          if (res.ok && slip && slip.employeeId) {
            // Show modal
            const existingModal = document.getElementById('paySlipModal');
            if (existingModal) existingModal.remove();
            const paySlipModalHTML = `
              <div id="paySlipModal" class="modal-overlay" style="display:flex;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);z-index:9999;justify-content:center;align-items:center;">
                <div class="modal-content" style="background:#fff;border-radius:12px;max-width:900px;width:98vw;max-height:95vh;overflow:auto;box-shadow:0 4px 32px rgba(0,0,0,0.18);padding:0;position:relative;">
                  <div id="paySlipPreviewContainer">${renderPaySlipHTML(slip)}</div>
                  <div style="display:flex;justify-content:flex-end;gap:1rem;padding:18px 32px 18px 0;background:#faf9fd;border-top:1px solid #eee;">
                    <button id="closePaySlipModalBtn" class="cancel-btn" style="padding:10px 28px;font-size:1.1em;">Close</button>
                  </div>
                </div>
              </div>`;
            document.body.insertAdjacentHTML('beforeend', paySlipModalHTML);
            document.getElementById('closePaySlipModalBtn').onclick = function() {
              const modal = document.getElementById('paySlipModal');
              if (modal) modal.remove();
            };
            // Mark as viewed in backend if status was 'new'
            if (this.parentElement.previousElementSibling.querySelector('.status-new')) {
              await fetch('/api/payslip/mark-viewed', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ employeeId, month, year })
              });
              // Update status visually
              this.parentElement.previousElementSibling.innerHTML = '<span class="status-viewed">Viewed</span>';
            }
          } else {
            alert(slip.error || 'Failed to load payslip.');
          }
        } catch (err) {
          alert('Error loading payslip.');
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2em;color:#aaa;">Error loading payslips.</td></tr>';
  }
}