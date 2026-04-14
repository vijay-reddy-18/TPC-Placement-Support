const KBArticle = require('../models/KBArticle');
const Notification = require('../models/Notification');

// Seed default Q&A articles if empty
const DEFAULT_ARTICLES = [
  {
    title: 'How does the TPC ticket system work?',
    category: 'general',
    status: 'published',
    targetAudience: 'all',
    content: `## Overview\nThe TPC Support Ticket System allows students to raise queries related to placements, internships, documents and more.\n\n## Steps to Raise a Ticket\n1. Login to your **Student Portal**\n2. Click on **Raise Ticket** in the sidebar\n3. Choose a **Category** (e.g. Placement, Document)\n4. Fill in the subject and a detailed description\n5. Click **Submit** — your ticket is now with the TPC team\n\n## What Happens Next?\n- Your ticket is automatically assigned a **Ticket ID**\n- The TPC team reviews and assigns it to the right staff member\n- You get notified on every status update\n- Once resolved, you can provide **feedback** to help improve the service`,
    excerpt: 'Learn how to raise and track support tickets with the TPC team step by step.',
    tags: ['tickets', 'howto', 'getting-started'],
    publishedAt: new Date(),
  },
  {
    title: 'What are the SLA (Service Level Agreement) timelines?',
    category: 'policy',
    status: 'published',
    targetAudience: 'all',
    content: `## SLA Policy\nThe TPC Placement Cell is committed to responding to student queries within defined timelines.\n\n| Priority | Resolution Target | Escalation After |\n|----------|------------------|-------------------|\n| 🔥 Urgent | 4 hours | 1 hour |\n| 🔴 High | 24 hours | 4 hours |\n| 🟡 Medium | 48 hours | 12 hours |\n| 🟢 Low | 72 hours | 24 hours |\n\n## What Triggers Escalation?\n- If a ticket is not responded to within the escalation window, it is automatically escalated to the Admin\n- You will receive a notification when your ticket is escalated\n\n## SLA Breach\n- If a ticket is not resolved within the resolution target, it is marked as **SLA Breached**\n- Breached tickets are given top priority`,
    excerpt: 'Understand how quickly TPC resolves different types of queries and what SLA breach means.',
    tags: ['sla', 'policy', 'response-time'],
    publishedAt: new Date(),
  },
  {
    title: 'Who is eligible for on-campus placement?',
    category: 'placement',
    status: 'published',
    targetAudience: 'student',
    content: `## General Eligibility Criteria\nMost companies have the following standard requirements:\n\n- **CGPA**: Minimum 6.5 (varies by company, some require 7.0+)\n- **Backlogs**: No active backlogs (some companies allow 0 total history)\n- **Attendance**: Minimum 75% attendance in all semesters\n- **Discipline**: No pending disciplinary actions\n\n## Department-Specific Criteria\n- **CSE / IT / ECE**: May have additional aptitude or coding test requirements\n- **Core Engineering** (Mech, Civil, EEE): Domain-specific technical assessments\n\n## Registration\n- Students must register on the **TPC Placement Portal** before the placement season\n- Upload updated resume in PDF format\n- Keep your profile 100% complete\n\n> **Note**: Each company announces specific eligibility criteria. Watch the **Announcements** section regularly.`,
    excerpt: 'Check general and department-specific eligibility criteria for on-campus placement drives.',
    tags: ['placement', 'eligibility', 'cgpa'],
    publishedAt: new Date(),
  },
  {
    title: 'How to submit and track document verification requests?',
    category: 'documents',
    status: 'published',
    targetAudience: 'student',
    content: `## Types of Document Requests\n- Bonafide Certificate\n- NOC (No Objection Certificate)\n- Character Certificate\n- Internship Completion Letter\n- Offer Letter Verification\n\n## Submission Process\n1. Go to **Raise Ticket** → Select **Document** category\n2. Mention the exact document required in the subject\n3. Provide reason and deadline in the description\n4. Upload any supporting files if available\n\n## Processing Time\n| Document Type | Processing Time |\n|-------------|----------------|\n| Bonafide Certificate | 1–2 working days |\n| NOC | 3–5 working days |\n| Internship Letter | 2–3 working days |\n\n## Track Status\nYou can track your document request under **My Tickets** at any time.`,
    excerpt: 'Step-by-step guide to requesting and tracking document verification through the TPC portal.',
    tags: ['documents', 'verification', 'certificates'],
    publishedAt: new Date(),
  },
  {
    title: 'What should I do if I receive an offer letter?',
    category: 'placement',
    status: 'published',
    targetAudience: 'student',
    content: `## Congratulations! 🎉\nReceiving an offer letter is a great milestone. Here's what you need to do next:\n\n## Immediate Steps\n1. **Read carefully**: Check the offer details — compensation, joining date, role, location\n2. **Raise a ticket**: Go to **Offer Letter** category and attach your offer letter PDF\n3. **TPC Verification**: The TPC team will verify the offer with the company\n4. **Accept/Decline**: After verification, confirm your decision\n\n## Documents to Submit\n- Signed offer letter (PDF)\n- Company HR contact details\n- Joining date and location\n\n## Important Notes\n- You can only hold **one offer** at a time (per policy)\n- Reneging on an offer may lead to **placement ban**\n- Contact TPC if you want to appear for other companies after receiving an offer`,
    excerpt: 'What to do after receiving a placement offer letter — verification process and next steps.',
    tags: ['offer-letter', 'placement', 'post-offer'],
    publishedAt: new Date(),
  },
  {
    title: 'Frequently Asked Questions (FAQ) — TPC Support',
    category: 'faq',
    status: 'published',
    targetAudience: 'all',
    content: `## General Questions\n\n**Q: Can I raise multiple tickets simultaneously?**\nA: Yes, you can have multiple open tickets at a time. Each ticket tracks a separate issue.\n\n**Q: How long does it take for TPC to respond?**\nA: Depends on priority. Urgent tickets get a response within 4 hours. See the SLA policy for details.\n\n**Q: Can I reopen a resolved ticket?**\nA: Yes! If your issue wasn't fully resolved, click **Reopen** on the ticket details page.\n\n**Q: How do I know my ticket was received?**\nA: You'll receive an in-app notification and (if email is configured) an email confirmation.\n\n**Q: Who can I contact if my issue is urgent?**\nA: Set the ticket priority to **Urgent** and describe your urgency. You'll be escalated immediately.\n\n## Technical Questions\n\n**Q: I forgot my portal password. What do I do?**\nA: Use the **Forgot Password** option on the login page, or contact the admin to reset it.\n\n**Q: Can I attach files to my ticket?**\nA: Yes, you can upload attachments when raising a ticket to provide additional context.\n\n**Q: What browsers are supported?**\nA: Chrome, Firefox, Edge and Safari are all fully supported.`,
    excerpt: 'Answers to the most frequently asked questions about the TPC Support System.',
    tags: ['faq', 'general', 'help'],
    publishedAt: new Date(),
  },
];

