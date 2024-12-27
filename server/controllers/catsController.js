// controllers/catsController.js
import CatSighting from '../models/CatSightings.js';
// import CatSighting from '../models/CatSightings.js'

/**
 * GET /api/cats
 * Returns all cat sightings (latest first).
 */
export const getCatSightings = async (req, res) => {
  try {
    const sightings = await CatSighting.find({})
      .populate('reportedBy', 'name enroll') // or any relevant fields
      .sort({ createdAt: -1 });

    return res.json({ sightings });
  } catch (error) {
    console.error('Error fetching cat sightings:', error);
    return res.status(500).json({ message: 'Error fetching cat sightings' });
  }
};

/**
 * POST /api/cats
 * Creates a new cat sighting.
 * Expects { catName, description, location: { coordinates: [lng, lat] } }
 */
export const createCatSighting = async (req, res) => {
  try {
    const { catName, description, location } = req.body;
    
    // Basic validation
    if (!catName || !location?.coordinates) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newSighting = new CatSighting({
      catName,
      description: description || '',
      location: {
        type: 'Point',
        coordinates: location.coordinates // [lng, lat]
      },
      reportedBy: req.user._id, // from authenticateToken middleware
    });

    await newSighting.save();
    return res.status(201).json(newSighting);
  } catch (error) {
    console.error('Error creating cat sighting:', error);
    return res.status(500).json({ message: 'Error creating cat sighting' });
  }
};
