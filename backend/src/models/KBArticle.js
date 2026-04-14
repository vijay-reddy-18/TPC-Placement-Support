const mongoose = require('mongoose');

const kbArticleSchema = new mongoose.Schema({
  title:    { type: String, required: true, trim: true },
  slug:     { type: String, trim: true },
  category: { type: String, enum: ['general', 'policy', 'placement', 'internship', 'documents', 'faq', 'announcements'], default: 'general' },
  content:  { type: String, required: true },
  excerpt:  { type: String, default: '' },
  tags:     { type: [String], default: [] },
  status:   { type: String, enum: ['draft', 'published'], default: 'draft' },
  views:    { type: Number, default: 0 },
  helpful:  { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
  targetAudience: { type: String, enum: ['all', 'student', 'tpc', 'admin'], default: 'all' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

kbArticleSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.replace(/[#*`_>]/g, '').slice(0, 160) + '...';
  }
  next();
});

module.exports = mongoose.model('KBArticle', kbArticleSchema);
