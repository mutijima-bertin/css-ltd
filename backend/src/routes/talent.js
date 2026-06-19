import { Router } from 'express';
import {
  createTalentProfile,
  addDemoFile,
  getAllTalentProfiles,
  getTalentProfileById,
  updateTalentStatus,
  deleteTalentProfile,
} from '../models/talent.js';
import { uploadDemo } from '../services/upload.js';

const router = Router();

router.post('/', uploadDemo.array('demos', 5), async (req, res) => {
  try {
    const { full_name, email, phone, country_code, location, bio, social_links, portfolio_links } = req.body;

    if (!full_name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email and phone are required' });
    }

    let parsedSocial = social_links;
    if (typeof social_links === 'string') {
      try { parsedSocial = JSON.parse(social_links); } catch { parsedSocial = [social_links]; }
    }

    let parsedPortfolio = portfolio_links;
    if (typeof portfolio_links === 'string') {
      try { parsedPortfolio = JSON.parse(portfolio_links); } catch { parsedPortfolio = [portfolio_links]; }
    }

    const profileId = await createTalentProfile({
      full_name,
      email,
      phone,
      country_code,
      location,
      bio,
      social_links: parsedSocial,
      portfolio_links: parsedPortfolio,
    });

    const demoIds = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileUrl = file.path;
        const fileType = file.mimetype.startsWith('audio') ? 'audio'
          : file.mimetype.startsWith('video') ? 'video'
          : file.mimetype.startsWith('image') ? 'image' : 'document';
        const demoId = await addDemoFile({
          talent_id: profileId,
          file_url: fileUrl,
          file_type: fileType,
          title: file.originalname,
        });
        demoIds.push(demoId);
      }
    }

    res.status(201).json({
      profile_id: profileId,
      demo_count: demoIds.length,
      message: 'Talent profile submitted successfully',
    });
  } catch (err) {
    console.error('Talent submission error:', err.message);
    if (err.message?.includes('File type not supported')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to submit talent profile' });
  }
});

router.get('/', async (req, res) => {
  try {
    const profiles = await getAllTalentProfiles();
    res.json(profiles);
  } catch (err) {
    console.error('Fetch talent error:', err.message);
    res.status(500).json({ error: 'Failed to fetch talent profiles' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const profile = await getTalentProfileById(Number(req.params.id));
    if (!profile) return res.status(404).json({ error: 'Talent profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch talent profile' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use pending, approved, or rejected.' });
    }
    await updateTalentStatus(Number(req.params.id), { status, admin_notes });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update talent profile' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteTalentProfile(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete talent profile' });
  }
});

export default router;
