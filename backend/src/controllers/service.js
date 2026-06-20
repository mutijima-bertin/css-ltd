import { getAllServices, getServiceByCategory, getServiceById, createService, updateService, deleteService } from '../models/service.js';

export const getAll = async (req, res) => {
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
};

export const getById = async (req, res) => {
  try {
    const service = await getServiceById(Number(req.params.id));
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

export const create = async (req, res) => {
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
};

export const update = async (req, res) => {
  try {
    await updateService(Number(req.params.id), req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
};

export const remove = async (req, res) => {
  try {
    await deleteService(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
};
