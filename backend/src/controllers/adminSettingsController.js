const SystemSettings = require('../models/SystemSettings');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

// GET  /admin/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    return res.status(200).json({ success: true, settings });
  } catch (err) {
    console.error('[getSettings]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

// PUT  /admin/settings
exports.updateSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = new SystemSettings();

    const allowed = [
      'appName', 'appLogo', 'theme', 'timezone', 'language', 'maintenanceMode',
      'slaRules', 'automationRules', 'notifications',
      'ticketCategories', 'ticketStatuses', 'permissions', 'security', 'integrations'
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        settings[key] = req.body[key];
      }
    }

    settings.markModified('permissions');
    settings.markModified('slaRules');
    settings.markModified('automationRules');
    settings.markModified('ticketCategories');

    await settings.save();
    return res.status(200).json({ success: true, message: 'Settings saved', settings });
  } catch (err) {
    console.error('[updateSettings]', err);
    return res.status(500).json({ success: false, message: 'Failed to save settings', error: err.message });
  }
};

// GET /admin/analytics  — real computed stats for dashboard
exports.getAnalytics = async (req, res) => {
  try {
    const [tickets, userStats] = await Promise.all([
      Ticket.find({}).lean(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);

    const total = tickets.length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in-progress').length;
    const escalated = tickets.filter(t => t.isEscalated).length;
    const breached = tickets.filter(t => t.slaStatus === 'breached').length;

    // Avg resolution time in days
    const resolvedWithTime = tickets.filter(t => t.resolvedAt && t.createdAt);
    const avgResolutionDays = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, t) => sum + ((new Date(t.resolvedAt) - new Date(t.createdAt)) / 86400000), 0) / resolvedWithTime.length
      : 0;

    const slaBreachRate = total > 0 ? ((breached / total) * 100).toFixed(1) : 0;

    // Tickets per day — last 30 days
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last30Days.push(d.toISOString().split('T')[0]);
    }
    const ticketsPerDay = last30Days.map(dateStr => ({
      date: dateStr,
      count: tickets.filter(t => t.createdAt && t.createdAt.toISOString().startsWith(dateStr)).length
    }));

    // Tickets last 7 days
    const last7 = last30Days.slice(-7);
    const ticketsLast7 = last7.map(dateStr => ({
      date: dateStr,
      count: tickets.filter(t => t.createdAt && t.createdAt.toISOString().startsWith(dateStr)).length
    }));

    // Category distribution
    const catMap = {};
    tickets.forEach(t => {
      const c = t.category || 'other';
      catMap[c] = (catMap[c] || 0) + 1;
    });

    // Priority distribution
    const priorityMap = {};
    tickets.forEach(t => {
      const p = t.priority || 'medium';
      priorityMap[p] = (priorityMap[p] || 0) + 1;
    });

    // Agent performance
    const agentMap = {};
    tickets.filter(t => t.status === 'resolved' && t.assignedTo).forEach(t => {
      // assignedTo is an ObjectId — we need the name from a populate, but for now use stringified ID
    });

    // Populate agent names separately
    const resolvedTickets = await Ticket.find({ status: 'resolved', assignedTo: { $ne: null } })
      .populate('assignedTo', 'name')
      .lean();

    const agentPerf = {};
    resolvedTickets.forEach(t => {
      if (t.assignedTo?.name) {
        agentPerf[t.assignedTo.name] = (agentPerf[t.assignedTo.name] || 0) + 1;
      }
    });

    // User stats
    const userStatMap = {};
    userStats.forEach(u => { userStatMap[u._id] = u.count; });

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toISOString().slice(0, 7); // YYYY-MM
      monthlyTrend.push({
        month,
        label: d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        count: tickets.filter(t => t.createdAt && t.createdAt.toISOString().startsWith(month)).length
      });
    }

    return res.status(200).json({
      success: true,
      analytics: {
        overview: {
          total, resolved, open, inProgress, escalated,
          avgResolutionDays: +avgResolutionDays.toFixed(2),
          slaBreachRate,
          breached,
          totalStudents: userStatMap['student'] || 0,
          totalTpc: userStatMap['tpc'] || 0,
        },
        ticketsLast7,
        ticketsPerDay,
        categoryDistribution: catMap,
        priorityDistribution: priorityMap,
        agentPerformance: agentPerf,
        monthlyTrend,
      }
    });
  } catch (err) {
    console.error('[getAnalytics]', err);
    return res.status(500).json({ success: false, message: 'Failed to compute analytics', error: err.message });
  }
};
