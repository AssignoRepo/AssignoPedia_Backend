// Blog posts data - This will be replaced with dynamic data from your backend
let blogPosts = [];

// Robust image URL normalizer for blog images
function resolveBlogImageUrl(rawUrl) {
  try {
    if (!rawUrl || typeof rawUrl !== 'string') return '/images/default-blog.jpg';

    // Absolute URL
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

    let url = rawUrl.trim();

    // Strip accidental leading 'public/'
    if (url.startsWith('public/')) url = url.substring('public/'.length);

    // If only a filename like blog-123-456.jpg
    if (/^blog-\d+-\d+\.[a-zA-Z0-9]+$/.test(url)) {
      url = `uploads/blog-images/${url}`;
    }

    // Ensure uploads path for in-app relative paths
    if (!url.startsWith('uploads/') && !url.startsWith('/uploads/')) {
      if (!url.startsWith('images/') && !url.startsWith('/images/')) {
        url = `uploads/blog-images/${url.split('/').pop()}`;
      }
    }

    // Ensure leading slash
    if (!url.startsWith('/')) url = `/${url}`;

    return url;
  } catch (_e) {
    return '/images/default-blog.jpg';
  }
}

// Fallback handler: try alternate extensions then default
function handleBlogImgError(imgEl) {
  if (!imgEl || !imgEl.src) return;
  const triedSwap = '__triedSwap__';
  const triedPrefix = '__triedPrefix__';
  const triedDefault = '__triedDefault__';

  try {
    const url = new URL(imgEl.src, window.location.origin);
    const pathname = url.pathname;

    // Try swapping .png <-> .jpg/.jpeg
    if (!imgEl[triedSwap]) {
      const m = pathname.match(/^(.*)\.(png|jpg|jpeg)$/i);
      if (m) {
        const base = m[1];
        const ext = m[2].toLowerCase();
        const alt = ext === 'png' ? 'jpg' : 'png';
        imgEl[triedSwap] = true;
        imgEl.src = `${base}.${alt}`;
        return;
      }
    }

    // If bare filename without uploads prefix
    if (!imgEl[triedPrefix] && /^\/blog-\d+-\d+\.[a-zA-Z0-9]+$/.test(pathname)) {
      imgEl[triedPrefix] = true;
      imgEl.src = `/uploads/blog-images${pathname}`;
      return;
    }

    if (!imgEl[triedDefault]) {
      imgEl[triedDefault] = true;
      imgEl.src = '/images/default-blog.jpg';
    }
  } catch (_e) {
    imgEl.src = '/images/default-blog.jpg';
  }
}

// Function to fetch blog posts from backend
async function fetchBlogPosts() {
  try {
    const response = await fetch('/api/blog');
    const data = await response.json();
    console.log('API /api/blog response:', data);
    
    if (data.blogs) {
      blogPosts = data.blogs.map(blog => ({
        id: blog._id,
        title: blog.title,
        excerpt: blog.excerpt,
        image: resolveBlogImageUrl(blog.image || ''),
        author: {
          name: blog.author?.name || 'AssignoPedia',
          avatar: blog.author?.avatar || '/images/logo.png'
        },
        date: blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : '',
        category: blog.category || 'General',
        slug: blog.slug,
        viewCount: blog.viewCount || 0
      }));
      console.log('Mapped blogPosts for rendering:', blogPosts);
    } else {
      console.warn('No blogs found in API response, falling back to sample data.');
    }
    
    // Render the blogs
    renderBlogPosts();
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    // Fallback to sample data if API fails
    blogPosts = [
      {
        id: 1,
        title: "The Future of Academic Writing in the Digital Age",
        excerpt: "Explore how technology and AI are transforming academic writing and research methodologies in higher education. Discover the latest trends and tools that are reshaping the way we approach scholarly work.",
        image: "https://source.unsplash.com/random/800x600/?education",
        author: {
          name: "Dr. Sarah Johnson",
          avatar: "https://source.unsplash.com/random/100x100/?portrait"
        },
        date: "March 15, 2024",
        category: "Academic",
        slug: "future-academic-writing-digital-age",
        viewCount: 1250
      },
      {
        id: 2,
        title: "Essential Tips for Writing a Stellar Research Paper",
        excerpt: "Learn the key strategies and best practices for crafting compelling research papers that stand out. From topic selection to final submission, master every step of the research writing process.",
        image: "https://source.unsplash.com/random/800x600/?research",
        author: {
          name: "Prof. Michael Chen",
          avatar: "https://source.unsplash.com/random/100x100/?man"
        },
        date: "March 12, 2024",
        category: "Research",
        slug: "essential-tips-research-paper",
        viewCount: 890
      }
    ];
    renderBlogPosts();
  }
}