const seedIfEmpty = async () => {
  const count = await KBArticle.countDocuments();
  if (count === 0) {
    await KBArticle.insertMany(DEFAULT_ARTICLES);
    console.log('[KB] Seeded default knowledge base articles');
  }
};

// GET /admin/kb — list all articles
exports.listArticles = async (req, res) => {
  try {
    await seedIfEmpty();
    const articles = await KBArticle.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, articles });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch articles', error: err.message });
  }
};

// GET /kb — public listing (published only)
exports.publicList = async (req, res) => {
  try {
    await seedIfEmpty();
    const { category, audience } = req.query;
    const filter = { status: 'published' };
    if (category) filter.category = category;
    if (audience && audience !== 'all') filter.targetAudience = { $in: ['all', audience] };
    const articles = await KBArticle.find(filter).sort({ publishedAt: -1 }).lean();
    return res.json({ success: true, articles });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed', error: err.message });
  }
};

// POST /admin/kb — create
exports.createArticle = async (req, res) => {
  try {
    const { title, category, content, status, targetAudience, tags } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title and content required' });
    const article = await KBArticle.create({
      title, category: category || 'general', content,
      status: status || 'draft',
      targetAudience: targetAudience || 'all',
      tags: tags || [],
      createdBy: req.user?._id || null,
      publishedAt: status === 'published' ? new Date() : null,
      excerpt: content.replace(/[#*`_>]/g, '').slice(0, 160) + '...',
    });

    // Notify if published
    if (status === 'published') {
      await Notification.create({
        title: '📚 New Knowledge Base Article',
        message: `"${title}" has been published. Check it out in the Help Center.`,
        type: 'info',
        targetRole: targetAudience === 'tpc' ? 'tpc' : targetAudience === 'student' ? 'student' : 'all',
        icon: '📚',
        link: '/student/help',
        sentBy: req.user?._id || null,
      });
    }

    return res.status(201).json({ success: true, article });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /admin/kb/:id — update
exports.updateArticle = async (req, res) => {
  try {
    const { title, category, content, status, targetAudience, tags } = req.body;
    const article = await KBArticle.findById(req.params.id);
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });

    const wasPublished = article.status === 'published';
    if (title)           article.title = title;
    if (category)        article.category = category;
    if (content)         article.content = content;
    if (targetAudience)  article.targetAudience = targetAudience;
    if (tags)            article.tags = tags;
    if (status)          article.status = status;
    if (content)         article.excerpt = content.replace(/[#*`_>]/g, '').slice(0, 160) + '...';
    if (status === 'published' && !wasPublished) {
      article.publishedAt = new Date();
      // Broadcast notification
      await Notification.create({
        title: '📚 New KB Article Published',
        message: `"${article.title}" is now available in the Help Center.`,
        type: 'info',
        targetRole: targetAudience === 'tpc' ? 'tpc' : targetAudience === 'student' ? 'student' : 'all',
        icon: '📚',
        link: '/student/help',
        sentBy: req.user?._id || null,
      });
    }
    await article.save();
    return res.json({ success: true, article });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /admin/kb/:id
exports.deleteArticle = async (req, res) => {
  try {
    await KBArticle.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Article deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /admin/kb/:id/publish — toggle publish status
exports.togglePublish = async (req, res) => {
  try {
    const article = await KBArticle.findById(req.params.id);
    if (!article) return res.status(404).json({ success: false, message: 'Not found' });
    const wasPublished = article.status === 'published';
    article.status = wasPublished ? 'draft' : 'published';
    if (!wasPublished) {
      article.publishedAt = new Date();
      await Notification.create({
        title: '📢 New Article in Help Center',
        message: `"${article.title}" is now available. Visit the Help Center to read more.`,
        type: 'info', targetRole: 'all', icon: '📚', link: '/student/help',
        sentBy: req.user?._id || null,
      });
    }
    await article.save();
    return res.json({ success: true, article });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /admin/notify — broadcast notification to all students / TPC
exports.broadcastNotification = async (req, res) => {
  try {
    const { title, message, type, targetRole, icon, link } = req.body;
    if (!title || !message) return res.status(400).json({ success: false, message: 'title and message required' });
    const notif = await Notification.create({
      title, message,
      type: type || 'info',
      targetRole: targetRole || 'all',
      icon: icon || '🔔',
      link: link || '',
      sentBy: req.user?._id || null,
    });
    return res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /notifications — my notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const role = req.user?.role || 'student';
    const notifs = await Notification.find({
      $or: [
        { targetRole: 'all' },
        { targetRole: role },
        { targetId: req.user?._id },
      ]
    }).sort({ createdAt: -1 }).limit(50).lean();

    const withRead = notifs.map(n => ({
      ...n,
      isRead: (n.readBy || []).some(id => id?.toString() === req.user?._id?.toString()),
    }));

    return res.json({ success: true, notifications: withRead });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { readBy: req.user._id } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    const role = req.user?.role || 'student';
    await Notification.updateMany(
      { $or: [{ targetRole: 'all' }, { targetRole: role }, { targetId: req.user._id }] },
      { $addToSet: { readBy: req.user._id } }
    );
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
