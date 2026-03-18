const Feature = require('../models/Feature');

exports.getFeatures = async (req, res) => {
    try {
        const features = await Feature.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, features });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch features', error: error.message });
    }
};

exports.createFeature = async (req, res) => {
    try {
        const { name, targetRole, description } = req.body;
        if (!name || !targetRole) {
            return res.status(400).json({ success: false, message: 'Name and target role are required' });
        }
        
        const newFeature = await Feature.create({ name, targetRole, description });
        return res.status(201).json({ success: true, feature: newFeature });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to create feature', error: error.message });
    }
};

exports.toggleFeature = async (req, res) => {
    try {
        const feature = await Feature.findById(req.params.id);
        if (!feature) {
            return res.status(404).json({ success: false, message: 'Feature not found' });
        }
        
        feature.isActive = !feature.isActive;
        await feature.save();
        
        return res.status(200).json({ success: true, feature });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to toggle feature', error: error.message });
    }
};

exports.deleteFeature = async (req, res) => {
    try {
        const feature = await Feature.findByIdAndDelete(req.params.id);
        if (!feature) {
            return res.status(404).json({ success: false, message: 'Feature not found' });
        }
        
        return res.status(200).json({ success: true, message: 'Feature deleted successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete feature', error: error.message });
    }
};