// Function to create a blog card HTML
function createBlogCard(post) {
  return `
    <div class="blog-card" data-category="${post.category}">
      <img src="${post.image}" alt="${post.title}" class="blog-card-image" onerror="handleBlogImgError(this)">
      <div class="blog-card-content">
        <div class="blog-card-category">${post.category}</div>
        <h3 class="blog-card-title">${post.title}</h3>
        <p class="blog-card-excerpt">${post.excerpt}</p>
        <div class="blog-card-meta">
          <div class="blog-card-author">
            <img src="${post.author.avatar}" alt="${post.author.name}">
            <span>${post.author.name}</span>
          </div>
          <div class="blog-card-date">${post.date}</div>
        </div>
        <a href="/blog/${post.slug}" class="blog-card-readmore">
          Read More <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `;
}

// Function to create featured blog HTML
function createFeaturedBlog(post) {
  return `
    <div class="featured-blog-image">
      <img src="${post.image}" alt="${post.title}" onerror="handleBlogImgError(this)">
    </div>
    <div class="featured-blog-content">
      <div class="featured-blog-category">${post.category}</div>
      <h2 class="featured-blog-title">${post.title}</h2>
      <p class="featured-blog-excerpt">${post.excerpt}</p>
      <div class="featured-blog-meta">
        <div class="featured-blog-author">
          <img src="${post.author.avatar}" alt="${post.author.name}">
          <span>${post.author.name}</span>
        </div>
        <div class="featured-blog-date">${post.date}</div>
      </div>
      <a href="/blog/${post.slug}" class="featured-blog-readmore">
        Read Full Article <i class="fas fa-arrow-right"></i>
      </a>
    </div>
  `;
}

// Function to render blog posts
function renderBlogPosts() {
  const featuredBlog = document.getElementById('featuredBlog');
  const blogGrid = document.getElementById('blogGrid');
  console.log('Rendering blogPosts:', blogPosts);
  
  if (!Array.isArray(blogPosts) || blogPosts.length === 0) {
    featuredBlog.innerHTML = '';
    blogGrid.innerHTML = '<div class="no-results">No blog posts found matching your criteria.</div>';
    return;
  }

  // Sort posts by date (most recent first)
  const sortedPosts = [...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Set featured blog (most recent)
  const featured = sortedPosts[0];
  featuredBlog.innerHTML = createFeaturedBlog(featured);
  
  // Render remaining posts
  const remainingPosts = sortedPosts.slice(1);
  if (remainingPosts.length === 0) {
    blogGrid.innerHTML = '';
  } else {
    blogGrid.innerHTML = remainingPosts.map(post => createBlogCard(post)).join('');
  }
}

// Filter functionality
document.addEventListener('DOMContentLoaded', function() {
  const blogFilters = document.getElementById('blogFilters');
  if (blogFilters) {
    blogFilters.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-btn')) {
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Filter posts
        const category = e.target.dataset.category;
        const filteredPosts = category === 'all' 
          ? blogPosts 
          : blogPosts.filter(post => post.category === category);
        
        // Re-render with filtered posts
        const sortedFilteredPosts = [...filteredPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const featuredBlog = document.getElementById('featuredBlog');
        const blogGrid = document.getElementById('blogGrid');
        
        if (sortedFilteredPosts.length === 0) {
          featuredBlog.innerHTML = '';
          blogGrid.innerHTML = '<div class="no-results">No blog posts found matching your criteria.</div>';
        } else {
          // Set featured blog (most recent from filtered results)
          const featured = sortedFilteredPosts[0];
          featuredBlog.innerHTML = createFeaturedBlog(featured);
          
          // Render remaining posts
          const remainingPosts = sortedFilteredPosts.slice(1);
          if (remainingPosts.length === 0) {
            blogGrid.innerHTML = '';
          } else {
            blogGrid.innerHTML = remainingPosts.map(post => createBlogCard(post)).join('');
          }
        }
      }
    });
  }

  // Search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const filteredPosts = blogPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        post.author.name.toLowerCase().includes(searchTerm) ||
        post.category.toLowerCase().includes(searchTerm)
      );
      
      // Re-render with filtered posts
      const sortedFilteredPosts = [...filteredPosts].sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const featuredBlog = document.getElementById('featuredBlog');
      const blogGrid = document.getElementById('blogGrid');
      
      if (sortedFilteredPosts.length === 0) {
        featuredBlog.innerHTML = '';
        blogGrid.innerHTML = '<div class="no-results">No blog posts found matching your criteria.</div>';
      } else {
        // Set featured blog (most recent from filtered results)
        const featured = sortedFilteredPosts[0];
        featuredBlog.innerHTML = createFeaturedBlog(featured);
        
        // Render remaining posts
        const remainingPosts = sortedFilteredPosts.slice(1);
        if (remainingPosts.length === 0) {
          blogGrid.innerHTML = '';
        } else {
          blogGrid.innerHTML = remainingPosts.map(post => createBlogCard(post)).join('');
        }
      }
    });
  }

  // Initialize by fetching blog posts
  fetchBlogPosts();
});     