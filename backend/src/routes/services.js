import { Router } from 'express';
import { getAllServices, getServiceByCategory, createService } from '../models/service.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    if (category) {
      const services = await getServiceByCategory(category);
      return res.json(services);
    }
    const services = await getAllServices();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, price, price_unit, category, sort_order } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }
    await createService({ name, description, price, price_unit, category, sort_order });
    res.status(201).json({ success: true, message: 'Service created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

export default router;
