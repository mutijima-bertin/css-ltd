import {
  createTalentProfile,
  addDemoFile,
  getApprovedTalentProfiles,
  getAllTalentProfiles,
  getTalentProfileById,
  updateTalentStatus,
  updateTalentProfile,
  deleteTalentProfile,
  deleteDemoFile,
  getDemoById,
  getTalentByEmail,
} from '../models/talent.js';

export const create = async (req, res) => {
  try {
    const full_name = req.body.full_name || req.user.full_name;
    const email = req.body.email || req.user.email;
    const phone = req.body.phone || req.user.phone || '';
    const { country_code, location, bio, skill_tags, social_links, portfolio_links } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const profile_picture = req.files?.profile_picture?.[0]?.path || null;

    let parsedSkillTags = skill_tags;
    if (typeof skill_tags === 'string') {
      try { parsedSkillTags = JSON.parse(skill_tags); } catch { parsedSkillTags = [skill_tags]; }
    }

    let parsedSocial = social_links;
    if (typeof social_links === 'string') {
      try { parsedSocial = JSON.parse(social_links); } catch { parsedSocial = [social_links]; }
    }

    let parsedPortfolio = portfolio_links;
    if (typeof portfolio_links === 'string') {
      try { parsedPortfolio = JSON.parse(portfolio_links); } catch { parsedPortfolio = [portfolio_links]; }
    }

    const demos = req.files?.demos || [];

    const profileId = await createTalentProfile({
      full_name,
      email,
      phone,
      country_code,
      location,
      bio,
      profile_picture,
      skill_tags: parsedSkillTags,
      social_links: parsedSocial,
      portfolio_links: parsedPortfolio,
    });

    const demoIds = [];
    if (demos.length > 0) {
      for (const file of demos) {
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
};

export const getApproved = async (req, res) => {
  try {
    const profiles = await getApprovedTalentProfiles();
    res.json(profiles);
  } catch (err) {
    console.error('Fetch talent error:', err.message);
    res.status(500).json({ error: 'Failed to fetch talent profiles' });
  }
};

export const getAll = async (req, res) => {
  try {
    const profiles = await getAllTalentProfiles();
    res.json(profiles);
  } catch (err) {
    console.error('Fetch all talent error:', err.message);
    res.status(500).json({ error: 'Failed to fetch talent profiles' });
  }
};

export const getMy = async (req, res) => {
  try {
    const profiles = await getTalentByEmail(req.user.email);
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your talent profiles' });
  }
};

const isOwnerOrAdmin = (profile, user) =>
  user.role === 'admin' || (profile && profile.email === user.email);

const parseField = (val) => {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
};

export const update = async (req, res) => {
  try {
    const profile = await getTalentProfileById(Number(req.params.id));
    if (!profile) return res.status(404).json({ error: 'Talent profile not found' });
    if (!isOwnerOrAdmin(profile, req.user)) {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }

    const allowed = ['full_name', 'email', 'phone', 'country_code', 'location', 'bio', 'skill_tags', 'social_links', 'portfolio_links'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        const val = parseField(req.body[key]);
        if (['skill_tags', 'social_links', 'portfolio_links'].includes(key)) {
          updates[key] = Array.isArray(val) ? JSON.stringify(val) : val;
        } else {
          updates[key] = val;
        }
      }
    }

    const profile_picture = req.files?.profile_picture?.[0]?.path;
    if (profile_picture) updates.profile_picture = profile_picture;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await updateTalentProfile(Number(req.params.id), updates);
    const updated = await getTalentProfileById(Number(req.params.id));

    res.json({ success: true, profile: updated });
  } catch (err) {
    console.error('Talent update error:', err.message);
    res.status(500).json({ error: 'Failed to update talent profile' });
  }
};

export const addDemos = async (req, res) => {
  try {
    const profile = await getTalentProfileById(Number(req.params.id));
    if (!profile) return res.status(404).json({ error: 'Talent profile not found' });
    if (!isOwnerOrAdmin(profile, req.user)) {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }

    const files = req.files || [];
    const demoIds = [];

    for (const file of files) {
      const fileUrl = file.path;
      const fileType = file.mimetype.startsWith('audio') ? 'audio'
        : file.mimetype.startsWith('video') ? 'video'
        : file.mimetype.startsWith('image') ? 'image' : 'document';
      const demoId = await addDemoFile({
        talent_id: Number(req.params.id),
        file_url: fileUrl,
        file_type: fileType,
        title: file.originalname,
      });
      demoIds.push(demoId);
    }

    res.status(201).json({ success: true, demo_ids: demoIds, count: demoIds.length });
  } catch (err) {
    console.error('Add demos error:', err.message);
    res.status(500).json({ error: 'Failed to add demo files' });
  }
};

export const removeDemo = async (req, res) => {
  try {
    const demo = await getDemoById(Number(req.params.demoId));
    if (!demo) return res.status(404).json({ error: 'Demo file not found' });

    const profile = await getTalentProfileById(demo.talent_id);
    if (!isOwnerOrAdmin(profile, req.user)) {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }

    await deleteDemoFile(Number(req.params.demoId));
    res.json({ success: true });
  } catch (err) {
    console.error('Remove demo error:', err.message);
    res.status(500).json({ error: 'Failed to remove demo file' });
  }
};

export const getEdit = async (req, res) => {
  try {
    const profile = await getTalentProfileById(Number(req.params.id));
    if (!profile) return res.status(404).json({ error: 'Talent profile not found' });
    if (!isOwnerOrAdmin(profile, req.user)) {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch talent profile' });
  }
};

export const getById = async (req, res) => {
  try {
    const profile = await getTalentProfileById(Number(req.params.id));
    if (!profile || profile.status !== 'approved') return res.status(404).json({ error: 'Talent profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch talent profile' });
  }
};

export const updateStatus = async (req, res) => {
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
};

export const remove = async (req, res) => {
  try {
    await deleteTalentProfile(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete talent profile' });
  }
};
