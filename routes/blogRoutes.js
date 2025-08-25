const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Get the Blog model from the main server file
const { Blog } = require('../server');

function getExtensionFromMIME(mimetype) {
  if (!mimetype || !mimetype.startsWith('image/')) return '.img';
  let ext = mimetype.split('/')[1].toLowerCase();
  if (ext === 'jpeg') ext = 'jpg';
  return `.${ext}`;
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/blog-images/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = getExtensionFromMIME(file.mimetype) || path.extname(file.originalname) || '.jpg';
    cb(null, 'blog-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Function to extract first image from CKEditor content
function extractFirstImageSrc(html) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^">]+)"/i);
  return match ? match[1] : null;
}

// --- GET all published blog posts (for frontend) ---
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    let query = { status: 'published' };
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }
    
    const blogs = await Blog.find(query)
      .populate('author', 'firstName lastName employeeId profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Add author.name and author.avatar for frontend and normalize image URL
    const blogsWithAuthor = blogs.map(blog => {
      const b = blog.toObject();
      if (b.author) {
        b.author.name = 'AssignoPedia';
        b.author.avatar = '/images/logo.png';
      }
      if (b.image) {
        // normalize leading slash
        b.image = b.image.startsWith('/') ? b.image : `/${b.image}`;
      }
      return b;
    });
    
    const total = await Blog.countDocuments(query);
    
    res.json({
      blogs: blogsWithAuthor,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// --- GET single blog post by slug ---
router.get('/:slug', async (req, res) => {
  try {
    const blog = await Blog.findOne({ 
      slug: req.params.slug, 
      status: 'published' 
    }).populate('author', 'firstName lastName employeeId profileImage');
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Increment view count
    blog.viewCount += 1;
    await blog.save();
    
    // Add author.name and author.avatar for frontend and normalize image URL
    const b = blog.toObject();
    if (b.author) {
      b.author.name = 'AssignoPedia';
      b.author.avatar = '/images/logo.png';
    }
    if (b.image) {
      b.image = b.image.startsWith('/') ? b.image : `/${b.image}`;
    }
    
    res.json(b);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

// --- POST create new blog post (HR Dashboard) ---
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    // Check if user has permission to create blogs
    if (!['admin', 'hr_admin', 'hr_recruiter'].includes(req.employee.role)) {
      return res.status(403).json({ error: 'Not authorized to create blog posts' });
    }
    
    const { title, content, excerpt, category, tags } = req.body;
    
    // Create excerpt if not provided
    const blogExcerpt = excerpt || content.substring(0, 200) + '...';
    
    // Find the employee by employeeId to get the _id for author field
    const Employee = require('../server').Employee;
    const employee = await Employee.findOne({ employeeId: req.employee.employeeId });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Generate slug from title
    const generateSlug = (title) => {
      return title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    const blogData = {
      title,
      content,
      excerpt: blogExcerpt,
      category: category || 'General',
      author: employee._id,
      slug: generateSlug(title),
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };
    
    // Extract first image from CKEditor content (this will be our card image if no cover uploaded)
    const firstImage = extractFirstImageSrc(content);
    if (firstImage) {
      blogData.image = firstImage;
    }
    
    // Add image if uploaded via file upload (this takes precedence)
    if (req.file) {
      blogData.image = `/uploads/blog-images/${req.file.filename}`;
    }
    
    const blog = new Blog(blogData);
    await blog.save();
    
    // Populate author info for response
    await blog.populate('author', 'firstName lastName email employeeId');
    
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      blog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ 
      error: 'Failed to create blog post',
      details: error.message 
    });
  }
});

// --- PUT update blog post ---
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin', 'hr_admin', 'hr_recruiter'].includes(req.employee.role)) {
      return res.status(403).json({ error: 'Not authorized to update blog posts' });
    }
    
    const { title, content, excerpt, category, tags, status } = req.body;
    
    const updateData = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      category: category || 'General',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };
    
    if (status) updateData.status = status;
    
    // Extract first image from CKEditor content
    const firstImage = extractFirstImageSrc(content);
    if (firstImage) {
      updateData.image = firstImage;
    }
    
    // Add image if uploaded via file upload (this takes precedence)
    if (req.file) {
      updateData.image = `/uploads/blog-images/${req.file.filename}`;
    }
    
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName email employeeId');
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json({
      success: true,
      message: 'Blog post updated successfully',
      blog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// --- DELETE blog post ---
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin', 'hr_admin'].includes(req.employee.role)) {
      return res.status(403).json({ error: 'Not authorized to delete blog posts' });
    }
    
    const blog = await Blog.findByIdAndDelete(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// --- GET all blogs for admin dashboard ---
router.get('/admin/all', auth, async (req, res) => {
  try {
    // Check if user has permission
    if (!['admin', 'hr_admin', 'hr_recruiter'].includes(req.employee.role)) {
      return res.status(403).json({ error: 'Not authorized to view all blogs' });
    }
    
    const blogs = await Blog.find()
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json(blogs);
  } catch (error) {
    console.error('Error fetching all blogs:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// --- CKEditor Image Upload Route ---
router.post('/upload-image', auth, upload.single('upload'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: { 
          message: 'No image file uploaded' 
        } 
      });
    }

    // Check if user has permission to upload images
    if (!['admin', 'hr_admin', 'hr_recruiter'].includes(req.employee.role)) {
      return res.status(403).json({ 
        error: { 
          message: 'Not authorized to upload images' 
        } 
      });
    }

    // Return the URL for CKEditor (preserves correct extension from MIME)
    const imageUrl = `/uploads/blog-images/${req.file.filename}`;
    res.json({
      url: imageUrl
    });
  } catch (error) {
    res.status(500).json({ 
      error: { 
        message: 'Failed to upload image' 
      } 
    });
  }
});

// --- ADMIN: One-time fixer to align DB image extensions with files on disk ---
router.post('/admin/fix-image-extensions', auth, async (req, res) => {
  try {
    if (!['admin', 'hr_admin'].includes(req.employee.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const publicBase = path.join(__dirname, '..', 'public');
    const blogs = await Blog.find({ image: { $regex: '^/uploads/' } });
    let updated = 0;
    const changes = [];

    for (const blog of blogs) {
      const imgPath = (blog.image || '').replace(/^\//, '');
      if (!imgPath) continue;
      const full = path.join(publicBase, imgPath);
      if (fs.existsSync(full)) continue;

      const m = imgPath.match(/^(.*)\.(png|jpg|jpeg|webp)$/i);
      if (!m) continue;
      const base = m[1];
      const tries = [`${base}.jpg`, `${base}.jpeg`, `${base}.png`, `${base}.webp`];
      const found = tries.find(p => fs.existsSync(path.join(publicBase, p)));
      if (found) {
        const old = blog.image;
        blog.image = `/${found.replace(/\\/g, '/')}`;
        await blog.save();
        updated += 1;
        changes.push({ id: blog._id, from: old, to: blog.image });
      }
    }

    res.json({ success: true, updated, changes });
  } catch (err) {
    console.error('fix-image-extensions error:', err);
    res.status(500).json({ error: 'Failed to fix image extensions' });
  }
});

module.exports = router; 