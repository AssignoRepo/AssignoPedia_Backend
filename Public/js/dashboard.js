import socialMediaService from './social-media-service.js';

// Make these functions globally available
//const token = localStorage.getItem('jwtToken');
//console.log("Token at dashbaoard",token);
window.approveLeaveRequest = async function(id) {
    try {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch(`http://localhost:5000/api/leave-requests/${id}/approve`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await res.json();
        
        if (data.success) {
            // Reload leave requests
            loadLeaveApproval();
        } else {
            alert(data.message || 'Failed to approve leave request');
        }
    } catch (err) {
        alert('Error approving leave request');
    }
};

window.rejectLeaveRequest = async function(id) {
    try {
        const token = localStorage.getItem("jwtToken");
        const res = await fetch(`http://localhost:5000/api/leave-requests/${id}/reject`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await res.json();
        
        if (data.success) {
            // Reload leave requests
            loadLeaveApproval();
        } else {
            alert(data.message || 'Failed to reject leave request');
        }
    } catch (err) {
        alert('Error rejecting leave request');
    }
};

document.addEventListener("DOMContentLoaded", () => {
  const employee = JSON.parse(localStorage.getItem("employee"));
  const token = localStorage.getItem("jwtToken");
console.log("login->",token);
  if (!employee || !token) {
    window.location.href = "login.html";
    return;
  }
console.log(employee);
  // Role-based access control
  const isAdminRole = employee.role === 'Admin' || employee.role === 'hr_admin';
  const isHRRole = employee.role === 'hr_admin' || employee.role === 'hr_manager' || employee.role === 'hr_executive' || employee.role === 'hr_recruiter';
  console.log(isAdminRole);
  // Access Control Summary:
  // - Admin & HR Admin: Full access (social media, add employee, stats, leave approval, pay slip)
  // - HR Manager, HR Executive, HR Recruiter: Employee management, leave approval, pay slip
  // - All other roles (developers, writers, team leaders, BDM): Leave requests only
  
  // Show admin/HR buttons based on role
  if (isAdminRole) {
    // Full access for admin and hr_admin
    document.getElementById("btn-social").style.display = "";
    document.getElementById("btn-add-employee").style.display = "";
    document.getElementById("btn-stats").style.display = "";
    
    // Add leave approval button to sidebar for admin roles
    const sidebar = document.querySelector('.sidebar');
    const leaveApprovalBtn = document.createElement('button');
    leaveApprovalBtn.id = 'btn-leave-approval';
    leaveApprovalBtn.className = 'sidebar-btn';
    leaveApprovalBtn.innerHTML = '<i class="fas fa-check-circle"></i> Leave Approval';
    sidebar.insertBefore(leaveApprovalBtn, document.getElementById('btn-stats'));
    
    // Add event listener for leave approval button
    leaveApprovalBtn.onclick = loadLeaveApproval;
  } else if (isHRRole) {
    // HR roles can see employee management and leave approval
    document.getElementById("btn-add-employee").style.display = "";
    
    // Add leave approval button to sidebar for HR roles
    const sidebar = document.querySelector('.sidebar');
    const leaveApprovalBtn = document.createElement('button');
    leaveApprovalBtn.id = 'btn-leave-approval';
    leaveApprovalBtn.className = 'sidebar-btn';
    leaveApprovalBtn.innerHTML = '<i class="fas fa-check-circle"></i> Leave Approval';
    sidebar.insertBefore(leaveApprovalBtn, document.getElementById('btn-stats'));
    
    // Add event listener for leave approval button
    leaveApprovalBtn.onclick = loadLeaveApproval;
  }
  // Other roles (developers, writers, team leaders, BDM) will only see leave requests and pay slip

  const mainContent = document.getElementById("mainContent");

  function setActive(buttonId) {
    document.querySelectorAll(".sidebar-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.getElementById(buttonId);
    if (activeBtn) activeBtn.classList.add("active");
  }

  // Load Leave Request Form and History
  async function loadLeaveRequest() {
    setActive("btn-leave");
    mainContent.innerHTML = `
      <div class="logout-container"><button class="logout-btn" id="logoutBtn">Logout</button></div>
      <div class="admin-content-section">
        <h2>Leave Requests</h2>
        <form id="leaveForm" class="section-form add-employee-flex-row">
          <div class="form-row" style="flex-wrap: wrap; gap: 15px;">
            <div class="form-group" style="flex: 1; min-width: 250px;">
              <label>Reason</label>
              <select name="Reason" required id="ReasonSelect" class="reason-select">
                <option value="">Select a reason</option>
                <option value="Medical Reason">Medical Reason</option>
                <option value="Personal Reason">Personal Reason</option>
                <option value="Emergency Reason">Emergency Reason</option>
                <option value="Other Reason">Other Reason</option>
              </select>
            </div>
            <div class="form-group" style="flex: 1; min-width: 250px;">
              <label>Leave Count</label>
              <div class="leave-count-container">
                <input type="number" name="leaveCount" min="1" max="20" value="" required class="leave-count-input" placeholder="Enter number of days (1-20)" id="leaveCountInput">
              </div>
            </div>
          </div>
          <div id="reasonCommentBox" class="form-row" style="display: none; margin-top: 10px;">
            <div class="form-group" style="flex: 1;">
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
          <div id="singleDateSection" class="form-row" style="flex-wrap: wrap; gap: 15px; margin-top: 15px; display: none;">
            <div class="form-group" style="flex: 1; min-width: 250px;">
              <label>Select Date</label>
              <input type="date" name="singleDate" class="date-input" placeholder="Select date">
            </div>
          </div>
          <div id="dateRangeSection" class="form-row" style="flex-wrap: wrap; gap: 15px; margin-top: 15px; display: none;">
            <div class="form-group" style="flex: 1; min-width: 250px;">
              <label>From</label>
              <input type="date" name="fromDate" class="date-input" placeholder="Select start date">
            </div>
            <div class="form-group" style="flex: 1; min-width: 250px;">
              <label>To</label>
              <input type="date" name="toDate" class="date-input" placeholder="Select end date">
            </div>
          </div>
          <div class="button-container">
            <button type="button" class="cancel-btn" id="cancelLeaveBtn">Cancel</button>
            <button type="submit" class="add-employee-btn">Submit Request</button>
          </div>
        </form>
      </div>
    `;

    // Sample holiday list (to be replaced with actual holidays later)
    const holidays = [
      '2024-01-01', // New Year's Day
      '2024-01-26', // Republic Day
      '2024-03-25', // Holi
      '2024-04-09', // Ram Navami
      '2024-05-01', // Labor Day
      '2024-08-15', // Independence Day
      '2024-10-02', // Gandhi Jayanti
      '2024-12-25'  // Christmas
    ];

    // Function to check if a date is a holiday
    const isHoliday = (date) => {
      const dateStr = date.toISOString().split('T')[0];
      return holidays.includes(dateStr);
    };

    // Function to create date without timezone issues
    const createDate = (dateStr) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
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
        console.log('Selected Date:', selectedDate);
        console.log('Day of week:', selectedDate.getDay());
        
        // Check if it's Sunday (0) or holiday
        if (selectedDate.getDay() === 0 || isHoliday(selectedDate)) {
          alert('Cannot apply leave on Sunday or holiday');
          singleDateInput.value = '';
          leaveCountInput.value = '0';
          return;
        } else {
          // If it's a valid working day, set leave count to 1
          leaveCountInput.value = '1';
        }
      } else if (leaveCount > 1 && fromDateInput.value && toDateInput.value) {
        const fromDate = createDate(fromDateInput.value);
        const toDate = createDate(toDateInput.value);

        if (fromDate > toDate) {
          alert('From date cannot be after To date');
          fromDateInput.value = '';
          toDateInput.value = '';
          return;
        }

        // Calculate and update leave count based on selected dates
        const workingDays = calculateWorkingDays(fromDate, toDate);
        leaveCountInput.value = workingDays;
      }
    };

    // Function to calculate working days between two dates
    const calculateWorkingDays = (startDate, endDate) => {
      let count = 0;
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // Skip Sundays (0) and holidays
        if (currentDate.getDay() !== 0 && !isHoliday(currentDate)) {
          count++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return count;
    };

    // Leave count change handler
    document.getElementById("leaveCountInput").onchange = function() {
      const leaveCount = parseInt(this.value);
      const singleDateSection = document.getElementById("singleDateSection");
      const dateRangeSection = document.getElementById("dateRangeSection");
      const singleDateInput = document.querySelector('input[name="singleDate"]');
      const fromDateInput = document.querySelector('input[name="fromDate"]');
      const toDateInput = document.querySelector('input[name="toDate"]');

      // Reset all date inputs
      singleDateInput.value = '';
      fromDateInput.value = '';
      toDateInput.value = '';

      if (leaveCount === 1) {
        singleDateSection.style.display = 'flex';
        dateRangeSection.style.display = 'none';
        singleDateInput.required = true;
        fromDateInput.required = false;
        toDateInput.required = false;
      } else if (leaveCount > 1) {
        singleDateSection.style.display = 'none';
        dateRangeSection.style.display = 'flex';
        singleDateInput.required = false;
        fromDateInput.required = true;
        toDateInput.required = true;
      } else {
        singleDateSection.style.display = 'none';
        dateRangeSection.style.display = 'none';
        singleDateInput.required = false;
        fromDateInput.required = false;
        toDateInput.required = false;
      }
    };

    // Add event listeners for date changes
    document.querySelector('input[name="singleDate"]').addEventListener('change', handleDateChange);
    document.querySelector('input[name="fromDate"]').addEventListener('change', handleDateChange);
    document.querySelector('input[name="toDate"]').addEventListener('change', handleDateChange);

    // Also add event listener for leave count input to handle initial value
    document.getElementById("leaveCountInput").addEventListener('change', function() {
      const singleDateInput = document.querySelector('input[name="singleDate"]');
      if (this.value === '1' && singleDateInput.value) {
        // Re-trigger date validation when leave count is set to 1
        handleDateChange();
      }
    });

    // Add reason select change handler
    document.getElementById("ReasonSelect").onchange = function() {
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
    document.getElementById("cancelLeaveBtn").onclick = function() {
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
      
      const body = {
        reason: form.Reason.value,
        leaveCount: leaveCount,
        fromDate: leaveCount === 1 ? form.singleDate.value : form.fromDate.value,
        toDate: leaveCount === 1 ? form.singleDate.value : form.toDate.value,
        comments: form.reasonComment.value
      };

      try {
        const res = await fetch("http://localhost:5000/api/leave-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
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
  }

  // Social Media Links
  function loadSocialMedia() {
    // Security check - only admin roles can access social media
    if (!isAdminRole) {
      alert('Access denied. Only administrators can access social media features.');
      return;
    }
    
    setActive("btn-social");
    mainContent.innerHTML = `
      <div class="logout-container"><button class="logout-btn" id="logoutBtn">Logout</button></div>
      <div class="admin-content-section">
        <h2>Social Media Post</h2>
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
          <div class="form-row" style="justify-content: flex-end;">
            <button type="submit" class="post-btn">
              <i class="fas fa-paper-plane"></i>
              Post to Social Media
            </button>
          </div>
        </form>
        <div id="postStatus" class="post-status"></div>
      </div>
    `;

    // File upload handling
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileLabel = document.querySelector('.file-label');

    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        fileInfo.innerHTML = `
          <div class="file-preview">
            <i class="fas ${getFileIcon(file.type)}"></i>
            <span>${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
          </div>
        `;
        fileLabel.classList.add('has-file');
      } else {
        fileInfo.innerHTML = '';
        fileLabel.classList.remove('has-file');
      }
    });

    // Drag and drop handling
    const dropZone = document.querySelector('.file-upload-container');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
      dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
      dropZone.classList.remove('highlight');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      fileInput.files = dt.files;
      const event = new Event('change');
      fileInput.dispatchEvent(event);
    }

    // Form submission
    document.getElementById('socialMediaForm').onsubmit = async function(e) {
      e.preventDefault();
      const form = e.target;
      const caption = form.caption.value;
      const file = form.file.files[0];
      const platforms = Array.from(form.platforms)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

      if (!caption) {
        showStatus('Please enter a caption', 'error');
        return;
      }

      if (platforms.length === 0) {
        showStatus('Please select at least one platform', 'error');
        return;
      }

      const postStatus = document.getElementById('postStatus');
      postStatus.innerHTML = '<div class="posting-status"><i class="fas fa-spinner fa-spin"></i> Posting to social media...</div>';

      try {
        const results = await socialMediaService.postToSocialMedia(caption, file, platforms);
        
        if (results.success.length > 0) {
          const successMessage = results.success
            .map(r => `Successfully posted to ${r.platform}`)
            .join('<br>');
          showStatus(successMessage, 'success');
        }
        
        if (results.failed.length > 0) {
          const errorMessage = results.failed
            .map(r => `Failed to post to ${r.platform}: ${r.error}`)
            .join('<br>');
          showStatus(errorMessage, 'error');
        }

        if (results.success.length > 0) {
          form.reset();
          fileInfo.innerHTML = '';
          fileLabel.classList.remove('has-file');
        }
      } catch (error) {
        showStatus('Error posting to social media. Please try again.', 'error');
      }
    };

    setLogoutListener();
  }

  // Helper functions for file handling
  function getFileIcon(fileType) {
    if (fileType.startsWith('image/')) return 'fa-image';
    if (fileType.startsWith('video/')) return 'fa-video';
    if (fileType.startsWith('audio/')) return 'fa-music';
    if (fileType.includes('pdf')) return 'fa-file-pdf';
    if (fileType.includes('word')) return 'fa-file-word';
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'fa-file-excel';
    return 'fa-file';
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function showStatus(message, type) {
    const postStatus = document.getElementById('postStatus');
    postStatus.innerHTML = `
      <div class="status-message ${type}">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
      </div>
    `;
  }

  async function simulateSocialMediaPost(caption, file, platforms) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Here you would typically make API calls to social media platforms
    console.log('Posting to:', platforms);
    console.log('Caption:', caption);
    console.log('File:', file ? file.name : 'No file');
    
    // Simulate success
    return true;
  }

  // Add Employee Form
  function loadAddEmployee() {
    // Security check - only admin and HR roles can add employees
    if (!isAdminRole && !isHRRole) {
      alert('Access denied. Only administrators and HR personnel can add employees.');
      return;
    }
    
    setActive("btn-add-employee");
    mainContent.innerHTML = `
      <div class="logout-container"><button class="logout-btn" id="logoutBtn">Logout</button></div>
      <div class="admin-content-section">
        <h2>Add New Employee</h2>
        <form id="addEmployeeForm" class="section-form add-employee-flex-row">
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
          </div>
          <div class="form-row" style="justify-content: space-between; align-items: flex-end;">
            <div class="form-group" style="flex: 0 0 auto;">
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
            <div class="button-container" style="flex: 0 0 auto;">
              <button type="button" class="cancel-btn">Cancel</button>
              <button type="submit" class="login-btn add-employee-btn">Add Employee</button>
            </div>
          </div>
          <div id="addEmployeeMsg"></div>
        </form>
      </div>
    `;

    // Add ID Card validation
    const idCardType = document.getElementById('idCardType');
    const idCardNumber = document.getElementById('idCardNumber');

    idCardType.addEventListener('change', function() {
      const type = this.value;
      idCardNumber.value = ''; // Clear previous value
      
      // Set pattern based on ID card type
      switch(type) {
        case 'aadhar':
          idCardNumber.pattern = '[0-9]{12}';
          idCardNumber.placeholder = 'Enter 12-digit Aadhar number';
          break;
        case 'pan':
          idCardNumber.pattern = '[A-Z]{5}[0-9]{4}[A-Z]{1}';
          idCardNumber.placeholder = 'Enter PAN number (e.g., ABCDE1234F)';
          break;
        case 'passport':
          idCardNumber.pattern = '[A-Z]{1}[0-9]{7}';
          idCardNumber.placeholder = 'Enter Passport number (e.g., A1234567)';
          break;
        case 'driving':
          idCardNumber.pattern = '[A-Z]{2}[0-9]{2}[0-9]{11}';
          idCardNumber.placeholder = 'Enter Driving License number';
          break;
        case 'voter':
          idCardNumber.pattern = '[A-Z]{3}[0-9]{7}';
          idCardNumber.placeholder = 'Enter Voter ID number';
          break;
        default:
          idCardNumber.pattern = '';
          idCardNumber.placeholder = 'Select ID Card Type first';
      }
    });

    document.getElementById("addEmployeeForm").onsubmit = async function (e) {
      e.preventDefault();
      const form = e.target;
      const formData = new FormData();
      
      // Add all form fields to FormData
      formData.append('employeeId', form.employeeId.value);
      formData.append('firstName', form.firstName.value);
      formData.append('lastName', form.lastName.value);
      formData.append('password', form.password.value);
      formData.append('role', form.role.value);
      formData.append('address', form.address.value);
      formData.append('mobile', form.mobile.value);
      formData.append('email', form.email.value);
      formData.append('idCardType', form.idCardType.value);
      formData.append('idCardNumber', form.idCardNumber.value);
      formData.append('doj', form.doj.value);

      // Add profile image if selected

      const profileImage = document.getElementById('profileImage').files[0];
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      try {
        const token=localStorage.getItem("jwtToken");
        console.log("Token at employee form",token);
        const res = await fetch("http://localhost:5000/api/employees", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData
        });
        const data = await res.json();
        console.log(data);
        const msgDiv = document.getElementById("addEmployeeMsg");
        if (data.success) {
          msgDiv.style.color = "green";
          msgDiv.textContent = "Employee added successfully!";
          form.reset();
          document.getElementById('imagePreview').style.display = 'none';
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
    document.querySelector('.cancel-btn').onclick = function() {
      document.getElementById('addEmployeeForm').reset();
    };

    // Add this function after the loadAddEmployee function
    function removeImage() {
      const preview = document.getElementById('imagePreview');
      const fileInput = document.getElementById('profileImage');
      preview.style.display = 'none';
      fileInput.value = '';
    }

    // Add this event listener in the loadAddEmployee function after the form submission handler
    document.getElementById('profileImage').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById('imagePreview');
          const previewImg = document.getElementById('previewImg');
          previewImg.src = e.target.result;
          preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
      }
    });

    setLogoutListener();
  }

  // Load Stats
  async function loadStats() {
    // Security check - only admin roles can access stats
    if (!isAdminRole) {
      alert('Access denied. Only administrators can view statistics.');
      return;
    }
    
    setActive("btn-stats");
    mainContent.innerHTML = `
      <div class="logout-container"><button class="logout-btn" id="logoutBtn">Logout</button></div>
      <div class="admin-content-section">
        <h2>Employee Statistics</h2>
        <div id="statsBox">Loading...</div>
      </div>
    `;
    try {
      const token=localStorage.getItem("jwtToken");
      const res = await fetch("http://localhost:5000/api/employees/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById("statsBox").innerHTML = `
          <p>Total Employees: <strong>${data.totalEmployees}</strong></p>
          <p>Total Admins: <strong>${data.totalAdmins}</strong></p>
        `;
      } else {
        document.getElementById("statsBox").textContent = "Failed to load stats.";
      }
    } catch {
      document.getElementById("statsBox").textContent = "Error loading statistics.";
    }

    setLogoutListener();
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

  // Attach event listeners
  document.getElementById("btn-leave").onclick = loadLeaveRequest; // Available to all users
  
  // Social media - only for admin roles
  if (isAdminRole) {
    document.getElementById("btn-social").onclick = loadSocialMedia;
  }
  
  // Add employee - for admin and HR roles
  if (isAdminRole || isHRRole) {
    document.getElementById("btn-add-employee").onclick = loadAddEmployee;
  }
  
  // Stats - only for admin roles
  if (isAdminRole) {
    document.getElementById("btn-stats").onclick = loadStats;
  }
  
  // Pay slip - for admin and HR roles
  if (isAdminRole || isHRRole) {
    document.getElementById("btn-pay-slip").onclick = loadPaySlipAdmin;
  }
  
  // Leave approval - for admin and HR roles
  if (isAdminRole || isHRRole) {
    const leaveApprovalBtn = document.getElementById("btn-leave-approval");
    if (leaveApprovalBtn) {
      leaveApprovalBtn.onclick = loadLeaveApproval;
    }
  }

  // Load default section
  loadLeaveRequest();

  // Responsive styles
  const formRow = document.querySelector('.form-row');
  if (formRow) {
    const formGroups = formRow.querySelectorAll('.form-group');
    if (formGroups.length > 2) {
      formRow.style.flexWrap = 'wrap';
      formRow.style.gap = '15px';
    }
  }

  const formGroups = document.querySelectorAll('.form-group');
  formGroups.forEach(group => {
    if (group.style.flex === '1') {
      group.style.minWidth = '250px';
    }
  });

  const formRowEnd = document.querySelector('.form-row[style*="justify-content: flex-end"]');
  if (formRowEnd) {
    formRowEnd.style.justifyContent = 'center';
    formRowEnd.style.gap = '1rem';
  }

  const cancelBtn = document.getElementById('cancelLeaveBtn');
  if (cancelBtn) {
    cancelBtn.style.minWidth = '120px';
  }

  const loginBtn = document.querySelector('.login-btn');
  if (loginBtn) {
    loginBtn.style.minWidth = '120px';
  }

  const adminContentSection = document.querySelector('.admin-content-section');
  if (adminContentSection) {
    const styles = window.getComputedStyle(adminContentSection);
    if (styles.padding.split(' ').some(p => p.includes('px'))) {
      adminContentSection.style.padding = '15px';
    }
  }

  formGroups.forEach(group => {
    if (group.style.marginBottom) {
      group.style.marginBottom = '10px';
    }
  });

  const labels = document.querySelectorAll('.form-group label');
  labels.forEach(label => {
    if (label.style.fontSize) {
      label.style.fontSize = '14px';
    }
  });

  const selects = document.querySelectorAll('.form-group select');
  const inputs = document.querySelectorAll('.form-group input');
  const textareas = document.querySelectorAll('.form-group textarea');
  selects.forEach(select => {
    if (select.style.padding) {
      select.style.padding = '10px';
    }
  });
  inputs.forEach(input => {
    if (input.style.padding) {
      input.style.padding = '10px';
    }
  });
  textareas.forEach(textarea => {
    if (textarea.style.padding) {
      textarea.style.padding = '10px';
    }
  });

  // Load Leave Approval Page (Admin Only)
  async function loadLeaveApproval() {
    // Security check - only admin and HR roles can approve leaves
    if (!isAdminRole && !isHRRole) {
      alert('Access denied. Only administrators and HR personnel can approve leave requests.');
      return;
    }
    
    setActive("btn-leave-approval");
    mainContent.innerHTML = `
      <div class="logout-container"><button class="logout-btn" id="logoutBtn">Logout</button></div>
      <div class="admin-content-section">
        <h2>Leave Approval Requests</h2>
        <div class="leave-requests-container">
          <div class="filters">
            <select id="statusFilter" class="filter-select">
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <input type="text" id="employeeFilter" class="filter-input" placeholder="Search by Employee ID or Name">
          </div>
          <div class="leave-requests-table">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Reason</th>
                  <th>Leave Count</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="leaveRequestsBody">
                <tr>
                  <td colspan="8" class="loading">Loading leave requests...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Add styles for the leave approval page
    const style = document.createElement('style');
    style.textContent = `
      .leave-requests-container {
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
      
      .leave-requests-table {
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
    `;
    document.head.appendChild(style);

    // Load leave requests
    try {
      const res = await fetch("http://localhost:5000/api/leave-requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      if (data.success) {
        displayLeaveRequests(data.leaveRequests);
      } else {
        document.getElementById("leaveRequestsBody").innerHTML = `
          <tr>
            <td colspan="8" class="error">Failed to load leave requests</td>
          </tr>
        `;
      }
    } catch (err) {
      document.getElementById("leaveRequestsBody").innerHTML = `
        <tr>
          <td colspan="8" class="error">Error loading leave requests</td>
        </tr>
      `;
    }

    // Add event listeners for filters
    document.getElementById("statusFilter").addEventListener("change", filterLeaveRequests);
    document.getElementById("employeeFilter").addEventListener("input", filterLeaveRequests);

    setLogoutListener();
  }

  // Function to display leave requests
  function displayLeaveRequests(requests) {
    const tbody = document.getElementById("leaveRequestsBody");
    if (requests.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="no-data">No leave requests found</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = requests.map(request => `
      <tr data-id="${request._id}" data-status="${request.status}">
        <td>${request.employeeId}</td>
        <td>${request.name}</td>
        <td>${request.reason}</td>
        <td>${request.leaveCount}</td>
        <td>${new Date(request.fromDate).toLocaleDateString()}</td>
        <td>${new Date(request.toDate).toLocaleDateString()}</td>
        <td>
          <span class="status-badge status-${request.status.toLowerCase()}">
            ${request.status}
          </span>
        </td>
        <td class="action-buttons">
          ${request.status === 'Pending' ? `
            <button class="approve-btn" onclick="approveLeaveRequest('${request._id}')">
              Approve
            </button>
            <button class="reject-btn" onclick="rejectLeaveRequest('${request._id}')">
              Reject
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  }

  // Function to filter leave requests
  function filterLeaveRequests() {
    const statusFilter = document.getElementById("statusFilter").value;
    const employeeFilter = document.getElementById("employeeFilter").value.toLowerCase();
    const rows = document.querySelectorAll("#leaveRequestsBody tr");

    rows.forEach(row => {
      if (row.classList.contains('no-data') || row.classList.contains('error')) return;

      const status = row.dataset.status;
      const employeeId = row.cells[0].textContent.toLowerCase();
      const employeeName = row.cells[1].textContent.toLowerCase();

      const statusMatch = statusFilter === 'all' || status === statusFilter;
      const employeeMatch = !employeeFilter || 
        employeeId.includes(employeeFilter) || 
        employeeName.includes(employeeFilter);

      row.style.display = statusMatch && employeeMatch ? '' : 'none';
    });
  }

  function createEmployeeRow(employee) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="employee-info">
          <img src="${employee.profileImage ? `http://localhost:5000/api/employees/${employee._id}/profile-image` : 'images/default-avatar.png'}" 
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

  function loadPaySlipAdmin() {
    // Security check - only admin and HR roles can generate pay slips
    if (!isAdminRole && !isHRRole) {
      alert('Access denied. Only administrators and HR personnel can generate pay slips.');
      return;
    }
    
    setActive("btn-pay-slip");
    mainContent.innerHTML = `
      <div class="logout-container"><button class="logout-btn" id="logoutBtn">Logout</button></div>
      <div class="admin-content-section">
        <h2>Pay Slip Generation</h2>
        <form id="paySlipForm" class="section-form add-employee-flex-row">
          <div class="form-row">
            <div class="form-group">
              <label for="employeeId">Employee ID</label>
              <input type="text" id="employeeId" name="employeeId" required />
            </div>
            <div class="form-group">
              <label for="month">Month</label>
              <select id="month" name="month" required>
                <option value="">Select Month</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="year">Year</label>
              <input type="number" id="year" name="year" min="2000" max="2100" required />
            </div>
            <div class="form-group">
              <label for="basicSalary">Basic Salary</label>
              <input type="number" id="basicSalary" name="basicSalary" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="allowances">Allowances</label>
              <input type="number" id="allowances" name="allowances" required />
            </div>
          </div>
          <div class="button-container">
            <button type="button" class="cancel-btn">Cancel</button>
            <button type="submit" class="add-employee-btn">Generate Pay Slip</button>
          </div>
        </form>
        <div id="message" class="message" style="display: none"></div>
      </div>
    `;

    // Add event listener for form submission
    document.getElementById("paySlipForm").addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = {
        employeeId: document.getElementById("employeeId").value,
        month: document.getElementById("month").value,
        year: document.getElementById("year").value,
        basicSalary: parseFloat(document.getElementById("basicSalary").value),
        allowances: parseFloat(document.getElementById("allowances").value),
      };

      try {
        const response = await fetch("http://localhost:5000/api/pay-slip", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        const messageDiv = document.getElementById("message");
        messageDiv.style.display = "block";

        if (response.ok) {
          messageDiv.className = "message success";
          messageDiv.textContent = "Pay slip generated successfully!";
          this.reset();
        } else {
          messageDiv.className = "message error";
          messageDiv.textContent = data.message || "Failed to generate pay slip";
        }
      } catch (error) {
        console.error("Error:", error);
        const messageDiv = document.getElementById("message");
        messageDiv.style.display = "block";
        messageDiv.className = "message error";
        messageDiv.textContent = "An error occurred. Please try again.";
      }
    });

    // Add Cancel button logic
    document.querySelector('.cancel-btn').onclick = function() {
      document.getElementById('paySlipForm').reset();
      document.getElementById('message').style.display = 'none';
    };

    setLogoutListener();
  }
});
