const mongoose = require('mongoose');

const hotspotSchema = new mongoose.Schema({
  clusters: [{
    center: {
      type: [Number],
      required: true
    },
    radius: {
      type: Number,
      required: true
    },
    density: {
      type: Number,
      required: true
    },
    primary_type: {
      type: String,
      required: true
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const CrimeHotspot = mongoose.models.CrimeHotspot || mongoose.model('CrimeHotspot', hotspotSchema);

module.exports = CrimeHotspot;
